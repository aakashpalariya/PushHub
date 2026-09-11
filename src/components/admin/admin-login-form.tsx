"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, Mail, ArrowRight, ArrowLeft, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AdminLoginForm({ currentMemberEmail }: { currentMemberEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pushhub.dev");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = "Administrator email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = "Please enter a valid email address";
    }

    if (!password) {
      errs.password = "Administrator password is required";
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
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || "Authentication failed";
        const lower = errorMsg.toLowerCase();
        if (lower.includes("access") || lower.includes("account") || lower.includes("email") || lower.includes("not an admin")) {
          setFieldErrors({ email: errorMsg });
        } else if (lower.includes("password")) {
          setFieldErrors({ password: errorMsg });
        } else {
          setFieldErrors({ email: errorMsg });
        }
        return;
      }

      router.refresh();
      window.location.reload();
    } catch {
      setFieldErrors({ password: "Failed to connect to administrator authentication service" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      {/* Top Bar for Admin Auth */}
      <div className="fixed top-0 left-0 right-0 p-4 flex items-center justify-between z-10 max-w-5xl mx-auto w-full">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to PushHub</span>
        </Link>
        <ThemeToggle size="sm" />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-card border border-purple-500/30 flex items-center justify-center shadow-xl p-1.5 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="PushHub Logo" className="h-full w-full object-contain" />
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-purple-600 text-white flex items-center justify-center border-2 border-background">
              <Shield className="h-3 w-3" />
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold mb-1.5">
              <Key className="h-3 w-3" />
              <span>Operations Portal</span>
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Administrator Authentication
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Enter administrator password to supervise system operations, manage user accounts, and review push activity.
            </p>
          </div>
        </div>

        {/* Member notice if logged in as a normal member */}
        {currentMemberEmail && currentMemberEmail !== "admin@pushhub.dev" && (
          <div className="p-3 rounded-2xl bg-secondary/50 border border-border text-xs text-muted-foreground">
            Signed in as member: <strong className="text-foreground">{currentMemberEmail}</strong>. Administrator credentials are required to access management features.
          </div>
        )}

        {/* Login Card */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField label="Admin Email" error={fieldErrors.email} required>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="admin@pushhub.dev"
                  className="pl-10"
                  error={Boolean(fieldErrors.email)}
                />
              </div>
            </FormField>

            <FormField
              label="Admin Password"
              error={fieldErrors.password}
              required
            >
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter administrator password"
                  className="pl-10"
                  error={Boolean(fieldErrors.password)}
                  autoFocus
                />
              </div>
            </FormField>

            <Button
              type="submit"
              variant="glow"
              size="lg"
              disabled={loading}
              className="w-full font-bold shadow-purple-500/25 gap-2"
            >
              <Shield className="h-4 w-4" />
              <span>{loading ? "Verifying Credentials..." : "Authenticate as Administrator"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
