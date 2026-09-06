import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { notificationConfigSchema } from "@/lib/validation/notification";

export async function GET(
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
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({
      notification: {
        ...notification,
        vibration: notification.vibration ? JSON.parse(notification.vibration) : [100, 50, 100],
        actions: notification.actions ? JSON.parse(notification.actions) : [],
        data: notification.data ? JSON.parse(notification.data) : {},
        style: notification.style ? JSON.parse(notification.style) : {},
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notification" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.notification.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const body = await req.json();
    const result = notificationConfigSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid notification payload" },
        { status: 400 }
      );
    }

    const val = result.data;
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        name: val.name,
        title: val.title,
        body: val.body,
        icon: val.icon || null,
        badge: val.badge || null,
        image: val.image || null,
        url: val.url || "/dashboard",
        tag: val.tag || null,
        direction: val.direction || "auto",
        language: val.language || "en",
        requireInteraction: Boolean(val.requireInteraction),
        silent: Boolean(val.silent),
        renotify: Boolean(val.renotify),
        timestamp: val.timestamp ? Number(val.timestamp) : null,
        vibration: JSON.stringify(val.vibration || [100, 50, 100]),
        actions: JSON.stringify(val.actions || []),
        data: JSON.stringify(val.data || {}),
        style: JSON.stringify(val.style || {}),
      },
    });

    return NextResponse.json({
      success: true,
      notification: {
        ...updated,
        vibration: updated.vibration ? JSON.parse(updated.vibration) : [],
        actions: updated.actions ? JSON.parse(updated.actions) : [],
        data: updated.data ? JSON.parse(updated.data) : {},
        style: updated.style ? JSON.parse(updated.style) : {},
      },
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

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
    const existing = await prisma.notification.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
