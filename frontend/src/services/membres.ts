import { api } from './api';

export type TipusDocMembre = 'DNI' | 'CARNET_CONDUIR' | 'CERTIFICAT_MEDIC' | 'ASSEGURANCA' | 'ALTRES';
export type EstatDocMembre = 'PENDENT' | 'REBUT' | 'CADUCAT';

export interface DocumentMembre {
  id: string;
  membreId: string;
  tipus: TipusDocMembre;
  estat: EstatDocMembre;
  dataCaducitat: string | null;
  fitxerUrl: string | null;
  fitxerNom: string | null;
  notes: string | null;
  creatEl: string;
}

export interface Membre {
  id: string;
  agrupacioId: string;
  agrupacio?: { id: string; nom: string };
  nom: string;
  cognoms: string;
  dni: string | null;
  dataNaixement: string | null;
  telefon: string | null;
  email: string | null;
  dataAlta: string;
  dataBaixa: string | null;
  actiu: boolean;
  notes: string | null;
  documents: DocumentMembre[];
}

export async function llistarMembres(): Promise<Membre[]> {
  const { data } = await api.get('/membres');
  return data;
}

export async function crearMembre(dades: {
  agrupacioId?: string;
  nom: string;
  cognoms: string;
  dni?: string;
  dataNaixement?: string;
  telefon?: string;
  email?: string;
  dataAlta?: string;
  notes?: string;
}): Promise<Membre> {
  const { data } = await api.post('/membres', dades);
  return data;
}

export async function editarMembre(id: string, dades: Partial<Membre>): Promise<Membre> {
  const { data } = await api.patch(`/membres/${id}`, dades);
  return data;
}

export async function eliminarMembre(id: string) {
  await api.delete(`/membres/${id}`);
}

export async function crearDocumentMembre(
  membreId: string,
  dades: { tipus: TipusDocMembre; estat?: EstatDocMembre; dataCaducitat?: string; notes?: string; fitxer?: File | null }
): Promise<DocumentMembre> {
  const form = new FormData();
  form.append('tipus', dades.tipus);
  if (dades.estat) form.append('estat', dades.estat);
  if (dades.dataCaducitat) form.append('dataCaducitat', dades.dataCaducitat);
  if (dades.notes) form.append('notes', dades.notes);
  if (dades.fitxer) form.append('fitxer', dades.fitxer);
  const { data } = await api.post(`/documents-membre/${membreId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function editarDocumentMembre(
  id: string,
  dades: { tipus?: TipusDocMembre; estat?: EstatDocMembre; dataCaducitat?: string; notes?: string; fitxer?: File | null }
): Promise<DocumentMembre> {
  const form = new FormData();
  if (dades.tipus) form.append('tipus', dades.tipus);
  if (dades.estat) form.append('estat', dades.estat);
  if (dades.dataCaducitat) form.append('dataCaducitat', dades.dataCaducitat);
  if (dades.notes) form.append('notes', dades.notes);
  if (dades.fitxer) form.append('fitxer', dades.fitxer);
  const { data } = await api.patch(`/documents-membre/item/${id}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function eliminarDocumentMembre(id: string) {
  await api.delete(`/documents-membre/item/${id}`);
}
