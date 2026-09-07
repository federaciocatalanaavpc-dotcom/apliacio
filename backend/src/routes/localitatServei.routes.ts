import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, bloquejaVoluntaris } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  const agrupacioId =
    req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId!;
  const localitats = await prisma.localitatServei.findMany({
    where: { OR: [{ agrupacioId: null }, ...(agrupacioId ? [{ agrupacioId }] : [])] },
    orderBy: { nom: 'asc' },
  });
  res.json(localitats);
});

router.post('/', bloquejaVoluntaris, async (req: AuthRequest, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom de la localitat' });
  const agrupacioId = req.usuari!.rol === 'FEDERACIO' ? null : req.usuari!.agrupacioId;
  try {
    const localitat = await prisma.localitatServei.create({ data: { nom, agrupacioId } });
    res.status(201).json(localitat);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear la localitat (potser ja existeix)" });
  }
});

router.patch('/:id', bloquejaVoluntaris, async (req: AuthRequest, res) => {
  const existent = await prisma.localitatServei.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Localitat no trobada' });
  if (req.usuari!.rol !== 'FEDERACIO' && existent.agrupacioId !== req.usuari!.agrupacioId) {
    return res.status(403).json({ error: 'No pots editar aquesta localitat' });
  }
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom de la localitat' });
  try {
    const localitat = await prisma.localitatServei.update({ where: { id: req.params.id }, data: { nom } });
    res.json(localitat);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

router.delete('/:id', bloquejaVoluntaris, async (req: AuthRequest, res) => {
  const existent = await prisma.localitatServei.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Localitat no trobada' });
  if (req.usuari!.rol !== 'FEDERACIO' && existent.agrupacioId !== req.usuari!.agrupacioId) {
    return res.status(403).json({ error: 'No pots eliminar aquesta localitat' });
  }
  try {
    await prisma.localitatServei.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: "No s'ha pogut eliminar la localitat" });
  }
});

export default router;
