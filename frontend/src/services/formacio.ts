import { api } from './api';

export type EstatFormacio = 'PENDENT' | 'COMPLETADA';

export interface InscripcioFormacio {
  id: string;
  formacioId: string;
  membreId: string;
  estat: EstatFormacio;
  dataCompletada: string | null;
  membre: { id: string; nom: string; cognoms: string; agrupacioId: string };
}

export interface Formacio {
  id: string;
  nom: string;
  descripcio: string | null;
  agrupacioId: string | null;
  agrupacio?: { id: string; nom: string } | null;
  dataProgramada: string | null;
  obligatoria: boolean;
  creatEl: string;
  inscripcions: InscripcioFormacio[];
}

export async function llistarFormacions(): Promise<Formacio[]> {
  const { data } = await api.get('/formacio');
  return data;
}

export async function crearFormacio(dades: {
  nom: string;
  descripcio?: string;
  agrupacioId?: string | null;
  dataProgramada?: string;
  obligatoria?: boolean;
}): Promise<Formacio> {
  const { data } = await api.post('/formacio', dades);
  return data;
}

export async function eliminarFormacio(id: string) {
  await api.delete(`/formacio/${id}`);
}

export async function inscriureMembre(formacioId: string, membreId: string, estat: EstatFormacio): Promise<InscripcioFormacio> {
  const { data } = await api.post(`/formacio/${formacioId}/inscripcions`, { membreId, estat });
  return data;
}

export async function eliminarInscripcio(id: string) {
  await api.delete(`/formacio/inscripcions/${id}`);
}
