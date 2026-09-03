import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, potGestionarAgrupacio } from '../middleware/auth.middleware';
import { pujadaDocumentsAgrupacio } from '../services/upload.service';

const router = Router();
router.use(requireAuth);

// Estatuts, llibre d'actes i altres documents oficials de l'agrupació
router.get('/', async (req: AuthRequest, res) => {
  const agrupacioId =
    req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId!;
  const documents = await prisma.document.findMany({
    where: agrupacioId ? { agrupacioId } : undefined,
    include: { pujatPer: { select: { id: true, nom: true } }, agrupacio: { select: { id: true, nom: true } } },
    orderBy: { creatEl: 'desc' },
  });
  res.json(documents);
});

router.post('/', pujadaDocumentsAgrupacio.single('fitxer'), async (req: AuthRequest, res) => {
  const { agrupacioId, tipus, titol, dataDocument } = req.body;
  const agrupacioFinal = req.usuari!.rol === 'FEDERACIO' ? agrupacioId : req.usuari!.agrupacioId;
  if (!agrupacioFinal || !tipus || !titol || !req.file) {
    return res.status(400).json({ error: 'Falten camps obligatoris (associació, tipus, títol i fitxer)' });
  }
  if (!potGestionarAgrupacio(req, agrupacioFinal)) {
    return res.status(403).json({ error: "No pots pujar documents d'una altra associació" });
  }
  try {
    const document = await prisma.document.create({
      data: {
        agrupacioId: agrupacioFinal,
        tipus,
        titol,
        dataDocument: dataDocument ? new Date(dataDocument) : undefined,
        fitxerUrl: `/uploads/documents/${req.file.filename}`,
        fitxerNom: req.file.originalname,
        pujatPerId: req.usuari!.id,
      },
    });
    res.status(201).json(document);
  } catch {
    res.status(400).json({ error: "No s'ha pogut desar el document" });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Document no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: 'No pots eliminar aquest document' });
  }
  await prisma.document.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
