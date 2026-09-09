"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "@/components/ui/custom-toaster";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    dateOfBirth?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errs: {
      email?: string;
      dateOfBirth?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = "Please enter a valid email address";
    }

    if (!dateOfBirth.trim()) {
      errs.dateOfBirth = "Date of birth is required to verify identity";
    }

    if (!password || password.length < 6) {
      errs.password = "New password must be at least 6 characters";
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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, dateOfBirth, password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || "Password reset failed";
        const lower = errorMsg.toLowerCase();
        if (lower.includes("email") || lower.includes("account")) {
          setFieldErrors({ email: errorMsg });
        } else if (lower.includes("date of birth") || lower.includes("dob") || lower.includes("verification")) {
          setFieldErrors({ dateOfBirth: errorMsg });
        } else if (lower.includes("password")) {
          setFieldErrors({ password: errorMsg });
        } else {
          toast.error(errorMsg);
        }
        return;
      }

      setIsSuccess(true);
      toast.success("Password reset successful!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toast.error(msg);
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

      {/* Main Card */}
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        {isSuccess ? (
          <div className="text-center py-4 space-y-5">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Password Reset Complete!
              </h2>
              <p className="text-sm text-muted-foreground">
                Your password has been successfully updated. You can now log in using your new password.
              </p>
            </div>
            <Button
              onClick={() => router.push("/login")}
              variant="glow"
              size="lg"
              className="w-full gap-2 font-bold shadow-emerald-500/25 mt-4"
            >
              <span>Back to Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Reset Password
              </h2>
              <p className="text-sm text-muted-foreground">
                Verify your registered email and Date of Birth to set a new password
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

              <FormField label="Date of Birth (Identity Verification)" error={fieldErrors.dateOfBirth} required>
                <DatePicker
                  value={dateOfBirth}
                  onChange={(val) => {
                    setDateOfBirth(val);
                    if (fieldErrors.dateOfBirth)
                      setFieldErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                  }}
                  placeholder="Jul 12, 2021"
                  error={Boolean(fieldErrors.dateOfBirth)}
                />
              </FormField>

              <FormField label="New Password" error={fieldErrors.password} required>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password)
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Minimum 6 characters"
                    className="pl-10"
                    error={Boolean(fieldErrors.password)}
                  />
                </div>
              </FormField>

              <FormField label="Confirm New Password" error={fieldErrors.confirmPassword} required>
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
                    placeholder="Re-enter new password"
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
                <span>{loading ? "Resetting Password..." : "Reset Password"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="pt-2 text-center text-xs text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3 inline" />
                Back to Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
