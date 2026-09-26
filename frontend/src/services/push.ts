import { api } from './api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function estatNotificacions(): Promise<NotificationPermission | 'no-suportat'> {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'no-suportat';
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

// El service worker pot no arribar a estar llest (p.ex. en desenvolupament);
// sense aquest límit la promesa "ready" es quedaria penjada per sempre.
async function registreServiceWorker(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, rebutja) => setTimeout(() => rebutja(new Error('sw-timeout')), 10_000)),
  ]);
}

function mateixaClau(a: ArrayBuffer | null, b: Uint8Array): boolean {
  if (!a) return false;
  const x = new Uint8Array(a);
  return x.length === b.length && x.every((v, i) => v === b[i]);
}

// Crea (o reutilitza) la subscripció push del dispositiu i la registra al
// backend associada a l'usuari que ha iniciat sessió. Es fa a cada inici de
// sessió: així un dispositiu compartit, una subscripció caducada o una clau
// VAPID canviada mai deixen l'usuari sense rebre avisos sense que se n'adoni.
async function subscriureIRegistrar(): Promise<boolean> {
  const registration = await registreServiceWorker();
  const { data } = await api.get('/push/clau-publica');
  if (!data.clauPublica) return false;
  const clau = urlBase64ToUint8Array(data.clauPublica);

  let subscripcio = await registration.pushManager.getSubscription();
  if (subscripcio && !mateixaClau(subscripcio.options.applicationServerKey, clau)) {
    await subscripcio.unsubscribe();
    subscripcio = null;
  }
  if (!subscripcio) {
    subscripcio = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: clau });
  }

  const json = subscripcio.toJSON();
  await api.post('/push/subscriure', { endpoint: json.endpoint, keys: json.keys });
  return true;
}

// Activa les notificacions: demana permís i registra la subscripció.
// Retorna false (en lloc de llançar) si qualsevol pas falla, perquè la
// pantalla ho pugui explicar.
export async function activarNotificacions(): Promise<boolean> {
  if ((await estatNotificacions()) === 'no-suportat') return false;
  try {
    const permis = await Notification.requestPermission();
    if (permis !== 'granted') return false;
    return await subscriureIRegistrar();
  } catch {
    return false;
  }
}

// Si el permís ja hi és, refà silenciosament la subscripció (sense cap
// diàleg). Retorna false si no s'ha pogut deixar registrada.
export async function sincronitzarNotificacions(): Promise<boolean> {
  if ((await estatNotificacions()) !== 'granted') return false;
  try {
    return await subscriureIRegistrar();
  } catch {
    return false;
  }
}

export interface ResultatProva {
  dispositius: number;
  enviades: number;
  fallides: number;
  eliminades: number;
  ultimError: number | null;
}

export async function enviarNotificacioProva(): Promise<ResultatProva> {
  const { data } = await api.post('/push/prova');
  return data;
}

// Text entenedor per a l'usuari sobre què ha passat amb la notificació de prova.
export function descriureProva(r: ResultatProva): { ok: boolean; text: string } {
  if (r.dispositius === 0) {
    return { ok: false, text: "Aquest compte no té cap dispositiu registrat. Recarrega l'app i accepta l'avís de notificacions." };
  }
  if (r.enviades > 0) {
    return {
      ok: true,
      text: `Enviada a ${r.enviades} dispositiu(s). Si no et surt res, revisa el mode "No molestar" i l'estalvi de bateria, i que el navegador pugui executar-se en segon pla.`,
    };
  }
  if (r.fallides > 0) {
    return { ok: false, text: `El servei de notificacions del navegador ha rebutjat l'enviament (codi ${r.ultimError}). Torna a activar-les.` };
  }
  return { ok: false, text: "El dispositiu registrat ja no era vàlid i s'ha eliminat. Recarrega l'app per registrar-lo de nou." };
}
