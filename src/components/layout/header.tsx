"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import {
  Bell,
  BellRing,
  BellOff,
  Smartphone,
  History,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/custom-toaster";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    isAdmin?: boolean;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSubscribed, subscribeDevice, permission } = usePushSubscription();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-card px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 shadow-xs">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile Brand Link */}
        <Link
          href="/dashboard"
          className="flex md:hidden items-center gap-2 group flex-shrink-0"
        >
          <div className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center overflow-hidden p-0.5 group-hover:border-primary/50 transition-colors">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="PushHub Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="font-extrabold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400">
            PushHub
          </span>
        </Link>

        {/* Desktop Status Badge */}
        <div className="hidden md:flex items-center gap-3">
          {isSubscribed ? (
            <Badge variant="success" className="gap-1.5 py-1 px-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Push Subscribed
            </Badge>
          ) : permission === "denied" ? (
            <Badge variant="destructive" className="gap-1.5 py-1 px-3">
              Permission Blocked
            </Badge>
          ) : (
            <Badge variant="warning" className="gap-1.5 py-1 px-3">
              Device Not Subscribed
            </Badge>
          )}
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          {!isSubscribed ? (
            <Button
              size="sm"
              variant="glow"
              onClick={() => subscribeDevice()}
              className="gap-1.5 text-xs font-bold"
            >
              <BellRing className="h-3.5 w-3.5" />
              <span>Subscribe Device</span>
            </Button>
          ) : (
            <Link href="/devices">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                <Smartphone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Device Connected</span>
              </Button>
            </Link>
          )}

          <ThemeToggle />
        </div>

        {/* Mobile Right Actions Bar (Clear, Labeled, Touch-Friendly) */}
        <div className="flex md:hidden items-center gap-1.5 ml-auto flex-shrink-0 relative">
          {/* 1. Push Status Chip with Icon & Label */}
          {isSubscribed ? (
            <Link
              href="/devices"
              className="h-8 px-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all"
              title="Push Subscribed (Device Connected)"
            >
              <Smartphone className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Connected</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            </Link>
          ) : permission === "denied" ? (
            <Link
              href="/devices"
              className="h-8 px-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all"
              title="Notifications Blocked in Browser"
            >
              <BellOff className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Blocked</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => subscribeDevice()}
              className="h-8 px-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-700 dark:text-blue-400 flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all"
              title="Tap to Subscribe Device"
            >
              <BellRing className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Subscribe</span>
            </button>
          )}

          {/* 2. Theme Toggle */}
          <ThemeToggle size="sm" />

          {/* 3. User Profile & Quick Menu Button with Label */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "h-8 px-2.5 rounded-xl border flex items-center gap-1.5 font-bold text-xs transition-all select-none active:scale-95",
              isMobileMenuOpen
                ? "bg-primary text-white border-primary shadow-xs"
                : "bg-secondary/60 border-border text-foreground hover:bg-secondary"
            )}
            title="Account & Quick Menu"
            aria-label="Account & Quick Menu"
          >
            <div className="h-5 w-5 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-[10px] font-bold">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <span>Menu</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform opacity-70", isMobileMenuOpen && "rotate-180")} />
            {user?.isAdmin && (
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
            )}
          </button>

          {/* Mobile Quick Menu Dropdown */}
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Floating Menu Card */}
              <div
                ref={mobileMenuRef}
                className="absolute top-full right-0 mt-2 w-72 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3"
              >
                {/* User Info Header with Full Email */}
                <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/50 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-foreground">
                      {user?.name || "Tester"}
                    </span>
                    {user?.isAdmin ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono font-bold">
                        ADMIN
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-400 font-mono font-semibold">
                        MEMBER
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground break-all leading-tight select-all font-medium">
                    {user?.email || "user@pushhub.dev"}
                  </p>
                </div>

                {/* Menu Navigation Links */}
                <div className="space-y-1">
                  {user?.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                        pathname.startsWith("/admin")
                          ? "bg-purple-600 text-white"
                          : "text-purple-700 dark:text-purple-400 hover:bg-purple-500/10"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Shield className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                        <span>Administrator Portal</span>
                      </div>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/20 font-mono font-bold">
                        PORTAL
                      </span>
                    </Link>
                  )}

                  <Link
                    href="/history"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                      pathname === "/history"
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <History className="h-4 w-4" />
                    <span>Notification History</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                      pathname === "/settings"
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings &amp; Theme</span>
                  </Link>
                </div>

                {/* Sign Out Button */}
                <div className="pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
