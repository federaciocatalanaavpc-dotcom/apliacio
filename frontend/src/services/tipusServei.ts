import { api } from './api';

export interface TipusServei {
  id: string;
  nom: string;
}

export async function llistarTipusServei(): Promise<TipusServei[]> {
  const { data } = await api.get('/tipus-servei');
  return data;
}

export async function crearTipusServei(nom: string): Promise<TipusServei> {
  const { data } = await api.post('/tipus-servei', { nom });
  return data;
}

export async function editarTipusServei(id: string, nom: string): Promise<TipusServei> {
  const { data } = await api.patch(`/tipus-servei/${id}`, { nom });
  return data;
}

export async function eliminarTipusServei(id: string) {
  await api.delete(`/tipus-servei/${id}`);
}
