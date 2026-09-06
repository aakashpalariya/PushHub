import { getRequiredUser } from "@/lib/auth/session";
import { getVapidPublicKey } from "@/lib/push/webpush";
import { SettingsClient } from "@/components/settings/settings-client";

export const revalidate = 0;

export default async function SettingsPage() {
  const user = await getRequiredUser();
  if (!user) return null;

  const vapidPublicKey = getVapidPublicKey();

  return (
    <SettingsClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt.toISOString(),
      }}
      vapidPublicKey={vapidPublicKey}
    />
  );
}
