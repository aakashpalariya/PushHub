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
      icon: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
      badge: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=96&auto=format&fit=crop&q=80",
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
      icon: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80",
      badge: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=96&auto=format&fit=crop&q=80",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
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
      icon: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=128&auto=format&fit=crop&q=80",
      badge: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=96&auto=format&fit=crop&q=80",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80",
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
      icon: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=128&auto=format&fit=crop&q=80",
      badge: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=96&auto=format&fit=crop&q=80",
      image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&auto=format&fit=crop&q=80",
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
      icon: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&auto=format&fit=crop&q=80",
      badge: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&auto=format&fit=crop&q=80",
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
      icon: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&auto=format&fit=crop&q=80",
      badge: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&auto=format&fit=crop&q=80",
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
      icon: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=128&auto=format&fit=crop&q=80",
      badge: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=96&auto=format&fit=crop&q=80",
      image: "",
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
      icon: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&auto=format&fit=crop&q=80",
      badge: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=96&auto=format&fit=crop&q=80",
      image: "",
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
      icon: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=128&auto=format&fit=crop&q=80",
      badge: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=96&auto=format&fit=crop&q=80",
      image: "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=600&auto=format&fit=crop&q=80",
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
      icon: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=128&auto=format&fit=crop&q=80",
      badge: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=96&auto=format&fit=crop&q=80",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80",
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
];

async function main() {
  console.log("Seeding system templates...");
  // Clear any existing system templates to prevent duplicates
  await prisma.template.deleteMany({
    where: { isSystemTemplate: true },
  });

  for (const t of systemTemplates) {
    await prisma.template.create({
      data: t,
    });
  }
  console.log(`Successfully seeded ${systemTemplates.length} system templates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
