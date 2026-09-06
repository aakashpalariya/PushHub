import { getRequiredUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NotificationComposer } from "@/components/composer/notification-composer";
import { NotificationConfig } from "@/types/notification";

export default async function NewNotificationPage({
  searchParams,
}: {
  searchParams: Promise<{ templateId?: string }>;
}) {
  const user = await getRequiredUser();
  if (!user) return null;

  const { templateId } = await searchParams;

  let initialData: NotificationConfig | undefined = undefined;

  if (templateId) {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (template) {
      try {
        const parsed = JSON.parse(template.configuration);
        initialData = {
          name: template.name,
          title: parsed.title || template.name,
          body: parsed.body || "",
          icon: parsed.icon || "/logo.png",
          badge: parsed.badge || "/logo.png",
          image: parsed.image || "",
          url: parsed.url || "/dashboard",
          tag: parsed.tag || "",
          direction: parsed.direction || "auto",
          requireInteraction: Boolean(parsed.requireInteraction),
          silent: Boolean(parsed.silent),
          renotify: Boolean(parsed.renotify),
          vibration: parsed.vibration || [100, 50, 100],
          actions: parsed.actions || [],
          data: parsed.data || {},
          style: parsed.style || {},
        };
      } catch (e) {
        console.error("Failed parsing template configuration", e);
      }
    }
  }

  return <NotificationComposer initialData={initialData} isEditMode={false} />;
}
