import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { sendWebPushToSubscription } from "@/lib/push/webpush";
import { notificationConfigSchema } from "@/lib/validation/notification";

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = notificationConfigSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const val = result.data;
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.userId },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          error: "No subscribed devices found for your account. Please click 'Enable & Subscribe Device' first.",
          requiresSubscription: true,
        },
        { status: 400 }
      );
    }

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
          device: sub.deviceName || sub.browser || "Unknown Device",
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
      totalDevices: subscriptions.length,
    });
  } catch (error) {
    console.error("Error in direct push send:", error);
    return NextResponse.json({ error: "Failed to dispatch push notification" }, { status: 500 });
  }
}
