import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { sendWebPushToSubscription } from "@/lib/push/webpush";
import { startScheduler } from "@/lib/push/scheduler";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const notification = await prisma.notification.findFirst({
      where: { id, userId: session.userId },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    let reqBody: {
      theme?: string;
      delaySeconds?: number;
      targetMode?: string;
      targetDeviceId?: string;
      targetSubscriptionId?: string;
    } = {};
    try {
      reqBody = await req.json();
    } catch {}

    const targetMode = reqBody.targetMode || "all";
    const targetDeviceId = reqBody.targetDeviceId || null;
    const targetSubscriptionId = reqBody.targetSubscriptionId || null;
    const delaySeconds = reqBody.delaySeconds ? parseInt(String(reqBody.delaySeconds), 10) : 0;

    const parsedActions = notification.actions ? JSON.parse(notification.actions) : [];
    const parsedVibration = notification.vibration ? JSON.parse(notification.vibration) : [100, 50, 100];
    const parsedData = notification.data ? JSON.parse(notification.data) : {};
    const activeTheme = reqBody.theme || parsedData.theme || "dark";

    const pushPayload = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/logo.png",
      badge: notification.badge || "/logo.png",
      image: notification.image || undefined,
      url: notification.url || "/dashboard",
      tag: notification.tag || undefined,
      direction: notification.direction || "auto",
      requireInteraction: notification.requireInteraction,
      silent: notification.silent,
      renotify: notification.renotify,
      vibration: parsedVibration,
      actions: parsedActions,
      theme: activeTheme,
      data: {
        ...parsedData,
        theme: activeTheme,
        notificationId: notification.id,
        sentAt: new Date().toISOString(),
      },
    };

    if (delaySeconds > 0) {
      const scheduledAt = new Date(Date.now() + delaySeconds * 1000);
      const scheduledItem = await prisma.scheduledNotification.create({
        data: {
          userId: session.userId,
          notificationId: notification.id,
          name: notification.name,
          title: notification.title,
          body: notification.body,
          payload: JSON.stringify(pushPayload),
          targetMode,
          targetDeviceId,
          targetSubscriptionId,
          delaySeconds,
          scheduledAt,
          status: "pending",
        },
      });

      startScheduler();

      return NextResponse.json({
        success: true,
        isScheduled: true,
        message: `Notification test scheduled to send in ${delaySeconds} second(s)`,
        scheduledItem,
      });
    }

    // Direct Instant Delivery
    let subscriptions: Array<{
      id: string;
      endpoint: string;
      p256dh: string;
      auth: string;
      deviceName?: string | null;
      browser?: string | null;
      platform?: string | null;
    }> = [];

    if (targetSubscriptionId) {
      const sub = await prisma.pushSubscription.findFirst({
        where: { id: targetSubscriptionId, userId: session.userId },
      });
      if (sub) subscriptions = [sub];
    } else if (targetDeviceId) {
      const sub = await prisma.pushSubscription.findFirst({
        where: { deviceId: targetDeviceId, userId: session.userId },
      });
      if (sub) subscriptions = [sub];
    } else if (targetMode === "active") {
      const onlineSub = await prisma.pushSubscription.findFirst({
        where: { userId: session.userId, isOnline: true },
        orderBy: { lastActiveAt: "desc" },
      });
      if (onlineSub) {
        subscriptions = [onlineSub];
      } else {
        const recentSub = await prisma.pushSubscription.findFirst({
          where: { userId: session.userId },
          orderBy: { lastActiveAt: "desc" },
        });
        if (recentSub) subscriptions = [recentSub];
      }
    } else {
      subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: session.userId },
      });
    }

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          error: "No devices are subscribed yet. Please subscribe this device using the 'Subscribe Device' button.",
          requiresSubscription: true,
        },
        { status: 400 }
      );
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      const res = await sendWebPushToSubscription(
        {
          id: sub.id,
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        pushPayload
      );

      const status = res.success ? "sent" : res.expired ? "expired" : "failed";
      if (res.success) sentCount++;
      else failedCount++;

      await prisma.notificationHistory.create({
        data: {
          userId: session.userId,
          notificationId: notification.id,
          title: notification.title,
          payload: JSON.stringify(pushPayload),
          device: sub.deviceName || sub.browser || "Unknown Device",
          platform: sub.platform || "Web",
          status,
          error: res.error || null,
        },
      });
    }

    // Update notification lastTested timestamp
    await prisma.notification.update({
      where: { id: notification.id },
      data: { lastTested: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `Push notification sent to ${sentCount} device(s)${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
      sentCount,
      failedCount,
      totalDevices: subscriptions.length,
    });
  } catch (error) {
    console.error("Error sending test push:", error);
    return NextResponse.json({ error: "Failed to dispatch push notification" }, { status: 500 });
  }
}
