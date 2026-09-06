import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    await clearSessionCookie();

    // If browser form submission or HTML request, redirect directly to /login
    const accept = req.headers.get("accept") || "";
    const contentType = req.headers.get("content-type") || "";
    if (
      accept.includes("text/html") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
    }

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to log out" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
