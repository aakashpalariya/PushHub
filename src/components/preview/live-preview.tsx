"use client";

import { useState } from "react";
import { Monitor, Smartphone, Apple, Info, Sun, Moon } from "lucide-react";
import { NotificationConfig } from "@/types/notification";
import { BrowserPreview } from "./browser-preview";
import { AndroidPreview } from "./android-preview";
import { IOSPreview } from "./ios-preview";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

type PreviewPlatform = "browser" | "android" | "ios";

export function LivePreview({
  config,
  overrideTheme,
}: {
  config: Partial<NotificationConfig>;
  overrideTheme?: "light" | "dark";
}) {
  const { resolvedTheme } = useTheme();
  const [platform, setPlatform] = useState<PreviewPlatform>("browser");
  const [manualTheme, setManualTheme] = useState<"light" | "dark" | "auto">("auto");

  // Effective theme is either explicit override, manual toggle, or synced with active app theme
  const activeNotificationTheme: "light" | "dark" =
    overrideTheme || (manualTheme === "auto" ? resolvedTheme : manualTheme);

  const togglePreviewTheme = () => {
    setManualTheme((current) => {
      const effective = current === "auto" ? resolvedTheme : current;
      return effective === "dark" ? "light" : "dark";
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Platform and Theme Selector Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-border/70">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">
            Notification Preview
          </span>
          <button
            type="button"
            onClick={togglePreviewTheme}
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition-colors",
              activeNotificationTheme === "light"
                ? "bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/25"
                : "bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25"
            )}
            title="Click to toggle preview between Light and Dark notification appearance"
          >
            {activeNotificationTheme === "light" ? (
              <>
                <Sun className="h-3 w-3 text-amber-600 dark:text-amber-500" />
                <span>Light Style</span>
              </>
            ) : (
              <>
                <Moon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span>Dark Style</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center bg-secondary/60 p-1 rounded-xl border border-border/80 text-xs">
          <button
            type="button"
            onClick={() => setPlatform("browser")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all",
              platform === "browser"
                ? "bg-primary text-white shadow-sm shadow-blue-500/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Browser</span>
          </button>
          <button
            type="button"
            onClick={() => setPlatform("android")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all",
              platform === "android"
                ? "bg-primary text-white shadow-sm shadow-blue-500/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Android</span>
          </button>
          <button
            type="button"
            onClick={() => setPlatform("ios")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all",
              platform === "ios"
                ? "bg-primary text-white shadow-sm shadow-blue-500/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Apple className="h-3.5 w-3.5" />
            <span>iOS</span>
          </button>
        </div>
      </div>

      {/* Preview Container Frame */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-secondary/20 rounded-2xl border border-dashed border-border/90 min-h-[280px]">
        {platform === "browser" && (
          <BrowserPreview config={config} theme={activeNotificationTheme} />
        )}
        {platform === "android" && (
          <AndroidPreview config={config} theme={activeNotificationTheme} />
        )}
        {platform === "ios" && (
          <IOSPreview config={config} theme={activeNotificationTheme} />
        )}
      </div>

      {/* Platform disclaimer */}
      <div className="flex items-start gap-2 mt-3 px-1 text-xs text-muted-foreground leading-relaxed">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Notification renders in {activeNotificationTheme === "light" ? "Light" : "Dark"} mode.</strong> Web APIs delegate final rendering to the native OS notification center matching device system theme.
        </p>
      </div>
    </div>
  );
}
