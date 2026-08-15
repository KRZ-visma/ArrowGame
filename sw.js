/* ARROW OUT service worker — cache app shell for offline play.
   Relative URLs so GitHub Pages project sites (e.g. /ArrowGame/) stay in scope. */

/* `__APP_VERSION__` is replaced on Pages deploy with a content hash of the staged shell. */
const CACHE_NAME = "arrow-out-__APP_VERSION__";

const PRECACHE = [
  "./",
  "./index.html",
  "./game.js",
  "./js/logic.js",
  "./js/levels.js",
  "./js/level-build.js",
  "./js/levels-data.js",
  "./js/progress.js",
  "./js/play-session.js",
  "./js/ui-shell.js",
  "./js/board-view.js",
  "./js/board-draw.js",
  "./js/overlays.js",
  "./js/pointer-input.js",
  "./js/version.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            await cache.add(url);
          } catch {
            // One missing asset must not block the rest (e.g. ./ vs index.html).
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        if (request.mode === "navigate") {
          const shell = await caches.match("./index.html");
          if (shell) return shell;
        }
        return Response.error();
      }
    })(),
  );
});
