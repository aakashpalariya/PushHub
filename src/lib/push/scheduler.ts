import { prisma } from "../db/prisma";
import { sendWebPushToSubscription } from "./webpush";

declare global {
  // eslint-disable-next-line no-var
  var __pushSchedulerTimer: NodeJS.Timeout | undefined;
}

export async function processScheduledNotifications() {
  try {
    const now = new Date();
    const pendingList = await prisma.scheduledNotification.findMany({
      where: {
        status: "pending",
        scheduledAt: { lte: now },
      },
      take: 20,
    });

    if (pendingList.length === 0) return;

    for (const item of pendingList) {
      try {
        let payload: Record<string, unknown> = {};
        try {
          payload = JSON.parse(item.payload);
        } catch {
          payload = { title: item.title, body: item.body };
        }

        // Determine target subscriptions
        let subscriptions: Array<{
          id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          deviceName?: string | null;
          browser?: string | null;
          platform?: string | null;
        }> = [];

        if (item.targetSubscriptionId) {
          const sub = await prisma.pushSubscription.findFirst({
            where: { id: item.targetSubscriptionId, userId: item.userId },
          });
          if (sub) subscriptions = [sub];
        } else if (item.targetDeviceId) {
          const sub = await prisma.pushSubscription.findFirst({
            where: { deviceId: item.targetDeviceId, userId: item.userId },
          });
          if (sub) subscriptions = [sub];
        } else if (item.targetMode === "active") {
          // Find online device or most recently active device
          const onlineSub = await prisma.pushSubscription.findFirst({
            where: { userId: item.userId, isOnline: true },
            orderBy: { lastActiveAt: "desc" },
          });
          if (onlineSub) {
            subscriptions = [onlineSub];
          } else {
            // Fallback to most recently active
            const recentSub = await prisma.pushSubscription.findFirst({
              where: { userId: item.userId },
              orderBy: { lastActiveAt: "desc" },
            });
            if (recentSub) subscriptions = [recentSub];
          }
        } else {
          // "all" mode
          subscriptions = await prisma.pushSubscription.findMany({
            where: { userId: item.userId },
          });
        }

        if (subscriptions.length === 0) {
          await prisma.scheduledNotification.update({
            where: { id: item.id },
            data: {
              status: "failed",
              error: "No matching target devices found at dispatch time",
            },
          });
          continue;
        }

        let sentCount = 0;
        let failedCount = 0;

        for (const sub of subscriptions) {
          const res = await sendWebPushToSubscription(
            {
              id: sub.id,
              endpoint: sub.endpoint,
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
            payload
          );

          const status = res.success ? "sent" : res.expired ? "expired" : "failed";
          if (res.success) sentCount++;
          else failedCount++;

          await prisma.notificationHistory.create({
            data: {
              userId: item.userId,
              notificationId: item.notificationId || null,
              title: item.title,
              payload: JSON.stringify(payload),
              device: sub.deviceName || sub.browser || "Scheduled Target Device",
              platform: sub.platform || "Web",
              status,
              error: res.error || null,
            },
          });
        }

        await prisma.scheduledNotification.update({
          where: { id: item.id },
          data: {
            status: sentCount > 0 ? "sent" : "failed",
            sentAt: new Date(),
            error: failedCount > 0 ? `${failedCount} device(s) failed delivery` : null,
          },
        });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown error during scheduled push";
        console.error(`Error processing scheduled notification ${item.id}:`, err);
        await prisma.scheduledNotification.update({
          where: { id: item.id },
          data: {
            status: "failed",
            error: errMsg,
          },
        });
      }
    }
  } catch (error) {
    console.error("Scheduler process error:", error);
  }
}

export function startScheduler() {
  if (globalThis.__pushSchedulerTimer) return;

  globalThis.__pushSchedulerTimer = setInterval(() => {
    processScheduledNotifications().catch((err) =>
      console.error("Scheduler interval error:", err)
    );
  }, 1000);
}

// Auto-start scheduler when module is imported
startScheduler();
