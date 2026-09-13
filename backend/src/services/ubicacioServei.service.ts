import { randomUUID } from 'crypto';

export const CADUCITAT_UBICACIO = 5 * 60_000;
export type Posicio = {latitud:number;longitud:number;precisio:number;capturadaEl:string;actualitzadaEl:string};
type Comparticio = {id:string;usuariId:string;sessionVersion:number;assistenciaId:string;caduca:number;posicio:Posicio|null};
// Només l'última posició, en memòria efímera: no s'escriu a PostgreSQL ni als backups.
// Un reinici la descarta i el voluntari ha de tornar a activar la compartició.
const sessions = new Map<string,Comparticio>();
export function purgarUbicacions(ara=Date.now()) {for(const [id,s] of sessions) if(s.caduca<=ara)sessions.delete(id);}
const neteja=setInterval(()=>purgarUbicacions(),30_000);neteja.unref();
export function aturarUbicacio(assistenciaId:string,id?:string) {const s=sessions.get(assistenciaId);if(s && (!id || s.id===id))sessions.delete(assistenciaId);}
export function aturarUbicacionsUsuari(usuariId:string) {for(const [id,s] of sessions)if(s.usuariId===usuariId)sessions.delete(id);}
export function iniciarUbicacio(assistenciaId:string,usuariId:string,sessionVersion:number) {
  purgarUbicacions();aturarUbicacionsUsuari(usuariId);
  const s:Comparticio={id:randomUUID(),usuariId,sessionVersion,assistenciaId,caduca:Date.now()+CADUCITAT_UBICACIO,posicio:null};sessions.set(assistenciaId,s);return s.id;
}
export function obtenirComparticio(assistenciaId:string) {purgarUbicacions();return sessions.get(assistenciaId);}
export function actualitzarUbicacio(assistenciaId:string,id:string,posicio:Posicio) {
  const s=obtenirComparticio(assistenciaId);if(!s || s.id!==id)return false;
  if(s.posicio && new Date(posicio.capturadaEl)<=new Date(s.posicio.capturadaEl))return true;
  s.posicio=posicio;s.caduca=Date.now()+CADUCITAT_UBICACIO;return true;
}
export function distanciaMetres(a:number,b:number,c:number,d:number) {
  const r=Math.PI/180,dl=(c-a)*r,dn=(d-b)*r;
  const h=Math.sin(dl/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(dn/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
export function compararPunt(p:Posicio|null,lat:number|null,lng:number|null,radi:number) {
  if(!p)return {estat:'SENSE_UBICACIO',distancia:null};
  if(Date.now()-new Date(p.capturadaEl).getTime()>90_000)return {estat:'ANTIGA',distancia:null};
  if(lat==null || lng==null)return {estat:'SENSE_PUNT',distancia:null};
  const distancia=distanciaMetres(lat,lng,p.latitud,p.longitud);
  const estat=p.precisio>radi?'PRECISIO_BAIXA':distancia+p.precisio<=radi?'DINS':distancia-p.precisio>radi?'FORA':'INCERTA';
  return {estat,distancia:Math.round(distancia)};
}
