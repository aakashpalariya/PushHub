"use client";

import * as React from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info" | "loading" | "default";

export interface ToastAction {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: "primary" | "secondary";
}

export interface ToastOptions {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  type?: ToastType;
  duration?: number;
  action?: ToastAction;
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  icon?: React.ReactNode;
}

export interface InternalToast extends ToastOptions {
  id: string;
  createdAt: number;
  duration: number;
}

type ToastInput = string | React.ReactNode | ToastOptions;

interface ToastMethods {
  (message: ToastInput, options?: ToastOptions): string;
  success: (message: ToastInput, options?: ToastOptions) => string;
  error: (message: ToastInput, options?: ToastOptions) => string;
  warning: (message: ToastInput, options?: ToastOptions) => string;
  info: (message: ToastInput, options?: ToastOptions) => string;
  loading: (message: ToastInput, options?: ToastOptions) => string;
  dismiss: (id?: string) => void;
}

type Listener = (toast: InternalToast | { id?: string; action: "dismiss" }) => void;
const listeners = new Set<Listener>();

function emit(data: InternalToast | { id?: string; action: "dismiss" }) {
  listeners.forEach((listener) => listener(data));
}

let toastCounter = 0;

function createToast(type: ToastType, input: ToastInput, options?: ToastOptions): string {
  const id =
    (typeof input === "object" && input && "id" in input && input.id) ||
    options?.id ||
    ("toast-" + Date.now() + "-" + (++toastCounter));

  let title: React.ReactNode = "";
  let description: React.ReactNode = undefined;
  let duration = type === "loading" ? 0 : 4200;
  let action: ToastAction | undefined = undefined;
  let cancel: ToastOptions["cancel"] = undefined;
  let icon: React.ReactNode = undefined;

  if (typeof input === "string" || React.isValidElement(input)) {
    title = input;
    if (options) {
      if (options.description) description = options.description;
      if (typeof options.duration === "number") duration = options.duration;
      if (options.action) action = options.action;
      if (options.cancel) cancel = options.cancel;
      if (options.icon) icon = options.icon;
    }
  } else if (typeof input === "object" && input !== null) {
    const opts = input as ToastOptions;
    title = opts.title || "";
    description = opts.description;
    if (typeof opts.duration === "number") duration = opts.duration;
    if (opts.action) action = opts.action;
    if (opts.cancel) cancel = opts.cancel;
    if (opts.icon) icon = opts.icon;
  }

  emit({
    id,
    type,
    title,
    description,
    duration,
    action,
    cancel,
    icon,
    createdAt: Date.now(),
  });

  return id;
}

export const toast: ToastMethods = Object.assign(
  (message: ToastInput, options?: ToastOptions) => createToast("default", message, options),
  {
    success: (message: ToastInput, options?: ToastOptions) => createToast("success", message, options),
    error: (message: ToastInput, options?: ToastOptions) => createToast("error", message, options),
    warning: (message: ToastInput, options?: ToastOptions) => createToast("warning", message, options),
    info: (message: ToastInput, options?: ToastOptions) => createToast("info", message, options),
    loading: (message: ToastInput, options?: ToastOptions) => createToast("loading", message, options),
    dismiss: (id?: string) => emit({ id, action: "dismiss" }),
  }
);

const toastConfigs: Record<
  ToastType,
  {
    icon: React.ReactNode;
    iconBg: string;
    borderGlow: string;
    progressBar: string;
  }
> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 stroke-[2.5]" />,
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
    borderGlow: "shadow-[0_12px_36px_-6px_rgba(16,185,129,0.22)] dark:shadow-[0_12px_36px_-6px_rgba(16,185,129,0.3)] border-emerald-500/35",
    progressBar: "bg-gradient-to-r from-emerald-500 to-teal-400",
  },
  error: {
    icon: <AlertCircle className="h-4 w-4 text-rose-500 stroke-[2.5]" />,
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25",
    borderGlow: "shadow-[0_12px_36px_-6px_rgba(244,63,94,0.22)] dark:shadow-[0_12px_36px_-6px_rgba(244,63,94,0.3)] border-rose-500/35",
    progressBar: "bg-gradient-to-r from-rose-500 to-pink-500",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 text-amber-500 stroke-[2.5]" />,
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25",
    borderGlow: "shadow-[0_12px_36px_-6px_rgba(245,158,11,0.22)] dark:shadow-[0_12px_36px_-6px_rgba(245,158,11,0.3)] border-amber-500/35",
    progressBar: "bg-gradient-to-r from-amber-500 to-orange-400",
  },
  info: {
    icon: <Info className="h-4 w-4 text-blue-500 stroke-[2.5]" />,
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25",
    borderGlow: "shadow-[0_12px_36px_-6px_rgba(59,130,246,0.22)] dark:shadow-[0_12px_36px_-6px_rgba(59,130,246,0.3)] border-blue-500/35",
    progressBar: "bg-gradient-to-r from-blue-500 to-indigo-500",
  },
  loading: {
    icon: <Loader2 className="h-4 w-4 text-primary animate-spin stroke-[2.5]" />,
    iconBg: "bg-primary/10 dark:bg-primary/20 text-primary border border-primary/25",
    borderGlow: "shadow-[0_12px_36px_-6px_rgba(59,130,246,0.22)] border-primary/35",
    progressBar: "bg-gradient-to-r from-primary via-indigo-500 to-primary animate-pulse",
  },
  default: {
    icon: <Info className="h-4 w-4 text-foreground stroke-[2.5]" />,
    iconBg: "bg-secondary text-foreground border border-border",
    borderGlow: "shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.45)] border-border",
    progressBar: "bg-foreground/40",
  },
};

function ToastItem({
  toastItem,
  onDismiss,
}: {
  toastItem: InternalToast;
  onDismiss: (id: string) => void;
}) {
  const [isPaused, setIsPaused] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const type = toastItem.type || "default";
  const cfg = toastConfigs[type];

  React.useEffect(() => {
    const r = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const triggerDismiss = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss(toastItem.id);
    }, 240);
  }, [onDismiss, toastItem.id]);

  React.useEffect(() => {
    if (!toastItem.duration || toastItem.duration <= 0 || isPaused) return;

    const timer = setTimeout(() => {
      triggerDismiss();
    }, toastItem.duration);

    return () => clearTimeout(timer);
  }, [toastItem.duration, isPaused, triggerDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        "group relative w-full sm:w-[380px] max-w-full overflow-hidden rounded-2xl",
        "bg-card/95 dark:bg-card/95 backdrop-blur-2xl border border-border/80",
        cfg.borderGlow,
        "transition-all duration-300 ease-out transform pointer-events-auto",
        !isMounted && "opacity-0 translate-y-3 sm:translate-y-0 sm:translate-x-6 scale-95",
        isMounted && !isClosing && "opacity-100 translate-y-0 sm:translate-x-0 scale-100",
        isClosing && "opacity-0 scale-95 sm:translate-x-8 transition-all duration-200 ease-in"
      )}
    >
      {/* Top subtle ambient highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />

      {/* Main Card Content */}
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Type Icon Container */}
        <div
          className={cn(
            "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
            cfg.iconBg
          )}
        >
          {toastItem.icon || cfg.icon}
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 pt-0.5">
          {toastItem.title && (
            <div className="text-xs sm:text-sm font-bold text-foreground leading-snug tracking-tight">
              {toastItem.title}
            </div>
          )}
          {toastItem.description && (
            <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3">
              {toastItem.description}
            </div>
          )}

          {/* Optional Interactive Actions */}
          {(toastItem.action || toastItem.cancel) && (
            <div className="flex items-center gap-2 mt-2.5 pt-1">
              {toastItem.action && (
                <button
                  type="button"
                  onClick={(e) => {
                    toastItem.action?.onClick(e);
                    triggerDismiss();
                  }}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer",
                    toastItem.action.variant === "secondary"
                      ? "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {toastItem.action.label}
                </button>
              )}
              {toastItem.cancel && (
                <button
                  type="button"
                  onClick={() => {
                    toastItem.cancel?.onClick?.();
                    triggerDismiss();
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  {toastItem.cancel.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={triggerDismiss}
          aria-label="Close notification"
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-secondary/80 active:scale-90 transition-all cursor-pointer opacity-70 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Dynamic Animated Progress Bar (pauses on hover) */}
      {toastItem.duration > 0 && (
        <div className="h-[2px] w-full bg-border/40 overflow-hidden">
          <div
            className={cn("h-full origin-left", cfg.progressBar)}
            style={{
              animation: "toast-progress " + toastItem.duration + "ms linear forwards",
              animationPlayState: isPaused ? "paused" : "running",
            }}
          />
        </div>
      )}
    </div>
  );
}

export interface ToasterProps {
  position?: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";
  maxToasts?: number;
}

export function CustomToaster({
  position = "top-right",
  maxToasts = 5,
}: ToasterProps) {
  const [toasts, setToasts] = React.useState<InternalToast[]>([]);

  React.useEffect(() => {
    const handleEmit: Listener = (data) => {
      if ("action" in data && data.action === "dismiss") {
        if (!data.id) {
          setToasts([]);
        } else {
          setToasts((prev) => prev.filter((t) => t.id !== data.id));
        }
        return;
      }

      const item = data as InternalToast;
      setToasts((prev) => {
        const existingIdx = prev.findIndex((t) => t.id === item.id);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = item;
          return updated;
        }
        const next = [item, ...prev];
        return next.slice(0, maxToasts);
      });
    };

    listeners.add(handleEmit);
    return () => {
      listeners.delete(handleEmit);
    };
  }, [maxToasts]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const positionClasses = {
    "top-right": "top-4 right-4 sm:top-5 sm:right-5 items-end",
    "top-center": "top-4 left-1/2 -translate-x-1/2 sm:top-5 items-center",
    "top-left": "top-4 left-4 sm:top-5 sm:left-5 items-start",
    "bottom-right": "bottom-4 right-4 sm:bottom-5 sm:right-5 items-end",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 sm:bottom-5 items-center",
    "bottom-left": "bottom-4 left-4 sm:bottom-5 sm:left-5 items-start",
  }[position];

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className={cn(
        "fixed z-[9999] flex flex-col gap-2.5 pointer-events-none w-[calc(100vw-2rem)] sm:w-auto",
        positionClasses
      )}
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} toastItem={item} onDismiss={removeToast} />
      ))}
    </div>
  );
}

export { CustomToaster as Toaster };
