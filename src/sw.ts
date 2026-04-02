/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision?: string }> };

// Precache assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Take control of all clients as soon as the SW activates
self.addEventListener("activate", () => {
  clientsClaim();
});

// Push notifications: show system notification even when PWA is not open
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; icon?: string; tag?: string; url?: string } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "JosCity", body: event.data.text() || "New update" };
  }
  const title = payload.title || "JosCity";
  const options: NotificationOptions & { renotify?: boolean; data?: { url?: string } } = {
    body: payload.body || "You have a new notification",
    icon: payload.icon || "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag || "joscity-notification",
    renotify: true,
    data: { url: payload.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click: focus app or open URL
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const data = (event.notification as Notification & { data?: { url?: string } }).data;
  const urlToOpen = data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
    })
  );
});
