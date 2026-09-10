import axios from 'axios';

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

export interface RespostaAcces { token?:string; usuari?:UsuariActual; pas?:'password'|'enrol'|'mfa'; repte?:string; recovery?:string[]; }
export function desarSessio(data:RespostaAcces) {
  if(!data.token || !data.usuari) throw new Error('Accés incomplet');
  sessionStorage.setItem('token',data.token); sessionStorage.setItem('usuari',JSON.stringify(data.usuari));
}
export async function login(usuari:string,contrasenya:string):Promise<RespostaAcces> {
  const {data}=await api.post('/auth/login',{usuari,contrasenya}); return data;
}
function netejarSessio() {
 sessionStorage.removeItem('token'); sessionStorage.removeItem('usuari');
 localStorage.removeItem('token'); localStorage.removeItem('usuari');
 if('caches' in window) caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('api-cache')).map(k=>caches.delete(k)))).catch(()=>{});
 navigator.serviceWorker?.controller?.postMessage({type:'CLEAR_PRIVATE_CACHE'});
}
// Les sessions anteriors persistents no es reutilitzen.
localStorage.removeItem('token'); localStorage.removeItem('usuari');
export function logout() {
 const token=sessionStorage.getItem('token');
 const revoke=token ? api.post('/auth/sortir',{}, {headers:{Authorization:'Bearer '+token}}).catch(()=>{}) : Promise.resolve();
 netejarSessio();
 navigator.serviceWorker?.getRegistration().then(r=>r?.pushManager.getSubscription()).then(s=>s?.unsubscribe()).catch(()=>{});
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
