import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getRequiredAdmin } from "@/lib/auth/admin";

export async function GET() {
  const admin = await getRequiredAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const [
      totalUsers,
      totalNotifications,
      totalSubscriptions,
      totalHistory,
      totalTemplates,
      sentPushes,
      failedPushes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.notification.count(),
      prisma.pushSubscription.count(),
      prisma.notificationHistory.count(),
      prisma.template.count(),
      prisma.notificationHistory.count({ where: { status: "sent" } }),
      prisma.notificationHistory.count({ where: { status: "failed" } }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalNotifications,
        totalSubscriptions,
        totalHistory,
        totalTemplates,
        sentPushes,
        failedPushes,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load admin stats" }, { status: 500 });
  }
}
