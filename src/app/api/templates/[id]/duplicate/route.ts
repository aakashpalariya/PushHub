import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";

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

    // Check that user can view it (either system template or owned by user)
    if (!template.isSystemTemplate && template.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let parsedConfig: Record<string, any> = {};
    try {
      parsedConfig = JSON.parse(template.configuration);
    } catch (e) {
      console.error("Failed to parse template configuration", e);
    }

    // 1. Create a saved Notification payload in user's "My Notifications"
    const notification = await prisma.notification.create({
      data: {
        userId: session.userId,
        name: `${template.name} (Copy)`,
        title: parsedConfig.title || template.name,
        body: parsedConfig.body || "",
        icon: parsedConfig.icon || null,
        badge: parsedConfig.badge || null,
        image: parsedConfig.image || null,
        url: parsedConfig.url || "/dashboard",
        tag: parsedConfig.tag || null,
        direction: parsedConfig.direction || "auto",
        language: parsedConfig.language || "en",
        requireInteraction: Boolean(parsedConfig.requireInteraction),
        silent: Boolean(parsedConfig.silent),
        renotify: Boolean(parsedConfig.renotify),
        timestamp: parsedConfig.timestamp ? Number(parsedConfig.timestamp) : null,
        vibration: JSON.stringify(parsedConfig.vibration || [100, 50, 100]),
        actions: JSON.stringify(parsedConfig.actions || []),
        data: JSON.stringify(parsedConfig.data || {}),
        style: JSON.stringify(parsedConfig.style || {}),
      },
    });

    // 2. Also keep a copy in custom templates if needed
    const duplicatedTemplate = await prisma.template.create({
      data: {
        userId: session.userId,
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        configuration: template.configuration,
        isSystemTemplate: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        notification: {
          ...notification,
          vibration: notification.vibration ? JSON.parse(notification.vibration) : [],
          actions: notification.actions ? JSON.parse(notification.actions) : [],
          data: notification.data ? JSON.parse(notification.data) : {},
          style: notification.style ? JSON.parse(notification.style) : {},
        },
        template: duplicatedTemplate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed duplicating template to notification:", error);
    return NextResponse.json({ error: "Failed to copy template" }, { status: 500 });
  }
}
