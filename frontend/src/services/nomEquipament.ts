import { api } from './api';
import { TipusEquipament } from './equipament';

export interface NomEquipament {
  id: string;
  tipus: TipusEquipament;
  nom: string;
  agrupacioId: string | null;
}

export async function llistarNomsEquipament(tipus: TipusEquipament, agrupacioId?: string): Promise<NomEquipament[]> {
  const { data } = await api.get('/nom-equipament', { params: { tipus, agrupacioId } });
  return data;
}

export async function crearNomEquipament(tipus: TipusEquipament, nom: string): Promise<NomEquipament> {
  const { data } = await api.post('/nom-equipament', { tipus, nom });
  return data;
}

export async function editarNomEquipament(id: string, nom: string): Promise<NomEquipament> {
  const { data } = await api.patch(`/nom-equipament/${id}`, { nom });
  return data;
}

export async function eliminarNomEquipament(id: string) {
  await api.delete(`/nom-equipament/${id}`);
}
