"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Bell,
  Sparkles,
  Smartphone,
  History,
  Settings,
  LogOut,
  Radio,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/custom-toaster";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface SidebarProps {
  user?: { name: string; email: string; isAdmin?: boolean } | null;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Composer", href: "/notifications/new", icon: PlusCircle },
  { label: "My Notifications", href: "/notifications", icon: Bell },
  { label: "Templates", href: "/templates", icon: Sparkles },
  { label: "Devices & Push", href: "/devices", icon: Smartphone },
  { label: "History", href: "/history", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (err) {
      toast.error("Failed to log out");
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0 z-30 shadow-xs">
      {/* Brand */}
      <div className="p-6 border-b border-border/80 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden shadow-lg p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PushHub Logo" className="h-full w-full object-contain" />
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400">
            PushHub
          </span>
          <span className="block text-xs font-medium text-muted-foreground">
            Notification Testing Studio
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : item.href === "/notifications/new"
              ? pathname === "/notifications/new" ||
                (pathname.startsWith("/notifications/") && pathname !== "/notifications")
              : item.href === "/notifications"
              ? pathname === "/notifications"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all",
                isActive
                  ? "bg-primary text-white shadow-md shadow-blue-500/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-muted-foreground")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {user?.isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all mt-3 border border-purple-500/30",
              pathname.startsWith("/admin")
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                : "text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white hover:bg-purple-500/10 dark:hover:bg-purple-500/15"
            )}
          >
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>Admin Portal</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono font-bold">
              ADMIN
            </span>
          </Link>
        )}
      </nav>

      {/* User Section & Actions */}
      <div className="p-4 border-t border-border/80 bg-secondary/20">
        <div className="p-3 rounded-xl bg-card border border-border/60 space-y-3 shadow-xs">
          {/* User Info with Full Email */}
          <div className="flex items-start gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground leading-snug truncate">
                {user?.name || "Tester"}
              </p>
              <p className="text-[11px] text-muted-foreground break-all leading-tight mt-0.5 font-medium select-all">
                {user?.email || "user@pushhub.dev"}
              </p>
            </div>
          </div>

          {/* Next Line: Theme Toggle and Sign Out Buttons */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ThemeToggle size="sm" />
              <span className="text-[11px] font-semibold text-muted-foreground">Theme</span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/25 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
