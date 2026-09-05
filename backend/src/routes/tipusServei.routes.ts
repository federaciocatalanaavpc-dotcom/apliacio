import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireFederacio, bloquejaVoluntaris } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res) => {
  const tipus = await prisma.tipusServei.findMany({ orderBy: { nom: 'asc' } });
  res.json(tipus);
});

router.post('/', bloquejaVoluntaris, async (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom del tipus de servei' });
  try {
    const tipus = await prisma.tipusServei.create({ data: { nom } });
    res.status(201).json(tipus);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear el tipus de servei (potser ja existeix)" });
  }
});

router.patch('/:id', requireFederacio, async (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom del tipus de servei' });
  try {
    const tipus = await prisma.tipusServei.update({ where: { id: req.params.id }, data: { nom } });
    res.json(tipus);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

router.delete('/:id', requireFederacio, async (req, res) => {
  try {
    await prisma.tipusServei.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: "No s'ha pogut eliminar el tipus de servei" });
  }
});

export default router;
