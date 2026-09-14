import {createContext,useContext,useEffect,useRef,useState,ReactNode} from 'react';
import {api,getUsuariActual} from '../services/api';
type Sessio={serveiId:string;nom:string;id:string;token:string};
type Context={serveiId:string|null;ocupat:boolean;iniciar:(id:string,nom:string)=>Promise<void>;aturar:()=>void};
const C=createContext<Context>({serveiId:null,ocupat:false,iniciar:async()=>{},aturar:()=>{}});
export const useUbicacio=()=>useContext(C);
function gps():Promise<GeolocationPosition>{return new Promise((resolve,reject)=>{
  if(!navigator.geolocation)return reject(new Error('Aquest dispositiu no disposa de GPS compatible'));
  navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,maximumAge:0,timeout:15000});
});}
export function CompartirUbicacioProvider({children}:{children:ReactNode}) {
  const [sessio,setSessio]=useState<Sessio|null>(null),[ocupat,setOcupat]=useState(false),[error,setError]=useState(''),[ultima,setUltima]=useState('');
  const actual=useRef<Sessio|null>(null),versio=useRef(0);
  async function retirar(s:Sessio){await api.delete(`/serveis/${s.serveiId}/ubicacio`,{data:{comparticioId:s.id},headers:{Authorization:'Bearer '+s.token}});}
  async function aturar(){versio.current++;const s=actual.current;actual.current=null;setSessio(null);setOcupat(false);setUltima('');
    if(s)try{await retirar(s);setError('');}catch{setError('GPS aturat al mòbil. Si no hi ha connexió, l’última posició desapareixerà en un màxim de 5 minuts.');}}
  async function enviar(s:Sessio,p:GeolocationPosition){
    if(actual.current?.id!==s.id)return;
    await api.patch(`/serveis/${s.serveiId}/ubicacio`,{comparticioId:s.id,latitud:p.coords.latitude,longitud:p.coords.longitude,precisio:p.coords.accuracy,capturadaEl:new Date(p.timestamp).toISOString()});
    if(actual.current?.id===s.id){setUltima(new Date().toLocaleTimeString('ca-ES'));setError('');}
  }
  async function iniciar(serveiId:string,nom:string){
    if(ocupat || getUsuariActual()?.rol!=='VOLUNTARI')return;
    await aturar();const v=++versio.current;setOcupat(true);setError('');
    try{
      const p=await gps();if(v!==versio.current)return;
      const token=sessionStorage.getItem('token');if(!token)throw new Error('Torna a iniciar sessió');
      const {data}=await api.post(`/serveis/${serveiId}/ubicacio/iniciar`,{acceptoCompartir:true});
      const s={serveiId,nom,id:data.comparticioId,token};
      if(v!==versio.current){await retirar(s);return;}
      actual.current=s;setSessio(s);await enviar(s,p);
    }catch(e:any){if(v===versio.current){const s=actual.current;actual.current=null;setSessio(null);if(s)await retirar(s).catch(()=>{});setError(e.response?.data?.error || (e.code===1?'No has permès la ubicació. Pots participar i fitxar sense GPS.':'No s’ha pogut obtenir el GPS. Revisa els permisos, la connexió i torna-ho a provar.'));}}
    finally{if(v===versio.current)setOcupat(false);}
  }
  useEffect(()=>{
    if(!sessio)return;let pendent=false;
    async function refrescar(){
      if(document.visibilityState!=='visible' || pendent || actual.current?.id!==sessio!.id)return;
      if(!sessionStorage.getItem('token')){aturar();return;}
      pendent=true;
      try{const p=await gps();await enviar(sessio!,p);}catch(e:any){
        if(actual.current?.id!==sessio!.id)return;
        if([401,403,409,410].includes(e.response?.status)||e.code===1){await aturar();setError('La compartició s’ha aturat. Si continues al servei, torna-la a activar quan correspongui.');}
        else setError('No s’ha actualitzat el GPS. L’administrador veurà l’antiguitat de l’última posició.');
      }finally{pendent=false;}
    }
    const timer=window.setInterval(refrescar,30_000);document.addEventListener('visibilitychange',refrescar);
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refrescar);};
  },[sessio]);
  useEffect(()=>{
    const sortir=()=>{void aturar();};
    const fitxat=(e:Event)=>{if((e as CustomEvent).detail===actual.current?.serveiId)void aturar();};
    const tancar=()=>{versio.current++;const s=actual.current;actual.current=null;setSessio(null);if(s)void fetch(`${api.defaults.baseURL}/serveis/${s.serveiId}/ubicacio`,{method:'DELETE',headers:{'Content-Type':'application/json',Authorization:'Bearer '+s.token},body:JSON.stringify({comparticioId:s.id}),keepalive:true}).catch(()=>{});};
    window.addEventListener('avpc-sortir',sortir);window.addEventListener('avpc-fitxatge-tancat',fitxat);window.addEventListener('pagehide',tancar);
    return()=>{window.removeEventListener('avpc-sortir',sortir);window.removeEventListener('avpc-fitxatge-tancat',fitxat);window.removeEventListener('pagehide',tancar);tancar();};
  },[]);
  return <C.Provider value={{serveiId:sessio?.serveiId||null,ocupat,iniciar,aturar}}>
    {(sessio || ocupat) && <aside className="card" style={{margin:12,border:'2px solid #198276'}} role="status"><strong>{sessio?`Compartint GPS · ${sessio.nom}`:'Activant ubicació…'}</strong><p>{ultima?'Última actualització: '+ultima+'. ':''}Mantén l’app oberta. Amb la pantalla bloquejada les actualitzacions es poden aturar.</p><button onClick={()=>aturar()}>Aturar ubicació</button></aside>}
    {error && <p className="page text-error" role="alert">{error}</p>}{children}
  </C.Provider>;
}
