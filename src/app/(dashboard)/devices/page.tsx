import { getRequiredUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { DevicesClient } from "@/components/devices/devices-client";

export const revalidate = 0;

export default async function DevicesPage() {
  const user = await getRequiredUser();
  if (!user) return null;

  const rawDevices = await prisma.pushSubscription.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  const devices = rawDevices.map((d) => ({
    id: d.id,
    endpoint: d.endpoint,
    browser: d.browser,
    platform: d.platform,
    deviceName: d.deviceName,
    userAgent: d.userAgent,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return <DevicesClient initialDevices={devices} />;
}
