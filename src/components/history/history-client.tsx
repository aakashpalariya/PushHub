"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Code,
  Trash2,
  Calendar,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/custom-toaster";
import { formatDate } from "@/lib/utils";
import { NotificationHistoryItem } from "@/types/notification";

export function HistoryClient({
  initialHistory,
}: {
  initialHistory: NotificationHistoryItem[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [history, setHistory] = useState<NotificationHistoryItem[]>(initialHistory);
  const [selectedItem, setSelectedItem] = useState<NotificationHistoryItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearHistory = async () => {
    const confirmed = await confirm({
      title: "Clear Notification History",
      description:
        "Are you sure you want to permanently clear all notification dispatch logs and delivery events? This action cannot be undone.",
      confirmText: "Clear All History",
      variant: "destructive",
      icon: "trash",
    });
    if (!confirmed) return;

    setClearing(true);
    try {
      const res = await fetch("/api/history", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear history");

      toast.success("Notification history cleared");
      setHistory([]);
      router.refresh();
    } catch (err) {
      toast.error("Failed to clear history");
    } finally {
      setClearing(false);
    }
  };

  const copyPayload = (payload: string) => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success("Payload copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Notification History"
        description="Audit log of all Web Push packets transmitted from PushHub to browser push endpoints."
        actions={
          history.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              disabled={clearing}
              className="gap-2 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 font-bold"
            >
              <Trash2 className="h-4 w-4" />
              <span>{clearing ? "Clearing..." : "Clear History"}</span>
            </Button>
          ) : undefined
        }
      />

      {/* History List */}
      {history.length === 0 ? (
        <EmptyState
          icon={History}
          title="No push notifications dispatched yet"
          description="Send a test notification from the Composer or from My Notifications to see real delivery logs here."
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notification Title</TableHead>
                  <TableHead>Target Device / Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Theme</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => {
                  const isSent = item.status === "sent";
                  const isExpired = item.status === "expired";

                  let parsedTheme: string | null = null;
                  try {
                    const parsed = JSON.parse(item.payload);
                    parsedTheme = parsed.theme || parsed.data?.theme || null;
                  } catch {
                    parsedTheme = null;
                  }

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold text-foreground">
                        <div>
                          <span>{item.title}</span>
                          <span className="text-[11px] text-muted-foreground font-mono block">
                            ID: {item.id}
                          </span>
                          {item.error && (
                            <p className="text-xs text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                              Error: {item.error}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          <Smartphone className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span>{item.device || "Web Device"} ({item.platform || "Web"})</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {isSent ? (
                          <Badge variant="success" size="sm" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Delivered</span>
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="warning" size="sm" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Expired</span>
                          </Badge>
                        ) : (
                          <Badge variant="destructive" size="sm" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            <span>Failed</span>
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {parsedTheme ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              parsedTheme === "light"
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                            }`}
                          >
                            {parsedTheme === "light" ? "☀️ Light" : "🌙 Dark"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(item.sentAt)}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                          className="gap-1.5"
                        >
                          <Code className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards View (Preserves same typography, badge tokens, and actions) */}
          <div className="block md:hidden space-y-3">
            {history.map((item) => {
              const isSent = item.status === "sent";
              const isExpired = item.status === "expired";

              let parsedTheme: string | null = null;
              try {
                const parsed = JSON.parse(item.payload);
                parsedTheme = parsed.theme || parsed.data?.theme || null;
              } catch {
                parsedTheme = null;
              }

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3 hover:border-border transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm sm:text-base text-foreground break-words">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-mono block">
                        ID: {item.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isSent ? (
                        <Badge variant="success" size="sm" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Delivered</span>
                        </Badge>
                      ) : isExpired ? (
                        <Badge variant="warning" size="sm" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Expired</span>
                        </Badge>
                      ) : (
                        <Badge variant="destructive" size="sm" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          <span>Failed</span>
                        </Badge>
                      )}

                      {parsedTheme && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            parsedTheme === "light"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                              : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {parsedTheme === "light" ? "☀️" : "🌙"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50 text-xs space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Target:</span>
                      <span className="font-medium text-foreground truncate max-w-[180px]">
                        {item.device || "Web Device"} ({item.platform || "Web"})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Timestamp:</span>
                      <span className="text-foreground">{formatDate(item.sentAt)}</span>
                    </div>
                    {item.error && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-mono pt-1">
                        Error: {item.error}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end pt-1 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                      className="gap-1.5"
                    >
                      <Code className="h-3.5 w-3.5" />
                      <span>Inspect Payload</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payload Inspection Modal */}
      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <DialogHeader>
          <DialogTitle>Notification Transmission Payload</DialogTitle>
          <DialogDescription>
            Exact JSON structure transmitted over Web Push VAPID protocol
          </DialogDescription>
        </DialogHeader>

        {selectedItem && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                Target: {selectedItem.device} ({selectedItem.platform})
              </span>
              <Button
                size="xs"
                variant="outline"
                onClick={() => copyPayload(selectedItem.payload)}
                className="gap-1"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-[#090d16] border border-border overflow-x-auto max-h-80">
              <pre className="text-xs font-mono text-blue-200 leading-relaxed">
                <code>
                  {(() => {
                    try {
                      return JSON.stringify(
                        JSON.parse(selectedItem.payload),
                        null,
                        2
                      );
                    } catch {
                      return selectedItem.payload;
                    }
                  })()}
                </code>
              </pre>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
