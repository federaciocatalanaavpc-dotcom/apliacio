import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';


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
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k.startsWith('api-cache')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

// Les dades de l'API són privades: mai es desen al dispositiu.
registerRoute(({url}) => url.pathname.startsWith('/api/'), new NetworkOnly());
self.addEventListener('message', event => {
  if(event.data?.type === 'CLEAR_PRIVATE_CACHE') event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k.startsWith('api-cache')).map(k=>caches.delete(k)))));
});

self.addEventListener('push', (event) => {
  let dades = { title: 'AVPC Federació', body: 'Tens un avís nou' };
  try {
    dades = event.data.json();
  } catch {
    // si el payload no és JSON, es fa servir el missatge per defecte
  }
  event.waitUntil(
    self.registration.showNotification('App Federació', {
      body: 'Tens un avís nou. Obre l’app per consultar-lo.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
