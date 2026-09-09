"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { toast } from "@/components/ui/custom-toaster";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // 5-click Admin access easter egg (silent navigation)
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleLogoClick = async () => {
    const now = Date.now();
    let currentClicks = logoClicks;

    if (now - lastClickTime > 3000) {
      currentClicks = 1;
    } else {
      currentClicks += 1;
    }

    setLastClickTime(now);
    setLogoClicks(currentClicks);

    if (currentClicks >= 5) {
      setLogoClicks(0);
      router.push("/admin");
    }
  };

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = "Please enter a valid email address";
    }

    if (!password) {
      errs.password = "Password is required";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || "Sign in failed";
        const lower = errorMsg.toLowerCase();
        if (lower.includes("email") || lower.includes("account") || lower.includes("register") || lower.includes("found")) {
          setFieldErrors({ email: errorMsg });
        } else if (lower.includes("password")) {
          setFieldErrors({ password: errorMsg });
        } else {
          setFieldErrors({ email: errorMsg });
        }
        return;
      }

      toast.success("Welcome back to PushHub!");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setFieldErrors({ password: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 selection:bg-primary/20 selection:text-primary">
      {/* Brand Header with 5-click easter egg for Admin */}
      <div
        onClick={handleLogoClick}
        className="flex items-center gap-3 mb-8 cursor-pointer select-none active:scale-95 transition-transform group"
      >
        <div
          className={cn(
            "h-12 w-12 rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden shadow-xl p-1 transition-all",
            logoClicks > 0 && "ring-2 ring-purple-500/50 scale-105"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PushHub Logo" className="h-full w-full object-contain" />
        </div>
        <span className="font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400">
          PushHub
        </span>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="space-y-1.5 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Sign In to PushHub
          </h2>
          <p className="text-sm text-muted-foreground">
            Access your notifications, templates, and connected devices
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField label="Email Address" error={fieldErrors.email} required>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="name@example.com"
                className="pl-10"
                error={Boolean(fieldErrors.email)}
              />
            </div>
          </FormField>

          <FormField label="Password" error={fieldErrors.password} required>
            <div className="flex items-center justify-end mb-1">
              <Link
                href="/forgot-password"
                className="text-xs text-primary font-medium hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                className="pl-10"
                error={Boolean(fieldErrors.password)}
              />
            </div>
          </FormField>

          <Button
            type="submit"
            variant="glow"
            size="lg"
            disabled={loading}
            className="w-full gap-2 font-bold shadow-blue-500/25 mt-2"
          >
            <span>{loading ? "Signing in..." : "Sign In"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Don&apos;t have an account yet?{" "}
          <Link href="/signup" className="text-primary font-bold hover:underline">
            Sign up for free
          </Link>
        </div>
      </div>
    </div>
  );
}
