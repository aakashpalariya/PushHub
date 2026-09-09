import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.scheduledNotification.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Scheduled item not found" }, { status: 404 });
    }

    await prisma.scheduledNotification.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Scheduled notification cancelled",
    });
  } catch (error) {
    console.error("Delete scheduled error:", error);
    return NextResponse.json(
      { error: "Failed to cancel scheduled notification" },
      { status: 500 }
    );
  }
}
