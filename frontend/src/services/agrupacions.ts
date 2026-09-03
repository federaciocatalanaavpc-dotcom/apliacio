import { api } from './api';

export interface Agrupacio {
  id: string;
  nom: string;
  provincia: string | null;
  municipi: string | null;
  comarca: string | null;
  adreca: string | null;
  telefon: string | null;
  email: string | null;
  president: string | null;
  dataFundacio: string | null;
  latitud: number | null;
  longitud: number | null;
  actiu: boolean;
  creatEl: string;
}

export async function llistarAgrupacions(): Promise<Agrupacio[]> {
  const { data } = await api.get('/agrupacions');
  return data;
}

export async function crearAgrupacio(dades: {
  nom: string;
  provincia?: string;
  municipi?: string;
  comarca?: string;
  adreca?: string;
  telefon?: string;
  email?: string;
  president?: string;
  dataFundacio?: string;
  latitud?: number;
  longitud?: number;
}): Promise<Agrupacio> {
  const { data } = await api.post('/agrupacions', dades);
  return data;
}

export async function editarAgrupacio(id: string, dades: Partial<Agrupacio>): Promise<Agrupacio> {
  const { data } = await api.patch(`/agrupacions/${id}`, dades);
  return data;
}

export async function eliminarAgrupacio(id: string) {
  await api.delete(`/agrupacions/${id}`);
}
