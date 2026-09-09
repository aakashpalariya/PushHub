import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { sendWebPushToSubscription } from "@/lib/push/webpush";
import { notificationConfigSchema } from "@/lib/validation/notification";
import { startScheduler } from "@/lib/push/scheduler";

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawBody = await req.json();

    // Check optional targetMode and delaySeconds parameters
    const targetMode = rawBody.targetMode || "all";
    const targetDeviceId = rawBody.targetDeviceId || null;
    const targetSubscriptionId = rawBody.targetSubscriptionId || null;
    const delaySeconds = rawBody.delaySeconds ? parseInt(String(rawBody.delaySeconds), 10) : 0;

    const result = notificationConfigSchema.safeParse(rawBody);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const val = result.data;
    const activeTheme = val.theme || ((val.data as { theme?: string })?.theme) || "dark";

    const pushPayload = {
      title: val.title,
      body: val.body,
      icon: val.icon || "/logo.png",
      badge: val.badge || "/logo.png",
      image: val.image || undefined,
      url: val.url || "/dashboard",
      tag: val.tag || undefined,
      direction: val.direction || "auto",
      requireInteraction: val.requireInteraction,
      silent: val.silent,
      renotify: val.renotify,
      vibration: val.vibration,
      actions: val.actions,
      theme: activeTheme,
      data: {
        ...(val.data || {}),
        theme: activeTheme,
        name: val.name,
        sentAt: new Date().toISOString(),
      },
    };

    // If delaySeconds > 0, delegate to scheduling engine!
    if (delaySeconds > 0) {
      const scheduledAt = new Date(Date.now() + delaySeconds * 1000);
      const scheduledItem = await prisma.scheduledNotification.create({
        data: {
          userId: session.userId,
          name: val.name || val.title,
          title: val.title,
          body: val.body,
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
        message: `Push notification scheduled to deliver in ${delaySeconds} second(s)`,
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
      // Find online device or most recently active device
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
      // "all" mode
      subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: session.userId },
      });
    }

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          error: "No matching target devices found for your account. Please check device subscription.",
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
          title: val.title,
          payload: JSON.stringify(pushPayload),
          device: sub.deviceName || sub.browser || "Target Device",
          platform: sub.platform || "Web",
          status,
          error: res.error || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Push delivered to ${sentCount} device(s)${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
      sentCount,
      failedCount,
      targetMode,
      totalDevices: subscriptions.length,
    });
  } catch (error) {
    console.error("Error in direct push send:", error);
    return NextResponse.json({ error: "Failed to dispatch push notification" }, { status: 500 });
  }
}
