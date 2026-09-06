import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const devices = await prisma.pushSubscription.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        endpoint: true,
        browser: true,
        platform: true,
        deviceName: true,
        userAgent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ devices });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
  }
}
