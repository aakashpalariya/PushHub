import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subscription, browser, platform, deviceName, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Invalid PushSubscription payload" },
        { status: 400 }
      );
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      return NextResponse.json(
        { error: "Subscription keys (p256dh, auth) are required" },
        { status: 400 }
      );
    }

    // Upsert the subscription so duplicate endpoints update the user/keys cleanly
    const savedSub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: session.userId,
        p256dh,
        auth,
        userAgent: userAgent || null,
        platform: platform || null,
        browser: browser || null,
        deviceName: deviceName || null,
        updatedAt: new Date(),
      },
      create: {
        userId: session.userId,
        endpoint,
        p256dh,
        auth,
        userAgent: userAgent || null,
        platform: platform || null,
        browser: browser || null,
        deviceName: deviceName || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Device subscribed successfully",
      subscription: savedSub,
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Failed to store push subscription" },
      { status: 500 }
    );
  }
}
