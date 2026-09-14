import {useEffect,useRef,useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {Servei,llistarServeis} from '../services/serveis';
import {PersonaServei,equipServei} from '../services/serveisConjunts';
import {obtenirUbicacions,assignarPunt,UbicacionsServei,ESTATS} from '../services/ubicacions';
import SelectorMapa from '../components/SelectorMapa';
import {TILE_URL,TILE_SUBDOMAINS,TILE_ATTRIBUTION,TILE_MAX_ZOOM} from '../utils/mapTiles';
const buit={voluntariId:'',puntNom:'',puntLatitud:null as number|null,puntLongitud:null as number|null,puntRadi:100};
const colors:Record<string,string>={DINS:'#15803d',FORA:'#b91c1c',INCERTA:'#b45309',PRECISIO_BAIXA:'#b45309',ANTIGA:'#64748b',SENSE_PUNT:'#1d4ed8'};
export default function UbicacioEnServei({serveiId}:{serveiId?:string}){
  const [serveis,setServeis]=useState<Servei[]>([]),[id,setId]=useState(serveiId||''),[dades,setDades]=useState<UbicacionsServei|null>(null),[voluntaris,setVoluntaris]=useState<PersonaServei[]>([]),[form,setForm]=useState(buit),[editar,setEditar]=useState(false),[error,setError]=useState(''),[desant,setDesant]=useState(false);
  const ref=useRef<HTMLDivElement>(null),mapa=useRef<L.Map|null>(null),capa=useRef<L.LayerGroup|null>(null),centrat=useRef('');
  useEffect(()=>{if(serveiId){setId(serveiId);return;}llistarServeis().then(setServeis).catch(()=>setError('No s’han pogut carregar els serveis'));},[serveiId]);
  useEffect(()=>{if(!ref.current)return;const m=L.map(ref.current).setView([41.6,1.5],8);L.tileLayer(TILE_URL,{attribution:TILE_ATTRIBUTION,subdomains:TILE_SUBDOMAINS,maxZoom:TILE_MAX_ZOOM}).addTo(m);mapa.current=m;capa.current=L.layerGroup().addTo(m);return()=>{m.remove();mapa.current=null;};},[]);
  useEffect(()=>{
    let cancelat=false;setDades(null);setVoluntaris([]);setEditar(false);setForm(buit);setError('');centrat.current='';
    if(!id)return;
    equipServei(id).then(v=>{if(!cancelat)setVoluntaris(v.filter(x=>x.actiu));}).catch(()=>{if(!cancelat)setError('No s’ha pogut carregar el voluntariat');});
    async function carregar(){try{const d=await obtenirUbicacions(id);if(!cancelat){setDades(d);setError('');}}catch{if(!cancelat){setDades(null);setError('No s’ha pogut actualitzar el mapa. No es mostren posicions antigues com si fossin actuals.');}}}
    carregar();const timer=setInterval(carregar,15_000);return()=>{cancelat=true;clearInterval(timer);};
  },[id,serveis]);
  useEffect(()=>{
    const layer=capa.current,m=mapa.current;if(!layer||!m)return;layer.clearLayers();if(!dades)return;const punts:L.LatLngExpression[]=[];
    for(const v of dades.voluntaris){
      if(v.puntLatitud!=null && v.puntLongitud!=null){const p:[number,number]=[v.puntLatitud,v.puntLongitud];punts.push(p);const text=document.createElement('span');text.textContent=`Punt de ${v.nom}: ${v.puntNom}`;L.circle(p,{radius:v.puntRadi,color:'#475569',dashArray:'5 5',fillOpacity:0.03}).bindTooltip(text).addTo(layer);}
      if(v.posicio){const p:[number,number]=[v.posicio.latitud,v.posicio.longitud];punts.push(p);const text=document.createElement('span');text.textContent=v.nom;const detail=document.createElement('div');detail.textContent=`${v.nom} · ${ESTATS[v.estat]} · Precisió ±${Math.round(v.posicio.precisio)} m · ${new Date(v.posicio.capturadaEl).toLocaleTimeString('ca-ES')}`;L.circle(p,{radius:Math.max(v.posicio.precisio,2),color:colors[v.estat]||'#64748b',fillOpacity:0.08,weight:1}).addTo(layer);L.circleMarker(p,{radius:9,color:colors[v.estat]||'#64748b',fillOpacity:0.9}).bindTooltip(text,{permanent:true,direction:'top'}).bindPopup(detail).addTo(layer);}
    }
    if(punts.length && centrat.current!==id){m.fitBounds(L.latLngBounds(punts).pad(0.2),{maxZoom:17});centrat.current=id;}
  },[dades,id]);
  async function desar(buidar=false){if(!id||!form.voluntariId)return;setDesant(true);setError('');try{await assignarPunt(id,form.voluntariId,{...form,puntLatitud:buidar?null:form.puntLatitud,puntLongitud:buidar?null:form.puntLongitud});setDades(await obtenirUbicacions(id));setEditar(false);}catch(e:any){setError(e.response?.data?.error||'No s’ha pogut desar el punt');}finally{setDesant(false);}}
  return <div>
    <p>GPS compartit voluntàriament mentre el voluntari està fitxat. Es refresca cada 15 segons. Una posició aproximada no acredita per si sola la presència.</p>
    {!serveiId && <label>Servei<select aria-label="Servei del mapa" value={id} onChange={e=>setId(e.target.value)} style={{width:'100%'}}><option value="">Selecciona un servei…</option>{serveis.map(s=><option key={s.id} value={s.id}>{s.titol} · {new Date(s.dataInici).toLocaleDateString('ca-ES')}</option>)}</select></label>}
    {error&&<p role="alert" className="text-error">{error}</p>}
    <div ref={ref} style={{height:380,margin:'16px 0',borderRadius:12}} aria-label="Mapa de posicions del servei" />
    {id && <button onClick={()=>{setForm(buit);setEditar(!editar);}}>Assignar punt a un voluntari</button>}
    {editar && <form className="card" style={{marginTop:12}} onSubmit={e=>{e.preventDefault();desar();}}>
      <label>Voluntari<select required aria-label="Voluntari del punt" value={form.voluntariId} onChange={e=>setForm({...buit,voluntariId:e.target.value})}><option value="">Selecciona…</option>{voluntaris.map(v=><option key={v.id} value={v.id}>{v.nom} {v.cognoms} · {v.agrupacio.nom}</option>)}</select></label>
      <label>Nom del punt<input required maxLength={100} value={form.puntNom} onChange={e=>setForm({...form,puntNom:e.target.value})} placeholder="Ex.: Cruïlla nord" /></label>
      <SelectorMapa key={form.voluntariId} latitud={form.puntLatitud} longitud={form.puntLongitud} onCanviar={(lat,lng)=>setForm(f=>({...f,puntLatitud:lat,puntLongitud:lng}))} descripcio="Toca el mapa per assignar el punt del servei." />
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><label>Latitud<input type="number" step="any" min={-90} max={90} required value={form.puntLatitud??''} onChange={e=>setForm({...form,puntLatitud:e.target.value===''?null:Number(e.target.value)})}/></label><label>Longitud<input type="number" step="any" min={-180} max={180} required value={form.puntLongitud??''} onChange={e=>setForm({...form,puntLongitud:e.target.value===''?null:Number(e.target.value)})}/></label></div>
      <label>Marge en metres<input type="number" required min={20} max={2000} value={form.puntRadi} onChange={e=>setForm({...form,puntRadi:Number(e.target.value)})}/></label>
      <button disabled={desant} type="submit">Desar punt</button> <button disabled={desant||!form.voluntariId} type="button" onClick={()=>desar(true)}>Retirar punt</button>
    </form>}
    {dades && dades.voluntaris.length===0 && <p>Encara no hi ha assistents en aquest servei. Pots assignar un punt al voluntariat.</p>}
    {dades?.voluntaris.map(v=><div key={v.voluntariId} className="card" style={{marginTop:12}}><strong>{v.nom}</strong><small style={{display:"block"}}>{v.agrupacioNom}</small><p>{v.enServei?'Fitxat en servei':'No està fitxat en servei'} · {ESTATS[v.estat]}</p><p>Punt: {v.puntNom||'Sense assignar'}{v.distancia!=null?` · Distància aproximada: ${v.distancia} m`:''}</p>{v.posicio&&<p>Actualitzat: {new Date(v.posicio.capturadaEl).toLocaleTimeString('ca-ES')} · Precisió ±{Math.round(v.posicio.precisio)} m</p>}<button onClick={()=>{setForm({voluntariId:v.voluntariId,puntNom:v.puntNom||'',puntLatitud:v.puntLatitud,puntLongitud:v.puntLongitud,puntRadi:v.puntRadi});setEditar(true);}}>Editar punt</button></div>)}
    <p className="text-muted">Verd: a prop del punt. Vermell: fora del marge. Taronja: precisió insuficient o límit incert. Gris: posició antiga o absent. No es guarda cap recorregut GPS.</p>
  </div>;
}
