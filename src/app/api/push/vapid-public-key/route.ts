import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push/webpush";

export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json(
      { error: "VAPID Public Key is not configured on the server" },
      { status: 500 }
    );
  }
  return NextResponse.json({ publicKey });
}
