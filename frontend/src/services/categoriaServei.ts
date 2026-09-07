import { api } from './api';

export interface CategoriaServei {
  id: string;
  nom: string;
  agrupacioId: string | null;
}

export async function llistarCategoriesServei(agrupacioId?: string): Promise<CategoriaServei[]> {
  const { data } = await api.get('/categoria-servei', { params: agrupacioId ? { agrupacioId } : undefined });
  return data;
}

export async function crearCategoriaServei(nom: string): Promise<CategoriaServei> {
  const { data } = await api.post('/categoria-servei', { nom });
  return data;
}

export async function editarCategoriaServei(id: string, nom: string): Promise<CategoriaServei> {
  const { data } = await api.patch(`/categoria-servei/${id}`, { nom });
  return data;
}

export async function eliminarCategoriaServei(id: string) {
  await api.delete(`/categoria-servei/${id}`);
}
