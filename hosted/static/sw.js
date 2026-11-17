// The Context's service worker: keeps the latest edition so the page opens offline.
// Same-origin pages and scripts are network-first (a fresh edition wins whenever
// there's a connection); Google Fonts are cache-first. Archived editions aren't
// stored, so the cache holds one edition and stays small.
const CACHE = "the-context-v1";
const SHELL = ["./", "icon.svg", "favicon-32.png", "apple-touch-icon.png", "icon-192.png", "manifest.webmanifest"];
const FONT_HOSTS = new Set(["fonts.googleapis.com", "fonts.gstatic.com"]);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const scope = () => new URL(self.registration.scope);

/** Today's page is stored under the scope URL however it was asked for ("./" or "./index.html"). */
function cacheKey(url) {
  const root = scope();
  if (url.origin === root.origin && (url.pathname === root.pathname || url.pathname === root.pathname + "index.html")) return root.href;
  return url.href;
}

async function networkFirst(request) {
  const url = new URL(request.url);
  const cache = await caches.open(CACHE);
  const archived = url.pathname.startsWith(scope().pathname + "archive/");
  try {
    const response = await fetch(request);
    if (response.ok && !archived) {
      // Only one homepage.js?v=… is worth keeping: the one today's page loads.
      if (/\/homepage\.js$/.test(url.pathname)) {
        for (const old of await cache.keys()) if (new URL(old.url).pathname === url.pathname && old.url !== url.href) await cache.delete(old);
      }
      await cache.put(cacheKey(url), response.clone());
    }
    return response;
  } catch (err) {
    const hit = await cache.match(cacheKey(url));
    if (hit) return hit;
    // Offline on a page we never stored (an old archive edition): show today's instead.
    if (request.mode === "navigate") {
      const today = await cache.match(scope().href);
      if (today) return today;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (FONT_HOSTS.has(url.hostname)) event.respondWith(cacheFirst(request));
  else if (url.origin === self.location.origin && url.pathname.startsWith(scope().pathname)) event.respondWith(networkFirst(request));
});

// Web Push: the builder sends {title, body, url} when a new edition is published.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text() };
  }
  const url = new URL(data.url || "./", scope()).href;
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || "The Context", {
        body: data.body || "Today's edition is out.",
        icon: "icon-192.png",
        badge: "icon-192.png",
        tag: "edition",
        data: { url },
      }),
      // Fetch the new edition now, so it's there even if the tap comes offline.
      fetch(scope().href, { cache: "no-store" })
        .then((r) => (r.ok ? caches.open(CACHE).then((c) => c.put(scope().href, r)) : null))
        .catch(() => {}),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || scope().href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(scope().href));
      if (open) return open.navigate(url).then((w) => (w || open).focus()).catch(() => open.focus());
      return self.clients.openWindow(url);
    }),
  );
});
