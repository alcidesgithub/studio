
// Service Worker Básico
// Este é um service worker muito simples, apenas para fins de demonstração de PWA.
// Para caching offline ou outras funcionalidades, este arquivo precisaria ser expandido.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalado');
  // event.waitUntil(
  //   caches.open('v1').then((cache) => {
  //     return cache.addAll([
  //       // '/',
  //       // '/index.html', // ou outras URLs para cachear inicialmente
  //     ]);
  //   })
  // );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativado');
});

self.addEventListener('fetch', (event) => {
  // console.log('Service Worker: Buscando', event.request.url);
  // event.respondWith(
  //   caches.match(event.request).then((response) => {
  //     return response || fetch(event.request);
  //   })
  // );
});
