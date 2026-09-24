/// <reference lib="webworker" />
import { cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: unknown };

// The build still injects this list. Do not precache it: a cache-first app shell
// kept serving the previous deployment until several refreshes.
void self.__WB_MANIFEST;

cleanupOutdatedCaches();

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      await Promise.all(
        windows.map(async (client) => {
          if (!("navigate" in client)) return;
          try {
            await client.navigate(client.url);
          } catch {
            // The tab may already be refreshing.
          }
        })
      );
    })()
  );
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
