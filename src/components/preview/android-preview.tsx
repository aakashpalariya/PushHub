import React from "react";
import { ChevronDown } from "lucide-react";
import { NotificationConfig } from "@/types/notification";
import { cn } from "@/lib/utils";

export function AndroidPreview({
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
        "w-full max-w-md rounded-3xl p-4 shadow-2xl font-sans transition-colors duration-200",
        isLight
          ? "bg-[#f8fafd] text-gray-900 border border-gray-200/90 shadow-gray-200/60"
          : "bg-[#1d1f24] text-gray-100 border border-gray-800"
      )}
    >
      {/* Android Notification Header */}
      <div
        className={cn(
          "flex items-center justify-between text-xs mb-2 transition-colors",
          isLight ? "text-gray-500" : "text-gray-400"
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-5 w-5 rounded-full overflow-hidden flex items-center justify-center p-0.5 border",
              isLight ? "bg-white border-gray-200" : "bg-card border-border"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={icon}
              alt="Icon"
              className="h-full w-full object-cover rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/logo.png";
              }}
            />
          </div>
          <span className={cn("font-medium", isLight ? "text-gray-800" : "text-gray-300")}>
            PushHub
          </span>
          <span>·</span>
          <span>now</span>
        </div>
        <ChevronDown className={cn("h-4 w-4", isLight ? "text-gray-400" : "text-gray-400")} />
      </div>

      {/* Android Content with optional Right Thumbnail */}
      <div className="flex gap-3 items-start" dir={config.direction || "auto"}>
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "font-semibold text-sm leading-snug",
              isLight ? "text-gray-900" : "text-gray-100"
            )}
          >
            {config.title || "Notification Title"}
          </h4>
          <p
            className={cn(
              "text-xs mt-0.5 line-clamp-3 leading-relaxed",
              isLight ? "text-gray-600" : "text-gray-300"
            )}
          >
            {config.body || "Notification body message preview..."}
          </p>
        </div>

        {!config.image && (
          <div
            className={cn(
              "h-10 w-10 rounded-xl overflow-hidden flex-shrink-0 border",
              isLight ? "bg-gray-100 border-gray-200" : "bg-gray-800 border-gray-700"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={icon}
              alt="App"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/logo.png";
              }}
            />
          </div>
        )}
      </div>

      {/* Android BigPicture View if image provided */}
      {config.image && (
        <div
          className={cn(
            "mt-3 rounded-2xl overflow-hidden border max-h-48",
            isLight ? "border-gray-200 bg-gray-50" : "border-gray-800 bg-gray-900"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.image}
            alt="Expanded Banner"
            className="w-full h-auto object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Android Material Pill Action Buttons */}
      {config.actions && config.actions.length > 0 && (
        <div
          className={cn(
            "mt-3.5 pt-2 border-t flex flex-wrap gap-2 transition-colors",
            isLight ? "border-gray-200" : "border-gray-800/80"
          )}
        >
          {config.actions.slice(0, 3).map((action, idx) => (
            <button
              key={idx}
              type="button"
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors",
                isLight
                  ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70"
                  : "bg-[#2a2d35] hover:bg-[#343842] text-blue-300"
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
