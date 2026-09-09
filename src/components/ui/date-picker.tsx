"use client";

import * as React from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";

export interface DatePickerProps {
  value?: string; // Expects "YYYY-MM-DD", "Jul 12, 2021", "DD/MM/YYYY" or ISO date string
  onChange: (value: string) => void; // Returns "YYYY-MM-DD"
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  minYear?: number;
  maxYear?: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const DatePicker: React.FC<DatePickerProps> = ({
  value = "",
  onChange,
  placeholder = "Jul 12, 2021",
  error = false,
  disabled = false,
  className,
  minYear = 1940,
  maxYear = new Date().getFullYear(),
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Parse initial date string into year, month (0-11), day (1-31)
  const parseDate = React.useCallback((valStr: string): { year: number; month: number; day: number } | null => {
    if (!valStr) return null;
    const str = valStr.trim();

    // MMM DD, YYYY (e.g. "Jul 12, 2021" or "Jul 12 2021")
    const mmmMatch = str.match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})$/);
    if (mmmMatch) {
      const monthIdx = SHORT_MONTH_NAMES.findIndex(
        (m) => m.toLowerCase() === mmmMatch[1].toLowerCase()
      );
      const day = parseInt(mmmMatch[2], 10);
      const year = parseInt(mmmMatch[3], 10);
      if (monthIdx !== -1 && !isNaN(day) && !isNaN(year)) {
        return { year, month: monthIdx, day };
      }
    }

    // YYYY-MM-DD
    const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymd) {
      const year = parseInt(ymd[1], 10);
      const month = parseInt(ymd[2], 10) - 1;
      const day = parseInt(ymd[3], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return { year, month, day };
      }
    }

    // DD/MM/YYYY
    const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const month = parseInt(dmy[2], 10) - 1;
      const year = parseInt(dmy[3], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return { year, month, day };
      }
    }
    return null;
  }, []);

  const parsedValue = parseDate(value);
  const defaultYear = parsedValue?.year || 2000;
  const defaultMonth = parsedValue?.month !== undefined ? parsedValue.month : 0;

  const [currentYear, setCurrentYear] = React.useState<number>(defaultYear);
  const [currentMonth, setCurrentMonth] = React.useState<number>(defaultMonth);

  // Sync internal state if value changes externally
  React.useEffect(() => {
    if (parsedValue) {
      setCurrentYear(parsedValue.year);
      setCurrentMonth(parsedValue.month);
    }
  }, [value, parsedValue]);

  // Click outside listener
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Days calculations
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const formattedStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    onChange(formattedStr);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      if (currentYear > minYear) {
        setCurrentMonth(11);
        setCurrentYear((prev) => prev - 1);
      }
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      if (currentYear < maxYear) {
        setCurrentMonth(0);
        setCurrentYear((prev) => prev + 1);
      }
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Formatted display text: "Jul 12, 2021"
  const getDisplayText = () => {
    if (!parsedValue) return "";
    const monthName = SHORT_MONTH_NAMES[parsedValue.month];
    const dayStr = String(parsedValue.day).padStart(2, "0");
    return `${monthName} ${dayStr}, ${parsedValue.year}`;
  };

  // Generate Month Options for custom Select component
  const monthOptions = React.useMemo(() => {
    return MONTH_NAMES.map((name, idx) => ({
      value: String(idx),
      label: name,
    }));
  }, []);

  // Generate Year Options for custom Select component
  const yearOptions = React.useMemo(() => {
    const years = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push({
        value: String(y),
        label: String(y),
      });
    }
    return years;
  }, [minYear, maxYear]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Input Display - exact match to Input styling */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full cursor-pointer items-center justify-between rounded-xl border border-border/80 bg-card/60 px-3.5 py-2 text-sm text-foreground transition-all select-none",
          "hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary",
          isOpen && "border-primary ring-2 ring-primary/30 bg-card",
          error && "border-rose-500 ring-rose-500/20",
          disabled && "cursor-not-allowed opacity-50 bg-muted/40",
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {getDisplayText() ? (
            <span className="text-sm font-normal text-foreground truncate">
              {getDisplayText()}
            </span>
          ) : (
            <span className="text-sm font-normal text-muted-foreground/70 truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
              title="Clear date"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180 text-primary"
            )}
          />
        </div>
      </div>

      {/* Popover Calendar Grid */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-80 rounded-2xl border border-border bg-card/95 p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in-50 zoom-in-95">
          {/* Header Controls (Month & Year selectors using custom Select component) */}
          <div className="flex items-center justify-between gap-1 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="h-8 w-8 rounded-xl hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 flex-1 justify-center">
              {/* Custom Month Select Component */}
              <Select
                value={String(currentMonth)}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                options={monthOptions}
                sizeVariant="sm"
                wrapperClassName="w-32 space-y-0"
                className="h-8 text-xs px-2.5 rounded-xl border-border/70 font-semibold"
              />

              {/* Custom Year Select Component */}
              <Select
                value={String(currentYear)}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                options={yearOptions}
                sizeVariant="sm"
                wrapperClassName="w-24 space-y-0"
                className="h-8 text-xs px-2.5 rounded-xl border-border/70 font-mono font-semibold"
              />
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="h-8 w-8 rounded-xl hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day Names Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_OF_WEEK.map((day) => (
              <span key={day} className="text-[11px] font-bold text-muted-foreground py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots for first day offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 w-8" />
            ))}

            {/* Days of month */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                parsedValue &&
                parsedValue.year === currentYear &&
                parsedValue.month === currentMonth &&
                parsedValue.day === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "h-8 w-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all active:scale-90",
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/30 ring-2 ring-primary/40 scale-105"
                      : "hover:bg-primary/10 text-foreground hover:text-primary"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clean Footer */}
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-end text-[11px] text-muted-foreground px-0.5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
