"use client";

import * as React from "react";
import { AlertTriangle, Trash2, Info, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "default";
  icon?: "trash" | "alert" | "info";
}

interface ConfirmContextType {
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = React.createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = React.useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ConfirmOptions>({});
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback((opts?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(opts || {});
      setIsOpen(true);
    });
  }, []);

  const handleClose = React.useCallback(
    (result: boolean) => {
      setIsOpen(false);
      if (resolverRef.current) {
        resolverRef.current(result);
        resolverRef.current = null;
      }
    },
    []
  );

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose(false);
        }}
        title={options.title || "Are you sure?"}
        description={
          options.description ||
          "This action cannot be undone. Are you sure you want to proceed?"
        }
        confirmText={options.confirmText || "Confirm"}
        cancelText={options.cancelText || "Cancel"}
        variant={options.variant || "destructive"}
        icon={options.icon || (options.variant === "default" ? "info" : "trash")}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </ConfirmContext.Provider>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "default";
  icon?: "trash" | "alert" | "info";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "destructive",
  icon = "trash",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelBtnRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        if (onCancel) onCancel();
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isLoading, onCancel, onOpenChange]);

  if (!open) return null;

  const getIcon = () => {
    switch (icon) {
      case "trash":
        return <Trash2 className="h-6 w-6 text-rose-500 dark:text-rose-400" />;
      case "alert":
        return <AlertTriangle className="h-6 w-6 text-amber-500 dark:text-amber-400" />;
      case "info":
      default:
        return <Info className="h-6 w-6 text-blue-500 dark:text-blue-400" />;
    }
  };

  const getIconContainerStyle = () => {
    switch (variant) {
      case "destructive":
        return "bg-rose-500/10 border-rose-500/20 text-rose-500";
      case "warning":
        return "bg-amber-500/10 border-amber-500/20 text-amber-500";
      case "default":
      default:
        return "bg-blue-500/10 border-blue-500/20 text-blue-500";
    }
  };

  const getConfirmButtonClass = () => {
    if (variant === "destructive") {
      return "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 border-0";
    }
    if (variant === "warning") {
      return "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 border-0";
    }
    return "bg-primary hover:bg-primary/90 text-primary-foreground";
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => {
          if (!isLoading) {
            if (onCancel) onCancel();
            onOpenChange(false);
          }
        }}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-50 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            if (!isLoading) {
              if (onCancel) onCancel();
              onOpenChange(false);
            }
          }}
          disabled={isLoading}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Icon Badge */}
          <div
            className={cn(
              "flex-shrink-0 h-12 w-12 rounded-2xl border flex items-center justify-center shadow-inner",
              getIconContainerStyle()
            )}
          >
            {getIcon()}
          </div>

          <div className="flex-1 space-y-1.5 pt-0.5">
            <h3
              id="confirm-dialog-title"
              className="text-lg sm:text-xl font-bold font-heading tracking-tight text-foreground"
            >
              {title}
            </h3>
            {description && (
              <div
                id="confirm-dialog-description"
                className="text-sm text-muted-foreground leading-relaxed"
              >
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            ref={cancelBtnRef}
            onClick={() => {
              if (!isLoading) {
                if (onCancel) onCancel();
                onOpenChange(false);
              }
            }}
            disabled={isLoading}
            className="w-full sm:w-auto h-10 px-4 rounded-xl font-medium"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            onClick={async () => {
              await onConfirm();
            }}
            disabled={isLoading}
            className={cn("w-full sm:w-auto h-10 px-5 rounded-xl font-bold gap-2", getConfirmButtonClass())}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
