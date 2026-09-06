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
    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Access check: system templates are available to all; custom templates only to owner
    if (!template.isSystemTemplate && template.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.userId },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          error: "No devices are subscribed yet. Please click 'Enable & Subscribe Device' to receive push notifications.",
          requiresSubscription: true,
        },
        { status: 400 }
      );
    }

    let reqBody: { theme?: string } = {};
    try {
      reqBody = await req.json();
    } catch {}

    let parsedConfig: Record<string, unknown> = {};
    try {
      parsedConfig = JSON.parse(template.configuration);
    } catch (err) {
      console.error("Failed to parse template configuration", err);
    }

    const title = (parsedConfig.title as string) || template.name;
    const body = (parsedConfig.body as string) || template.description || "Notification test";
    const icon = (parsedConfig.icon as string) || "/logo.png";
    const badge = (parsedConfig.badge as string) || "/logo.png";
    const image = (parsedConfig.image as string) || undefined;
    const url = (parsedConfig.url as string) || "/dashboard";
    const tag = (parsedConfig.tag as string) || `template-${template.id}`;
    const direction = (parsedConfig.direction as "auto" | "ltr" | "rtl") || "auto";
    const requireInteraction = Boolean(parsedConfig.requireInteraction);
    const silent = Boolean(parsedConfig.silent);
    const renotify = Boolean(parsedConfig.renotify);
    const vibration = parsedConfig.vibration || [100, 50, 100];
    const actions = parsedConfig.actions || [];
    const customData = (parsedConfig.data as Record<string, unknown>) || {};
    const activeTheme = reqBody.theme || (customData.theme as string) || "dark";

    const pushPayload = {
      title,
      body,
      icon,
      badge,
      image,
      url,
      tag,
      direction,
      requireInteraction,
      silent,
      renotify,
      vibration,
      actions,
      theme: activeTheme,
      data: {
        ...customData,
        theme: activeTheme,
        templateId: template.id,
        templateName: template.name,
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
          title,
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
      message: `Test push for "${template.name}" delivered to ${sentCount} device(s)!`,
      sentCount,
      failedCount,
      totalDevices: subscriptions.length,
    });
  } catch (error) {
    console.error("Error dispatching template test push:", error);
    const msg = error instanceof Error ? error.message : "Failed to dispatch test push";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
