import { api } from './api';

export interface Formacio {
  id: string;
  nom: string;
  descripcio: string | null;
  agrupacioId: string | null;
  agrupacio?: { id: string; nom: string } | null;
  dataProgramada: string | null;
  obligatoria: boolean;
  creatEl: string;
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
