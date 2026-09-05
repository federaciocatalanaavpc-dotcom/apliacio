import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireFederacio } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// Catàleg de noms de material (qualsevol usuari el pot llegir per omplir el desplegable)
router.get('/', async (_req, res) => {
  const tipus = await prisma.tipusMaterial.findMany({ orderBy: { nom: 'asc' } });
  res.json(tipus);
});

// Qualsevol usuari autenticat pot afegir un nou nom (p.ex. una associació que
// té un material que encara no és al catàleg comú); editar/eliminar es
// reserva a la federació per evitar que es trenqui la llista per a tothom.
router.post('/', async (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom del material' });
  try {
    const tipus = await prisma.tipusMaterial.create({ data: { nom } });
    res.status(201).json(tipus);
  } catch {
    res.status(400).json({ error: 'No s\'ha pogut crear el tipus de material (potser ja existeix)' });
  }
});

router.patch('/:id', requireFederacio, async (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom del material' });
  try {
    const tipus = await prisma.tipusMaterial.update({ where: { id: req.params.id }, data: { nom } });
    res.json(tipus);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

router.delete('/:id', requireFederacio, async (req, res) => {
  try {
    await prisma.tipusMaterial.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: "No s'ha pogut eliminar el tipus de material" });
  }
});

export default router;
