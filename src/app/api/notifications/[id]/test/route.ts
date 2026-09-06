import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { sendWebPushToSubscription } from "@/lib/push/webpush";

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

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.userId },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          error: "No devices are subscribed yet. Please subscribe this device using the 'Subscribe Device' button.",
          requiresSubscription: true,
        },
        { status: 400 }
      );
    }

    let reqBody: { theme?: string } = {};
    try {
      reqBody = await req.json();
    } catch {}

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
