import { precacheAndRoute } from 'workbox-precaching';

// Aquesta línia és substituïda per vite-plugin-pwa (mode injectManifest) amb
// la llista de fitxers a precarxar. Sense strategies:'injectManifest', el
// plugin generava el seu propi sw.js i sobreescrivia aquest, perdent els
// listeners de push de sota (per això les notificacions no funcionaven mai).
precacheAndRoute(self.__WB_MANIFEST);

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
