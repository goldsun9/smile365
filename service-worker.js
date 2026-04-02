/* =====================================================
   뇌팔청춘365 — Service Worker v2.0
   오프라인 캐시 & 빠른 로딩 지원
   ===================================================== */

const CACHE_NAME = 'smile365-v2.1.0';  // ← 버전 올릴 때마다 여기 숫자 변경

const ASSETS = [
  '/index.html',
  '/manifest.json',
  '/Icons/icon-192x192.png',
  '/Icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap'
];

/* ── 설치: 핵심 파일 캐시 ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] 캐시 설치 중...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

/* ── 활성화: 구버전 캐시 삭제 ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── fetch: 네트워크 우선, 없으면 캐시 ── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(response => {
      if (!response || response.status !== 200 || response.type === 'opaque') {
        return response;
      }
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => {
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

/* ── 푸시 알림 (향후 사용 가능) ── */
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '뇌팔청춘365';
  const options = {
    body: data.body || '오늘의 뇌팔청춘 훈련이 기다리고 있어요! 😄',
    icon: '/Icons/icon-192x192.png',
    badge: '/Icons/icon-72x72.png',
    lang: 'ko',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
