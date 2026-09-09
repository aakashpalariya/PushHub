"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Bell,
  Send,
  Edit,
  Copy,
  Trash2,
  ArrowUpDown,
  Bookmark,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/custom-toaster";
import { formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { useTheme } from "@/components/theme/theme-provider";
import { NotificationConfig } from "@/types/notification";
import { ScheduledNotificationsCard } from "./scheduled-notifications-card";

interface NotificationItem extends NotificationConfig {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export function NotificationsListClient({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const { resolvedTheme } = useTheme();
  const { isSubscribed, subscribeDevice } = usePushSubscription();

  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initialNotifications
  );
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "updated" | "tested">("newest");
  const [filterType, setFilterType] = useState<"all" | "tested" | "actions" | "images">("all");

  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [templatingId, setTemplatingId] = useState<string | null>(null);

  // Filter and sort items
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => {
        const matchesSearch =
          n.name.toLowerCase().includes(search.toLowerCase()) ||
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.body.toLowerCase().includes(search.toLowerCase()) ||
          (n.tag && n.tag.toLowerCase().includes(search.toLowerCase()));

        if (!matchesSearch) return false;

        if (filterType === "tested") return Boolean(n.lastTested);
        if (filterType === "actions") return Boolean(n.actions && n.actions.length > 0);
        if (filterType === "images") return Boolean(n.image);

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "updated") {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        if (sortBy === "tested") {
          const timeA = a.lastTested ? new Date(a.lastTested).getTime() : 0;
          const timeB = b.lastTested ? new Date(b.lastTested).getTime() : 0;
          return timeB - timeA;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [notifications, search, sortBy, filterType]);

  // Quick Test Push Handler with optional delay
  const handleTest = async (id: string, delaySeconds = 0) => {
    if (!isSubscribed) {
      toast.info("Subscribing this browser first...");
      const subscribed = await subscribeDevice();
      if (!subscribed) {
        toast.error("Device subscription required to test push");
        return;
      }
    }

    setTestingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: resolvedTheme, delaySeconds }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch test");
      }

      toast.success(
        data.message ||
          (delaySeconds > 0
            ? `Test push scheduled in ${delaySeconds}s!`
            : "Test push delivered to your devices!")
      );

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, lastTested: new Date().toISOString() } : item
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error testing push";
      toast.error(msg);
    } finally {
      setTestingId(null);
    }
  };

  // Duplicate Notification Handler
  const handleDuplicate = async (notification: NotificationItem) => {
    try {
      const duplicatedPayload = {
        ...notification,
        name: `${notification.name} (Copy)`,
      };
      delete (duplicatedPayload as { id?: string }).id;

      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicatedPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error("Failed to duplicate notification");

      toast.success("Notification duplicated!");
      setNotifications((prev) => [data.notification, ...prev]);
    } catch {
      toast.error("Failed to duplicate notification");
    }
  };

  // Convert Notification to Private Custom Template
  const handleMakeTemplate = async (notif: NotificationItem) => {
    setTemplatingId(notif.id);
    try {
      const templatePayload = {
        name: notif.name,
        description: notif.body ? `${notif.body.slice(0, 120)}...` : `Template from ${notif.name}`,
        category: notif.tag ? (notif.tag.charAt(0).toUpperCase() + notif.tag.slice(1)) : "Custom",
        configuration: {
          name: notif.name,
          title: notif.title,
          body: notif.body,
          icon: notif.icon || "/logo.png",
          badge: notif.badge || "/logo.png",
          image: notif.image || "",
          url: notif.url || "/dashboard",
          tag: notif.tag || "",
          direction: notif.direction || "auto",
          language: notif.language || "en",
          requireInteraction: Boolean(notif.requireInteraction),
          silent: Boolean(notif.silent),
          renotify: Boolean(notif.renotify),
          timestamp: notif.timestamp || null,
          vibration: notif.vibration || [100, 50, 100],
          actions: notif.actions || [],
          data: notif.data || {},
          style: notif.style || {},
        },
      };

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templatePayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create template");

      toast.success(`"${notif.name}" saved as your private template!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating template";
      toast.error(msg);
    } finally {
      setTemplatingId(null);
    }
  };

  // Delete Notification Handler
  const handleDelete = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    const confirmed = await confirm({
      title: "Delete Notification",
      description: (
        <span>
          Are you sure you want to permanently delete{" "}
          <strong className="text-foreground font-semibold">
            {target?.title ? `"${target.title}"` : "this notification"}
          </strong>? This action cannot be undone.
        </span>
      ),
      confirmText: "Delete Notification",
      variant: "destructive",
      icon: "trash",
    });
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Notification deleted");
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch {
      toast.error("Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header */}
      <PageHeader
        title="My Notifications"
        description="Search, filter, edit, duplicate, schedule, and test your saved push notification configurations."
        actions={
          <Link href="/notifications/new">
            <Button variant="glow" size="default" className="gap-2 font-bold shadow-blue-500/25">
              <PlusCircle className="h-4 w-4" />
              <span>Create Notification</span>
            </Button>
          </Link>
        }
      />

      {/* Scheduled Notifications Card */}
      <ScheduledNotificationsCard />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              placeholder="Search by name, title, message, or tag..."
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                filterType === "all"
                  ? "bg-primary text-white"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType("tested")}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                filterType === "tested"
                  ? "bg-primary text-white"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Tested
            </button>
            <button
              onClick={() => setFilterType("actions")}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                filterType === "actions"
                  ? "bg-primary text-white"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Has Actions
            </button>
            <button
              onClick={() => setFilterType("images")}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                filterType === "images"
                  ? "bg-primary text-white"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Has Image
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="w-full sm:w-48 flex-shrink-0">
            <Select
              icon={ArrowUpDown}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="updated">Recently Updated</option>
              <option value="tested">Recently Tested</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Notifications List / Cards */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={search ? "No matching notifications found" : "No saved notifications"}
          description={
            search
              ? "Try adjusting your search terms or filters to find what you're looking for."
              : "Create your first custom push notification and start testing across your devices."
          }
          action={
            !search ? (
              <Link href="/notifications/new">
                <Button variant="glow" size="sm" className="gap-2 font-bold">
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Notification</span>
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm hover:border-blue-500/30 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight break-words">
                      {notif.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" size="sm" className="font-mono flex-shrink-0">
                        {notif.tag || "general"}
                      </Badge>
                      {notif.actions && notif.actions.length > 0 && (
                        <Badge variant="secondary" size="sm" className="flex-shrink-0">
                          {notif.actions.length} action(s)
                        </Badge>
                      )}
                      {notif.image && (
                        <Badge variant="secondary" size="sm" className="flex-shrink-0">
                          Image attached
                        </Badge>
                      )}
                    </div>
                  </div>

                  {notif.icon && (
                    <div className="h-10 w-10 rounded-xl overflow-hidden bg-secondary border border-border flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={notif.icon}
                        alt="Icon"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/logo.png";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Notification Preview Box */}
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 text-xs space-y-1">
                  <p className="font-bold text-foreground truncate">
                    {notif.title}
                  </p>
                  <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                    {notif.body}
                  </p>
                </div>

                {/* Timestamps */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                  <span>Created {formatDate(notif.createdAt)}</span>
                  <span>·</span>
                  <span>Tested: {formatDate(notif.lastTested)}</span>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="glow"
                    size="sm"
                    onClick={() => handleTest(notif.id, 0)}
                    disabled={testingId === notif.id}
                    className="gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{testingId === notif.id ? "Sending..." : "Test Now"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(notif.id, 10)}
                    disabled={testingId === notif.id}
                    className="gap-1 text-xs"
                    title="Test Push in 10 Seconds"
                  >
                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>10s</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(notif.id, 30)}
                    disabled={testingId === notif.id}
                    className="gap-1 text-xs"
                    title="Test Push in 30 Seconds"
                  >
                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                    <span>30s</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(notif.id, 60)}
                    disabled={testingId === notif.id}
                    className="gap-1 text-xs"
                    title="Test Push in 1 Minute"
                  >
                    <Clock className="h-3.5 w-3.5 text-purple-400" />
                    <span>1m</span>
                  </Button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link href={`/notifications/${notif.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(notif)}
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                    title="Duplicate Notification"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(notif.id)}
                    disabled={deletingId === notif.id}
                    className="gap-1.5 text-rose-600 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/10"
                    title="Delete Notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
