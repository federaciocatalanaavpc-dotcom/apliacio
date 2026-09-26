import { api } from './api';

export type EstatCaducitat = 'CADUCAT' | 'PROPERA' | 'OK';

export interface Caducitat {
  id: string;
  agrupacioId: string;
  vehicleId: string | null;
  materialId: string | null;
  concepte: string;
  dataCaducitat: string;
  notes: string | null;
  dies: number;
  estat: EstatCaducitat;
  agrupacio?: { id: string; nom: string };
  vehicle?: { id: string; matricula: string | null; marca: string | null; model: string | null } | null;
  material?: { id: string; nom: string } | null;
}

export async function llistarCaducitats(agrupacioId?: string): Promise<Caducitat[]> {
  const { data } = await api.get('/caducitats', { params: agrupacioId ? { agrupacioId } : undefined });
  return data;
}

export async function resumCaducitats(): Promise<{ caducades: number; properes: number }> {
  const { data } = await api.get('/caducitats/resum');
  return data;
}

export async function crearCaducitat(dades: {
  agrupacioId?: string;
  vehicleId?: string;
  materialId?: string;
  concepte: string;
  dataCaducitat: string;
  notes?: string;
}): Promise<Caducitat> {
  const { data } = await api.post('/caducitats', dades);
  return data;
}

export async function editarCaducitat(id: string, dades: { concepte?: string; dataCaducitat?: string; notes?: string }): Promise<Caducitat> {
  const { data } = await api.patch(`/caducitats/${id}`, dades);
  return data;
}

export async function eliminarCaducitat(id: string) {
  await api.delete(`/caducitats/${id}`);
}
