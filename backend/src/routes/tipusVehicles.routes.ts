import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireFederacio } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// Catàleg de tipus de vehicle (qualsevol usuari el pot llegir per omplir el desplegable)
router.get('/', async (_req, res) => {
  const tipus = await prisma.tipusVehicle.findMany({ orderBy: { nom: 'asc' } });
  res.json(tipus);
});

// Qualsevol usuari autenticat pot afegir un nou tipus (p.ex. una associació
// que té un vehicle que encara no és al catàleg comú); editar/eliminar es
// reserva a la federació per evitar que es trenqui la llista per a tothom.
router.post('/', async (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom del tipus de vehicle' });
  try {
    const tipus = await prisma.tipusVehicle.create({ data: { nom } });
    res.status(201).json(tipus);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear el tipus de vehicle (potser ja existeix)" });
  }
});

router.patch('/:id', requireFederacio, async (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom del tipus de vehicle' });
  try {
    const tipus = await prisma.tipusVehicle.update({ where: { id: req.params.id }, data: { nom } });
    res.json(tipus);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

router.delete('/:id', requireFederacio, async (req, res) => {
  try {
    await prisma.tipusVehicle.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: "No s'ha pogut eliminar el tipus de vehicle" });
  }
});

export default router;
