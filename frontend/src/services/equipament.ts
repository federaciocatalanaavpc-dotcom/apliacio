import { api } from './api';

export type TipusEquipament = 'ROBA' | 'EPI';

export interface ArticleEquipament {
  id: string;
  agrupacioId: string;
  agrupacio?: { id: string; nom: string; municipi: string };
  tipus: TipusEquipament;
  nom: string;
  talla: string | null;
  estocTotal: number;
  estocAssignat: number;
  estocLliure: number;
  notes: string | null;
  creatEl: string;
  _count?: { assignacions: number };
}

export interface AssignacioEquipament {
  id: string;
  articleId: string;
  voluntariId: string;
  quantitat: number;
  dataAssignacio: string;
  dataRetorn: string | null;
  notes: string | null;
  creatEl: string;
  article?: { id: string; tipus: TipusEquipament; nom: string; talla: string | null; agrupacioId: string };
  voluntari?: { id: string; nom: string; cognoms: string };
}

export async function llistarArticlesEquipament(opcions?: { tipus?: TipusEquipament; agrupacioId?: string }): Promise<ArticleEquipament[]> {
  const { data } = await api.get('/equipament/articles', { params: opcions });
  return data;
}

export async function crearArticleEquipament(dades: {
  agrupacioId?: string;
  tipus: TipusEquipament;
  nom: string;
  talla?: string;
  estocTotal?: number;
  notes?: string;
}): Promise<ArticleEquipament> {
  const { data } = await api.post('/equipament/articles', dades);
  return data;
}

export async function editarArticleEquipament(id: string, dades: Partial<ArticleEquipament>): Promise<ArticleEquipament> {
  const { data } = await api.patch(`/equipament/articles/${id}`, dades);
  return data;
}

export async function eliminarArticleEquipament(id: string) {
  await api.delete(`/equipament/articles/${id}`);
}

export async function llistarAssignacionsEquipament(opcions?: {
  tipus?: TipusEquipament;
  agrupacioId?: string;
  voluntariId?: string;
  actives?: boolean;
}): Promise<AssignacioEquipament[]> {
  const { data } = await api.get('/equipament/assignacions', { params: opcions });
  return data;
}

export async function crearAssignacioEquipament(dades: {
  articleId: string;
  voluntariId: string;
  quantitat?: number;
  notes?: string;
}): Promise<AssignacioEquipament> {
  const { data } = await api.post('/equipament/assignacions', dades);
  return data;
}

export async function retornarAssignacioEquipament(id: string): Promise<AssignacioEquipament> {
  const { data } = await api.patch(`/equipament/assignacions/${id}`, { retornar: true });
  return data;
}

export async function eliminarAssignacioEquipament(id: string) {
  await api.delete(`/equipament/assignacions/${id}`);
}
