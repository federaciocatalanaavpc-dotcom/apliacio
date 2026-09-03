import { api } from './api';

export interface Provincia {
  id: string;
  nom: string;
}

export async function llistarProvincies(): Promise<Provincia[]> {
  const { data } = await api.get('/provincies');
  return data;
}

export async function crearProvincia(nom: string): Promise<Provincia> {
  const { data } = await api.post('/provincies', { nom });
  return data;
}

export async function editarProvincia(id: string, nom: string): Promise<Provincia> {
  const { data } = await api.patch(`/provincies/${id}`, { nom });
  return data;
}

export async function eliminarProvincia(id: string) {
  await api.delete(`/provincies/${id}`);
}
