import React from "react";
import { NotificationConfig } from "@/types/notification";
import { cn } from "@/lib/utils";

export function IOSPreview({
  config,
  theme = "dark",
}: {
  config: Partial<NotificationConfig>;
  theme?: "light" | "dark";
}) {
  const icon = config.icon || "/logo.png";
  const isLight = theme === "light";

  return (
    <div
      className={cn(
        "w-full max-w-md rounded-3xl backdrop-blur-2xl p-4 shadow-2xl font-sans transition-colors duration-200",
        isLight
          ? "bg-white/80 text-gray-900 border border-black/5 shadow-gray-300/60"
          : "bg-slate-900/80 text-white border border-white/10"
      )}
    >
      {/* iOS Lock Screen Banner Header */}
      <div
        className={cn(
          "flex items-center justify-between text-xs mb-2 transition-colors",
          isLight ? "text-gray-500" : "text-gray-300/80"
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-6 w-6 rounded-lg overflow-hidden flex items-center justify-center p-0.5 shadow-sm border",
              isLight ? "bg-white border-gray-200" : "bg-card border-border/80"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={icon}
              alt="iOS App Icon"
              className="h-full w-full object-cover rounded-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/logo.png";
              }}
            />
          </div>
          <span
            className={cn(
              "font-bold tracking-wider text-[11px] uppercase",
              isLight ? "text-gray-800" : "text-gray-200"
            )}
          >
            PUSH HUB
          </span>
        </div>
        <span className={cn("text-[11px] font-medium", isLight ? "text-gray-400" : "text-gray-400")}>
          now
        </span>
      </div>

      {/* iOS Banner Content */}
      <div dir={config.direction || "auto"}>
        <h4
          className={cn(
            "font-semibold text-sm leading-snug",
            isLight ? "text-gray-900" : "text-white"
          )}
        >
          {config.title || "Notification Title"}
        </h4>
        <p
          className={cn(
            "text-xs mt-0.5 leading-relaxed line-clamp-3",
            isLight ? "text-gray-700" : "text-gray-200/90"
          )}
        >
          {config.body || "Notification body message preview..."}
        </p>
      </div>

      {/* iOS Image Attachment */}
      {config.image && (
        <div
          className={cn(
            "mt-3 rounded-2xl overflow-hidden max-h-48 border",
            isLight ? "border-black/5 bg-gray-100" : "border-white/10 bg-slate-950"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.image}
            alt="iOS Notification Attachment"
            className="w-full h-auto object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* iOS Action Buttons */}
      {config.actions && config.actions.length > 0 && (
        <div
          className={cn(
            "mt-3 grid grid-cols-2 gap-2 pt-2 border-t transition-colors",
            isLight ? "border-black/5" : "border-white/10"
          )}
        >
          {config.actions.slice(0, 2).map((action, idx) => (
            <button
              key={idx}
              type="button"
              className={cn(
                "w-full py-2 px-3 rounded-xl text-xs font-semibold text-center backdrop-blur-md transition-colors",
                isLight
                  ? "bg-black/5 hover:bg-black/10 active:bg-black/15 text-gray-900 border border-black/5"
                  : "bg-white/10 hover:bg-white/20 active:bg-white/30 text-white"
              )}
            >
              {action.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
