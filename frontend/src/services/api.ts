import axios from 'axios';
import {VERSIO_PRIVACITAT} from '../components/InformacioPrivacitat';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Afegeix el token a totes les peticions si hi és
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UsuariActual {
  id: string;
  nom: string;
  usuari: string;
  rol: 'FEDERACIO' | 'AGRUPACIO' | 'VOLUNTARI' | 'ADMIN_AVPC';
  agrupacioId: string | null;
  agrupacioNom: string | null;
}

export interface RespostaAcces { token?:string; usuari?:UsuariActual; pas?:'password'; repte?:string; }
// Sessió recordada: només s'hi desa un token de llarga durada (14 dies, que el
// servidor només emet a voluntaris i associacions si ho han demanat). Cada cop
// que s'obre l'app es copia a sessionStorage, que és on la resta del codi el
// llegeix; Sortir, un 401 o un canvi de contrasenya l'esborren.
const CLAU_RECORDADA='avpc-sessio-recordada';
function caducitatToken(token:string):number {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).exp*1000; } catch { return 0; }
}
export function desarSessio(data:RespostaAcces, recordar=false) {
  if(!data.token || !data.usuari) throw new Error('Accés incomplet');
  sessionStorage.setItem('token',data.token); sessionStorage.setItem('usuari',JSON.stringify(data.usuari));
  localStorage.removeItem(CLAU_RECORDADA);
  if(recordar && caducitatToken(data.token)-Date.now()>12*3600_000) localStorage.setItem(CLAU_RECORDADA,JSON.stringify({token:data.token,usuari:data.usuari}));
}
export async function login(usuari:string,contrasenya:string,privacitatLlegida:boolean,recordar=false):Promise<RespostaAcces> {
  const {data}=await api.post('/auth/login',{usuari,contrasenya,privacitatLlegida,privacitatVersio:VERSIO_PRIVACITAT,recordar}); return data;
}
export function netejarSessio() {
 window.dispatchEvent(new Event('avpc-sortir'));
 sessionStorage.removeItem('token'); sessionStorage.removeItem('usuari'); sessionStorage.removeItem('avpc-avis-notis-vist');
 localStorage.removeItem('token'); localStorage.removeItem('usuari'); localStorage.removeItem(CLAU_RECORDADA);
 if('caches' in window) caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('api-cache')).map(k=>caches.delete(k)))).catch(()=>{});
 navigator.serviceWorker?.controller?.postMessage({type:'CLEAR_PRIVATE_CACHE'});
}
// Les sessions anteriors persistents no es reutilitzen.
localStorage.removeItem('token'); localStorage.removeItem('usuari');
// En obrir l'app, si hi ha una sessió recordada vàlida es restaura.
(()=>{
 if(sessionStorage.getItem('token')) return;
 try {
  const r=JSON.parse(localStorage.getItem(CLAU_RECORDADA)||'null');
  if(r?.token && r?.usuari && caducitatToken(r.token)>Date.now()) { sessionStorage.setItem('token',r.token); sessionStorage.setItem('usuari',JSON.stringify(r.usuari)); }
  else localStorage.removeItem(CLAU_RECORDADA);
 } catch { localStorage.removeItem(CLAU_RECORDADA); }
})();
export function logout() {
 const token=sessionStorage.getItem('token');
 const auth={headers:{Authorization:'Bearer '+token}};
 // Primer es treu la subscripció push d'aquest dispositiu del servidor (amb
 // el token encara vàlid) i després es revoca la sessió, perquè el següent
 // usuari d'aquest dispositiu no rebi els avisos de l'anterior.
 const revoke=(async()=>{
  try {
   const reg=await navigator.serviceWorker?.getRegistration();
   const sub=await reg?.pushManager.getSubscription();
   if(sub){ if(token) await api.post('/push/desubscriure',{endpoint:sub.endpoint},auth).catch(()=>{}); await sub.unsubscribe(); }
  } catch {}
  if(token) await api.post('/auth/sortir',{},auth).catch(()=>{});
 })();
 netejarSessio();
 return revoke;
}
api.interceptors.response.use(r=>r,err=>{
 if(err.response?.status===401 && !err.config?.url?.startsWith('/auth/')) { netejarSessio(); window.location.replace('/login'); }
 return Promise.reject(err);
});
export async function generarInvitacio(id:string):Promise<string> {
 const {data}=await api.post('/auth/invitacions/'+id); return data.invitacioUrl;
}

export function getUsuariActual(): UsuariActual | null {
  const raw = sessionStorage.getItem('usuari');
  try {return raw ? JSON.parse(raw) : null;} catch {return null;}
}

// Cada usuari pot canviar la seva pròpia contrasenya (cal saber l'actual).
// La federació mai veu les contrasenyes en clar; només les pot restablir
// des de Gestionar usuaris.
export async function canviarContrasenya(contrasenyaActual: string, contrasenyaNova: string) {
  const {data}=await api.patch('/auth/contrasenya', { contrasenyaActual, contrasenyaNova });
  sessionStorage.setItem('token',data.token);
  localStorage.removeItem(CLAU_RECORDADA);
}

// Els fitxers (desats a la base de dades) es serveixen darrere d'autenticació,
// així que no es poden obrir amb un <a href> normal (el navegador no hi
// afegiria el token). Es descarreguen com a blob amb el token i s'obren amb
// una URL d'objecte temporal.
//
// La finestra s'obre ABANS de fer la petició (de forma síncrona, dins el
// mateix gestor de clic) perquè els navegadors bloquegen com a popup
// qualsevol window.open() que arribi després d'un await: un cop resolta la
// petició ja no compta com a resultat directe del clic de l'usuari.
export async function obrirFitxerProtegit(urlRelatiu: string) {
  const finestra = window.open('', '_blank');
  try {
    const { data } = await api.get(urlRelatiu, { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    if (finestra) {
      finestra.location.href = url;
    } else {
      window.open(url, '_blank');
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    finestra?.close();
    throw err;
  }
}
