import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {getUsuariActual} from '../services/api';
import {Agrupacio,llistarAgrupacions} from '../services/agrupacions';
import {Servei,obtenirServei} from '../services/serveis';
import {Conjunt,ConfigConjunt,PersonaServei,llistarConjunts,desarConjunt,equipServei,candidatsServei,incorporar,retirar} from '../services/serveisConjunts';
import UbicacioEnServei from './UbicacioEnServei';
import SelectorMapa from '../components/SelectorMapa';
import HorariAssistent from '../components/HorariAssistent';
import {dataLocal,mostrarData} from '../utils/horesServei';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const buit:ConfigConjunt={titol:'',dataInici:'',dataFi:'',collaboracioEmergencies:false,descripcio:'',adreca:'',latitud:null,longitud:null,participants:[],arxivat:false};
export default function ServeisConjunts(){
 const u=getUsuariActual(),fed=u?.rol==='FEDERACIO';
 const [llista,setLlista]=useState<Conjunt[]>([]),[ags,setAgs]=useState<Agrupacio[]>([]),[seleccio,setSeleccio]=useState(''),[detall,setDetall]=useState<Servei|null>(null),[equip,setEquip]=useState<PersonaServei[]>([]),[candidats,setCandidats]=useState<PersonaServei[]>([]),[candidat,setCandidat]=useState(''),[form,setForm]=useState<ConfigConjunt>(buit),[editant,setEditant]=useState<string|null>(null),[formulari,setFormulari]=useState(false),[arxivats,setArxivats]=useState(false),[tab,setTab]=useState<'equip'|'mapa'>('equip'),[error,setError]=useState(''),[ocupat,setOcupat]=useState(false);
 async function carregar(){setLlista(await llistarConjunts(arxivats));}
 useEffect(()=>{setSeleccio('');setDetall(null);carregar().catch(()=>setError('No s’han pogut carregar els serveis conjunts'));},[arxivats]);
 useEffect(()=>{if(fed)llistarAgrupacions().then(setAgs).catch(()=>setError('No s’han pogut carregar les associacions'));},[fed]);
 async function carregarDetall(id=seleccio){if(!id)return;const [s,e,c]=await Promise.all([obtenirServei(id),equipServei(id),candidatsServei(id)]);setDetall(s);setEquip(e);setCandidats(c);setCandidat('');}
 useEffect(()=>{let vigent=true;setDetall(null);setEquip([]);setCandidats([]);if(!seleccio)return;Promise.all([obtenirServei(seleccio),equipServei(seleccio),candidatsServei(seleccio)]).then(([s,e,c])=>{if(vigent){setDetall(s);setEquip(e);setCandidats(c);}}).catch(()=>{if(vigent)setError('No es pot consultar aquest servei');});return()=>{vigent=false;};},[seleccio]);
 async function accio(fn:()=>Promise<unknown>){setOcupat(true);setError('');try{await fn();}catch(e:any){setError(e.response?.data?.error||'No s’ha pogut completar l’operació');}finally{setOcupat(false);}}
 function editar(s?:Servei){setEditant(s?.id||null);setForm(s?{titol:s.titol,dataInici:dataLocal(s.dataInici),dataFi:dataLocal(s.dataFi),collaboracioEmergencies:s.collaboracioEmergencies,descripcio:s.descripcio||'',adreca:s.adreca||'',latitud:s.latitud,longitud:s.longitud,participants:(s.participants||[]).map(p=>({agrupacioId:p.agrupacioId,coordinadora:p.coordinadora})),arxivat:s.arxivat,versioCoordinacio:s.versioCoordinacio}:buit);setFormulari(true);}
 function informe(){if(!detall)return;const doc=new jsPDF();doc.setFontSize(18);doc.text('Informe de servei conjunt',14,20);doc.setFontSize(11);doc.text(doc.splitTextToSize(detall.titol,180),14,30);autoTable(doc,{startY:45,head:[['Dada','Informació']],body:[['Inici',mostrarData(detall.dataInici)],['Fi',mostrarData(detall.dataFi)],['AVPC participants',(detall.participants||[]).map(p=>p.agrupacio.nom+(p.coordinadora?' (coordinació)':'')).join(', ')],['Lloc',detall.adreca||'—']]});autoTable(doc,{startY:(doc as any).lastAutoTable.finalY+10,head:[['Voluntari','AVPC','Entrada','Sortida','Hores']],body:equip.map(v=>{const a=detall.assistencies?.find(x=>x.voluntariId===v.id);return [v.nom+' '+v.cognoms,v.agrupacio.nom,mostrarData(a?.horaEntrada||null),mostrarData(a?.horaSortida||null),a?.horesRealitzades?.toString()||'—'];})});doc.save('informe-servei-conjunt.pdf');}
 return <main className="page workspace-page"><Link to={u?.rol==='ADMIN_AVPC'?'/gestio-avpc':'/federacio'}>← Tornar</Link><section className="workspace-inner-hero workspace-inner-hero--federacio"><span className="workspace-inner-hero__icon">🤝</span><div><span className="dashboard-eyebrow">Coordinació entre associacions</span><h1>Serveis conjunts</h1><p>Un servei, diverses AVPC i un equip coordinat.</p></div></section>
 {error&&<p role="alert" className="text-error">{error}</p>}
 {formulari&&fed?<form className="card" onSubmit={e=>{e.preventDefault();accio(async()=>{const s=await desarConjunt({...form,dataInici:new Date(form.dataInici).toISOString(),dataFi:new Date(form.dataFi).toISOString()},editant||undefined);setFormulari(false);await carregar();setSeleccio(s.id);await carregarDetall(s.id);});}}>
 <h2>{editant?'Organització del servei':'Nou servei conjunt'}</h2>
 <label>Títol<input required maxLength={200} value={form.titol} onChange={e=>setForm({...form,titol:e.target.value})}/></label>
 <div style={{display:'flex',gap:16,flexWrap:'wrap'}}><label>Inici<input required type="datetime-local" value={form.dataInici} onChange={e=>setForm({...form,dataInici:e.target.value})}/></label><label>Final previst<input required type="datetime-local" value={form.dataFi} onChange={e=>setForm({...form,dataFi:e.target.value})}/></label></div>
 <label><input type="checkbox" checked={form.collaboracioEmergencies} onChange={e=>setForm({...form,collaboracioEmergencies:e.target.checked})}/> Servei d’emergència</label>
 <label>Instruccions i necessitats<textarea maxLength={10000} value={form.descripcio} onChange={e=>setForm({...form,descripcio:e.target.value})}/></label>
 <label>Adreça o lloc de trobada<input maxLength={500} value={form.adreca} onChange={e=>setForm({...form,adreca:e.target.value})}/></label>
 <SelectorMapa latitud={form.latitud} longitud={form.longitud} onCanviar={(lat,lng)=>setForm(f=>({...f,latitud:lat,longitud:lng}))} descripcio="Marca el lloc de trobada del servei."/>
 <fieldset><legend>AVPC participants i coordinació</legend><p>Selecciona almenys dues associacions. La coordinadora pot gestionar els assistents d’aquest servei; no les seves fitxes privades.</p>
 {ags.filter(a=>a.actiu).map(a=>{const p=form.participants.find(x=>x.agrupacioId===a.id);return <div key={a.id} style={{padding:'8px 0',display:'flex',gap:12,flexWrap:'wrap',borderBottom:'1px solid var(--c-border)'}}><label><input type="checkbox" checked={!!p} onChange={e=>setForm({...form,participants:e.target.checked?[...form.participants,{agrupacioId:a.id,coordinadora:false}]:form.participants.filter(x=>x.agrupacioId!==a.id)})}/> {a.nom}</label>{p&&<label><input type="checkbox" checked={p.coordinadora} onChange={e=>setForm({...form,participants:form.participants.map(x=>x.agrupacioId===a.id?{...x,coordinadora:e.target.checked}:x)})}/> Delegar coordinació</label>}</div>;})}</fieldset>
 {editant&&<label><input type="checkbox" checked={form.arxivat} onChange={e=>setForm({...form,arxivat:e.target.checked})}/> Servei tancat</label>}
 <div style={{display:'flex',gap:12,marginTop:16}}><button disabled={ocupat} type="submit">Desar servei conjunt</button><button type="button" onClick={()=>setFormulari(false)}>Cancel·lar</button></div></form>:<>
 <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>{fed&&<button onClick={()=>editar()}>+ Nou servei conjunt</button>}<button onClick={()=>setArxivats(!arxivats)}>{arxivats?'Veure oberts':'Veure tancats'}</button><button disabled={ocupat} onClick={()=>accio(async()=>{await carregar();await carregarDetall();})}>Actualitzar</button></div>
 <div className="module-grid">{llista.map(s=><button key={s.id} className="module-card module-card--federacio" onClick={()=>{setSeleccio(s.id);setTab('equip');setError('');}}><span className="module-card__icon">{s.collaboracioEmergencies?'🚨':'🤝'}</span><span className="module-card__copy"><strong>{s.titol}</strong><small>{mostrarData(s.dataInici)} · {s.participants?.length} AVPC</small><small>{s.potCoordinar?'Coordinació del servei':'Participació de la teva AVPC'}</small></span><span>→</span></button>)}</div>
 {!llista.length&&<p>No hi ha serveis conjunts {arxivats?'tancats':'oberts'} per consultar.</p>}
 {detall&&<section className="card" style={{marginTop:20}}><h2>{detall.titol}</h2><p>{mostrarData(detall.dataInici)} — {mostrarData(detall.dataFi)}</p><p style={{whiteSpace:'pre-wrap'}}>{detall.descripcio}</p><p>{detall.adreca}</p><p>{detall.participants?.map(p=>p.agrupacio.nom+(p.coordinadora?' · Coordinadora':'')).join(' / ')}</p>
 {fed&&<button onClick={()=>editar(detall)}>Editar servei i delegació</button>}
 <div className="tabs" style={{margin:'16px 0'}}><button className={'tab '+(tab==='equip'?'tab--active':'')} onClick={()=>setTab('equip')}>Assistents i hores</button><button className={'tab '+(tab==='mapa'?'tab--active':'')} onClick={()=>setTab('mapa')}>Mapa i punts</button></div>
 {tab==='mapa'?<UbicacioEnServei key={seleccio} serveiId={seleccio}/>:<>
 <p>Només es mostren els assistents que pots gestionar. Cada AVPC incorpora el seu voluntariat; la coordinació veu tot l’equip del servei.</p>
 {!detall.arxivat&&<form onSubmit={e=>{e.preventDefault();accio(async()=>{await incorporar(seleccio,candidat);await carregarDetall();});}}><label>Incorporar voluntari<select required value={candidat} onChange={e=>setCandidat(e.target.value)}><option value="">Selecciona…</option>{candidats.map(v=><option key={v.id} value={v.id}>{v.nom} {v.cognoms} · {v.agrupacio.nom}</option>)}</select></label><button disabled={ocupat||!candidat}>Incorporar al servei</button></form>}
 <p>{equip.length} assistents visibles · {detall.assistencies?.filter(a=>a.horaEntrada&&!a.horaSortida).length||0} fitxats · {Math.round((detall.assistencies?.reduce((sum,a)=>sum+(a.horesRealitzades||0),0)||0)*100)/100} hores registrades</p>
 {equip.map(v=>{const a=detall.assistencies?.find(x=>x.voluntariId===v.id);return <div key={v.id} style={{marginTop:16}}><p><strong>{v.agrupacio.nom}</strong>{v.indicatiu?' · '+v.indicatiu:''}</p><HorariAssistent voluntari={v} servei={detall} assistencia={a} onDesat={carregarDetall}/>{!detall.arxivat&&!a?.horaEntrada&&a?.horesRealitzades==null&&<button className="btn-danger" disabled={ocupat} onClick={()=>{if(window.confirm('Retirar aquest voluntari del servei?'))accio(async()=>{await retirar(seleccio,v.id);await carregarDetall();});}}>Retirar del servei</button>}</div>;})}
 <button style={{marginTop:16}} onClick={informe}>Descarregar informe PDF</button></>}
 </section>}</>}
 </main>;
}
