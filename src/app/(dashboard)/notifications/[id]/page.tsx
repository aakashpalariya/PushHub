import { notFound } from "next/navigation";
import { getRequiredUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NotificationComposer } from "@/components/composer/notification-composer";
import { NotificationConfig } from "@/types/notification";

export default async function EditNotificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getRequiredUser();
  if (!user) return null;

  const { id } = await params;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!notification) {
    notFound();
  }

  const formattedConfig: NotificationConfig = {
    id: notification.id,
    name: notification.name,
    title: notification.title,
    body: notification.body,
    icon: notification.icon || "",
    badge: notification.badge || "",
    image: notification.image || "",
    url: notification.url || "/dashboard",
    tag: notification.tag || "",
    direction: (notification.direction as "auto" | "ltr" | "rtl") || "auto",
    language: notification.language || "en",
    requireInteraction: notification.requireInteraction,
    silent: notification.silent,
    renotify: notification.renotify,
    timestamp: notification.timestamp ? Number(notification.timestamp) : undefined,
    vibration: notification.vibration ? JSON.parse(notification.vibration) : [100, 50, 100],
    actions: notification.actions ? JSON.parse(notification.actions) : [],
    data: notification.data ? JSON.parse(notification.data) : {},
    style: notification.style ? JSON.parse(notification.style) : {},
    lastTested: notification.lastTested ? notification.lastTested.toISOString() : null,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
  };

  return <NotificationComposer initialData={formattedConfig} isEditMode={true} />;
}
