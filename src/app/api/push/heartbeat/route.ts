import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: { endpoint?: string; deviceId?: string; status?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Beacon calls might send text/plain or stringified JSON
    }

    const { endpoint, deviceId, status } = body;
    const isDisconnect = status === "disconnect";

    if (endpoint || deviceId) {
      const whereClause = endpoint
        ? { endpoint, userId: session.userId }
        : { deviceId, userId: session.userId };

      await prisma.pushSubscription.updateMany({
        where: whereClause,
        data: {
          isOnline: !isDisconnect,
          lastActiveAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Mark any devices whose last active heartbeat is older than 45s as offline
    const cutoffTime = new Date(Date.now() - 45 * 1000);
    await prisma.pushSubscription.updateMany({
      where: {
        userId: session.userId,
        lastActiveAt: { lt: cutoffTime },
        isOnline: true,
      },
      data: {
        isOnline: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Heartbeat API error:", error);
    return NextResponse.json({ error: "Failed to record heartbeat" }, { status: 500 });
  }
}
