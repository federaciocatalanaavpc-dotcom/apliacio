import { api } from './api';

export type Disponibilitat = 'PRESENCIAL' | 'IMMEDIATA' | 'DIFERIDA' | 'NO_DISPONIBLE';

export interface Voluntari {
  id: string;
  agrupacioId: string;
  nom: string;
  cognoms: string;
  telefon: string | null;
  dni: string | null;
  genere: string | null;
  dataNaixement: string | null;
  provincia: string | null;
  localitat: string | null;
  adreca: string | null;
  codiPostal: string | null;
  dataIngres: string | null;
  dataBaixa: string | null;
  numeroIdentificacio: string | null;
  indicatiu: string | null;
  carrec: string | null;
  altresEmails: string | null;
  altresAgrupacions: string | null;
  disponibilitat: Disponibilitat;
  actiu: boolean;
  creatEl: string;
  usuari: { id: string; usuari: string; actiu: boolean } | null;
}

export async function llistarVoluntaris(agrupacioId?: string): Promise<Voluntari[]> {
  const { data } = await api.get('/voluntaris', { params: agrupacioId ? { agrupacioId } : undefined });
  return data;
}

export async function obtenirVoluntariPropi(): Promise<Voluntari> {
  const { data } = await api.get('/voluntaris/me');
  return data;
}

export interface AssistenciaPropia {
  confirmat: boolean;
  horesRealitzades: number | null;
  servei: { titol: string; tipus: string | null; dataInici: string };
}

export async function obtenirEstadistiquesPropies(): Promise<AssistenciaPropia[]> {
  const { data } = await api.get('/voluntaris/me/estadistiques');
  return data;
}

export interface DadesVoluntari {
  agrupacioId?: string;
  nom: string;
  cognoms: string;
  telefon?: string;
  dni?: string;
  genere?: string;
  dataNaixement?: string;
  provincia?: string;
  localitat?: string;
  adreca?: string;
  codiPostal?: string;
  dataIngres?: string;
  dataBaixa?: string;
  numeroIdentificacio?: string;
  indicatiu?: string;
  carrec?: string;
  altresEmails?: string;
  altresAgrupacions?: string;
  disponibilitat?: Disponibilitat;
  actiu?: boolean;
  emailAcces?: string;
  contrasenyaAcces?: string;
}

export async function crearVoluntari(dades: DadesVoluntari): Promise<Voluntari> {
  const { data } = await api.post('/voluntaris', dades);
  return data;
}

export async function editarVoluntari(id: string, dades: DadesVoluntari): Promise<Voluntari> {
  const { data } = await api.patch(`/voluntaris/${id}`, dades);
  return data;
}

export async function actualitzarDisponibilitatPropia(disponibilitat: Disponibilitat): Promise<Voluntari> {
  const { data } = await api.patch('/voluntaris/me/disponibilitat', { disponibilitat });
  return data;
}

export async function eliminarVoluntari(id: string) {
  await api.delete(`/voluntaris/${id}`);
}
