import { api } from './api';

export interface Assistencia {
  id: string;
  serveiId: string;
  voluntariId: string;
  confirmat: boolean;
  horaEntrada: string | null;
  horaSortida: string | null;
  horesRealitzades: number | null;
  notes: string | null;
  voluntari?: { id: string; nom: string; cognoms: string; indicatiu: string | null };
}

export interface Servei {
  id: string;
  agrupacioId: string;
  titol: string;
  numeracio: string | null;
  maxAssistents: number | null;
  collaboracioEmergencies: boolean;
  dataInici: string;
  dataFi: string;
  limitInscripcio: string | null;
  horaBase: string | null;
  horaSortida: string | null;
  tipus: string | null;
  categoria: string | null;
  localitat: string | null;
  sollicitant: string | null;
  latitud: number | null;
  longitud: number | null;
  adreca: string | null;
  descripcio: string | null;
  destinataris: string | null;
  arxivat: boolean;
  creatEl: string;
  creatPer: { id: string; nom: string };
  agrupacio?: { id: string; nom: string };
  _count?: { assistencies: number };
  assistencies?: Assistencia[];
  assistenciaPropia?: Assistencia | null;
}

export async function llistarServeis(opcions?: { agrupacioId?: string; arxivat?: boolean }): Promise<Servei[]> {
  const { data } = await api.get('/serveis', { params: opcions });
  return data;
}

export async function obtenirServei(id: string): Promise<Servei> {
  const { data } = await api.get(`/serveis/${id}`);
  return data;
}

export interface DadesServei {
  agrupacioId?: string;
  titol: string;
  numeracio?: string;
  maxAssistents?: number;
  collaboracioEmergencies?: boolean;
  dataInici: string;
  dataFi: string;
  limitInscripcio?: string;
  horaBase?: string;
  horaSortida?: string;
  tipus?: string;
  categoria?: string;
  localitat?: string;
  sollicitant?: string;
  latitud?: number;
  longitud?: number;
  adreca?: string;
  descripcio?: string;
  destinataris?: string;
  arxivat?: boolean;
}

export async function crearServei(dades: DadesServei): Promise<Servei> {
  const { data } = await api.post('/serveis', dades);
  return data;
}

export async function editarServei(id: string, dades: Partial<DadesServei>): Promise<Servei> {
  const { data } = await api.patch(`/serveis/${id}`, dades);
  return data;
}

export async function eliminarServei(id: string) {
  await api.delete(`/serveis/${id}`);
}

export async function confirmarAssistencia(serveiId: string): Promise<Assistencia> {
  const { data } = await api.post(`/serveis/${serveiId}/confirmar`);
  return data;
}

export async function cancelarAssistencia(serveiId: string) {
  await api.post(`/serveis/${serveiId}/cancelar`);
}

export interface ServeiEstadistiques {
  id: string;
  titol: string;
  tipus: string | null;
  categoria: string | null;
  dataInici: string;
  arxivat: boolean;
  assistencies: {
    confirmat: boolean;
    horesRealitzades: number | null;
    voluntari: { id: string; nom: string; cognoms: string };
  }[];
}

export async function obtenirDadesEstadistiques(agrupacioId?: string): Promise<ServeiEstadistiques[]> {
  const { data } = await api.get('/serveis/estadistiques/dades', { params: agrupacioId ? { agrupacioId } : undefined });
  return data;
}

export async function marcarAssistencia(
  serveiId: string,
  voluntariId: string,
  dades: { horaEntrada?: string; horaSortida?: string; horesRealitzades?: number; notes?: string; confirmat?: boolean }
): Promise<Assistencia> {
  const { data } = await api.patch(`/serveis/${serveiId}/assistencies/${voluntariId}`, dades);
  return data;
}
