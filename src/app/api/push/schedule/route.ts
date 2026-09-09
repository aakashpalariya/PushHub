import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { startScheduler, processScheduledNotifications } from "@/lib/push/scheduler";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Trigger background scheduler
  startScheduler();

  try {
    const scheduled = await prisma.scheduledNotification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ scheduled });
  } catch (error) {
    console.error("Fetch scheduled error:", error);
    return NextResponse.json({ error: "Failed to fetch scheduled notifications" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      notificationId,
      name,
      title,
      body: bodyMessage,
      payload,
      targetMode = "all",
      targetDeviceId,
      targetSubscriptionId,
      delaySeconds = 30,
    } = body;

    if (!title || !bodyMessage) {
      return NextResponse.json(
        { error: "Title and body message are required for scheduled notification" },
        { status: 400 }
      );
    }

    const delay = Math.max(1, parseInt(String(delaySeconds), 10) || 30);
    const scheduledAt = new Date(Date.now() + delay * 1000);

    const fullPayload = payload
      ? typeof payload === "string"
        ? payload
        : JSON.stringify(payload)
      : JSON.stringify({
          title,
          body: bodyMessage,
          icon: "/logo.png",
          badge: "/logo.png",
          url: "/dashboard",
          tag: "scheduled-notification",
          data: {
            scheduled: true,
            delaySeconds: delay,
            sentAt: new Date().toISOString(),
          },
        });

    const scheduledItem = await prisma.scheduledNotification.create({
      data: {
        userId: session.userId,
        notificationId: notificationId || null,
        name: name || title,
        title,
        body: bodyMessage,
        payload: fullPayload,
        targetMode,
        targetDeviceId: targetDeviceId || null,
        targetSubscriptionId: targetSubscriptionId || null,
        delaySeconds: delay,
        scheduledAt,
        status: "pending",
      },
    });

    // Make sure scheduler is running
    startScheduler();

    // Trigger immediate check if delay is very short
    if (delay <= 1) {
      processScheduledNotifications().catch(console.error);
    }

    return NextResponse.json({
      success: true,
      message: `Notification scheduled to send in ${delay} second(s)`,
      scheduledItem,
    });
  } catch (error) {
    console.error("Error creating scheduled notification:", error);
    return NextResponse.json(
      { error: "Failed to schedule push notification" },
      { status: 500 }
    );
  }
}
