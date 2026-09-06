import { getRequiredUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { HistoryClient } from "@/components/history/history-client";

export const revalidate = 0;

export default async function HistoryPage() {
  const user = await getRequiredUser();
  if (!user) return null;

  const rawHistory = await prisma.notificationHistory.findMany({
    where: { userId: user.id },
    orderBy: { sentAt: "desc" },
    take: 100,
  });

  const history = rawHistory.map((h) => ({
    id: h.id,
    notificationId: h.notificationId,
    title: h.title,
    payload: h.payload,
    device: h.device,
    platform: h.platform,
    status: h.status as "sent" | "failed" | "expired",
    error: h.error,
    sentAt: h.sentAt.toISOString(),
  }));

  return <HistoryClient initialHistory={history} />;
}
