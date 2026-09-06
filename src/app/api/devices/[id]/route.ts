import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { sendWebPushToSubscription } from "@/lib/push/webpush";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.pushSubscription.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    await prisma.pushSubscription.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Device removed" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove device" }, { status: 500 });
  }
}

// POST to /api/devices/[id] sends a test ping to this specific device
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
    const sub = await prisma.pushSubscription.findFirst({
      where: { id, userId: session.userId },
    });

    if (!sub) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const testPayload = {
      title: "🔔 PushHub Device Test",
      body: `Test signal delivered to ${sub.deviceName || sub.browser || "your device"} successfully!`,
      icon: "/logo.png",
      badge: "/logo.png",
      url: "/devices",
      tag: "device-test-ping",
      vibration: [100, 50, 100],
      actions: [
        { action: "ack", title: "Received!" },
        { action: "settings", title: "Open PushHub" }
      ],
      data: {
        deviceId: sub.id,
        pingTime: new Date().toISOString(),
      },
    };

    const res = await sendWebPushToSubscription(
      {
        id: sub.id,
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
      testPayload
    );

    const status = res.success ? "sent" : res.expired ? "expired" : "failed";

    await prisma.notificationHistory.create({
      data: {
        userId: session.userId,
        title: testPayload.title,
        payload: JSON.stringify(testPayload),
        device: sub.deviceName || sub.browser || "Unknown Device",
        platform: sub.platform || "Web",
        status,
        error: res.error || null,
      },
    });

    if (!res.success) {
      return NextResponse.json(
        { error: res.error || "Failed to deliver push to device" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test ping delivered to ${sub.deviceName || "device"}`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to dispatch test ping" }, { status: 500 });
  }
}
