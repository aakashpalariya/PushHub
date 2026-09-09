import { NextResponse } from "next/server";
import { prisma, initDb } from "@/lib/db/prisma";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";

function normalizeDateString(dateStr: string): string {
  if (!dateStr) return "";
  const cleaned = dateStr.trim();
  // Matches YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  // Matches DD/MM/YYYY or D/M/YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  return cleaned.toLowerCase();
}

export async function POST(req: Request) {
  try {
    await initDb();

    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid inputs" },
        { status: 400 }
      );
    }

    const { email, dateOfBirth, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 }
      );
    }

    if (!user.dateOfBirth) {
      return NextResponse.json(
        { error: "No Date of Birth recorded for this account. Please contact support." },
        { status: 400 }
      );
    }

    const inputNormalized = normalizeDateString(dateOfBirth);
    const dbNormalized = normalizeDateString(user.dateOfBirth);

    const matches =
      inputNormalized === dbNormalized ||
      dateOfBirth.trim() === user.dateOfBirth.trim();

    if (!matches) {
      return NextResponse.json(
        { error: "Date of Birth verification failed. Details do not match our records." },
        { status: 401 }
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting password" },
      { status: 500 }
    );
  }
}
