import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, potGestionarAgrupacio } from '../middleware/auth.middleware';
import { pujadaDocumentsMembre } from '../services/upload.service';

const router = Router();
router.use(requireAuth);

async function comprovarAccesMembre(req: AuthRequest, membreId: string) {
  const membre = await prisma.membre.findUnique({ where: { id: membreId } });
  if (!membre) return null;
  if (!potGestionarAgrupacio(req, membre.agrupacioId)) return false;
  return membre;
}

// Puja/registra un document de documentació pendent d'un membre concret
router.post('/:membreId', pujadaDocumentsMembre.single('fitxer'), async (req: AuthRequest, res) => {
  const acces = await comprovarAccesMembre(req, req.params.membreId);
  if (acces === null) return res.status(404).json({ error: 'Membre no trobat' });
  if (acces === false) {
    return res.status(403).json({ error: "No pots gestionar documentació d'un membre d'una altra agrupació" });
  }

  const { tipus, estat, dataCaducitat, notes } = req.body;
  if (!tipus) return res.status(400).json({ error: 'Cal indicar el tipus de document' });
  try {
    const doc = await prisma.documentMembre.create({
      data: {
        membreId: req.params.membreId,
        tipus,
        estat: estat || (req.file ? 'REBUT' : 'PENDENT'),
        dataCaducitat: dataCaducitat ? new Date(dataCaducitat) : undefined,
        fitxerUrl: req.file ? `/uploads/membres/${req.file.filename}` : undefined,
        fitxerNom: req.file ? req.file.originalname : undefined,
        notes: notes || undefined,
      },
    });
    res.status(201).json(doc);
  } catch {
    res.status(400).json({ error: "No s'ha pogut desar el document" });
  }
});

router.patch('/item/:id', pujadaDocumentsMembre.single('fitxer'), async (req: AuthRequest, res) => {
  const existent = await prisma.documentMembre.findUnique({ where: { id: req.params.id }, include: { membre: true } });
  if (!existent) return res.status(404).json({ error: 'Document no trobat' });
  if (!potGestionarAgrupacio(req, existent.membre.agrupacioId)) {
    return res.status(403).json({ error: 'No pots editar aquest document' });
  }
  const { tipus, estat, dataCaducitat, notes } = req.body;
  try {
    const doc = await prisma.documentMembre.update({
      where: { id: req.params.id },
      data: {
        tipus,
        estat,
        dataCaducitat: dataCaducitat ? new Date(dataCaducitat) : null,
        notes: notes || null,
        ...(req.file ? { fitxerUrl: `/uploads/membres/${req.file.filename}`, fitxerNom: req.file.originalname } : {}),
      },
    });
    res.json(doc);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

router.delete('/item/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.documentMembre.findUnique({ where: { id: req.params.id }, include: { membre: true } });
  if (!existent) return res.status(404).json({ error: 'Document no trobat' });
  if (!potGestionarAgrupacio(req, existent.membre.agrupacioId)) {
    return res.status(403).json({ error: 'No pots eliminar aquest document' });
  }
  await prisma.documentMembre.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
