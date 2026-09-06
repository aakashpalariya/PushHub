"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

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

  const [capabilities, setCapabilities] = useState({
    notifications: false,
    serviceWorker: false,
    pushManager: false,
    actions: false,
    vibration: false,
    badge: false,
    standalone: false,
  });

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
      // Register or get existing service worker registration
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      setSwRegistration(reg);

      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        setIsSubscribed(true);
        setSubscription(existingSub);
      } else {
        setIsSubscribed(false);
        setSubscription(null);
      }
    } catch (err) {
      console.error("Failed checking push subscription state:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

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

      // 5. Send subscription to backend
      const deviceInfo = detectPlatformAndBrowser();
      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: pushSub.toJSON(),
          browser: deviceInfo.browser,
          platform: deviceInfo.platform,
          deviceName: deviceInfo.deviceName,
          userAgent: deviceInfo.userAgent,
        }),
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json();
        throw new Error(errorData.error || "Failed to save device subscription");
      }

      setIsSubscribed(true);
      setSubscription(pushSub);
      toast.success("Device connected! You can now send real Web Push notifications.");
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

      setIsSubscribed(false);
      setSubscription(null);
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
    subscribeDevice,
    unsubscribeDevice,
    refreshStatus: checkSubscription,
    deviceInfo: detectPlatformAndBrowser(),
  };
}
