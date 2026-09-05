import { api } from './api';

export interface RecursFormacio {
  id: string;
  titol: string;
  url: string | null;
  fitxerNom: string | null;
  fitxerUrl: string | null;
  pujatPer: { id: string; nom: string };
  creatEl: string;
}

export async function llistarRecursosFormacio(): Promise<RecursFormacio[]> {
  const { data } = await api.get('/formacio');
  return data;
}

export async function crearRecursFormacio(dades: { titol: string; url?: string; fitxer?: File | null }): Promise<RecursFormacio> {
  const form = new FormData();
  form.append('titol', dades.titol);
  if (dades.url) form.append('url', dades.url);
  if (dades.fitxer) form.append('fitxer', dades.fitxer);
  const { data } = await api.post('/formacio', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function eliminarRecursFormacio(id: string) {
  await api.delete(`/formacio/${id}`);
}
