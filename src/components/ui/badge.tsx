import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border border-primary/30 bg-primary/15 text-blue-700 dark:text-blue-300",
        secondary:
          "border border-border/80 bg-secondary text-secondary-foreground",
        destructive:
          "border border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-400",
        success:
          "border border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-400",
        warning:
          "border border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-400",
        purple:
          "border border-purple-500/30 bg-purple-500/15 text-purple-700 dark:text-purple-300",
        outline:
          "border border-border text-foreground bg-transparent",
      },
      size: {
        default: "text-xs px-2.5 py-0.5 rounded-lg",
        sm: "text-[10px] px-2 py-0.5 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
