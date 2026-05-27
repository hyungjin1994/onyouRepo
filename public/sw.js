// LifeOS service worker — handles push notifications + click routing.
// No offline caching yet (DB/auth state too volatile).

const VERSION = "lifeos-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)),
      );
    })(),
  );
});

self.addEventListener("fetch", () => {
  // Pass-through.
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "LifeOS", body: event.data.text() };
  }

  const title = payload.title || "LifeOS";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon.svg",
    badge: payload.badge || "/icon.svg",
    tag: payload.tag,
    data: { url: payload.url || "/home", ...(payload.data || {}) },
    renotify: !!payload.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/home";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Focus an existing window if one is already open in our origin.
      for (const client of allClients) {
        const url = new URL(client.url);
        const origin = new URL(self.location.origin).origin;
        if (url.origin === origin) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(targetUrl);
            } catch {
              // navigate() can throw for cross-origin / sandboxed contexts
            }
          }
          return;
        }
      }

      await self.clients.openWindow(targetUrl);
    })(),
  );
});
