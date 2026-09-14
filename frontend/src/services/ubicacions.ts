import {api} from './api';
export interface Posicio {latitud:number;longitud:number;precisio:number;capturadaEl:string;actualitzadaEl:string;}
export interface UbicacioVoluntari {voluntariId:string;nom:string;agrupacioNom?:string;enServei:boolean;puntNom:string|null;puntLatitud:number|null;puntLongitud:number|null;puntRadi:number;posicio:Posicio|null;estat:string;distancia:number|null;}
export interface UbicacionsServei {servei:{id:string;titol:string;agrupacioId:string;arxivat:boolean;latitud:number|null;longitud:number|null};voluntaris:UbicacioVoluntari[];}
export async function obtenirUbicacions(id:string):Promise<UbicacionsServei>{return (await api.get(`/serveis/${id}/ubicacions`)).data;}
export async function assignarPunt(id:string,voluntariId:string,punt:{puntNom:string;puntLatitud:number|null;puntLongitud:number|null;puntRadi:number}){await api.patch(`/serveis/${id}/punts/${voluntariId}`,punt);}
export const ESTATS:Record<string,string>={DINS:'A prop del punt',FORA:'Fora del marge',INCERTA:'Al límit · posició incerta',PRECISIO_BAIXA:'GPS poc precís',ANTIGA:'Ubicació antiga',SENSE_PUNT:'Sense punt assignat',SENSE_UBICACIO:'Sense ubicació compartida'};
