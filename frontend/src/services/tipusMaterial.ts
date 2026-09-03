import { api } from './api';

export interface TipusMaterial {
  id: string;
  nom: string;
}

export async function llistarTipusMaterial(): Promise<TipusMaterial[]> {
  const { data } = await api.get('/tipus-material');
  return data;
}

export async function crearTipusMaterial(nom: string): Promise<TipusMaterial> {
  const { data } = await api.post('/tipus-material', { nom });
  return data;
}

export async function editarTipusMaterial(id: string, nom: string): Promise<TipusMaterial> {
  const { data } = await api.patch(`/tipus-material/${id}`, { nom });
  return data;
}

export async function eliminarTipusMaterial(id: string) {
  await api.delete(`/tipus-material/${id}`);
}
