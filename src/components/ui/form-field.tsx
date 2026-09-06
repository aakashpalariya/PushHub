import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  labelRight?: React.ReactNode;
  error?: string | null;
  helperText?: React.ReactNode;
  required?: boolean;
}

export function FormField({
  label,
  labelRight,
  error,
  helperText,
  required,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {(label || labelRight) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
              {label}
              {required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
          )}
          {labelRight && <div className="text-xs">{labelRight}</div>}
        </div>
      )}

      {children}

      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
