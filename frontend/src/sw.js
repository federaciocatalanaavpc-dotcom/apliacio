import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Aquesta línia és substituïda per vite-plugin-pwa (mode injectManifest) amb
// la llista de fitxers a precarxar. Sense strategies:'injectManifest', el
// plugin generava el seu propi sw.js i sobreescrivia aquest, perdent els
// listeners de push de sota (per això les notificacions no funcionaven mai).
precacheAndRoute(self.__WB_MANIFEST);

// Sense això, un service worker nou només comença a interceptar peticions a
// partir de la següent navegació completa; amb clients.claim() ho fa de
// seguida amb les pestanyes que ja estaven obertes quan es va activar.
self.skipWaiting();
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Guarda la darrera resposta bona de cada consulta a l'API (llistats
// d'associacions, vehicles, material, documents...) perquè si es queda sense
// connexió es puguin seguir consultant les últimes dades conegudes, en lloc
// de quedar-se la pantalla carregant per sempre. Sempre intenta la xarxa
// primer (dades fresques quan n'hi ha); només cau al cau si no hi ha resposta
// en 5 segons. Es descarta la baixada del contingut real dels fitxers
// (poden pesar molt i l'espai del navegador és limitat).
registerRoute(
  ({ request, url }) => request.method === 'GET' && url.pathname.startsWith('/api/') && !url.pathname.includes('/fitxer'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 7 * 24 * 60 * 60 })],
  })
);

self.addEventListener('push', (event) => {
  let dades = { title: 'AVPC Federació', body: 'Tens un avís nou' };
  try {
    dades = event.data.json();
  } catch {
    // si el payload no és JSON, es fa servir el missatge per defecte
  }
  event.waitUntil(
    self.registration.showNotification(dades.title, {
      body: dades.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
