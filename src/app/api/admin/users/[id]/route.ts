import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getRequiredAdmin } from "@/lib/auth/admin";
import { hashPassword } from "@/lib/auth/password";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getRequiredAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json(
      { error: "Cannot delete your own administrator account" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `User ${user.email} deleted` });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getRequiredAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { isAdmin, isActive, newPassword, name } = body;

    const updateData: Record<string, unknown> = {};

    if (typeof isActive === "boolean") {
      if (id === admin.id && !isActive) {
        return NextResponse.json(
          { error: "Cannot deactivate your own administrator account" },
          { status: 400 }
        );
      }
      updateData.isActive = isActive;
    }

    if (typeof isAdmin === "boolean") {
      if (id === admin.id && !isAdmin) {
        return NextResponse.json(
          { error: "Cannot revoke admin privileges from yourself" },
          { status: 400 }
        );
      }
      updateData.isAdmin = isAdmin;
    }

    if (name && typeof name === "string") {
      updateData.name = name;
    }

    if (newPassword && typeof newPassword === "string" && newPassword.length >= 6) {
      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
