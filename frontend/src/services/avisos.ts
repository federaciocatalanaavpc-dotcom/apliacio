import { api } from './api';

export interface Avis {
  id: string;
  titol: string;
  cos: string;
  agrupacioId: string | null;
  agrupacio?: { id: string; nom: string } | null;
  dataEnviament: string;
  enviat: boolean;
  creatEl: string;
}

export async function llistarAvisos(): Promise<Avis[]> {
  const { data } = await api.get('/avisos');
  return data;
}

export async function crearAvis(dades: {
  titol: string;
  cos: string;
  agrupacioId?: string | null;
  dataEnviament?: string;
}): Promise<Avis> {
  const { data } = await api.post('/avisos', dades);
  return data;
}

export async function eliminarAvis(id: string) {
  await api.delete(`/avisos/${id}`);
}
