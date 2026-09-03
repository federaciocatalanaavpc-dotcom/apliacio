import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireFederacio } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// Catàleg de províncies (qualsevol usuari el pot llegir per omplir el desplegable)
router.get('/', async (_req, res) => {
  const provincies = await prisma.provincia.findMany({ orderBy: { nom: 'asc' } });
  res.json(provincies);
});

router.post('/', requireFederacio, async (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom de la província' });
  try {
    const provincia = await prisma.provincia.create({ data: { nom } });
    res.status(201).json(provincia);
  } catch {
    res.status(400).json({ error: 'No s\'ha pogut crear la província (potser ja existeix)' });
  }
});

router.patch('/:id', requireFederacio, async (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom de la província' });
  try {
    const provincia = await prisma.provincia.update({ where: { id: req.params.id }, data: { nom } });
    res.json(provincia);
  } catch {
    res.status(400).json({ error: 'No s\'han pogut desar els canvis' });
  }
});

router.delete('/:id', requireFederacio, async (req, res) => {
  try {
    await prisma.provincia.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: 'No s\'ha pogut eliminar la província' });
  }
});

export default router;
