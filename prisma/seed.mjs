import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const systemTemplates = [
  {
    name: "Simple Alert",
    description: "Minimal, clean notification for general alerts and notifications.",
    category: "Alert",
    isSystemTemplate: true,
    configuration: JSON.stringify({
      name: "Simple Alert",
      title: "New Message",
      body: "You have a new unread notification waiting for you in your inbox.",
      icon: "/presets/icon-bell.png",
      badge: "/presets/badge-bell.png",
      image: "",
      url: "/dashboard",
      tag: "simple-alert",
      direction: "auto",
      requireInteraction: false,
      silent: false,
      renotify: false,
      vibration: [100, 50, 100],
      actions: [
        { action: "view", title: "View Message", icon: "" },
        { action: "dismiss", title: "Dismiss", icon: "" }
      ],
      data: { source: "inbox", priority: "normal" },
      style: { theme: "blue", type: "alert" }
    }),
  },
  {
    name: "Payment Success",
    description: "Confirmed transaction and billing receipt notification.",
    category: "Billing",
    isSystemTemplate: true,
    configuration: JSON.stringify({
      name: "Payment Success",
      title: "Payment Successful",
      body: "Your transaction of $49.00 has been processed successfully. Invoice #INV-8921 is available.",
      icon: "/presets/icon-success.png",
      badge: "/presets/badge-check.png",
      image: "/presets/banner-success.png",
      url: "/history",
      tag: "billing-success",
      direction: "auto",
      requireInteraction: false,
      silent: false,
      renotify: false,
      vibration: [150, 50, 150],
      actions: [
        { action: "receipt", title: "View Receipt", icon: "" },
        { action: "close", title: "Close", icon: "" }
      ],
      data: { invoiceId: "INV-8921", amount: 49.00, currency: "USD" },
      style: { theme: "emerald", type: "success" }
    }),
  },
  {
    name: "Workout Reminder",
    description: "Scheduled health and fitness activity reminder with quick actions.",
    category: "Health",
    isSystemTemplate: true,
    configuration: JSON.stringify({
      name: "Workout Reminder",
      title: "Workout Reminder",
      body: "Time for today's 30-min HIIT workout! Keep your 5-day streak alive 🔥",
      icon: "/presets/icon-bell.png",
      badge: "/presets/badge-star.png",
      image: "",
      url: "/dashboard",
      tag: "workout-streak",
      direction: "auto",
      requireInteraction: true,
      silent: false,
      renotify: true,
      vibration: [200, 100, 200, 100, 200],
      actions: [
        { action: "start", title: "Start Now", icon: "" },
        { action: "snooze", title: "Snooze 15m", icon: "" }
      ],
      data: { routineId: "hiit-30", streakDays: 5 },
      style: { theme: "amber", type: "reminder" }
    }),
  },
  {
    name: "Special Promotion",
    description: "Marketing and flash sale promotion designed to boost engagement.",
    category: "Marketing",
    isSystemTemplate: true,
    configuration: JSON.stringify({
      name: "Special Promotion",
      title: "Special Offer 🎉",
      body: "Flash Sale: Get 50% off all Pro subscriptions for the next 24 hours only. Don't miss out!",
      icon: "/presets/icon-bell.png",
      badge: "/presets/badge-star.png",
      image: "/presets/banner-promo.png",
      url: "/notifications",
      tag: "promo-flash-50",
      direction: "auto",
      requireInteraction: false,
      silent: false,
      renotify: false,
      vibration: [100, 50, 100],
      actions: [
        { action: "claim", title: "Claim 50% Off", icon: "" },
        { action: "later", title: "Remind Later", icon: "" }
      ],
      data: { coupon: "FLASH50", expiresHours: 24 },
      style: { theme: "rose", type: "promotion" }
    }),
  },
  {
    name: "Social Engagement",
    description: "Social media like, comment, or mention activity feed notification.",
    category: "Social",
    isSystemTemplate: true,
    configuration: JSON.stringify({
      name: "Social Engagement",
      title: "Someone liked your post",
      body: "Sarah Jenkins and 14 others liked your post: 'Just launched our new Web Push Testing Lab!'",
      icon: "/presets/icon-message.png",
      badge: "/presets/badge-bell.png",
      image: "",
      url: "/dashboard",
      tag: "social-like",
      direction: "auto",
      requireInteraction: false,
      silent: false,
      renotify: false,
      vibration: [50, 50, 50],
      actions: [
        { action: "view_post", title: "View Post", icon: "" },
        { action: "reply", title: "Reply", icon: "" }
      ],
      data: { postId: "post-981", likesCount: 15 },
      style: { theme: "indigo", type: "social" }
    }),
  },
  {
    name: "Direct Message",
    description: "Instant chat message preview with quick reply capability.",
    category: "Chat",
    isSystemTemplate: true,
    configuration: JSON.stringify({
      name: "Direct Message",
      title: "New message from Alex",
      body: "Hey! Did you check the latest push notification previews on iOS PWA? Looks super slick! 🚀",
      icon: "/presets/icon-message.png",
      badge: "/presets/badge-bell.png",
      image: "",
      url: "/dashboard",
      tag: "chat-alex",
      direction: "auto",
      requireInteraction: true,
      silent: false,
      renotify: true,
      vibration: [100, 100, 100],
      actions: [
        { action: "reply", title: "Quick Reply", icon: "" },
        { action: "mark_read", title: "Mark as Read", icon: "" }
      ],
      data: { senderId: "alex-42", threadId: "thread-789" },
      style: { theme: "cyan", type: "chat" }
    }),
  },
  {
    name: "Software Update",
    description: "App release note and version update announcement.",
    category: "System",
    isSystemTemplate: true,
    configuration: JSON.stringify({
      name: "Software Update",
      title: "New Version Available",
      body: "Push Lab v2.4 is ready! Includes native lockscreen preview & action button reordering.",
      icon: "/logo.png",
      badge: "/presets/badge-bell.png",
      image: "/presets/banner-abstract.png",
      url: "/settings",
      tag: "version-update",
      direction: "auto",
      requireInteraction: false,
      silent: true,
      renotify: false,
      vibration: [80, 40, 80],
      actions: [
        { action: "update", title: "Update & Reload", icon: "" },
        { action: "changelog", title: "Changelog", icon: "" }
      ],
      data: { version: "2.4.0", critical: false },
      style: { theme: "violet", type: "update" }
    }),
  },
  {
    name: "Security Alert",
    description: "Urgent account activity, new device login, or security alert.",
    category: "Security",
    isSystemTemplate: true,
    configuration: JSON.stringify({
      name: "Security Alert",
      title: "New Login Detected",
      body: "A new login was recorded from Chrome on Windows in San Francisco, CA. Was this you?",
      icon: "/presets/icon-alert.png",
      badge: "/presets/badge-shield.png",
      image: "/presets/banner-abstract.png",
      url: "/devices",
      tag: "security-auth",
      direction: "auto",
      requireInteraction: true,
      silent: false,
      renotify: true,
      vibration: [300, 100, 300],
      actions: [
        { action: "verify", title: "Yes, it was me", icon: "" },
        { action: "lock", title: "Lock Account", icon: "" }
      ],
      data: { ip: "192.0.2.1", city: "San Francisco", browser: "Chrome 128" },
      style: { theme: "red", type: "security" }
    }),
  },
  {
    name: "Achievement Unlocked",
    description: "Gamification milestone, badge reward, and level up celebration.",
    category: "Gamification",
    isSystemTemplate: true,
    configuration: JSON.stringify({
      name: "Achievement Unlocked",
      title: "Congratulations! 🏆",
      body: "You unlocked the 'Power Tester' badge for testing 50 push notifications successfully!",
      icon: "/presets/icon-bell.png",
      badge: "/presets/badge-star.png",
      image: "/presets/banner-promo.png",
      url: "/dashboard",
      tag: "badge-milestone",
      direction: "auto",
      requireInteraction: false,
      silent: false,
      renotify: false,
      vibration: [100, 50, 100, 50, 200],
      actions: [
        { action: "share", title: "Share Badge", icon: "" },
        { action: "view_trophies", title: "Trophy Room", icon: "" }
      ],
      data: { badgeId: "power-tester-50", pointsEarned: 500 },
      style: { theme: "yellow", type: "achievement" }
    }),
  },
  {
    name: "Order Delivery",
    description: "Real-time delivery status, courier tracking, and doorstep arrival alert.",
    category: "Delivery",
    isSystemTemplate: true,
    configuration: JSON.stringify({
      name: "Order Delivery",
      title: "Your order is arriving",
      body: "Driver Marcus is 5 minutes away with your delivery. Track his vehicle in real-time.",
      icon: "/presets/icon-success.png",
      badge: "/presets/badge-check.png",
      image: "/presets/banner-success.png",
      url: "/history",
      tag: "order-track-77",
      direction: "auto",
      requireInteraction: true,
      silent: false,
      renotify: true,
      vibration: [200, 100, 200],
      actions: [
        { action: "track", title: "Track on Map", icon: "" },
        { action: "instructions", title: "Delivery Note", icon: "" }
      ],
      data: { orderId: "ORD-9921", driver: "Marcus", etaMinutes: 5 },
      style: { theme: "teal", type: "delivery" }
    }),
  },
  {
    name: "Flight Status Update",
    description: "Real-time gate change, flight boarding call, and boarding pass alert.",
    category: "Travel",
    isSystemTemplate: true,
    configuration: JSON.stringify({
      name: "Flight Status Update",
      title: "Flight DL-492 Boarding Now ✈️",
      body: "Gate changed to B22. Boarding group 3 is now invited to proceed to the gate.",
      icon: "/presets/icon-alert.png",
      badge: "/presets/badge-bell.png",
      image: "/presets/banner-abstract.png",
      url: "/dashboard",
      tag: "flight-dl492",
      direction: "auto",
      requireInteraction: true,
      silent: false,
      renotify: true,
      vibration: [200, 100, 200, 100, 200],
      actions: [
        { action: "boarding_pass", title: "Boarding Pass", icon: "" },
        { action: "gate_map", title: "Airport Map", icon: "" }
      ],
      data: { flight: "DL-492", gate: "B22", terminal: "2", boardingGroup: 3 },
      style: { theme: "sky", type: "travel" }
    }),
  },
  {
    name: "Upcoming Meeting",
    description: "Timely calendar invite notification with 1-click video call join action.",
    category: "Productivity",
    isSystemTemplate: true,
    configuration: JSON.stringify({
      name: "Upcoming Meeting",
      title: "Product Roadmap Sync in 5m 📅",
      body: "Meeting with Engineering & Design teams starting at 10:00 AM in Google Meet.",
      icon: "/presets/icon-message.png",
      badge: "/presets/badge-bell.png",
      image: "/presets/banner-abstract.png",
      url: "/dashboard",
      tag: "meeting-roadmap-sync",
      direction: "auto",
      requireInteraction: true,
      silent: false,
      renotify: true,
      vibration: [150, 50, 150],
      actions: [
        { action: "join_call", title: "Join Video Call", icon: "" },
        { action: "running_late", title: "Running Late (5m)", icon: "" }
      ],
      data: { meetingId: "meet-sync-892", platform: "Google Meet", organizer: "Marcus Vance" },
      style: { theme: "emerald", type: "productivity" }
    }),
  },
];


import bcrypt from "bcryptjs";

async function main() {
  console.log("Cleaning existing database records...");
  await prisma.scheduledNotification.deleteMany({});
  await prisma.notificationHistory.deleteMany({});
  await prisma.pushSubscription.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.template.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("Database cleared successfully.");

  console.log("Seeding system templates...");
  for (const t of systemTemplates) {
    await prisma.template.create({
      data: t,
    });
  }
  console.log(`Successfully seeded ${systemTemplates.length} system templates.`);

  // Seed default admin account
  console.log("Seeding default administrator account...");
  const adminPasswordHash = await bcrypt.hash("adminPassword123!", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin Marcus",
      email: "admin@pushhub.dev",
      passwordHash: adminPasswordHash,
      dateOfBirth: "01/01/1995",
      isAdmin: true,
      isActive: true,
    },
  });
  console.log(`Default admin account ready: ${admin.email}`);

  // Seed default demo user
  console.log("Seeding default demo user account...");
  const demoPasswordHash = await bcrypt.hash("Demo@123", 10);

  const demoUser = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@pushhub.app",
      passwordHash: demoPasswordHash,
      dateOfBirth: "01/01/2001",
      isAdmin: false,
      isActive: true,
    },
  });
  console.log(`Default demo user account ready: ${demoUser.email} (DOB: ${demoUser.dateOfBirth})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
