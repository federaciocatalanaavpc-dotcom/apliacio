import { api } from './api';

export type TipusDocument = 'ESTATUTS' | 'ACTA' | 'ALTRES';

export interface DocumentAgrupacio {
  id: string;
  agrupacioId: string;
  agrupacio?: { id: string; nom: string };
  tipus: TipusDocument;
  titol: string;
  dataDocument: string | null;
  fitxerUrl: string;
  fitxerNom: string;
  pujatPer: { id: string; nom: string };
  creatEl: string;
}

export async function llistarDocuments(): Promise<DocumentAgrupacio[]> {
  const { data } = await api.get('/documents');
  return data;
}

export async function pujarDocument(dades: {
  agrupacioId?: string;
  tipus: TipusDocument;
  titol: string;
  dataDocument?: string;
  fitxer: File;
}): Promise<DocumentAgrupacio> {
  const form = new FormData();
  if (dades.agrupacioId) form.append('agrupacioId', dades.agrupacioId);
  form.append('tipus', dades.tipus);
  form.append('titol', dades.titol);
  if (dades.dataDocument) form.append('dataDocument', dades.dataDocument);
  form.append('fitxer', dades.fitxer);
  const { data } = await api.post('/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function eliminarDocument(id: string) {
  await api.delete(`/documents/${id}`);
}
