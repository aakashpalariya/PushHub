import webpush from "web-push";
import { prisma } from "../db/prisma";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@pushhub.dev";

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error("Error setting VAPID details:", err);
  }
}

export function getVapidPublicKey(): string {
  return vapidPublicKey;
}

export interface SendPushResult {
  endpoint: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  expired?: boolean;
}

export async function sendWebPushToSubscription(
  sub: {
    id?: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: Record<string, unknown>
): Promise<SendPushResult> {
  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  };

  try {
    const result = await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    return {
      endpoint: sub.endpoint,
      success: true,
      statusCode: result.statusCode,
    };
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; message?: string };
    const statusCode = errorObj.statusCode || 500;
    const isExpired = statusCode === 410 || statusCode === 404;

    // If subscription has expired on push service, remove it from database
    if (isExpired && sub.id) {
      try {
        await prisma.pushSubscription.delete({
          where: { id: sub.id },
        });
      } catch (dbErr) {
        console.error("Failed to prune expired subscription", dbErr);
      }
    }

    return {
      endpoint: sub.endpoint,
      success: false,
      statusCode,
      error: errorObj.message || "Push service error",
      expired: isExpired,
    };
  }
}
