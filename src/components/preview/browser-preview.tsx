import React from "react";
import { X, ExternalLink, Globe } from "lucide-react";
import { NotificationConfig } from "@/types/notification";
import { cn } from "@/lib/utils";

export function BrowserPreview({
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
        "w-full max-w-md rounded-xl shadow-2xl overflow-hidden font-sans transition-colors duration-200",
        isLight
          ? "bg-white border border-gray-200 text-gray-900 shadow-gray-200/50"
          : "bg-[#1e222d] border border-gray-700/80 text-gray-100"
      )}
    >
      {/* Chrome / Edge Notification Header */}
      <div
        className={cn(
          "flex items-center justify-between px-3.5 py-2 border-b text-xs transition-colors",
          isLight
            ? "bg-[#f1f3f4] border-gray-200 text-gray-600"
            : "bg-[#282c37] border-gray-700/60 text-gray-300"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Globe className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
          <span className="truncate font-medium">pushhub.dev</span>
        </div>
        <button
          type="button"
          className={cn(
            "transition-colors",
            isLight ? "text-gray-400 hover:text-gray-700" : "text-gray-400 hover:text-gray-200"
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body Area */}
      <div className="p-3.5 flex gap-3 items-start">
        {/* Left App Icon */}
        <div
          className={cn(
            "h-12 w-12 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center border transition-colors",
            isLight ? "bg-gray-100 border-gray-200" : "bg-gray-800 border-gray-700"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon}
            alt="Notification Icon"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo.png";
            }}
          />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0" dir={config.direction || "auto"}>
          <h5
            className={cn(
              "font-semibold text-sm leading-snug truncate",
              isLight ? "text-gray-900" : "text-white"
            )}
          >
            {config.title || "Notification Title"}
          </h5>
          <p
            className={cn(
              "text-xs mt-1 line-clamp-3 leading-relaxed whitespace-pre-wrap",
              isLight ? "text-gray-600" : "text-gray-300"
            )}
          >
            {config.body || "Notification body message preview..."}
          </p>
        </div>
      </div>

      {/* Big Image if present */}
      {config.image && (
        <div className="px-3.5 pb-3">
          <div
            className={cn(
              "rounded-lg overflow-hidden max-h-48 border",
              isLight ? "border-gray-200 bg-gray-50" : "border-gray-700 bg-gray-900"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={config.image}
              alt="Notification Banner"
              className="w-full h-auto object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>
      )}

      {/* Browser Action Buttons */}
      {config.actions && config.actions.length > 0 && (
        <div
          className={cn(
            "border-t p-1.5 flex flex-wrap gap-1.5 justify-end transition-colors",
            isLight
              ? "border-gray-200 bg-[#f8f9fa]"
              : "border-gray-700/60 bg-[#252934]"
          )}
        >
          {config.actions.slice(0, 2).map((action, idx) => (
            <button
              key={idx}
              type="button"
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5",
                isLight
                  ? "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 shadow-sm"
                  : "bg-gray-700/60 hover:bg-gray-600/80 text-white"
              )}
            >
              <span>{action.title}</span>
              <ExternalLink className={cn("h-3 w-3", isLight ? "text-gray-500" : "text-gray-400")} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
