const CACHE_NAME = '90plus5-v3';
const ASSETS_TO_CACHE = [
    '/manifest.json',
    '/logo.svg',
    '/fondo.jpg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Solo cachear GET requests y no las de Supabase
    if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
        return;
    }

    // 🚀 ESTRATEGIA: Network First para navegación (HTML)
    // Esto asegura que el usuario siempre vea la versión más reciente app
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
        return;
    }

    // ⚡ ESTRATEGIA: Cache First para recursos estáticos
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                // Cachear assets estáticos de Next.js, fuentes y assets locales
                if (
                    event.request.url.includes('/_next/static/') ||
                    event.request.url.includes('/fonts/') ||
                    event.request.url.includes('/heroes/')
                ) {
                    const responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return fetchResponse;
            });
        })
    );
});
