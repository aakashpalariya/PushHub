"use client";

import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PRESET_ICONS,
  PRESET_BADGES,
  PRESET_BANNERS,
  AssetPreset,
} from "@/lib/constants/presets";
import { Check, Sparkles, Image as ImageIcon, Shield, Bell, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "icon" | "badge" | "banner" | null;
  currentValue?: string;
  onSelect: (url: string) => void;
}

export function AssetPickerModal({
  open,
  onOpenChange,
  type,
  currentValue,
  onSelect,
}: AssetPickerModalProps) {
  if (!type) return null;

  const title =
    type === "icon"
      ? "Select Default Notification Icon"
      : type === "badge"
      ? "Select Default Notification Badge"
      : "Select Default Banner Image";

  const description =
    type === "icon"
      ? "High-resolution square 1:1 icons optimized for desktop and mobile notification previews."
      : type === "badge"
      ? "Monochrome white silhouette badge icons for Android status bar and Chrome notification badges."
      : "Rich widescreen (2:1) banner artwork for expanded notification previews.";

  const presets: AssetPreset[] =
    type === "icon"
      ? PRESET_ICONS
      : type === "badge"
      ? PRESET_BADGES
      : PRESET_BANNERS;

  const handleSelect = (url: string) => {
    onSelect(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>{title}</span>
        </DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 pt-2">
        <div
          className={cn(
            "grid gap-3.5",
            type === "banner"
              ? "grid-cols-1"
              : "grid-cols-1 sm:grid-cols-2"
          )}
        >
          {presets.map((item) => {
            const isSelected = currentValue === item.url;
            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item.url)}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 text-left group select-none relative",
                  isSelected
                    ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40"
                    : "bg-secondary/30 border-border/80 hover:border-primary/40 hover:bg-secondary/60"
                )}
              >
                {/* Visual Preview */}
                <div
                  className={cn(
                    "rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-border/70",
                    type === "banner"
                      ? "w-28 h-16 bg-slate-950"
                      : type === "badge"
                      ? "w-14 h-14 bg-slate-900"
                      : "w-14 h-14 bg-secondary"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.name}
                    className={cn(
                      type === "banner"
                        ? "h-full w-full object-cover group-hover:scale-105 transition-transform"
                        : type === "badge"
                        ? "h-8 w-8 object-contain p-1"
                        : "h-full w-full object-cover group-hover:scale-105 transition-transform"
                    )}
                  />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {item.name}
                    </span>
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" />
                        Selected
                      </span>
                    ) : (
                      <Badge variant="outline" size="sm" className="text-[10px]">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <span className="text-[10px] font-mono text-muted-foreground/70 truncate mt-1">
                    {item.url}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          {currentValue ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleSelect("")}
              className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
            >
              Clear Image Selection
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
