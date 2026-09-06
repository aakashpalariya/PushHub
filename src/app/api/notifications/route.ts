import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { notificationConfigSchema } from "@/lib/validation/notification";

export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";

  let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (sort === "oldest") orderBy = { createdAt: "asc" };
  else if (sort === "updated") orderBy = { updatedAt: "desc" };
  else if (sort === "tested") orderBy = { lastTested: "desc" };

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.userId,
        OR: search
          ? [
              { name: { contains: search } },
              { title: { contains: search } },
              { body: { contains: search } },
            ]
          : undefined,
      },
      orderBy,
    });

    const parsedNotifications = notifications.map((n) => ({
      ...n,
      vibration: n.vibration ? JSON.parse(n.vibration) : [100, 50, 100],
      actions: n.actions ? JSON.parse(n.actions) : [],
      data: n.data ? JSON.parse(n.data) : {},
      style: n.style ? JSON.parse(n.style) : {},
    }));

    return NextResponse.json({ notifications: parsedNotifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

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
        { error: result.error.errors[0]?.message || "Invalid notification payload" },
        { status: 400 }
      );
    }

    const val = result.data;
    const notification = await prisma.notification.create({
      data: {
        userId: session.userId,
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
        ...notification,
        vibration: notification.vibration ? JSON.parse(notification.vibration) : [],
        actions: notification.actions ? JSON.parse(notification.actions) : [],
        data: notification.data ? JSON.parse(notification.data) : {},
        style: notification.style ? JSON.parse(notification.style) : {},
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Failed to save notification" }, { status: 500 });
  }
}
