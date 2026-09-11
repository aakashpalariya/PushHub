"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  Shield,
  Key,
  Smartphone,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Download,
  LogOut,
  Sparkles,
  History,
  Bell,
  ArrowRight,
  Sun,
  Moon,
  Laptop,
  Palette,
  Share,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { FormField } from "@/components/ui/form-field";
import { toast } from "@/components/ui/custom-toaster";
import { formatDate } from "@/lib/utils";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { usePushSubscription } from "@/hooks/use-push-subscription";

interface UserData {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  createdAt: string;
}

export function SettingsClient({
  user,
  vapidPublicKey,
}: {
  user: UserData;
  vapidPublicKey: string;
}) {
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { capabilities } = usePushSubscription();
  const [copiedKey, setCopiedKey] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleCopyVapidKey = () => {
    navigator.clipboard.writeText(vapidPublicKey);
    setCopiedKey(true);
    toast.success("VAPID Public Key copied to clipboard");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Settings & Configuration"
        description="Account profile, session security, and developer Web Push credentials."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-fit gap-1.5 text-xs border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
          </Button>
        }
      />

      {/* 1. Account Details */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-foreground">Account Profile</h3>
          </div>
          {user.isAdmin ? (
            <Badge variant="purple" className="gap-1 text-xs">
              <Shield className="h-3 w-3" />
              Administrator
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Member
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Full Name">
            <Input value={user.name} disabled className="bg-secondary/40 font-semibold" />
          </FormField>

          <FormField label="Email Address">
            <Input value={user.email} disabled className="bg-secondary/40 font-semibold" />
          </FormField>

          <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <span className="text-xs text-muted-foreground">
              Member since {formatDate(user.createdAt)}
            </span>
            {user.isAdmin && (
              <Link href="/admin">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/10">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Open Administrator Portal</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. Appearance & Theme Settings */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-bold text-foreground">Appearance &amp; Theme</h3>
          </div>
          <Badge
            variant="outline"
            className="capitalize text-xs font-semibold"
          >
            Active: {resolvedTheme} mode
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Select your visual theme. Test push notifications and live previews adapt dynamically to the theme active at the time of notification.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
              theme === "light"
                ? "border-amber-500/60 bg-amber-500/10 shadow-sm"
                : "border-border hover:border-border/80 bg-secondary/30 hover:bg-secondary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <Sun className="h-5 w-5 text-amber-500" />
              {theme === "light" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="mt-3">
              <span className="font-bold text-sm text-foreground block">Light Mode</span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Crisp, high-contrast daytime interface
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
              theme === "dark"
                ? "border-blue-500/60 bg-blue-500/10 shadow-sm"
                : "border-border hover:border-border/80 bg-secondary/30 hover:bg-secondary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <Moon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {theme === "dark" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="mt-3">
              <span className="font-bold text-sm text-foreground block">Dark Mode</span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Deep obsidian, reduced eye fatigue
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
              theme === "system"
                ? "border-purple-500/60 bg-purple-500/10 shadow-sm"
                : "border-border hover:border-border/80 bg-secondary/30 hover:bg-secondary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <Laptop className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {theme === "system" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="mt-3">
              <span className="font-bold text-sm text-foreground block">System Default</span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Matches your OS preference ({resolvedTheme})
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Account Session & Security (Dedicated Logout Section) */}
      <div className="rounded-2xl border border-rose-500/20 bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <LogOut className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          <h3 className="text-lg font-bold text-foreground">Active Session &amp; Sign Out</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-rose-500/5 p-4 rounded-xl border border-rose-500/15">
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              Signed in as <span className="text-rose-600 dark:text-rose-400 font-bold">{user.email}</span>
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Signing out will end your current session and require password authentication to access your notifications and registered devices.
            </p>
          </div>

          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="gap-2 font-bold flex-shrink-0 shadow-lg shadow-rose-500/15"
          >
            <LogOut className="h-4 w-4" />
            <span>{isLoggingOut ? "Logging Out..." : "Log Out of PushHub"}</span>
          </Button>
        </div>
      </div>

      {/* 3. PWA Application Status - ONLY IN MOBILE VIEW */}
      <div className="block md:hidden rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              PWA (Progressive Web App)
            </h3>
          </div>
          {isInstalled ? (
            <Badge variant="success" className="gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3" /> Installed
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">Browser Tab</Badge>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Running PushHub as an installed PWA unlocks native standalone windows, improved background push responsiveness, and iOS Home Screen notification badge capabilities.
          </p>

          {/* iOS Safari Home Screen Guide */}
          {isIOS && !isInstalled && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-2">
              <p className="font-semibold text-blue-700 dark:text-blue-300">
                To install on iOS Safari:
              </p>
              <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  1. Tap <Share className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> <strong>Share</strong> in Safari toolbar
                </span>
                <span>2. Select <strong>&quot;Add to Home Screen&quot;</strong></span>
                <span>3. Launch PushHub from your Home Screen</span>
              </div>
            </div>
          )}

          {/* Standard Android / Chromium Install Prompt */}
          {isInstallable && !isInstalled && (
            <div className="pt-1">
              <Button variant="glow" onClick={install} className="w-full gap-2 text-xs font-bold">
                <Download className="h-4 w-4" />
                <span>Install PushHub Application</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Developer & VAPID Credentials */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h3 className="text-lg font-bold text-foreground">
            Web Push VAPID Protocol Details
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                VAPID Public Key (Safe to share)
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyVapidKey}
                className="h-6 px-2 text-xs gap-1 text-primary"
              >
                {copiedKey ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedKey ? "Copied" : "Copy"}</span>
              </Button>
            </div>
            <Input
              value={vapidPublicKey || "Not configured"}
              readOnly
              className="font-mono text-xs bg-secondary/40"
            />
          </div>

          <div className="p-4 rounded-xl bg-secondary/30 border border-border/70 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-foreground font-bold">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cryptographic Security Guarantee</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Your VAPID Private Key is securely stored in your server-side environment variables and is never exposed to the client or browser network requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
