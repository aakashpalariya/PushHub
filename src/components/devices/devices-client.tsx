"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Trash2,
  Share,
  HelpCircle,
  Shield,
  Layers,
  Radio,
  ExternalLink,
  Laptop,
  Flame,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/custom-toaster";
import { formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { PushDevice } from "@/types/notification";

export function DevicesClient({
  initialDevices,
}: {
  initialDevices: PushDevice[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    capabilities,
    subscribeDevice,
    unsubscribeDevice,
    deviceInfo,
  } = usePushSubscription();

  const [devices, setDevices] = useState<PushDevice[]>(initialDevices);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleSubscribeToggle = async () => {
    if (isSubscribed) {
      const ok = await unsubscribeDevice();
      if (ok) router.refresh();
    } else {
      const ok = await subscribeDevice();
      if (ok) {
        // Fetch refreshed devices list
        const res = await fetch("/api/devices");
        if (res.ok) {
          const data = await res.json();
          setDevices(data.devices || []);
        }
      }
    }
  };

  const handleTestDevice = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/devices/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to deliver ping");

      toast.success(data.message || "Test ping sent to device!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending ping";
      toast.error(msg);
    } finally {
      setTestingId(null);
    }
  };

  const handleRemoveDevice = async (id: string) => {
    const confirmed = await confirm({
      title: "Unregister Device",
      description:
        "Are you sure you want to unregister this device? It will no longer receive push notifications from this workspace until re-registered.",
      confirmText: "Unregister Device",
      variant: "destructive",
      icon: "trash",
    });
    if (!confirmed) return;

    setRemovingId(id);
    try {
      const res = await fetch(`/api/devices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove device");

      toast.success("Device unregistered successfully");
      setDevices((prev) => prev.filter((d) => d.id !== id));
      router.refresh();
    } catch (err) {
      toast.error("Failed to remove device");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Devices & Web Push Setup"
        description="Manage connected browsers, inspect W3C Push capabilities, and verify real device deliveries."
        actions={
          <Button
            variant={isSubscribed ? "outline" : "glow"}
            size="default"
            onClick={handleSubscribeToggle}
            disabled={isLoading}
            className="gap-2 font-bold"
          >
            <Radio className="h-4 w-4 animate-pulse" />
            <span>
              {isLoading
                ? "Checking..."
                : isSubscribed
                ? "Unsubscribe This Device"
                : "Subscribe This Device"}
            </span>
          </Button>
        }
      />

      {/* Permission & Capability Center */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Shield className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Permission &amp; Capability Center
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <div className="p-3 sm:p-3.5 rounded-xl bg-secondary/30 border border-border/70 space-y-1.5 min-w-0">
            <span className="text-[11px] font-bold text-muted-foreground uppercase truncate block">
              Push Permission
            </span>
            <div>
              {permission === "granted" ? (
                <Badge variant="success" className="text-xs">
                  Granted
                </Badge>
              ) : permission === "denied" ? (
                <Badge variant="destructive" className="text-xs">
                  Denied
                </Badge>
              ) : (
                <Badge variant="warning" className="text-xs">
                  Default
                </Badge>
              )}
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-secondary/30 border border-border/70 space-y-1.5 min-w-0">
            <span className="text-[11px] font-bold text-muted-foreground uppercase truncate block">
              Service Worker
            </span>
            <div>
              {capabilities.serviceWorker ? (
                <Badge variant="success" className="text-xs">
                  Ready (/sw.js)
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  Not Ready
                </Badge>
              )}
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-secondary/30 border border-border/70 space-y-1.5 min-w-0">
            <span className="text-[11px] font-bold text-muted-foreground uppercase truncate block">
              Subscription
            </span>
            <div>
              {isSubscribed ? (
                <Badge variant="success" className="text-xs">
                  Connected
                </Badge>
              ) : (
                <Badge variant="warning" className="text-xs">
                  Not Connected
                </Badge>
              )}
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-secondary/30 border border-border/70 space-y-1.5 min-w-0">
            <span className="text-[11px] font-bold text-muted-foreground uppercase truncate block">
              PWA Mode
            </span>
            <div>
              {capabilities.standalone ? (
                <Badge variant="success" className="text-xs">
                  Standalone
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Browser Tab
                </Badge>
              )}
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-secondary/30 border border-border/70 space-y-1.5 min-w-0">
            <span className="text-[11px] font-bold text-muted-foreground uppercase truncate block">
              Detected Browser
            </span>
            <p className="text-sm font-bold text-foreground truncate">
              {deviceInfo.browser}
            </p>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-secondary/30 border border-border/70 space-y-1.5 min-w-0">
            <span className="text-[11px] font-bold text-muted-foreground uppercase truncate block">
              Detected Platform
            </span>
            <p className="text-sm font-bold text-foreground truncate">
              {deviceInfo.platform}
            </p>
          </div>
        </div>
      </div>

      {/* Browser Compatibility Matrix */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Dynamic Web Push Feature Compatibility
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Dynamically evaluated for current client
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
          <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-between gap-2 min-w-0">
            <span className="font-semibold text-foreground truncate">Notification API</span>
            <div className="flex-shrink-0">
              {capabilities.notifications ? (
                <Badge variant="success">Supported</Badge>
              ) : (
                <Badge variant="destructive">Not Supported</Badge>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-between gap-2 min-w-0">
            <span className="font-semibold text-foreground truncate">Push API</span>
            <div className="flex-shrink-0">
              {capabilities.pushManager ? (
                <Badge variant="success">Supported</Badge>
              ) : (
                <Badge variant="destructive">Not Supported</Badge>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-between gap-2 min-w-0">
            <span className="font-semibold text-foreground truncate">Service Worker</span>
            <div className="flex-shrink-0">
              {capabilities.serviceWorker ? (
                <Badge variant="success">Supported</Badge>
              ) : (
                <Badge variant="destructive">Not Supported</Badge>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-between gap-2 min-w-0">
            <span className="font-semibold text-foreground truncate">Action Buttons</span>
            <div className="flex-shrink-0">
              {capabilities.actions ? (
                <Badge variant="success">Supported</Badge>
              ) : (
                <Badge variant="warning">Limited/Varies</Badge>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-between gap-2 min-w-0">
            <span className="font-semibold text-foreground truncate">Vibration API</span>
            <div className="flex-shrink-0">
              {capabilities.vibration ? (
                <Badge variant="success">Supported</Badge>
              ) : (
                <Badge variant="outline">Desktop / N/A</Badge>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-between gap-2 min-w-0">
            <span className="font-semibold text-foreground truncate">App Badging</span>
            <div className="flex-shrink-0">
              {capabilities.badge ? (
                <Badge variant="success">Supported</Badge>
              ) : (
                <Badge variant="outline">Limited</Badge>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-between gap-2 min-w-0">
            <span className="font-semibold text-foreground truncate">PWA Manifest</span>
            <div className="flex-shrink-0">
              <Badge variant="success">Supported</Badge>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-between gap-2 min-w-0">
            <span className="font-semibold text-foreground truncate">Background Push</span>
            <div className="flex-shrink-0">
              <Badge variant="success">Supported</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Help Section */}
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-tr from-blue-950/40 via-card to-card p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              How to Test on iPhone &amp; iPad (iOS 16.4+)
            </h3>
            <p className="text-xs text-muted-foreground">
              For iPhone/iPad push testing, install this website to the Home Screen and open it as a PWA where required by iOS.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1">
            <span className="font-bold text-blue-600 dark:text-blue-400">Step 1</span>
            <p className="text-muted-foreground">
              Open <strong className="text-foreground">PushHub</strong> in Safari on your iOS device.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1">
            <span className="font-bold text-blue-600 dark:text-blue-400">Step 2</span>
            <p className="text-muted-foreground">
              Tap the <strong className="text-foreground">Share</strong> icon and select <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong>.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1">
            <span className="font-bold text-blue-600 dark:text-blue-400">Step 3</span>
            <p className="text-muted-foreground">
              Launch PushHub from your Home Screen, sign in, and tap <strong className="text-foreground">&quot;Subscribe Device&quot;</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* My Connected Devices List */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Registered Devices ({devices.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Devices linked to your account that receive Web Push signals
            </p>
          </div>
        </div>

        {devices.length === 0 ? (
          <EmptyState
            icon={Smartphone}
            title="No devices subscribed yet"
            description='Click "Subscribe This Device" above to register this browser for real push testing.'
            action={
              <Button
                variant="glow"
                size="sm"
                onClick={handleSubscribeToggle}
                className="gap-2 font-bold"
              >
                <Radio className="h-4 w-4" />
                <span>Subscribe Device</span>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {devices.map((dev) => (
              <div
                key={dev.id}
                className="p-4 rounded-xl bg-secondary/20 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                    {dev.platform === "Windows" || dev.platform === "macOS" || dev.platform === "Linux" ? (
                      <Laptop className="h-5 w-5" />
                    ) : (
                      <Smartphone className="h-5 w-5" />
                    )}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground break-words">
                        {dev.deviceName || `${dev.browser} on ${dev.platform}`}
                      </span>
                      <Badge variant="success" size="sm" className="flex-shrink-0">
                        Connected
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      Endpoint: {dev.endpoint.slice(0, 48)}...
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-muted-foreground pt-0.5">
                      <span>Registered {formatDate(dev.createdAt)}</span>
                      <span>·</span>
                      <span>Last active: {formatDate(dev.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestDevice(dev.id)}
                    disabled={testingId === dev.id}
                    className="gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{testingId === dev.id ? "Pinging..." : "Test Ping"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveDevice(dev.id)}
                    disabled={removingId === dev.id}
                    className="gap-1.5 text-rose-600 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/10"
                    title="Remove device"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
