// PushHub Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "PushHub Notification",
    body: "You received a new test push notification!",
    icon: "/logo.png",
    badge: "/logo.png",
    url: "/dashboard",
    tag: "pushhub-default",
    data: {},
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = { ...payload, ...data };
    } catch (e) {
      try {
        payload.body = event.data.text();
      } catch (err) {
        console.error("Failed to parse push data", err);
      }
    }
  }

  const notificationOptions = {
    body: payload.body || "Test notification payload",
    icon: payload.icon || "/logo.png",
    badge: payload.badge || "/logo.png",
    image: payload.image || undefined,
    tag: payload.tag || undefined,
    data: {
      url: payload.url || "/dashboard",
      customData: payload.data || {},
      theme: payload.theme || (payload.data && payload.data.theme) || "dark",
      timestamp: Date.now(),
    },
    requireInteraction: Boolean(payload.requireInteraction),
    silent: Boolean(payload.silent),
    renotify: Boolean(payload.renotify),
    vibrate: Array.isArray(payload.vibration) ? payload.vibration : [100, 50, 100],
    dir: payload.direction || "auto",
    actions: Array.isArray(payload.actions)
      ? payload.actions.map((act) => ({
          action: act.action,
          title: act.title,
          icon: act.icon || undefined,
        }))
      : [],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.url || "/dashboard";

  // If user clicked a specific action button
  if (event.action) {
    console.log("Action button clicked:", event.action);
    // If specific action has a route or query param
    targetUrl += (targetUrl.includes("?") ? "&" : "?") + "action=" + encodeURIComponent(event.action);
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it and navigate
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url && client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
