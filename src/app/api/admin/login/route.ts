import { NextResponse } from "next/server";
import { prisma, initDb } from "@/lib/db/prisma";
import { comparePassword, hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { email, password } = body;
    const adminEmail = (email || "admin@pushhub.dev").trim().toLowerCase();

    if (!password) {
      return NextResponse.json(
        { error: "Administrator password is required" },
        { status: 400 }
      );
    }

    const envAdminPassword = process.env.ADMIN_PASSWORD;

    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!adminUser && adminEmail === "admin@pushhub.dev") {
      const initialPassword = envAdminPassword || "adminPassword123!";
      const defaultHash = await hashPassword(initialPassword);
      adminUser = await prisma.user.create({
        data: {
          name: "Admin Marcus",
          email: adminEmail,
          passwordHash: defaultHash,
          isAdmin: true,
        },
      });
    }

    if (!adminUser || !adminUser.isAdmin) {
      return NextResponse.json(
        { error: "Access denied. Not an administrator account." },
        { status: 403 }
      );
    }

    let isMatch = false;
    if (envAdminPassword && password === envAdminPassword) {
      isMatch = true;
      const hashMatches = await comparePassword(password, adminUser.passwordHash);
      if (!hashMatches) {
        const updatedHash = await hashPassword(password);
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { passwordHash: updatedHash },
        });
      }
    } else {
      isMatch = await comparePassword(password, adminUser.passwordHash);
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect administrator password" },
        { status: 401 }
      );
    }

    await setSessionCookie({
      userId: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      isAdmin: true,
    });

    return NextResponse.json({
      success: true,
      message: "Administrator session established",
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        isAdmin: true,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate administrator" },
      { status: 500 }
    );
  }
}