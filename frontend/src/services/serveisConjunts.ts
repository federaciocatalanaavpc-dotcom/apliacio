import {api} from './api';
import {Servei} from './serveis';
export interface PersonaServei {id:string;nom:string;cognoms:string;indicatiu:string|null;actiu:boolean;agrupacioId:string;agrupacio:{id:string;nom:string};}
export interface Conjunt extends Servei {potCoordinar?:boolean;}
export const llistarConjunts=async(arxivat=false):Promise<Conjunt[]> => (await api.get('/serveis/conjunts',{params:{arxivat}})).data;
export const equipServei=async(id:string):Promise<PersonaServei[]> => (await api.get(`/serveis/${id}/equip`)).data;
export const candidatsServei=async(id:string):Promise<PersonaServei[]> => (await api.get(`/serveis/${id}/candidats`)).data;
export const incorporar=async(id:string,v:string)=>api.post(`/serveis/${id}/equip/${v}`);
export const retirar=async(id:string,v:string)=>api.delete(`/serveis/${id}/equip/${v}`);
export interface ConfigConjunt {titol:string;dataInici:string;dataFi:string;collaboracioEmergencies:boolean;descripcio:string;adreca:string;latitud:number|null;longitud:number|null;participants:{agrupacioId:string;coordinadora:boolean}[];versioCoordinacio?:number;arxivat:boolean;}
export const desarConjunt=async(d:ConfigConjunt,id?:string):Promise<Conjunt> => (id?await api.patch(`/serveis/conjunts/${id}`,d):await api.post('/serveis/conjunts',d)).data;
