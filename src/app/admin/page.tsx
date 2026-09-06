import Link from "next/link";
import { getRequiredAdmin } from "@/lib/auth/admin";
import { getRequiredUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AdminClient } from "@/components/admin/admin-client";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ArrowLeft, Shield } from "lucide-react";

export const revalidate = 0;

export default async function StandaloneAdminPage() {
  const admin = await getRequiredAdmin();

  // If not authenticated as administrator, show the Admin Password Login screen
  if (!admin) {
    const sessionUser = await getRequiredUser();
    return <AdminLoginForm currentMemberEmail={sessionUser?.email} />;
  }

  // Load platform-wide metrics, users, audit logs, and templates
  const [
    totalUsers,
    activeUsersCount,
    deactivatedUsersCount,
    totalNotifications,
    totalSubscriptions,
    totalHistory,
    totalTemplates,
    sentPushes,
    failedPushes,
    rawUsers,
    rawHistory,
    rawTemplates,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.notification.count(),
    prisma.pushSubscription.count(),
    prisma.notificationHistory.count(),
    prisma.template.count({
      where: {
        OR: [{ isSystemTemplate: true }, { userId: admin.id }],
      },
    }),
    prisma.notificationHistory.count({ where: { status: "sent" } }),
    prisma.notificationHistory.count({ where: { status: "failed" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            notifications: true,
            subscriptions: true,
            history: true,
          },
        },
      },
    }),
    prisma.notificationHistory.findMany({
      take: 60,
      orderBy: { sentAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),
    prisma.template.findMany({
      where: {
        OR: [{ isSystemTemplate: true }, { userId: admin.id }],
      },
      orderBy: [{ isSystemTemplate: "desc" }, { createdAt: "desc" }],
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),
  ]);

  const users = rawUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  const logs = rawHistory.map((h) => ({
    id: h.id,
    title: h.title,
    payload: h.payload,
    device: h.device || "Unknown Device",
    platform: h.platform || "Web",
    status: h.status,
    error: h.error,
    sentAt: h.sentAt.toISOString(),
    userName: h.user?.name || "Member",
    userEmail: h.user?.email || "Unknown",
  }));

  const templates = rawTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    isSystemTemplate: t.isSystemTemplate,
    createdAt: t.createdAt.toISOString(),
    author: t.isSystemTemplate ? "System Default" : (t.user ? `${t.user.name} (Admin)` : "Administrator"),
  }));

  const stats = {
    totalUsers,
    activeUsersCount,
    deactivatedUsersCount,
    totalNotifications,
    totalSubscriptions,
    totalHistory,
    totalTemplates,
    sentPushes,
    failedPushes,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Dedicated Admin Portal Header */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-card px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden p-1 shadow-xs flex-shrink-0 hover:border-primary/50 transition-colors"
              title="Return to Dashboard"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="PushHub Logo" className="h-full w-full object-contain" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link href="/dashboard" className="font-extrabold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400 truncate">
                  PushHub
                </Link>
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono font-bold flex-shrink-0">
                  ADMIN
                </span>
              </div>
              <span className="text-[11px] sm:text-xs text-muted-foreground truncate block font-medium">
                {admin.email}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Back to PushHub Button (Mobile: Touch-friendly Pill, Desktop: Full text) */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 border border-primary/25 transition-all active:scale-95"
              title="Return to Main PushHub App"
            >
              <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">PushHub</span>
            </Link>

            <ThemeToggle size="sm" />

            <AdminLogoutButton />
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
        <AdminClient
          initialUsers={users}
          initialStats={stats}
          initialLogs={logs}
          initialTemplates={templates}
          currentAdminEmail={admin.email}
        />
      </main>
    </div>
  );
}
