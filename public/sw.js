// ============================================================
// Tyren — Enhanced Service Worker (PWA)
//
// Improvements over original:
// 1. Runtime caching for Next.js _next/static/* assets (Cache-First)
// 2. Stale-While-Revalidate for dynamic page loads
// 3. Better cache versioning and cleanup
// 4. Font caching for Google Fonts
// ============================================================

const CACHE_VERSION = 'v11';
const STATIC_CACHE = `tyren-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `tyren-runtime-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
    '/',
    '/manifest.json',
    '/icon-192.svg?v=2',
    '/icon-512.svg?v=2'
];

// ---- Install: precache essential assets ----
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
});

// ---- Activate: clean up old caches ----
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== STATIC_CACHE && name !== RUNTIME_CACHE)
                        .map((name) => caches.delete(name))
                );
            })
        ])
    );
});

// ---- Fetch: strategy-based routing ----
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. API requests: always network, never cache
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // 2. Next.js static assets (_next/static/*): Cache-First with runtime caching
    //    These are content-hashed, so they are safe to cache indefinitely.
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;

                return fetch(event.request).then((response) => {
                    // Only cache successful responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // 3. Google Fonts: Cache-First (font files rarely change)
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;

                return fetch(event.request).then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // 4. Navigation requests: Network-First, fallback to cache (prevents white screen)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Update cache with fresh navigation response
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(STATIC_CACHE).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match('/') || caches.match(event.request);
                })
        );
        return;
    }

    // 5. Other assets: Stale-While-Revalidate
    //    Serve from cache immediately, then update cache in background
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetchPromise = fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => cached);

            return cached || fetchPromise;
        })
    );
});
