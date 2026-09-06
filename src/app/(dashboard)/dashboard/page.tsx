import Link from "next/link";
import { getRequiredUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  Bell,
  Sparkles,
  Smartphone,
  Zap,
  PlusCircle,
  History,
  Send,
  Edit,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { DashboardNotificationActions } from "@/components/dashboard/dashboard-notification-actions";

export const revalidate = 0; // Fresh data on each dashboard view

export default async function DashboardPage() {
  const user = await getRequiredUser();
  if (!user) return null;

  // Fetch metrics in parallel
  const [savedCount, devicesCount, testedCount, templatesCount, recentNotifications] =
    await Promise.all([
      prisma.notification.count({ where: { userId: user.id } }),
      prisma.pushSubscription.count({ where: { userId: user.id } }),
      prisma.notificationHistory.count({ where: { userId: user.id } }),
      prisma.template.count({
        where: {
          OR: [{ isSystemTemplate: true }, { userId: user.id }],
        },
      }),
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-card dark:from-blue-950/60 dark:via-indigo-950/40 border border-blue-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
            <span>Push Notification Lab</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {greeting}, {user.name} 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            Welcome to your push testing studio. Create custom payloads, test across browsers, and review push histories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/notifications/new">
            <Button size="default" variant="glow" className="gap-2 font-bold shadow-blue-500/25">
              <PlusCircle className="h-4 w-4" />
              <span>Create Notification</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Statistics 4-Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">
              Saved Notifications
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{savedCount}</p>
          <span className="text-xs text-muted-foreground block">
            Custom notification presets
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">
              Templates
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{templatesCount}</p>
          <span className="text-xs text-muted-foreground block">
            12 system + custom templates
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">
              Registered Devices
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{devicesCount}</p>
          <span className="text-xs text-muted-foreground block">
            Connected browser endpoints
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">
              Notifications Tested
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{testedCount}</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">
            Dispatched test push events
          </span>
        </div>
      </div>

      {/* Main Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/notifications/new"
          className="p-4 rounded-2xl bg-secondary/30 border border-border/80 hover:border-blue-500/40 hover:bg-secondary/50 transition-all group flex flex-col justify-between"
        >
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 w-fit group-hover:scale-105 transition-transform">
            <PlusCircle className="h-4 w-4" />
          </div>
          <div className="mt-4">
            <h4 className="font-bold text-sm text-foreground">Create Notification</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Author a new payload</p>
          </div>
        </Link>

        <Link
          href="/templates"
          className="p-4 rounded-2xl bg-secondary/30 border border-border/80 hover:border-purple-500/40 hover:bg-secondary/50 transition-all group flex flex-col justify-between"
        >
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 w-fit group-hover:scale-105 transition-transform">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="mt-4">
            <h4 className="font-bold text-sm text-foreground">Browse Templates</h4>
            <p className="text-xs text-muted-foreground mt-0.5">12 production blueprints</p>
          </div>
        </Link>

        <Link
          href="/notifications"
          className="p-4 rounded-2xl bg-secondary/30 border border-border/80 hover:border-emerald-500/40 hover:bg-secondary/50 transition-all group flex flex-col justify-between"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 w-fit group-hover:scale-105 transition-transform">
            <Bell className="h-4 w-4" />
          </div>
          <div className="mt-4">
            <h4 className="font-bold text-sm text-foreground">My Notifications</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Manage saved tests</p>
          </div>
        </Link>

        <Link
          href="/devices"
          className="p-4 rounded-2xl bg-secondary/30 border border-border/80 hover:border-cyan-500/40 hover:bg-secondary/50 transition-all group flex flex-col justify-between"
        >
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 w-fit group-hover:scale-105 transition-transform">
            <Smartphone className="h-4 w-4" />
          </div>
          <div className="mt-4">
            <h4 className="font-bold text-sm text-foreground">Device Manager</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Setup &amp; inspect endpoints</p>
          </div>
        </Link>
      </div>

      {/* Recent Notifications Section */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">Recent Notifications</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your most recently created or tested notification configurations
            </p>
          </div>
          <Link href="/notifications">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary font-bold">
              <span>View All ({savedCount})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {recentNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Create your first custom push notification or pick from the 12 built-in system templates."
            action={
              <div className="flex items-center justify-center gap-3">
                <Link href="/notifications/new">
                  <Button variant="glow" size="sm" className="gap-2 font-bold">
                    <PlusCircle className="h-4 w-4" />
                    <span>Create Notification</span>
                  </Button>
                </Link>
                <Link href="/templates">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Browse Templates</span>
                  </Button>
                </Link>
              </div>
            }
          />
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 rounded-xl bg-secondary/20 border border-border/70 hover:border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-foreground">
                      {notif.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {notif.tag || "general"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    <strong className="text-foreground">{notif.title}:</strong> {notif.body}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                    <span>Created {formatDate(notif.createdAt)}</span>
                    <span>·</span>
                    <span>Last tested: {formatDate(notif.lastTested)}</span>
                  </div>
                </div>

                <DashboardNotificationActions notificationId={notif.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
