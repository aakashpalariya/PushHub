"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/custom-toaster";

export function AdminLogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Administrator logged out successfully");
      router.push("/login");
      router.refresh();
      window.location.href = "/login";
    } catch {
      toast.error("Failed to log out");
      setLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
      title="Sign Out of Administrator Portal"
    >
      {loggingOut ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
      ) : (
        <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
      )}
      <span className="hidden xs:inline sm:inline">{loggingOut ? "Signing Out..." : "Sign Out"}</span>
    </button>
  );
}
