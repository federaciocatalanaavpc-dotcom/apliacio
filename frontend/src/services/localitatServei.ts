import { api } from './api';

export interface LocalitatServei {
  id: string;
  nom: string;
  agrupacioId: string | null;
}

export async function llistarLocalitatsServei(agrupacioId?: string): Promise<LocalitatServei[]> {
  const { data } = await api.get('/localitat-servei', { params: agrupacioId ? { agrupacioId } : undefined });
  return data;
}

export async function crearLocalitatServei(nom: string): Promise<LocalitatServei> {
  const { data } = await api.post('/localitat-servei', { nom });
  return data;
}

export async function editarLocalitatServei(id: string, nom: string): Promise<LocalitatServei> {
  const { data } = await api.patch(`/localitat-servei/${id}`, { nom });
  return data;
}

export async function eliminarLocalitatServei(id: string) {
  await api.delete(`/localitat-servei/${id}`);
}
