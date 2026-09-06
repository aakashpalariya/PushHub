import { NextResponse } from "next/server";
import { getAuthSession, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { isAdmin: true },
    });

    await setSessionCookie({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      isAdmin: true,
    });

    return NextResponse.json({
      success: true,
      message: "Account promoted to Administrator",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: true,
      },
    });
  } catch (error) {
    console.error("Self promote error:", error);
    return NextResponse.json(
      { error: "Failed to promote account to administrator" },
      { status: 500 }
    );
  }
}
