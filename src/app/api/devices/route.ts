import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Mark stale devices as offline (last heartbeat > 45 seconds ago)
    const cutoffTime = new Date(Date.now() - 45 * 1000);
    await prisma.pushSubscription.updateMany({
      where: {
        userId: session.userId,
        lastActiveAt: { lt: cutoffTime },
        isOnline: true,
      },
      data: { isOnline: false },
    });

    const devices = await prisma.pushSubscription.findMany({
      where: { userId: session.userId },
      orderBy: { lastActiveAt: "desc" },
      select: {
        id: true,
        endpoint: true,
        browser: true,
        platform: true,
        deviceName: true,
        deviceId: true,
        userAgent: true,
        isActive: true,
        isOnline: true,
        lastActiveAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      devices,
      totalCount: devices.length,
      maxAllowed: 3,
    });
  } catch (error) {
    console.error("Fetch devices error:", error);
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
  }
}
