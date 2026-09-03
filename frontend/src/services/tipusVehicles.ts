import { api } from './api';

export interface TipusVehicle {
  id: string;
  nom: string;
}

export async function llistarTipusVehicles(): Promise<TipusVehicle[]> {
  const { data } = await api.get('/tipus-vehicles');
  return data;
}

export async function crearTipusVehicle(nom: string): Promise<TipusVehicle> {
  const { data } = await api.post('/tipus-vehicles', { nom });
  return data;
}

export async function editarTipusVehicle(id: string, nom: string): Promise<TipusVehicle> {
  const { data } = await api.patch(`/tipus-vehicles/${id}`, { nom });
  return data;
}

export async function eliminarTipusVehicle(id: string) {
  await api.delete(`/tipus-vehicles/${id}`);
}
