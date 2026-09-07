import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

export function getDatabasePath(): string {
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY
  );

  if (isServerless) {
    const tmpDir = path.join("/tmp", "pushhub_data");
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch (err) {
        console.warn("[PushHub DB] Failed to create /tmp/pushhub_data:", err);
      }
    }
    return path.join(tmpDir, "pushhub.db");
  }

  const customUrl = process.env.DATABASE_URL;
  if (customUrl && customUrl.startsWith("file:")) {
    const rawPath = customUrl.replace(/^file:/, "");
    return path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
  }

  const localDir = path.join(process.cwd(), "prisma");
  if (!fs.existsSync(localDir)) {
    try {
      fs.mkdirSync(localDir, { recursive: true });
    } catch {
      // ignore
    }
  }
  return path.join(localDir, "dev.db");
}

export function bootstrapDatabaseFile(): void {
  try {
    const targetDbPath = getDatabasePath();
    const targetDir = path.dirname(targetDbPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (fs.existsSync(targetDbPath) && fs.statSync(targetDbPath).size > 0) {
      return;
    }

    const candidatePaths = [
      path.join(process.cwd(), "prisma", "starter.db"),
      path.join(process.cwd(), "prisma", "dev.db"),
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
        fs.copyFileSync(candidate, targetDbPath);
        console.log(`[PushHub DB] Seeded SQLite database initialized from ${candidate} -> ${targetDbPath}`);
        return;
      }
    }
  } catch (error) {
    console.warn("[PushHub DB] Error during bootstrapDatabaseFile:", error);
  }
}

let initPromise: Promise<void> | null = null;

export async function ensureDatabaseReady(prisma: PrismaClient): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 1. Ensure file is copied
      bootstrapDatabaseFile();

      // 2. Ensure tables exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "passwordHash" TEXT NOT NULL,
          "isAdmin" BOOLEAN NOT NULL DEFAULT false,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "body" TEXT NOT NULL,
          "icon" TEXT,
          "badge" TEXT,
          "image" TEXT,
          "url" TEXT,
          "tag" TEXT,
          "direction" TEXT DEFAULT 'auto',
          "language" TEXT DEFAULT 'en',
          "requireInteraction" BOOLEAN NOT NULL DEFAULT false,
          "silent" BOOLEAN NOT NULL DEFAULT false,
          "renotify" BOOLEAN NOT NULL DEFAULT false,
          "timestamp" REAL,
          "vibration" TEXT,
          "data" TEXT,
          "actions" TEXT,
          "style" TEXT,
          "lastTested" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PushSubscription" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "endpoint" TEXT NOT NULL,
          "p256dh" TEXT NOT NULL,
          "auth" TEXT NOT NULL,
          "userAgent" TEXT,
          "platform" TEXT,
          "browser" TEXT,
          "deviceName" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "NotificationHistory" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "notificationId" TEXT,
          "title" TEXT NOT NULL,
          "payload" TEXT NOT NULL,
          "device" TEXT,
          "platform" TEXT,
          "status" TEXT NOT NULL,
          "error" TEXT,
          "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "NotificationHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "NotificationHistory_userId_idx" ON "NotificationHistory"("userId");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Template" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT,
          "name" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "configuration" TEXT NOT NULL,
          "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Template_userId_idx" ON "Template"("userId");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Template_isSystemTemplate_idx" ON "Template"("isSystemTemplate");
      `);

      // 3. Ensure Default Admin Account exists
      const adminCount = await prisma.user.count({
        where: { email: "admin@pushhub.dev" },
      });

      if (adminCount === 0) {
        const passwordHash = await bcrypt.hash("adminPassword123!", 10);
        await prisma.user.create({
          data: {
            name: "Admin Marcus",
            email: "admin@pushhub.dev",
            passwordHash,
            isAdmin: true,
            isActive: true,
          },
        });
        console.log("[PushHub DB] Seeded default admin user (admin@pushhub.dev)");
      }
    } catch (error) {
      console.error("[PushHub DB] ensureDatabaseReady error:", error);
    }
  })();

  return initPromise;
}
