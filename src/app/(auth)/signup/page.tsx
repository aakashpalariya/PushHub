"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { toast } from "@/components/ui/custom-toaster";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errs: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = "Full name must be at least 2 characters";
    }

    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = "Please enter a valid email address";
    }

    if (!password || password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || "Registration failed";
        if (errorMsg.toLowerCase().includes("email")) {
          setFieldErrors({ email: errorMsg });
        } else if (errorMsg.toLowerCase().includes("password")) {
          setFieldErrors({ password: errorMsg });
        } else if (errorMsg.toLowerCase().includes("name")) {
          setFieldErrors({ name: errorMsg });
        } else {
          setFieldErrors({ email: errorMsg });
        }
        return;
      }

      toast.success("Account created! Welcome to PushHub.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setFieldErrors({ email: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 selection:bg-primary/20 selection:text-primary">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden shadow-xl p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PushHub Logo" className="h-full w-full object-contain" />
        </div>
        <span className="font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400">
          PushHub
        </span>
      </div>

      {/* Signup Card */}
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="space-y-1.5 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Create Your Account
          </h2>
          <p className="text-sm text-muted-foreground">
            Start crafting and testing Web Push notifications
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField label="Full Name" error={fieldErrors.name} required>
            <div className="relative">
              <User className="h-4 w-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Alex Mercer"
                className="pl-10"
                error={Boolean(fieldErrors.name)}
              />
            </div>
          </FormField>

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
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Minimum 6 characters"
                className="pl-10"
                error={Boolean(fieldErrors.password)}
              />
            </div>
          </FormField>

          <FormField label="Confirm Password" error={fieldErrors.confirmPassword} required>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword)
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                placeholder="Re-enter password"
                className="pl-10"
                error={Boolean(fieldErrors.confirmPassword)}
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
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
