import { NextResponse } from "next/server";
import { prisma, initDb } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { comparePassword, hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    await initDb();

    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid credentials" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Auto-create default administrator if attempting login on a freshly initialized database
    const envAdminPassword = process.env.ADMIN_PASSWORD;
    if (!user && (normalizedEmail === "admin@pushhub.dev" || normalizedEmail === "admin@pushlab.dev")) {
      const initialPassword = envAdminPassword || "adminPassword123!";
      const passwordHash = await hashPassword(initialPassword);
      user = await prisma.user.create({
        data: {
          name: "Admin Marcus",
          email: normalizedEmail,
          passwordHash,
          isAdmin: true,
          isActive: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 }
      );
    }

    let isMatch = false;
    if (user.isAdmin && envAdminPassword && password === envAdminPassword) {
      isMatch = true;
      const hashMatches = await comparePassword(password, user.passwordHash);
      if (!hashMatches) {
        const updatedHash = await hashPassword(password);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: updatedHash },
        });
      }
    } else {
      isMatch = await comparePassword(password, user.passwordHash);
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { error: "This account has been deactivated by an administrator." },
        { status: 403 }
      );
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
