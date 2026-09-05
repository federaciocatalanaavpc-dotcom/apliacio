import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireFederacio, AuthRequest, potGestionarAgrupacio } from '../middleware/auth.middleware';
import { pujadaDocumentsAgrupacio } from '../services/upload.service';

const router = Router();
router.use(requireAuth);

const SELECCIO_LLISTA = {
  id: true,
  agrupacioId: true,
  tipus: true,
  titol: true,
  dataDocument: true,
  pendent: true,
  fitxerNom: true,
  fitxerMimeType: true,
  creatEl: true,
  pujatPer: { select: { id: true, nom: true } },
  agrupacio: { select: { id: true, nom: true } },
} as const;

function ambUrlFitxer<T extends { id: string; fitxerMimeType: string | null }>(doc: T) {
  return { ...doc, fitxerUrl: doc.fitxerMimeType ? `/documents/${doc.id}/fitxer` : null };
}

// Estatuts, llibre d'actes i altres documents oficials. Tothom veu tots els
// documents (comuns i de qualsevol associació). No es retorna el contingut
// del fitxer aquí (seria molt pesat); només si n'hi ha un via fitxerUrl.
router.get('/', async (_req: AuthRequest, res) => {
  const documents = await prisma.document.findMany({
    select: SELECCIO_LLISTA,
    orderBy: { creatEl: 'desc' },
  });
  res.json(documents.map(ambUrlFitxer));
});

// Descarrega el contingut real del fitxer (desat a la base de dades).
router.get('/:id/fitxer', async (req: AuthRequest, res) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc || !doc.fitxerContingut) {
    return res.status(404).json({ error: 'Fitxer no trobat' });
  }
  res.setHeader('Content-Type', doc.fitxerMimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fitxerNom || 'document')}"`);
  res.send(doc.fitxerContingut);
});

// La federació puja documents comuns o d'una associació concreta, i pot
// crear-hi sol·licituds pendents (sense fitxer, perquè l'associació el
// pugi més tard). Una associació només puja documents propis (amb fitxer
// ja adjuntat de seguida) a la seva pròpia "Documentació pròpia".
router.post('/', pujadaDocumentsAgrupacio.single('fitxer'), async (req: AuthRequest, res) => {
  const { agrupacioId, tipus, titol, dataDocument, pendent } = req.body;
  const esFederacio = req.usuari!.rol === 'FEDERACIO';
  if (!esFederacio && agrupacioId && agrupacioId !== req.usuari!.agrupacioId) {
    return res.status(403).json({ error: "No pots pujar documents a una altra associació" });
  }
  const agrupacioFinal = esFederacio ? agrupacioId || undefined : req.usuari!.agrupacioId!;
  const esPendent = esFederacio && (pendent === 'true' || pendent === true);
  if (!tipus || !titol || (!esPendent && !req.file)) {
    return res.status(400).json({ error: 'Falten camps obligatoris (tipus, títol i fitxer)' });
  }
  try {
    const document = await prisma.document.create({
      data: {
        agrupacioId: agrupacioFinal,
        tipus,
        titol,
        dataDocument: dataDocument ? new Date(dataDocument) : undefined,
        pendent: esPendent && !req.file,
        fitxerNom: req.file ? req.file.originalname : undefined,
        fitxerContingut: req.file ? req.file.buffer : undefined,
        fitxerMimeType: req.file ? req.file.mimetype : undefined,
        pujatPerId: req.usuari!.id,
      },
      select: SELECCIO_LLISTA,
    });
    res.status(201).json(ambUrlFitxer(document));
  } catch {
    res.status(400).json({ error: "No s'ha pogut desar el document" });
  }
});

// Puja el fitxer que resol una sol·licitud pendent. Ho pot fer la federació
// o la mateixa associació a qui s'ha demanat el document.
router.patch('/:id', pujadaDocumentsAgrupacio.single('fitxer'), async (req: AuthRequest, res) => {
  const existent = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Document no trobat' });
  if (existent.agrupacioId ? !potGestionarAgrupacio(req, existent.agrupacioId) : req.usuari!.rol !== 'FEDERACIO') {
    return res.status(403).json({ error: 'No pots modificar aquest document' });
  }
  if (!req.file) return res.status(400).json({ error: 'Cal adjuntar el fitxer' });
  try {
    const document = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        pendent: false,
        fitxerNom: req.file.originalname,
        fitxerContingut: req.file.buffer,
        fitxerMimeType: req.file.mimetype,
      },
      select: SELECCIO_LLISTA,
    });
    res.json(ambUrlFitxer(document));
  } catch {
    res.status(400).json({ error: "No s'ha pogut desar el fitxer" });
  }
});

router.delete('/:id', requireFederacio, async (req: AuthRequest, res) => {
  const existent = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Document no trobat' });
  await prisma.document.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
