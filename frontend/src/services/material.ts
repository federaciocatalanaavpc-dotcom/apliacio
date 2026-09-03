import { api } from './api';

export interface Material {
  id: string;
  agrupacioId: string;
  agrupacio?: { id: string; nom: string; municipi: string };
  nom: string;
  categoria: string | null;
  quantitat: number;
  estat: 'OPERATIU' | 'MANTENIMENT' | 'BAIXA';
  notes: string | null;
  creatEl: string;
  actualitzatEl: string;
}

export async function llistarMaterial(): Promise<Material[]> {
  const { data } = await api.get('/material');
  return data;
}

export async function crearMaterial(dades: {
  agrupacioId?: string;
  nom: string;
  categoria?: string;
  quantitat?: number;
  estat?: 'OPERATIU' | 'MANTENIMENT' | 'BAIXA';
  notes?: string;
}): Promise<Material> {
  const { data } = await api.post('/material', dades);
  return data;
}

export async function editarMaterial(id: string, dades: Partial<Material>): Promise<Material> {
  const { data } = await api.patch(`/material/${id}`, dades);
  return data;
}

export async function eliminarMaterial(id: string) {
  await api.delete(`/material/${id}`);
}
