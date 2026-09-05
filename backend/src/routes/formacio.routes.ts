import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireFederacio, AuthRequest } from '../middleware/auth.middleware';
import { pujadaDocumentsAgrupacio } from '../services/upload.service';

const router = Router();
router.use(requireAuth);

const SELECCIO_LLISTA = {
  id: true,
  titol: true,
  url: true,
  fitxerNom: true,
  fitxerMimeType: true,
  creatEl: true,
  pujatPer: { select: { id: true, nom: true } },
} as const;

function ambUrlFitxer<T extends { id: string; fitxerMimeType: string | null }>(recurs: T) {
  return { ...recurs, fitxerUrl: recurs.fitxerMimeType ? `/formacio/${recurs.id}/fitxer` : null };
}

// Biblioteca de recursos de formació (PDFs o enllaços). Tothom els pot veure;
// només la federació els gestiona.
router.get('/', async (_req: AuthRequest, res) => {
  const recursos = await prisma.recursFormacio.findMany({
    select: SELECCIO_LLISTA,
    orderBy: { creatEl: 'desc' },
  });
  res.json(recursos.map(ambUrlFitxer));
});

router.get('/:id/fitxer', async (req: AuthRequest, res) => {
  const recurs = await prisma.recursFormacio.findUnique({ where: { id: req.params.id } });
  if (!recurs || !recurs.fitxerContingut) {
    return res.status(404).json({ error: 'Fitxer no trobat' });
  }
  res.setHeader('Content-Type', recurs.fitxerMimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(recurs.fitxerNom || 'document')}"`);
  res.send(recurs.fitxerContingut);
});

router.post('/', requireFederacio, pujadaDocumentsAgrupacio.single('fitxer'), async (req: AuthRequest, res) => {
  const { titol, url } = req.body;
  if (!titol || (!url && !req.file)) {
    return res.status(400).json({ error: "Cal indicar el títol i almenys un enllaç o un fitxer" });
  }
  try {
    const recurs = await prisma.recursFormacio.create({
      data: {
        titol,
        url: url || undefined,
        fitxerNom: req.file ? req.file.originalname : undefined,
        fitxerContingut: req.file ? req.file.buffer : undefined,
        fitxerMimeType: req.file ? req.file.mimetype : undefined,
        pujatPerId: req.usuari!.id,
      },
      select: SELECCIO_LLISTA,
    });
    res.status(201).json(ambUrlFitxer(recurs));
  } catch {
    res.status(400).json({ error: "No s'ha pogut desar el recurs" });
  }
});

router.delete('/:id', requireFederacio, async (req: AuthRequest, res) => {
  const existent = await prisma.recursFormacio.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Recurs no trobat' });
  await prisma.recursFormacio.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
