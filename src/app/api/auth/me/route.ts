import { NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getRequiredUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
