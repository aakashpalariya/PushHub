"use server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST() {
  try {
    const adminEmail = "admin@pushhub.dev";
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!adminUser) {
      const defaultHash = await hashPassword("adminPassword123!");
      adminUser = await prisma.user.create({
        data: {
          name: "Admin Marcus",
          email: adminEmail,
          passwordHash: defaultHash,
          isAdmin: true,
        },
      });
    } else if (!adminUser.isAdmin) {
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: { isAdmin: true },
      });
    }

    await setSessionCookie({
      userId: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      isAdmin: true,
    });

    return NextResponse.json({
      success: true,
      message: "Admin authentication successful",
      redirect: "/admin",
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        isAdmin: true,
      },
    });
  } catch (error) {
    console.error("Admin quick access error:", error);
    return NextResponse.json(
      { error: "Failed to establish administrator session" },
      { status: 500 }
    );
  }
}
