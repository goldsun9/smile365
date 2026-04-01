/* =====================================================
   뇌팔청춘365 — Service Worker v1.0
   오프라인 캐시 & 빠른 로딩 지원
   ===================================================== */

const CACHE_NAME = 'smile365-v1.0.0';

// 캐시할 파일 목록
const ASSETS = [
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
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

/* ── fetch: 캐시 우선, 없으면 네트워크 ── */
self.addEventListener('fetch', event => {
  // POST 요청은 캐시 무시
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // 유효한 응답만 캐시
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // 오프라인 fallback — 메인 HTML 반환
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
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
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
