import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) {
  console.error("TURSO_DATABASE_URL is not set");
  process.exit(1);
}

const adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoAuthToken });
const prisma = new PrismaClient({ adapter });

const SYSTEM_TEMPLATES = [
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

async function main() {
  console.log("Seeding 12 system templates into Turso...\n");
  let seeded = 0;
  let skipped = 0;

  for (const tmpl of SYSTEM_TEMPLATES) {
    const existing = await prisma.template.findFirst({
      where: { name: tmpl.name, isSystemTemplate: true },
    });

    if (existing) {
      console.log(`[SKIP] "${tmpl.name}" already exists.`);
      skipped++;
      continue;
    }

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

    console.log(`[OK]   "${tmpl.name}" [${tmpl.category}]`);
    seeded++;
  }

  console.log(`\nDone. Seeded: ${seeded}, Skipped: ${skipped}`);

  const total = await prisma.template.count({ where: { isSystemTemplate: true } });
  console.log(`Total system templates in Turso: ${total}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
