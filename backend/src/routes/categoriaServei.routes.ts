import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireFederacio, bloquejaVoluntaris } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res) => {
  const categories = await prisma.categoriaServei.findMany({ orderBy: { nom: 'asc' } });
  res.json(categories);
});

router.post('/', bloquejaVoluntaris, async (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom de la categoria' });
  try {
    const categoria = await prisma.categoriaServei.create({ data: { nom } });
    res.status(201).json(categoria);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear la categoria (potser ja existeix)" });
  }
});

router.patch('/:id', requireFederacio, async (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom de la categoria' });
  try {
    const categoria = await prisma.categoriaServei.update({ where: { id: req.params.id }, data: { nom } });
    res.json(categoria);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

router.delete('/:id', requireFederacio, async (req, res) => {
  try {
    await prisma.categoriaServei.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: "No s'ha pogut eliminar la categoria" });
  }
});

export default router;
