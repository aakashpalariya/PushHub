"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server_device";
  const STORAGE_KEY = "pushhub_device_id";
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function detectPlatformAndBrowser() {
  if (typeof window === "undefined") return { platform: "Unknown", browser: "Unknown", deviceName: "Unknown" };

  const ua = navigator.userAgent;
  let browser = "Other";
  let platform = "Other";

  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  if (/android/i.test(ua)) platform = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) platform = "iOS";
  else if (/macintosh|mac os x/i.test(ua)) platform = "macOS";
  else if (/windows/i.test(ua)) platform = "Windows";
  else if (/linux/i.test(ua)) platform = "Linux";

  const deviceName = `${browser} on ${platform}`;

  return { browser, platform, deviceName, userAgent: ua };
}

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [deviceId, setDeviceId] = useState<string>("");

  const subscriptionRef = useRef<PushSubscription | null>(null);
  const deviceIdRef = useRef<string>("");

  const [capabilities, setCapabilities] = useState({
    notifications: false,
    serviceWorker: false,
    pushManager: false,
    actions: false,
    vibration: false,
    badge: false,
    standalone: false,
  });

  // Ensure deviceId is initialized on client
  useEffect(() => {
    const id = getOrCreateDeviceId();
    setDeviceId(id);
    deviceIdRef.current = id;
  }, []);

  const sendHeartbeat = useCallback(async (isDisconnect = false) => {
    try {
      const endpoint = subscriptionRef.current?.endpoint;
      const currentDeviceId = deviceIdRef.current;

      const payload = JSON.stringify({
        endpoint,
        deviceId: currentDeviceId,
        status: isDisconnect ? "disconnect" : "active",
      });

      if (isDisconnect && typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/push/heartbeat", blob);
      } else {
        await fetch("/api/push/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
      }
    } catch {
      // Ignore background heartbeat errors silently
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    if (typeof window === "undefined") return;

    const hasSw = "serviceWorker" in navigator;
    const hasNotification = "Notification" in window;
    const hasPush = "PushManager" in window;
    const hasVibrate = "vibrate" in navigator;
    const hasBadge = "setAppBadge" in navigator;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    setCapabilities({
      notifications: hasNotification,
      serviceWorker: hasSw,
      pushManager: hasPush,
      actions: hasNotification && "actions" in (Notification.prototype as unknown as Record<string, unknown>),
      vibration: hasVibrate,
      badge: hasBadge,
      standalone: isStandalone,
    });

    if (!hasSw || !hasNotification || !hasPush) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      setSwRegistration(reg);

      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        setIsSubscribed(true);
        setSubscription(existingSub);
        subscriptionRef.current = existingSub;
        // Trigger heartbeat on check
        sendHeartbeat(false);
      } else {
        setIsSubscribed(false);
        setSubscription(null);
        subscriptionRef.current = null;
      }
    } catch (err) {
      console.error("Failed checking push subscription state:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sendHeartbeat]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Periodic Heartbeat loop (every 15s) and page unload beacon
  useEffect(() => {
    if (typeof window === "undefined") return;

    const interval = setInterval(() => {
      sendHeartbeat(false);
    }, 15000);

    const handleUnload = () => {
      sendHeartbeat(true);
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [sendHeartbeat]);

  const subscribeDevice = async () => {
    if (!isSupported) {
      toast.error("Web Push is not supported in this browser environment");
      return false;
    }

    setIsLoading(true);
    try {
      // 1. Request notification permission
      const requestedPermission = await Notification.requestPermission();
      setPermission(requestedPermission);

      if (requestedPermission !== "granted") {
        toast.error("Notification permission was denied or dismissed");
        setIsLoading(false);
        return false;
      }

      // 2. Ensure ServiceWorker registration is ready
      let reg = swRegistration;
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        setSwRegistration(reg);
      }
      await navigator.serviceWorker.ready;

      // 3. Fetch VAPID public key
      const keyRes = await fetch("/api/push/vapid-public-key");
      const keyData = await keyRes.json();

      if (!keyRes.ok || !keyData.publicKey) {
        throw new Error(keyData.error || "Failed to retrieve VAPID key");
      }

      const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);

      // 4. Subscribe with PushManager
      const pushSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // 5. Send subscription to backend along with persistent deviceId
      const deviceInfo = detectPlatformAndBrowser();
      const currentDeviceId = deviceId || getOrCreateDeviceId();

      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: pushSub.toJSON(),
          browser: deviceInfo.browser,
          platform: deviceInfo.platform,
          deviceName: deviceInfo.deviceName,
          userAgent: deviceInfo.userAgent,
          deviceId: currentDeviceId,
        }),
      });

      const resData = await saveRes.json();

      if (!saveRes.ok) {
        if (resData.limitReached) {
          // Clean up browser subscription if backend rejected due to 3-device limit
          await pushSub.unsubscribe().catch(() => {});
          toast.error(resData.error || "Device limit reached (max 3 devices allowed). Please disconnect an existing device.");
          return false;
        }
        throw new Error(resData.error || "Failed to save device subscription");
      }

      setIsSubscribed(true);
      setSubscription(pushSub);
      subscriptionRef.current = pushSub;
      toast.success("Device connected! You can now send real Web Push notifications.");
      sendHeartbeat(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to subscribe device";
      console.error("Subscription error:", err);
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeDevice = async () => {
    if (!subscription) return false;

    setIsLoading(true);
    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      sendHeartbeat(true);

      setIsSubscribed(false);
      setSubscription(null);
      subscriptionRef.current = null;
      toast.success("Device unsubscribed successfully");
      return true;
    } catch (err) {
      console.error("Unsubscribe error:", err);
      toast.error("Failed to unsubscribe device");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscription,
    capabilities,
    deviceId,
    subscribeDevice,
    unsubscribeDevice,
    refreshStatus: checkSubscription,
    deviceInfo: detectPlatformAndBrowser(),
  };
}
