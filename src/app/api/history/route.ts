import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const history = await prisma.notificationHistory.findMany({
      where: { userId: session.userId },
      orderBy: { sentAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.notificationHistory.deleteMany({
      where: { userId: session.userId },
    });

    return NextResponse.json({ success: true, message: "History cleared successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
  }
}
