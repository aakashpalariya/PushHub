"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Bell,
  Code,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Eye,
  Settings2,
  AlertCircle,
  Shield,
  Bookmark,
  Clock,
  Target,
  Timer,
} from "lucide-react";
import { toast } from "@/components/ui/custom-toaster";
import { NotificationConfig, NotificationAction } from "@/types/notification";
import { ScheduledNotificationsCard } from "@/components/notifications/scheduled-notifications-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { LivePreview } from "@/components/preview/live-preview";
import { JsonInspector } from "./json-inspector";
import { AssetPickerModal } from "./asset-picker-modal";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { useTheme } from "@/components/theme/theme-provider";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationComposerProps {
  initialData?: NotificationConfig;
  isEditMode?: boolean;
}

const defaultNotification: NotificationConfig = {
  name: "Custom Notification Test",
  title: "New Update Available",
  body: "Tap to explore new features and notification improvements!",
  icon: "/presets/icon-bell.png",
  badge: "/presets/badge-bell.png",
  url: "/dashboard",
  tag: "general-announcements",
  requireInteraction: false,
  silent: false,
  renotify: false,
  vibration: [100, 50, 100],
  actions: [
    { action: "view", title: "View Update", icon: "" },
    { action: "dismiss", title: "Dismiss", icon: "" },
  ],
  data: {
    source: "notification-composer",
    category: "announcements",
  },
};

const vibrationPresets = [
  { label: "Default Pulse", pattern: [100, 50, 100] },
  { label: "Urgent Alert", pattern: [300, 100, 300, 100, 300] },
  { label: "Gentle Tap", pattern: [50, 50, 50] },
  { label: "Double Buzz", pattern: [200, 100, 200] },
];

export function NotificationComposer({
  initialData,
  isEditMode = false,
}: NotificationComposerProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const { isSubscribed, subscribeDevice } = usePushSubscription();

  const [config, setConfig] = useState<NotificationConfig>(
    initialData || defaultNotification
  );

  const [targetMode, setTargetMode] = useState<"all" | "active" | "current">("all");
  const [delaySeconds, setDelaySeconds] = useState<number>(0);

  const [customDataText, setCustomDataText] = useState<string>(
    JSON.stringify(config.data || {}, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [pickerType, setPickerType] = useState<"icon" | "badge" | "banner" | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    title?: string;
    body?: string;
    url?: string;
    icon?: string;
    badge?: string;
    image?: string;
    customData?: string;
    actionErrors?: Record<number, { title?: string; action?: string }>;
  }>({});

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview" | "payload">("edit");

  // Handle text input changes
  const handleChange = (
    field: keyof NotificationConfig,
    value: unknown
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Custom Data JSON handler
  const handleDataChange = (text: string) => {
    setCustomDataText(text);
    try {
      if (text.trim() === "") {
        setConfig((prev) => ({ ...prev, data: {} }));
        setJsonError(null);
        setFieldErrors((prev) => ({ ...prev, customData: undefined }));
      } else {
        const parsed = JSON.parse(text);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          setConfig((prev) => ({ ...prev, data: parsed }));
          setJsonError(null);
          setFieldErrors((prev) => ({ ...prev, customData: undefined }));
        } else {
          setJsonError("Custom data must be a JSON object");
          setFieldErrors((prev) => ({ ...prev, customData: "Custom data must be a JSON object" }));
        }
      }
    } catch (e) {
      setJsonError("Invalid JSON syntax");
      setFieldErrors((prev) => ({ ...prev, customData: "Invalid JSON syntax" }));
    }
  };

  // Action Button management
  const addAction = () => {
    if ((config.actions || []).length >= 3) {
      toast.warning("Browsers generally support a maximum of 2-3 actions");
      return;
    }
    const newAction: NotificationAction = {
      action: `action_${Date.now()}`,
      title: "New Action",
      icon: "",
    };
    setConfig((prev) => ({
      ...prev,
      actions: [...(prev.actions || []), newAction],
    }));
  };

  const removeAction = async (index: number) => {
    const action = config.actions?.[index];
    const hasContent = action && (action.title?.trim() || action.action?.trim());
    if (hasContent) {
      const confirmed = await confirm({
        title: "Remove Action Button",
        description: `Are you sure you want to remove the "${action.title || action.action}" action button?`,
        confirmText: "Remove Action",
        variant: "destructive",
        icon: "trash",
      });
      if (!confirmed) return;
    }

    setConfig((prev) => ({
      ...prev,
      actions: (prev.actions || []).filter((_, i) => i !== index),
    }));
    if (fieldErrors.actionErrors?.[index]) {
      setFieldErrors((prev) => {
        const next = { ...(prev.actionErrors || {}) };
        delete next[index];
        return { ...prev, actionErrors: next };
      });
    }
  };

  const moveAction = (index: number, direction: "up" | "down") => {
    const list = [...(config.actions || [])];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setConfig((prev) => ({ ...prev, actions: list }));
  };

  const updateAction = (
    index: number,
    field: keyof NotificationAction,
    value: string
  ) => {
    const list = [...(config.actions || [])];
    list[index] = { ...list[index], [field]: value };
    setConfig((prev) => ({ ...prev, actions: list }));
    if (fieldErrors.actionErrors?.[index]?.[field as "title" | "action"]) {
      setFieldErrors((prev) => {
        const nextActionErrors = { ...(prev.actionErrors || {}) };
        if (nextActionErrors[index]) {
          nextActionErrors[index] = { ...nextActionErrors[index], [field]: undefined };
        }
        return { ...prev, actionErrors: nextActionErrors };
      });
    }
  };

  const validateComposer = (forSendOnly = false) => {
    const errors: typeof fieldErrors = {};
    let hasError = false;

    if (!forSendOnly && (!config.name || !config.name.trim())) {
      errors.name = "Notification name is required";
      hasError = true;
    }

    if (!config.title || !config.title.trim()) {
      errors.title = "Notification title is required";
      hasError = true;
    }

    if (!config.body || !config.body.trim()) {
      errors.body = "Notification body message is required";
      hasError = true;
    }

    if (config.url && config.url.trim()) {
      const u = config.url.trim();
      if (!u.startsWith("/") && !u.startsWith("http://") && !u.startsWith("https://")) {
        errors.url = "Target URL must start with /, http://, or https://";
        hasError = true;
      }
    }

    if (config.icon && config.icon.trim()) {
      const u = config.icon.trim();
      if (!u.startsWith("/") && !u.startsWith("http://") && !u.startsWith("https://") && !u.startsWith("data:")) {
        errors.icon = "Icon URL must start with /, http://, https://, or data:";
        hasError = true;
      }
    }

    if (config.badge && config.badge.trim()) {
      const u = config.badge.trim();
      if (!u.startsWith("/") && !u.startsWith("http://") && !u.startsWith("https://") && !u.startsWith("data:")) {
        errors.badge = "Badge URL must start with /, http://, https://, or data:";
        hasError = true;
      }
    }

    if (config.image && config.image.trim()) {
      const u = config.image.trim();
      if (!u.startsWith("/") && !u.startsWith("http://") && !u.startsWith("https://") && !u.startsWith("data:")) {
        errors.image = "Banner URL must start with /, http://, https://, or data:";
        hasError = true;
      }
    }

    if (jsonError) {
      errors.customData = jsonError;
      hasError = true;
    }

    if (config.actions && config.actions.length > 0) {
      const actErrs: Record<number, { title?: string; action?: string }> = {};
      config.actions.forEach((act, idx) => {
        const itemErr: { title?: string; action?: string } = {};
        if (!act.title || !act.title.trim()) {
          itemErr.title = "Action title is required";
        }
        if (!act.action || !act.action.trim()) {
          itemErr.action = "Action ID is required";
        } else if (/\s/.test(act.action.trim())) {
          itemErr.action = "Action ID cannot contain spaces";
        }
        if (itemErr.title || itemErr.action) {
          actErrs[idx] = itemErr;
          hasError = true;
        }
      });
      if (Object.keys(actErrs).length > 0) {
        errors.actionErrors = actErrs;
      }
    }

    setFieldErrors(errors);
    return !hasError;
  };

  const { resolvedTheme } = useTheme();
  const activeNotificationTheme: "light" | "dark" = config.theme || resolvedTheme;

  // Save Notification Configuration
  const handleSave = async () => {
    if (!validateComposer(false)) {
      setMobileTab("edit");
      toast.error("Please resolve the highlighted form errors");
      return;
    }

    setIsSaving(true);
    try {
      const url = isEditMode && config.id ? `/api/notifications/${config.id}` : "/api/notifications";
      const method = isEditMode && config.id ? "PUT" : "POST";

      const payloadToSave = {
        ...config,
        theme: activeNotificationTheme,
        data: {
          ...(config.data || {}),
          theme: activeNotificationTheme,
        },
        style: {
          ...(config.style || {}),
          theme: activeNotificationTheme,
        },
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSave),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save notification");
      }

      toast.success(
        isEditMode
          ? "Notification configuration updated!"
          : "Notification saved to your lab!"
      );

      if (!isEditMode && data.notification?.id) {
        router.push(`/notifications/${data.notification.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving notification";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Current Configuration as a Private Custom Template
  const handleSaveAsTemplate = async () => {
    if (!validateComposer(false)) {
      setMobileTab("edit");
      toast.error("Please resolve the highlighted form errors");
      return;
    }

    setIsSavingTemplate(true);
    try {
      const templatePayload = {
        name: config.name,
        description: config.body ? `${config.body.slice(0, 120)}...` : `Template from ${config.name}`,
        category: config.tag ? (config.tag.charAt(0).toUpperCase() + config.tag.slice(1)) : "Custom",
        configuration: {
          ...config,
          theme: activeNotificationTheme,
          data: {
            ...(config.data || {}),
            theme: activeNotificationTheme,
          },
          style: {
            ...(config.style || {}),
            theme: activeNotificationTheme,
          },
        },
      };

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templatePayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create template");
      }

      toast.success(`"${config.name}" saved to your private templates!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving template";
      toast.error(msg);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Send Real Push Notification
  const handleSendPush = async () => {
    if (!validateComposer(true)) {
      setMobileTab("edit");
      toast.error("Please resolve the highlighted form errors");
      return;
    }
    if (jsonError) {
      toast.error("Please fix invalid custom JSON data before sending");
      return;
    }

    // If device is not yet subscribed, prompt device subscription flow
    if (!isSubscribed) {
      toast.info("Subscribing this browser first...");
      const subscribed = await subscribeDevice();
      if (!subscribed) {
        toast.error("Device subscription required to dispatch Web Push");
        return;
      }
    }

    setIsSending(true);
    try {
      const payloadToSend = {
        ...config,
        theme: activeNotificationTheme,
        targetMode,
        delaySeconds,
        data: {
          ...(config.data || {}),
          theme: activeNotificationTheme,
        },
        style: {
          ...(config.style || {}),
          theme: activeNotificationTheme,
        },
      };

      // Send real push payload via Next.js backend
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSend),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch push");
      }

      toast.success(data.message || `Real Web Push (${activeNotificationTheme} mode) sent!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error dispatching push";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header Bar */}
      <PageHeader
        title={isEditMode ? "Edit Notification" : "Notification Composer"}
        description="Configure visual assets, trigger behaviors, actions, and test across devices."
        actions={
          <div className="hidden md:flex items-center gap-2.5">
            <Button
              variant="outline"
              size="default"
              onClick={handleSaveAsTemplate}
              disabled={isSavingTemplate}
              className="gap-2"
              title="Save this notification configuration as a private template"
            >
              <Bookmark className="h-4 w-4 text-purple-500" />
              <span>{isSavingTemplate ? "Saving Template..." : "Save as Template"}</span>
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Saving..." : "Save Notification"}</span>
            </Button>
            <Button
              variant="glow"
              size="default"
              onClick={handleSendPush}
              disabled={isSending}
              className="gap-2 font-bold"
            >
              <Send className="h-4 w-4" />
              <span>{isSending ? "Sending Push..." : "Send Test Push"}</span>
            </Button>
          </div>
        }
      />

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex rounded-xl bg-card border border-border p-1 shadow-xs">
        <button
          onClick={() => setMobileTab("edit")}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors",
            mobileTab === "edit" ? "bg-primary text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Editor
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors",
            mobileTab === "preview" ? "bg-primary text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Live Preview
        </button>
        <button
          onClick={() => setMobileTab("payload")}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors",
            mobileTab === "payload" ? "bg-primary text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Code className="h-3.5 w-3.5" />
          JSON
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Configuration */}
        <div
          className={cn(
            "lg:col-span-7 space-y-6",
            mobileTab !== "edit" && "hidden md:block"
          )}
        >
          {/* 1. General Info */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-foreground border-b border-border/60 pb-3">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>General Details</span>
            </div>

            <div className="space-y-4">
              <FormField
                label="Notification Name (Lab Label)"
                error={fieldErrors.name}
                required
              >
                <Input
                  value={config.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Flash Sale Announcement"
                  error={Boolean(fieldErrors.name)}
                />
              </FormField>

              <FormField
                label="Notification Theme Mode"
                helperText={
                  <span>
                    Transmitted with payload: <strong className="text-foreground capitalize">{activeNotificationTheme} Mode</strong>
                  </span>
                }
              >
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange("theme", undefined)}
                    className={cn(
                      "py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                      !config.theme
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>Auto ({resolvedTheme})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("theme", "light")}
                    className={cn(
                      "py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                      config.theme === "light"
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Sun className="h-3.5 w-3.5 text-amber-300" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("theme", "dark")}
                    className={cn(
                      "py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                      config.theme === "dark"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Moon className="h-3.5 w-3.5 text-blue-300" />
                    <span>Dark</span>
                  </button>
                </div>
              </FormField>

              <FormField
                label="Notification Title"
                error={fieldErrors.title}
                required
              >
                <Input
                  value={config.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g. 50% Off Everything Today Only!"
                  error={Boolean(fieldErrors.title)}
                />
              </FormField>

              <FormField
                label="Body Message"
                error={fieldErrors.body}
                required
              >
                <Textarea
                  value={config.body}
                  onChange={(e) => handleChange("body", e.target.value)}
                  placeholder="Enter the primary message that users will read..."
                  rows={3}
                  error={Boolean(fieldErrors.body)}
                />
              </FormField>
            </div>
          </div>

          {/* 1.5. Target Device & Delivery Timing (Scheduling) */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 text-base font-bold text-foreground border-b border-border/60 pb-3">
              <Target className="h-5 w-5 text-emerald-500" />
              <span>Target Device &amp; Delivery Scheduling</span>
            </div>

            <div className="space-y-4">
              <FormField
                label="Target Device Routing"
                helperText="Select which of your connected devices will receive this push notification."
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTargetMode("all")}
                    className={cn(
                      "p-3 rounded-xl border text-left space-y-1 transition-all",
                      targetMode === "all"
                        ? "bg-primary/10 border-primary text-foreground shadow-xs"
                        : "bg-secondary/20 border-border/70 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-xs font-bold block text-foreground">All Devices</span>
                    <span className="text-[11px] text-muted-foreground block">
                      Broadcast push to all registered devices
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetMode("active")}
                    className={cn(
                      "p-3 rounded-xl border text-left space-y-1 transition-all",
                      targetMode === "active"
                        ? "bg-emerald-500/10 border-emerald-500 text-foreground shadow-xs"
                        : "bg-secondary/20 border-border/70 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-xs font-bold block text-emerald-400">Active Device Only</span>
                    <span className="text-[11px] text-muted-foreground block">
                      Send to device currently active / open
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetMode("current")}
                    className={cn(
                      "p-3 rounded-xl border text-left space-y-1 transition-all",
                      targetMode === "current"
                        ? "bg-blue-500/10 border-blue-500 text-foreground shadow-xs"
                        : "bg-secondary/20 border-border/70 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-xs font-bold block text-blue-400">This Device Only</span>
                    <span className="text-[11px] text-muted-foreground block">
                      Send to current browser window
                    </span>
                  </button>
                </div>
              </FormField>

              <FormField
                label="Delivery Timing (Delay / Schedule)"
                helperText="Schedule delayed delivery. Notification will send via server Web Push even if tab/app is closed."
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setDelaySeconds(0)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                      delaySeconds === 0
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Instant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDelaySeconds(10)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                      delaySeconds === 10
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>10 Seconds</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDelaySeconds(30)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                      delaySeconds === 30
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>30 Seconds</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDelaySeconds(60)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                      delaySeconds === 60
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>1 Minute</span>
                  </button>
                </div>
              </FormField>
            </div>
          </div>

          {/* Pending Scheduled Notifications Card */}
          <ScheduledNotificationsCard />

          {/* 2. Visuals & Assets */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-foreground border-b border-border/60 pb-3">
              <ImageIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Visuals &amp; Media</span>
            </div>

            <div className="space-y-3">
              <FormField label="Icon URL (Square icon)" error={fieldErrors.icon}>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={config.icon || ""}
                      onChange={(e) => handleChange("icon", e.target.value)}
                      placeholder="https://.../icon.png (Default: /presets/icon-bell.png)"
                      error={Boolean(fieldErrors.icon)}
                      className={config.icon ? "pr-10" : ""}
                    />
                    {config.icon && (
                      <div className="absolute right-2 top-2 h-6 w-6 rounded-md overflow-hidden bg-secondary border border-border/80 pointer-events-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={config.icon}
                          alt="Icon Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerType("icon")}
                    className="h-10 px-3 gap-1.5 font-bold text-xs shrink-0 border-border hover:border-primary hover:text-primary transition-colors"
                    title="Pick from default icons"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                    <span>Pick Icon</span>
                  </Button>
                </div>
              </FormField>

              <FormField label="Badge URL (Monochrome small icon)" error={fieldErrors.badge}>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={config.badge || ""}
                      onChange={(e) => handleChange("badge", e.target.value)}
                      placeholder="https://.../badge.png (Default: /presets/badge-bell.png)"
                      error={Boolean(fieldErrors.badge)}
                      className={config.badge ? "pr-10" : ""}
                    />
                    {config.badge && (
                      <div className="absolute right-2 top-2 h-6 w-6 rounded-md overflow-hidden bg-slate-900 border border-border/80 pointer-events-none flex items-center justify-center p-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={config.badge}
                          alt="Badge Preview"
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerType("badge")}
                    className="h-10 px-3 gap-1.5 font-bold text-xs shrink-0 border-border hover:border-primary hover:text-primary transition-colors"
                    title="Pick from default badges"
                  >
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span>Pick Badge</span>
                  </Button>
                </div>
              </FormField>

              <FormField label="Expanded Banner Image URL (Optional)" error={fieldErrors.image}>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={config.image || ""}
                      onChange={(e) => handleChange("image", e.target.value)}
                      placeholder="https://.../banner.png"
                      error={Boolean(fieldErrors.image)}
                      className={config.image ? "pr-14" : ""}
                    />
                    {config.image && (
                      <div className="absolute right-2 top-2 h-6 w-10 rounded-md overflow-hidden bg-slate-950 border border-border/80 pointer-events-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={config.image}
                          alt="Banner Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerType("banner")}
                    className="h-10 px-3 gap-1.5 font-bold text-xs shrink-0 border-border hover:border-primary hover:text-primary transition-colors"
                    title="Pick from default banners"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Pick Banner</span>
                  </Button>
                </div>
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <FormField label="Text Direction">
                  <Select
                    value={config.direction || "auto"}
                    onChange={(e) =>
                      handleChange(
                        "direction",
                        e.target.value as "auto" | "ltr" | "rtl"
                      )
                    }
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="ltr">Left to Right (LTR)</option>
                    <option value="rtl">Right to Left (RTL)</option>
                  </Select>
                </FormField>

                <FormField label="Tag / Grouping ID">
                  <Input
                    value={config.tag || ""}
                    onChange={(e) => handleChange("tag", e.target.value)}
                    placeholder="e.g. order-updates"
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* 3. Behavior & Interactivity */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-foreground border-b border-border/60 pb-3">
              <Sliders className="h-5 w-5 text-teal-400" />
              <span>Behavior &amp; Triggers</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Require Interaction
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Notification remains on screen until user interacts or dismisses.
                  </p>
                </div>
                <Switch
                  checked={Boolean(config.requireInteraction)}
                  onCheckedChange={(checked) =>
                    handleChange("requireInteraction", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60">
                <div>
                  <p className="text-sm font-bold text-foreground">Silent Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Suppress sound and vibration regardless of device settings.
                  </p>
                </div>
                <Switch
                  checked={Boolean(config.silent)}
                  onCheckedChange={(checked) => handleChange("silent", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60">
                <div>
                  <p className="text-sm font-bold text-foreground">Renotify</p>
                  <p className="text-xs text-muted-foreground">
                    Trigger audio/vibration again when replacing an existing tagged notification.
                  </p>
                </div>
                <Switch
                  checked={Boolean(config.renotify)}
                  onCheckedChange={(checked) => handleChange("renotify", checked)}
                />
              </div>

              {/* Vibration Presets */}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Vibration Pattern
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {vibrationPresets.map((vp, idx) => {
                    const isSelected =
                      JSON.stringify(config.vibration) ===
                      JSON.stringify(vp.pattern);
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => handleChange("vibration", vp.pattern)}
                        className={cn(
                          "py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center",
                          isSelected
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                      >
                        {vp.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Action Buttons */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 text-base font-bold text-foreground">
                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span>Notification Actions</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addAction}
                className="text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Action
              </Button>
            </div>

            {(!config.actions || config.actions.length === 0) ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                No interactive buttons configured. Click &quot;Add Action&quot; to attach quick buttons.
              </p>
            ) : (
              <div className="space-y-3">
                {config.actions.map((act, index) => {
                  const actErr = fieldErrors.actionErrors?.[index];
                  return (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl bg-secondary/30 border border-border/70 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                    >
                      <div className="w-full sm:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Input
                            value={act.title}
                            onChange={(e) =>
                              updateAction(index, "title", e.target.value)
                            }
                            placeholder="Button Title (e.g. View Order)"
                            error={Boolean(actErr?.title)}
                          />
                          {actErr?.title && (
                            <div className="flex items-center gap-1 text-[11px] text-destructive font-medium mt-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>{actErr.title}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <Input
                            value={act.action}
                            onChange={(e) =>
                              updateAction(index, "action", e.target.value)
                            }
                            placeholder="Action ID (e.g. view_order)"
                            error={Boolean(actErr?.action)}
                          />
                          {actErr?.action && (
                            <div className="flex items-center gap-1 text-[11px] text-destructive font-medium mt-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>{actErr.action}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 self-end sm:self-center mt-1 sm:mt-0">
                        <button
                          type="button"
                          onClick={() => moveAction(index, "up")}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveAction(index, "down")}
                          disabled={index === (config.actions?.length || 0) - 1}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAction(index)}
                          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                          title="Remove Action"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Click Action & Custom Data */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-foreground border-b border-border/60 pb-3">
              <ExternalLink className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Click Navigation &amp; Custom Data</span>
            </div>

            <div className="space-y-3">
              <FormField label="Target Click URL" error={fieldErrors.url}>
                <Input
                  value={config.url || ""}
                  onChange={(e) => handleChange("url", e.target.value)}
                  placeholder="/dashboard or https://..."
                  error={Boolean(fieldErrors.url)}
                />
              </FormField>

              <FormField
                label="Custom Data (JSON)"
                error={fieldErrors.customData || (jsonError ? jsonError : undefined)}
                helperText={!jsonError ? "Valid JSON object" : undefined}
              >
                <Textarea
                  value={customDataText}
                  onChange={(e) => handleDataChange(e.target.value)}
                  rows={4}
                  className="font-mono text-xs"
                  error={Boolean(fieldErrors.customData || jsonError)}
                  placeholder='{"screen": "workout", "id": "123"}'
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview & JSON Inspector */}
        <div
          className={cn(
            "lg:col-span-5 space-y-6 sticky top-24",
            mobileTab === "preview" && "block",
            mobileTab === "payload" && "block",
            mobileTab === "edit" && "hidden md:block"
          )}
        >
          {/* Live Preview Card */}
          {(mobileTab === "preview" || mobileTab === "edit") && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
              <LivePreview config={config} overrideTheme={activeNotificationTheme} />
            </div>
          )}

          {/* JSON Inspector */}
          {(mobileTab === "payload" || mobileTab === "edit") && (
            <JsonInspector config={{ ...config, theme: activeNotificationTheme }} />
          )}

          {/* Quick Real Push Dispatch Card */}
          <div className="rounded-2xl border border-border bg-gradient-to-tr from-blue-950/40 to-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-bold text-sm text-foreground">
                Push Dispatch Console
              </h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dispatches real Web Push packets using server-side VAPID signatures to all your connected browsers and PWAs.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="glow"
                onClick={handleSendPush}
                disabled={isSending}
                className="w-full gap-2 text-base font-bold shadow-blue-500/25"
              >
                <Send className="h-4 w-4" />
                <span>{isSending ? "Dispatching Push..." : "Send Real Push"}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full gap-2 text-sm"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? "Saving..." : "Save to My Notifications"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 p-2.5 bg-card/95 backdrop-blur-xl border-t border-border/80 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveAsTemplate}
          disabled={isSavingTemplate}
          className="text-xs px-2.5 h-11"
          title="Save as Private Template"
        >
          <Bookmark className="h-4 w-4 text-purple-500" />
        </Button>
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 text-xs gap-1.5 h-11 font-bold"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? "Saving..." : "Save"}</span>
        </Button>
        <Button
          variant="glow"
          onClick={handleSendPush}
          disabled={isSending}
          className="flex-1 text-xs gap-1.5 h-11 font-bold"
        >
          <Send className="h-4 w-4" />
          <span>{isSending ? "Sending..." : "Test Push"}</span>
        </Button>
      </div>

      {/* Default Asset Picker Dialog */}
      <AssetPickerModal
        open={Boolean(pickerType)}
        onOpenChange={(open) => !open && setPickerType(null)}
        type={pickerType}
        currentValue={
          pickerType === "icon"
            ? config.icon
            : pickerType === "badge"
            ? config.badge
            : config.image
        }
        onSelect={(url) => {
          if (pickerType === "banner") {
            handleChange("image", url);
          } else if (pickerType) {
            handleChange(pickerType, url);
          }
        }}
      />
    </div>
  );
}
