const isDev = typeof process !== "undefined" && process.env?.NODE_ENV === "development";
const debugLog = (...args) => {
  if (isDev) console.log(...args);
};

self.addEventListener("install", () => {
  debugLog("Service Worker installing.");
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  debugLog("Service Worker activating.");
  return self.clients.claim();
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "BrainDeck";
  const options = {
    body: data.body || "Time to study your flashcards!",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
});
