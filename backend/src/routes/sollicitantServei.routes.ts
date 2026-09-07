import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, bloquejaVoluntaris } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  const agrupacioId =
    req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId!;
  const sollicitants = await prisma.sollicitantServei.findMany({
    where: { OR: [{ agrupacioId: null }, ...(agrupacioId ? [{ agrupacioId }] : [])] },
    orderBy: { nom: 'asc' },
  });
  res.json(sollicitants);
});

router.post('/', bloquejaVoluntaris, async (req: AuthRequest, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom del sol·licitant' });
  const agrupacioId = req.usuari!.rol === 'FEDERACIO' ? null : req.usuari!.agrupacioId;
  try {
    const sollicitant = await prisma.sollicitantServei.create({ data: { nom, agrupacioId } });
    res.status(201).json(sollicitant);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear el sol·licitant (potser ja existeix)" });
  }
});

router.patch('/:id', bloquejaVoluntaris, async (req: AuthRequest, res) => {
  const existent = await prisma.sollicitantServei.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Sol·licitant no trobat' });
  if (req.usuari!.rol !== 'FEDERACIO' && existent.agrupacioId !== req.usuari!.agrupacioId) {
    return res.status(403).json({ error: 'No pots editar aquest sol·licitant' });
  }
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom del sol·licitant' });
  try {
    const sollicitant = await prisma.sollicitantServei.update({ where: { id: req.params.id }, data: { nom } });
    res.json(sollicitant);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

router.delete('/:id', bloquejaVoluntaris, async (req: AuthRequest, res) => {
  const existent = await prisma.sollicitantServei.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Sol·licitant no trobat' });
  if (req.usuari!.rol !== 'FEDERACIO' && existent.agrupacioId !== req.usuari!.agrupacioId) {
    return res.status(403).json({ error: 'No pots eliminar aquest sol·licitant' });
  }
  try {
    await prisma.sollicitantServei.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: "No s'ha pogut eliminar el sol·licitant" });
  }
});

export default router;
