import { useEffect, useState } from 'react';
import { Servei, Assistencia, marcarAssistencia } from '../services/serveis';
import { Voluntari } from '../services/voluntaris';
import { dataLocal, duradaHores, mostrarData } from '../utils/horesServei';

export default function HorariAssistent({voluntari:v,servei,assistencia:a,onDesat}:{voluntari:Pick<Voluntari,"id"|"nom"|"cognoms">;servei:Servei;assistencia?:Assistencia;onDesat:()=>Promise<void>}) {
  const [obert,setObert]=useState(false),[entrada,setEntrada]=useState(''),[sortida,setSortida]=useState(''),[ocupat,setOcupat]=useState(false),[error,setError]=useState('');
  useEffect(()=>{setEntrada(dataLocal(a?.horaEntrada || null));setSortida(dataLocal(a?.horaSortida || null));},[a?.horaEntrada,a?.horaSortida]);
  async function desar(validar=false) {
    setError('');setOcupat(true);
    try {await marcarAssistencia(servei.id,v.id,validar?{validarHorariServei:true}:{horaEntrada:new Date(entrada).toISOString(),horaSortida:sortida?new Date(sortida).toISOString():null});await onDesat();setObert(false);}
    catch(e:any){setError(e.response?.data?.error || 'No s’han pogut desar els horaris');} finally {setOcupat(false);}
  }
  const senseFitxatge=!a?.horaEntrada && !a?.horaSortida && a?.horesRealitzades==null;
  return <div className="card" style={{padding:14}}>
    <strong>{v.nom} {v.cognoms}</strong>
    <p>{a?.confirmat?'Assistència confirmada':'Sense confirmació'} · {a?.horesRealitzades!=null ? `${a.horesRealitzades.toLocaleString('ca-ES')} h` : a?.horaEntrada?'En servei · falta la sortida':'Hores pendents'}</p>
    <p style={{fontSize:13}}>Entrada: {mostrarData(a?.horaEntrada || null)}<br/>Sortida: {mostrarData(a?.horaSortida || null)}</p>
    {senseFitxatge && <p style={{fontSize:13}}>Horari previst: {mostrarData(servei.dataInici)} — {mostrarData(servei.dataFi)} ({duradaHores(servei.dataInici,servei.dataFi)}). Valida’l només si la persona ha fet aquest horari.</p>}
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      {senseFitxatge && <button disabled={ocupat || new Date(servei.dataFi)>new Date()} onClick={()=>desar(true)}>Validar hores del servei</button>}
      <button disabled={ocupat} onClick={()=>setObert(!obert)}>{obert?'Tancar':'Corregir horaris'}</button>
    </div>
    {obert && <form onSubmit={e=>{e.preventDefault();desar();}} style={{marginTop:12}}>
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
        <label>Entrada<input aria-label={`Entrada de ${v.nom}`} type="datetime-local" required value={entrada} onChange={e=>setEntrada(e.target.value)} /></label>
        <label>Sortida<input aria-label={`Sortida de ${v.nom}`} type="datetime-local" value={sortida} onChange={e=>setSortida(e.target.value)} /></label>
      </div>
      <p>Hores calculades: {entrada && sortida?duradaHores(entrada,sortida):'pendent de sortida'}</p>
      <button disabled={ocupat} type="submit">Desar horaris</button>
    </form>}
    {error && <p role="alert" className="text-error">{error}</p>}
  </div>;
}
