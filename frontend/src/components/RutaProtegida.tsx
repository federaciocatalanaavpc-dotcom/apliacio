import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, getUsuariActual } from '../services/api';
import Capcalera from './Capcalera';

export default function RutaProtegida({ children }: { children: React.ReactNode }) {
 const {pathname}=useLocation();
 const [online,setOnline]=useState(navigator.onLine),[checked,setChecked]=useState(''),[error,setError]=useState(false);
 const token=sessionStorage.getItem('token');
 useEffect(()=>{
  const on=()=>setOnline(true),off=()=>{setOnline(false);setChecked('');};
  window.addEventListener('online',on);window.addEventListener('offline',off);
  return ()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off);};
 },[]);
 useEffect(()=>{
  let cancelled=false;setChecked('');setError(false);
  if(token&&online)api.get('/auth/me').then(({data})=>{
   if(!cancelled){sessionStorage.setItem('usuari',JSON.stringify(data));setChecked(pathname);}
  }).catch(e=>{if(!cancelled){if(e.response?.status===401){sessionStorage.clear();window.location.replace('/login');}else setError(true);}});
  return ()=>{cancelled=true;};
 },[pathname,token,online]);
 if(!token)return <Navigate to="/login" replace/>;
 if(!online)return <main className="page"><p>Cal connexió per consultar dades personals. Torna a connectar-te per continuar.</p></main>;
 if(error)return <main className="page"><p>No s’ha pogut verificar la sessió.</p><button onClick={()=>window.location.reload()}>Tornar-ho a provar</button></main>;
 if(checked!==pathname)return <main className="page">Verificant l’accés…</main>;
 const u=getUsuariActual();
 if(u?.rol==='ADMIN_AVPC'&&!['/','/gestio-avpc','/inventari','/avisos','/canviar-contrasenya','/voluntari/roba','/voluntari/disponibilitat','/voluntari/estadistiques','/voluntari/alertes'].includes(pathname))return <Navigate to="/gestio-avpc" replace/>;
 if(u?.rol==='VOLUNTARI'&&pathname!=='/'&&pathname!=='/canviar-contrasenya'&&!pathname.startsWith('/voluntari/'))return <Navigate to="/" replace/>;
 return <><Capcalera/>{children}</>;
}
