import { api } from './api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function estatNotificacions(): Promise<NotificationPermission | 'no-suportat'> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'no-suportat';
  return Notification.permission;
}

// A iPhone/iPad, Safari només permet subscriure's a notificacions push quan
// l'app s'ha afegit a la pantalla d'inici (mode standalone); des del
// navegador normal la subscripció sempre falla encara que es doni permís.
export function esIosSenseInstallar(): boolean {
  const esIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const esStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  return esIos && !esStandalone;
}

// Activa les notificacions: demana permís, registra el service worker,
// crea la subscripció push i l'envia al backend perquè guardi les claus.
// Si qualsevol pas falla (motiu habitual al mòbil: iOS sense instal·lar,
// o un navegador que no accepta subscripcions push) es retorna false en
// lloc de deixar l'excepció sense capturar, perquè la pantalla ho pugui dir.
export async function activarNotificacions(): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  try {
    const permis = await Notification.requestPermission();
    if (permis !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;
    const { data } = await api.get('/push/clau-publica');
    if (!data.clauPublica) return false;

    const subscripcioExistent = await registration.pushManager.getSubscription();
    const subscripcio =
      subscripcioExistent ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.clauPublica),
      }));

    const json = subscripcio.toJSON();
    await api.post('/push/subscriure', {
      endpoint: json.endpoint,
      keys: json.keys,
    });

    return true;
  } catch {
    return false;
  }
}

export async function enviarNotificacioProva() {
  await api.post('/push/prova');
}
