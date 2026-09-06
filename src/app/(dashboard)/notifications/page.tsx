import { getRequiredUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NotificationsListClient } from "@/components/notifications/notifications-list-client";

export const revalidate = 0;

export default async function NotificationsPage() {
  const user = await getRequiredUser();
  if (!user) return null;

  const rawNotifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const notifications = rawNotifications.map((n) => ({
    id: n.id,
    name: n.name,
    title: n.title,
    body: n.body,
    icon: n.icon || "",
    badge: n.badge || "",
    image: n.image || "",
    url: n.url || "",
    tag: n.tag || "",
    direction: (n.direction as "auto" | "ltr" | "rtl") || "auto",
    language: n.language || "en",
    requireInteraction: n.requireInteraction,
    silent: n.silent,
    renotify: n.renotify,
    timestamp: n.timestamp ? Number(n.timestamp) : undefined,
    vibration: n.vibration ? JSON.parse(n.vibration) : [100, 50, 100],
    actions: n.actions ? JSON.parse(n.actions) : [],
    data: n.data ? JSON.parse(n.data) : {},
    style: n.style ? JSON.parse(n.style) : {},
    lastTested: n.lastTested ? n.lastTested.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }));

  return <NotificationsListClient initialNotifications={notifications} />;
}
