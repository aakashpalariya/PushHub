"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/custom-toaster";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { useTheme } from "@/components/theme/theme-provider";

export function DashboardNotificationActions({
  notificationId,
}: {
  notificationId: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const { resolvedTheme } = useTheme();
  const { isSubscribed, subscribeDevice } = usePushSubscription();
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleTest = async () => {
    if (!isSubscribed) {
      toast.info("Subscribing this browser first...");
      const subscribed = await subscribeDevice();
      if (!subscribed) {
        toast.error("Device subscription required to receive push notifications");
        return;
      }
    }

    setTesting(true);
    try {
      const res = await fetch(`/api/notifications/${notificationId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: resolvedTheme }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch test notification");
      }
      toast.success(data.message || "Test push delivered to your devices!");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error dispatching push";
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Notification",
      description:
        "Are you sure you want to permanently delete this notification preset? This action cannot be undone.",
      confirmText: "Delete Notification",
      variant: "destructive",
      icon: "trash",
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete notification");
      toast.success("Notification deleted");
      router.refresh();
    } catch (err) {
      toast.error("Failed to delete notification");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center">
      <Button
        variant="glow"
        size="sm"
        onClick={handleTest}
        disabled={testing}
        className="gap-1.5"
      >
        <Send className="h-3.5 w-3.5" />
        <span>{testing ? "Testing..." : "Test"}</span>
      </Button>

      <Link href={`/notifications/${notificationId}`}>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Edit className="h-3.5 w-3.5" />
          <span>Edit</span>
        </Button>
      </Link>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
        className="text-rose-600 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/10"
        title="Delete Notification"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Delete</span>
      </Button>
    </div>
  );
}
