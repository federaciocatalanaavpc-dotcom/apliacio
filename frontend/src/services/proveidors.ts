import { api } from './api';

export interface Proveidor {
  id: string;
  agrupacioId: string;
  agrupacio?: { id: string; nom: string; municipi: string };
  nom: string;
  categoria: string | null;
  contacte: string | null;
  telefon: string | null;
  email: string | null;
  adreca: string | null;
  notes: string | null;
  actiu: boolean;
  creatEl: string;
}

export async function llistarProveidors(): Promise<Proveidor[]> {
  const { data } = await api.get('/proveidors');
  return data;
}

export async function crearProveidor(dades: {
  agrupacioId?: string;
  nom: string;
  categoria?: string;
  contacte?: string;
  telefon?: string;
  email?: string;
  adreca?: string;
  notes?: string;
}): Promise<Proveidor> {
  const { data } = await api.post('/proveidors', dades);
  return data;
}

export async function editarProveidor(id: string, dades: Partial<Proveidor>): Promise<Proveidor> {
  const { data } = await api.patch(`/proveidors/${id}`, dades);
  return data;
}

export async function eliminarProveidor(id: string) {
  await api.delete(`/proveidors/${id}`);
}
