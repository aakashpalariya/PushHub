import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getRequiredAdmin } from "@/lib/auth/admin";

export async function GET() {
  const admin = await getRequiredAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            notifications: true,
            subscriptions: true,
            history: true,
          },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
