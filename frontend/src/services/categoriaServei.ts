import { api } from './api';

export interface CategoriaServei {
  id: string;
  nom: string;
}

export async function llistarCategoriesServei(): Promise<CategoriaServei[]> {
  const { data } = await api.get('/categoria-servei');
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
