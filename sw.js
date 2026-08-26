/* 햄스킨라빈스 — 서비스워커
   게임 화면(HTML)은 네트워크 우선: 온라인이면 항상 최신, 오프라인이면 캐시에서 꺼낸다.
   아이콘·매니페스트 같은 정적 파일은 캐시 우선.
   게임을 고쳐 올릴 때 CACHE 뒤의 숫자를 올리면 헌 캐시가 정리된다. */
const CACHE = "hamskin-v40";
const ASSETS = [
  "./",
  "index.html",
  "news.html",
  "news-20260825.html",
  "news-20260824.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "icon-512-maskable.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      /* 하나가 404 여도 설치가 실패하지 않게 개별로 담는다 */
      .then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;           /* 바깥 주소는 건드리지 않는다 */

  const isHTML = req.mode === "navigate" || url.pathname.endsWith(".html");

  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match("index.html")))
    );
  } else {
    e.respondWith(
      caches.match(req).then(cached =>
        cached || fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
      )
    );
  }
});
