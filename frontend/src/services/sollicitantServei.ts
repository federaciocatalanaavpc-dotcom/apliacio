import { api } from './api';

export interface SollicitantServei {
  id: string;
  nom: string;
  agrupacioId: string | null;
}

export async function llistarSollicitantsServei(agrupacioId?: string): Promise<SollicitantServei[]> {
  const { data } = await api.get('/sollicitant-servei', { params: agrupacioId ? { agrupacioId } : undefined });
  return data;
}

export async function crearSollicitantServei(nom: string): Promise<SollicitantServei> {
  const { data } = await api.post('/sollicitant-servei', { nom });
  return data;
}

export async function editarSollicitantServei(id: string, nom: string): Promise<SollicitantServei> {
  const { data } = await api.patch(`/sollicitant-servei/${id}`, { nom });
  return data;
}

export async function eliminarSollicitantServei(id: string) {
  await api.delete(`/sollicitant-servei/${id}`);
}
