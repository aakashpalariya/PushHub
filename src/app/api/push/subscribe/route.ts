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
    const { subscription, browser, platform, deviceName, userAgent, deviceId } = body;

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

    // Check existing device count for this user (excluding updating current endpoint/deviceId)
    const existingDevices = await prisma.pushSubscription.findMany({
      where: { userId: session.userId },
    });

    const isExistingThisDevice = existingDevices.some(
      (d) => d.endpoint === endpoint || (deviceId && d.deviceId === deviceId)
    );

    if (!isExistingThisDevice && existingDevices.length >= 3) {
      return NextResponse.json(
        {
          error:
            "Device limit reached! Maximum 3 devices can be connected to one account simultaneously. Please disconnect an existing device first.",
          limitReached: true,
          currentCount: existingDevices.length,
          maxLimit: 3,
        },
        { status: 400 }
      );
    }

    // Upsert the subscription with deviceId, lastActiveAt, isOnline
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
        deviceId: deviceId || null,
        isActive: true,
        isOnline: true,
        lastActiveAt: new Date(),
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
        deviceId: deviceId || null,
        isActive: true,
        isOnline: true,
        lastActiveAt: new Date(),
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
