import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "p-8 sm:p-12 text-center rounded-3xl border border-dashed border-border/90 bg-card/40 space-y-4",
        className
      )}
      {...props}
    >
      <div className="h-16 w-16 rounded-2xl bg-secondary/70 border border-border/60 flex items-center justify-center mx-auto text-muted-foreground shadow-xs">
        <Icon className="h-8 w-8" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      {action && (
        <div className="flex items-center justify-center gap-3 pt-2">
          {action}
        </div>
      )}
    </div>
  );
}
