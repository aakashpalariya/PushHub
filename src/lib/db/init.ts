import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

let initPromise: Promise<void> | null = null;

async function ensureColumnExists(
  prisma: PrismaClient,
  table: string,
  column: string,
  colDef: string
): Promise<void> {
  try {
    const columns: Array<{ name: string }> = await prisma.$queryRawUnsafe(`PRAGMA table_info("${table}");`);
    const hasCol = columns.some((c) => c.name.toLowerCase() === column.toLowerCase());
    if (!hasCol) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${colDef};`);
    }
  } catch {
    // ignore
  }
}

export const DEFAULT_SYSTEM_TEMPLATES = [
  {
    name: "Flash Sale Announcement",
    description: "High-urgency promotional template for limited-time discount events. Drives immediate click-through with action buttons.",
    category: "Marketing",
    configuration: {
      title: "🔥 Flash Sale: 50% Off Ends Midnight!",
      body: "Huge savings across all premium collections. Don't wait — stock is running out fast!",
      icon: "/logo.png",
      badge: "/logo.png",
      url: "/dashboard",
      tag: "flash-sale",
      requireInteraction: true,
      actions: [
        { action: "shop_now", title: "Shop Now" },
        { action: "remind_later", title: "Later" },
      ],
    },
  },
  {
    name: "Product Feature Launch",
    description: "Announce recently shipped capabilities and major improvements to re-engage active users.",
    category: "Product",
    configuration: {
      title: "✨ Introducing Automated Push Workflows",
      body: "Schedule multi-step triggers, set delivery delays, and monitor target devices in real time.",
      icon: "/logo.png",
      badge: "/logo.png",
      url: "/dashboard",
      tag: "feature-launch",
      actions: [
        { action: "explore", title: "Explore" },
        { action: "dismiss", title: "Dismiss" },
      ],
    },
  },
  {
    name: "Weekly Digest Newsletter",
    description: "Curated weekly recap delivering key highlights, trending updates, and product tips.",
    category: "Marketing",
    configuration: {
      title: "📰 Your Weekly Digest Is Ready",
      body: "Discover top strategies, metrics breakdowns, and expert guides curated just for you.",
      icon: "/logo.png",
      badge: "/logo.png",
      url: "/dashboard",
      tag: "weekly-digest",
      actions: [
        { action: "read_digest", title: "Read Digest" },
      ],
    },
  },
  {
    name: "System Maintenance Notice",
    description: "Advance notification informing users of planned maintenance windows and brief service downtime.",
    category: "System",
    configuration: {
      title: "🛠️ Scheduled Maintenance Tonight (2:00 AM UTC)",
      body: "PushHub will undergo database maintenance for approx 15 minutes. No data will be affected.",
      icon: "/logo.png",
      badge: "/logo.png",
      tag: "system-maintenance",
      requireInteraction: false,
      actions: [
        { action: "status_page", title: "Status Page" },
      ],
    },
  },
  {
    name: "Critical Latency Incident",
    description: "Urgent high-priority alert for operational teams when infrastructure thresholds are breached.",
    category: "Alert",
    configuration: {
      title: "🚨 High Latency Alert: API Gateway (p99 > 1500ms)",
      body: "Gateway latency exceeded threshold in region ap-south-1. Engineering on-call is investigating.",
      icon: "/logo.png",
      badge: "/logo.png",
      url: "/dashboard",
      tag: "incident-alert",
      requireInteraction: true,
      vibration: [300, 150, 300],
      actions: [
        { action: "incident_room", title: "War Room" },
        { action: "acknowledge", title: "Acknowledge" },
      ],
    },
  },
  {
    name: "Suspicious Login Attempt",
    description: "Critical security alert notifying account owners of unrecognized devices or foreign IP sign-ins.",
    category: "Security",
    configuration: {
      title: "🛡️ Security Alert: Unrecognized Sign-In",
      body: "A new session was initiated from Chrome on Windows. If this wasn't you, revoke access immediately.",
      icon: "/logo.png",
      badge: "/logo.png",
      url: "/admin",
      tag: "security-alert",
      requireInteraction: true,
      vibration: [200, 100, 200, 100, 200],
      actions: [
        { action: "review_activity", title: "Review Activity" },
        { action: "lock_account", title: "Lock Account" },
      ],
    },
  },
  {
    name: "Order Placed & Confirmed",
    description: "Order receipt and shipping update notifying customers their purchase has been confirmed.",
    category: "Transactional",
    configuration: {
      title: "📦 Order #PH-8942 Confirmed",
      body: "Your order has been received and is being prepared for dispatch. Track your shipment live.",
      icon: "/logo.png",
      badge: "/logo.png",
      url: "/dashboard",
      tag: "order-update",
      actions: [
        { action: "track_package", title: "Track Package" },
        { action: "view_invoice", title: "Invoice" },
      ],
    },
  },
  {
    name: "Payment Succeeded",
    description: "Financial confirmation acknowledging successful subscription renewal or payment receipt.",
    category: "Transactional",
    configuration: {
      title: "💳 Payment Received — Thank You!",
      body: "Your monthly Pro plan subscription payment of $29.00 has been successfully processed.",
      icon: "/logo.png",
      badge: "/logo.png",
      url: "/dashboard",
      tag: "billing-receipt",
      actions: [
        { action: "download_pdf", title: "Download PDF" },
      ],
    },
  },
  {
    name: "Incoming Chat Message",
    description: "Instant messaging alert notifying users of new direct messages or team channel mentions.",
    category: "Social",
    configuration: {
      title: "💬 Sarah Jenkins: Project update",
      body: "Hey! I just uploaded the latest API test results to the shared dashboard. Take a look!",
      icon: "/logo.png",
      badge: "/logo.png",
      url: "/dashboard",
      tag: "chat-message",
      renotify: true,
      actions: [
        { action: "reply", title: "Reply" },
        { action: "mark_read", title: "Mark as Read" },
      ],
    },
  },
  {
    name: "Community Connection Request",
    description: "Social connection invite notification encouraging collaboration and networking.",
    category: "Social",
    configuration: {
      title: "👋 Alex Morgan wants to connect",
      body: "Alex sent you a connection invite: 'Looking forward to collaborating on the push project!'",
      icon: "/logo.png",
      badge: "/logo.png",
      url: "/dashboard",
      tag: "connection-request",
      actions: [
        { action: "accept", title: "Accept" },
        { action: "ignore", title: "Ignore" },
      ],
    },
  },
  {
    name: "Task Deadline Approaching",
    description: "Timely nudge for pending deadlines, upcoming team meetings, or scheduled tasks.",
    category: "Productivity",
    configuration: {
      title: "⏰ Reminder: Sprint Review in 30 Minutes",
      body: "Join the engineering team call to review sprint deliverables and release status.",
      icon: "/logo.png",
      badge: "/logo.png",
      url: "/dashboard",
      tag: "calendar-reminder",
      vibration: [100, 50, 100],
      actions: [
        { action: "join_meeting", title: "Join Meeting" },
        { action: "snooze_10m", title: "Snooze 10m" },
      ],
    },
  },
  {
    name: "Daily Focus Reminder",
    description: "Gentle morning motivation encouraging users to review daily goals and track priority milestones.",
    category: "Productivity",
    configuration: {
      title: "🌅 Good Morning! Ready to focus?",
      body: "You have 4 priority tasks scheduled for today. Review your dashboard to kick off strong.",
      icon: "/logo.png",
      badge: "/logo.png",
      url: "/dashboard",
      tag: "daily-focus",
      actions: [
        { action: "view_tasks", title: "View Tasks" },
        { action: "dismiss", title: "Dismiss" },
      ],
    },
  },
];

export async function ensureDatabaseReady(prisma: PrismaClient): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Ensure tables exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "passwordHash" TEXT NOT NULL,
          "dateOfBirth" TEXT,
          "isAdmin" BOOLEAN NOT NULL DEFAULT false,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await ensureColumnExists(prisma, "User", "dateOfBirth", "TEXT");

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
          "deviceId" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "isOnline" BOOLEAN NOT NULL DEFAULT true,
          "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await ensureColumnExists(prisma, "PushSubscription", "deviceId", "TEXT");
      await ensureColumnExists(prisma, "PushSubscription", "isActive", "BOOLEAN NOT NULL DEFAULT true");
      await ensureColumnExists(prisma, "PushSubscription", "isOnline", "BOOLEAN NOT NULL DEFAULT true");
      await ensureColumnExists(prisma, "PushSubscription", "lastActiveAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "PushSubscription_deviceId_idx" ON "PushSubscription"("deviceId");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ScheduledNotification" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "notificationId" TEXT,
          "name" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "body" TEXT NOT NULL,
          "payload" TEXT NOT NULL,
          "targetMode" TEXT NOT NULL DEFAULT 'all',
          "targetDeviceId" TEXT,
          "targetSubscriptionId" TEXT,
          "delaySeconds" INTEGER NOT NULL DEFAULT 30,
          "scheduledAt" DATETIME NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "sentAt" DATETIME,
          "error" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ScheduledNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "ScheduledNotification_userId_idx" ON "ScheduledNotification"("userId");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "ScheduledNotification_status_scheduledAt_idx" ON "ScheduledNotification"("status", "scheduledAt");
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

      // 3. Ensure Default Admin & Demo Accounts exist with ADMIN_PASSWORD env sync
      const adminPassword = process.env.ADMIN_PASSWORD || "adminPassword123!";
      const adminUser = await prisma.user.findUnique({
        where: { email: "admin@pushhub.dev" },
      });

      if (!adminUser) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await prisma.user.create({
          data: {
            name: "Admin Marcus",
            email: "admin@pushhub.dev",
            passwordHash,
            dateOfBirth: "01/01/1995",
            isAdmin: true,
            isActive: true,
          },
        });
        console.log("[PushHub DB] Seeded default admin user (admin@pushhub.dev)");
      } else {
        const matches = await bcrypt.compare(adminPassword, adminUser.passwordHash);
        if (!matches) {
          const passwordHash = await bcrypt.hash(adminPassword, 10);
          await prisma.user.update({
            where: { id: adminUser.id },
            data: { passwordHash, isAdmin: true },
          });
          console.log("[PushHub DB] Synchronized admin password from ADMIN_PASSWORD env variable");
        }
      }

      const demoUser = await prisma.user.findUnique({
        where: { email: "demo@pushhub.app" },
      });

      if (!demoUser) {
        const demoHash = await bcrypt.hash("Demo@123", 10);
        await prisma.user.create({
          data: {
            name: "Demo User",
            email: "demo@pushhub.app",
            passwordHash: demoHash,
            dateOfBirth: "01/01/2001",
            isAdmin: false,
            isActive: true,
          },
        });
        console.log("[PushHub DB] Seeded default demo user (demo@pushhub.app)");
      }

      // 4. Ensure 12 System Templates exist
      const existingCount = await prisma.template.count({
        where: { isSystemTemplate: true },
      });

      if (existingCount < DEFAULT_SYSTEM_TEMPLATES.length) {
        for (const tmpl of DEFAULT_SYSTEM_TEMPLATES) {
          const existing = await prisma.template.findFirst({
            where: { name: tmpl.name, isSystemTemplate: true },
          });

          if (!existing) {
            await prisma.template.create({
              data: {
                name: tmpl.name,
                description: tmpl.description,
                category: tmpl.category,
                configuration: JSON.stringify(tmpl.configuration),
                isSystemTemplate: true,
                userId: null,
              },
            });
            console.log(`[PushHub DB] Seeded system template: "${tmpl.name}" [${tmpl.category}]`);
          }
        }
      }
    } catch (error) {
      console.error("[PushHub DB] ensureDatabaseReady error:", error);
    }
  })();

  return initPromise;
}
