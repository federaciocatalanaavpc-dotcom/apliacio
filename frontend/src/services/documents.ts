import { api } from './api';

export type TipusDocument = 'ESTATUTS' | 'ACTA' | 'ALTRES';

export interface DocumentAgrupacio {
  id: string;
  agrupacioId: string | null;
  agrupacio?: { id: string; nom: string } | null;
  tipus: TipusDocument;
  titol: string;
  dataDocument: string | null;
  pendent: boolean;
  fitxerUrl: string | null;
  fitxerNom: string | null;
  pujatPer: { id: string; nom: string };
  creatEl: string;
}

export async function llistarDocuments(): Promise<DocumentAgrupacio[]> {
  const { data } = await api.get('/documents');
  return data;
}

// Puja un document real (fitxer obligatori), o crea una sol·licitud pendent
// (sense fitxer) perquè una associació el pugi més tard.
export async function pujarDocument(dades: {
  agrupacioId?: string;
  tipus: TipusDocument;
  titol: string;
  dataDocument?: string;
  pendent?: boolean;
  fitxer?: File | null;
}): Promise<DocumentAgrupacio> {
  const form = new FormData();
  if (dades.agrupacioId) form.append('agrupacioId', dades.agrupacioId);
  form.append('tipus', dades.tipus);
  form.append('titol', dades.titol);
  if (dades.dataDocument) form.append('dataDocument', dades.dataDocument);
  if (dades.pendent) form.append('pendent', 'true');
  if (dades.fitxer) form.append('fitxer', dades.fitxer);
  const { data } = await api.post('/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// Igual que pujarDocument, però permet seleccionar diversos fitxers de cop:
// es crea un document per fitxer (el títol de cadascun es basa en el nom del
// fitxer si n'hi ha més d'un, o s'hi combina amb el títol indicat).
export async function pujarDocuments(dades: {
  agrupacioId?: string;
  tipus: TipusDocument;
  titol: string;
  dataDocument?: string;
  pendent?: boolean;
  fitxers: File[];
}): Promise<DocumentAgrupacio[]> {
  if (dades.pendent || dades.fitxers.length === 0) {
    return [await pujarDocument({ ...dades, fitxer: null })];
  }
  const resultats: DocumentAgrupacio[] = [];
  for (const fitxer of dades.fitxers) {
    const titolFinal =
      dades.fitxers.length > 1
        ? dades.titol
          ? `${dades.titol} - ${fitxer.name}`
          : fitxer.name
        : dades.titol || fitxer.name;
    resultats.push(await pujarDocument({ ...dades, titol: titolFinal, fitxer }));
  }
  return resultats;
}

// Puja el fitxer que resol una sol·licitud pendent
export async function resoldrePendent(id: string, fitxer: File): Promise<DocumentAgrupacio> {
  const form = new FormData();
  form.append('fitxer', fitxer);
  const { data } = await api.patch(`/documents/${id}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function eliminarDocument(id: string) {
  await api.delete(`/documents/${id}`);
}
