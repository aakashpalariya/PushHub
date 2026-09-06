import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getRequiredAdmin } from "@/lib/auth/admin";

export async function GET() {
  const admin = await getRequiredAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const history = await prisma.notificationHistory.findMany({
      orderBy: { sentAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load audit history" }, { status: 500 });
  }
}
