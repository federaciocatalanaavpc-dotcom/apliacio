import { api } from './api';

export interface RegistreAuditoria {
  id: string;
  accio: string;
  entitat: string;
  entitatId: string;
  detall: string | null;
  creatEl: string;
  usuari: { id: string; nom: string };
}

export async function llistarAuditoria(opcions?: { agrupacioId?: string; entitat?: string }): Promise<RegistreAuditoria[]> {
  const { data } = await api.get('/auditoria', { params: opcions });
  return data;
}
