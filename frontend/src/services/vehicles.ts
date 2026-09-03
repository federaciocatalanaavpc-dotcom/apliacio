import { api } from './api';

export interface Vehicle {
  id: string;
  agrupacioId: string;
  agrupacio?: { id: string; nom: string };
  matricula: string;
  tipus: string | null;
  marca: string | null;
  model: string | null;
  propietat: 'PROPI' | 'RENTING' | 'CEDIT';
  empresaRenting: string | null;
  proximaItv: string | null;
  proximaRevisio: string | null;
  notes: string | null;
  creatEl: string;
}

export async function llistarVehicles(): Promise<Vehicle[]> {
  const { data } = await api.get('/vehicles');
  return data;
}

export async function crearVehicle(dades: {
  agrupacioId?: string;
  matricula: string;
  tipus?: string;
  marca?: string;
  model?: string;
  propietat: 'PROPI' | 'RENTING' | 'CEDIT';
  empresaRenting?: string;
  proximaItv?: string;
  proximaRevisio?: string;
  notes?: string;
}): Promise<Vehicle> {
  const { data } = await api.post('/vehicles', dades);
  return data;
}

export async function editarVehicle(id: string, dades: Partial<Vehicle>): Promise<Vehicle> {
  const { data } = await api.patch(`/vehicles/${id}`, dades);
  return data;
}

export async function eliminarVehicle(id: string) {
  await api.delete(`/vehicles/${id}`);
}
