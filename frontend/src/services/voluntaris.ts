import { api } from './api';

export type Disponibilitat = 'PRESENCIAL' | 'IMMEDIATA' | 'DIFERIDA' | 'NO_DISPONIBLE';

export interface Voluntari {
  invitacioUrl?: string;
  id: string;
  agrupacioId: string;
  nom: string;
  cognoms: string;
  telefon: string | null;
  dataIngres: string | null;
  dataBaixa: string | null;
  numeroIdentificacio: string | null;
  indicatiu: string | null;
  carrec: string | null;
  disponibilitat: Disponibilitat;
  consentimentDades: boolean;
  actiu: boolean;
  creatEl: string;
  usuari: { id: string; usuari: string; actiu: boolean; rol: string } | null;
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
  dataIngres?: string;
  dataBaixa?: string | null;
  numeroIdentificacio?: string;
  indicatiu?: string;
  carrec?: string;
  disponibilitat?: Disponibilitat;
  consentimentDades?: boolean;
  actiu?: boolean;
  rolAcces?: 'VOLUNTARI' | 'ADMIN_AVPC';
  emailAcces?: string;
  contrasenyaAcces?: string;
}

export async function crearVoluntari(dades: DadesVoluntari): Promise<Voluntari> {
  const { data } = await api.post('/voluntaris', dades);
  return data;
}

export async function editarVoluntari(id: string, dades: Partial<DadesVoluntari>): Promise<Voluntari> {
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

export interface ExportacioVoluntari {
  voluntari: Voluntari;
  assistencies: {
    confirmat: boolean;
    horaEntrada: string | null;
    horaSortida: string | null;
    horesRealitzades: number | null;
    notes: string | null;
    servei: { titol: string; dataInici: string; dataFi: string };
  }[];
  equipamentAssignat: {
    quantitat: number;
    dataAssignacio: string;
    dataRetorn: string | null;
    notes: string | null;
    article: { tipus: string; nom: string; talla: string | null };
  }[];
  exportatEl: string;
}

export async function exportarVoluntari(id: string): Promise<ExportacioVoluntari> {
  const { data } = await api.get(`/voluntaris/${id}/exportar`);
  return data;
}
