"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  options?: SelectOption[];
  placeholder?: string;
  sizeVariant?: "default" | "sm";
  icon?: React.ComponentType<{ className?: string }>;
  wrapperClassName?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean | string;
  children?: React.ReactNode;
}

export function Select({
  label,
  value,
  onChange,
  options: propOptions,
  placeholder = "Select option...",
  sizeVariant = "default",
  icon: LeadingIcon,
  wrapperClassName,
  className,
  disabled,
  required,
  error,
  children,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive options from children (<option value="...">label</option>) if options array not provided directly
  const options: SelectOption[] = React.useMemo(() => {
    if (propOptions && propOptions.length > 0) {
      return propOptions;
    }
    const extracted: SelectOption[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.props) {
        const props = child.props as Record<string, any>;
        const val = String(props.value ?? "");
        const lbl = String(props.children ?? val);
        extracted.push({
          value: val,
          label: lbl,
        });
      }
    });
    return extracted;
  }, [propOptions, children]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: string) => {
    onChange?.({ target: { value: val } });
    setIsOpen(false);
  };

  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full min-w-0 max-w-full space-y-1.5", wrapperClassName)}
    >
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Button Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between rounded-xl font-semibold transition-all cursor-pointer select-none text-left",
          "border border-border/80 bg-card/80 backdrop-blur-md text-foreground shadow-xs",
          "hover:border-border hover:bg-card focus:outline-none",
          isOpen
            ? "ring-2 ring-primary/30 border-primary bg-card"
            : "",
          LeadingIcon ? "pl-3 pr-3" : "px-3.5",
          sizeVariant === "sm" ? "h-8 text-xs py-1" : "h-10 text-xs py-2",
          disabled && "opacity-50 cursor-not-allowed",
          hasError && "border-rose-500 ring-rose-500/30 focus:border-rose-500",
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate text-xs">
          {LeadingIcon && (
            <LeadingIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          {selectedOption?.icon}
          <span className={cn("truncate text-xs font-semibold", !selectedOption && "text-muted-foreground/70 font-normal")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground flex-shrink-0 ml-2 transition-transform duration-200",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {/* Custom Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl p-1.5 space-y-0.5 backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-100">
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground font-medium">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left",
                    isSelected
                      ? "bg-primary/15 text-primary font-bold"
                      : "text-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {opt.icon}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs">{opt.label}</p>
                      {opt.sublabel && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {opt.sublabel}
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-primary flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-rose-500 font-semibold mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

// Retain alias CustomSelect for compatibility
export const CustomSelect = Select;
