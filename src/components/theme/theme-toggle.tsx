"use client";

import { useTheme } from "./theme-provider";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "rounded-xl border transition-all flex items-center justify-center relative active:scale-95",
        isDark
          ? "bg-secondary/40 border-border/70 text-amber-400 hover:bg-secondary/70 hover:text-amber-300"
          : "bg-secondary/60 border-border/80 text-amber-600 hover:bg-secondary hover:text-amber-700",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        className
      )}
      title={`Switch to ${isDark ? "Light" : "Dark"} theme`}
      aria-label={`Switch to ${isDark ? "Light" : "Dark"} theme`}
    >
      {isDark ? (
        <Sun className={cn(size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5", "transition-transform hover:rotate-45 duration-300")} />
      ) : (
        <Moon className={cn(size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5", "transition-transform hover:-rotate-12 duration-300")} />
      )}
    </button>
  );
}
