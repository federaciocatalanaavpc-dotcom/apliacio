import { api } from './api';

export interface Avis {
  id: string;
  titol: string;
  cos: string;
  agrupacioId: string | null;
  agrupacio?: { id: string; nom: string } | null;
  dataEnviament: string;
  enviat: boolean;
  demanaResposta: boolean;
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
  demanaResposta?: boolean;
}): Promise<Avis> {
  const { data } = await api.post('/avisos', dades);
  return data;
}

export async function eliminarAvis(id: string) {
  await api.delete(`/avisos/${id}`);
}

export interface SeguimentAvis {
  demanaResposta: boolean;
  total: number;
  vaig: number;
  noPuc: number;
  llegits: number;
  pendents: number;
  destinataris: { nom: string; estat: 'PENDENT' | 'LLEGIT' | 'VAIG' | 'NO_PUC'; llegitEl: string | null; respostaEl: string | null }[];
}

export async function obtenirSeguimentAvis(id: string): Promise<SeguimentAvis> {
  const { data } = await api.get(`/avisos/${id}/seguiment`);
  return data;
}
