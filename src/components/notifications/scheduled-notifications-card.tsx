"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle2, AlertCircle, XCircle, Trash2, Send, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/custom-toaster";
import { formatDate } from "@/lib/utils";
import { ScheduledNotificationItem } from "@/types/notification";

export function ScheduledNotificationsCard() {
  const [items, setItems] = useState<ScheduledNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchScheduled = useCallback(async () => {
    try {
      const res = await fetch("/api/push/schedule");
      if (res.ok) {
        const data = await res.json();
        setItems(data.scheduled || []);
      }
    } catch {
      // Ignore background errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduled();
    // Poll scheduled list every 2 seconds for live countdown updates
    const timer = setInterval(() => {
      fetchScheduled();
    }, 2000);
    return () => clearInterval(timer);
  }, [fetchScheduled]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/push/schedule/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to cancel scheduled push");

      toast.success("Scheduled push cancelled");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Failed to cancel scheduled notification");
    } finally {
      setCancellingId(null);
    }
  };

  const pendingItems = items.filter((i) => i.status === "pending");

  if (!loading && items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-400 animate-spin" style={{ animationDuration: "8s" }} />
          <h3 className="text-base font-bold text-foreground">
            Scheduled Notifications ({pendingItems.length} Pending)
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">In-App Delayed Engine</span>
      </div>

      <div className="space-y-2.5">
        {items.slice(0, 5).map((item) => {
          const targetTime = new Date(item.scheduledAt).getTime();
          const now = Date.now();
          const remainingSeconds = Math.max(0, Math.ceil((targetTime - now) / 1000));
          const isPending = item.status === "pending";

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                isPending
                  ? "bg-indigo-500/10 border-indigo-500/30"
                  : item.status === "sent"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-rose-500/5 border-rose-500/20"
              }`}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-foreground truncate max-w-[200px]">
                    {item.title}
                  </span>

                  {isPending ? (
                    <Badge variant="purple" className="text-[11px] font-mono gap-1">
                      <Clock className="h-3 w-3 animate-spin" />
                      <span>
                        {remainingSeconds > 0
                          ? `Delivering in ${remainingSeconds}s`
                          : "Delivering now..."}
                      </span>
                    </Badge>
                  ) : item.status === "sent" ? (
                    <Badge variant="success" className="text-[11px] gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Delivered</span>
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[11px] gap-1">
                      <XCircle className="h-3 w-3" />
                      <span>Failed</span>
                    </Badge>
                  )}

                  <Badge variant="outline" className="text-[10px] capitalize">
                    Target: {item.targetMode === "active" ? "Active Device Only" : item.targetMode}
                  </Badge>
                </div>
                <p className="text-muted-foreground truncate">{item.body}</p>
              </div>

              {isPending && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(item.id)}
                  disabled={cancellingId === item.id}
                  className="h-8 px-2.5 text-xs gap-1 text-rose-500 hover:bg-rose-500/10 shrink-0 self-end sm:self-center"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
