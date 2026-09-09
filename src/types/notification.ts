export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationConfig {
  id?: string;
  name: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
  direction?: "auto" | "ltr" | "rtl";
  language?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  renotify?: boolean;
  timestamp?: number;
  vibration?: number[];
  actions?: NotificationAction[];
  data?: Record<string, unknown>;
  style?: Record<string, unknown>;
  theme?: "light" | "dark";
  lastTested?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PushDevice {
  id: string;
  endpoint: string;
  browser?: string | null;
  platform?: string | null;
  deviceName?: string | null;
  deviceId?: string | null;
  userAgent?: string | null;
  isActive?: boolean;
  isOnline?: boolean;
  lastActiveAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ScheduledNotificationItem {
  id: string;
  userId: string;
  notificationId?: string | null;
  name: string;
  title: string;
  body: string;
  payload: string;
  targetMode: "all" | "active" | "current" | "specific";
  targetDeviceId?: string | null;
  targetSubscriptionId?: string | null;
  delaySeconds: number;
  scheduledAt: string | Date;
  status: "pending" | "sent" | "failed" | "cancelled";
  sentAt?: string | Date | null;
  error?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface NotificationHistoryItem {
  id: string;
  notificationId?: string | null;
  title: string;
  payload: string;
  device?: string | null;
  platform?: string | null;
  status: "sent" | "failed" | "expired";
  error?: string | null;
  sentAt: string | Date;
}

export interface TemplateModel {
  id: string;
  userId?: string | null;
  name: string;
  description: string;
  category: string;
  configuration: string; // JSON
  isSystemTemplate: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string | Date;
}
