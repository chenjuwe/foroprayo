const CACHE_NAME = 'prayforo-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico',
  '/manifest.json',
  '/apple-touch-icon.png',
  '/masked-icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/placeholder.svg'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Activate new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => {
          return name !== CACHE_NAME;
        }).map(name => {
          return caches.delete(name);
        })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip cross-origin requests like analytics
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Cache hit - return response
          if (response) {
            return response;
          }

          // Clone the request
          const fetchRequest = event.request.clone();

          return fetch(fetchRequest).then(
            response => {
              // Check if valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            }
          ).catch(() => {
            // Return the offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // Return nothing for other failed requests
            return new Response('Network error occurred', {
              status: 408,
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
        })
    );
  }
}); 