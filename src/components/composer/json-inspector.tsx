"use client";

import { useState } from "react";
import { Copy, Check, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/custom-toaster";
import { NotificationConfig } from "@/types/notification";

export function JsonInspector({ config }: { config: NotificationConfig }) {
  const [copied, setCopied] = useState(false);

  const payload = {
    title: config.title,
    body: config.body,
    icon: config.icon || "/logo.png",
    badge: config.badge || "/logo.png",
    image: config.image || undefined,
    url: config.url || "/dashboard",
    tag: config.tag || undefined,
    direction: config.direction || "auto",
    requireInteraction: config.requireInteraction,
    silent: config.silent,
    renotify: config.renotify,
    vibration: config.vibration,
    actions: config.actions,
    theme: config.theme || "dark",
    data: {
      ...(config.data || {}),
      theme: config.theme || "dark",
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    toast.success("Payload JSON copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-secondary/30">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Code className="h-4 w-4 text-blue-500" />
          <span>Generated Web Push JSON Payload</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="h-8 px-2.5 text-xs gap-1.5"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? "Copied" : "Copy JSON"}</span>
        </Button>
      </div>
      <div className="p-4 bg-secondary/30 border-t border-border/40 overflow-x-auto">
        <pre className="text-xs font-mono text-primary leading-relaxed">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
}
