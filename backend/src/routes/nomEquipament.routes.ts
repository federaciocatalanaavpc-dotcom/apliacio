import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, bloquejaVoluntaris } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);
router.use(bloquejaVoluntaris);

router.get('/', async (req: AuthRequest, res) => {
  const agrupacioId =
    req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId!;
  const tipus = req.query.tipus as string | undefined;
  const noms = await prisma.nomEquipament.findMany({
    where: {
      ...(tipus ? { tipus: tipus as any } : {}),
      OR: [{ agrupacioId: null }, ...(agrupacioId ? [{ agrupacioId }] : [])],
    },
    orderBy: { nom: 'asc' },
  });
  res.json(noms);
});

router.post('/', async (req: AuthRequest, res) => {
  const { tipus, nom } = req.body;
  if (!tipus || !nom) return res.status(400).json({ error: 'Cal indicar el tipus i el nom' });
  const agrupacioId = req.usuari!.rol === 'FEDERACIO' ? null : req.usuari!.agrupacioId;
  try {
    const nomEquipament = await prisma.nomEquipament.create({ data: { tipus, nom, agrupacioId } });
    res.status(201).json(nomEquipament);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear el nom (potser ja existeix)" });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.nomEquipament.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Nom no trobat' });
  if (req.usuari!.rol !== 'FEDERACIO' && existent.agrupacioId !== req.usuari!.agrupacioId) {
    return res.status(403).json({ error: 'No pots editar aquest nom' });
  }
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom' });
  try {
    const nomEquipament = await prisma.nomEquipament.update({ where: { id: req.params.id }, data: { nom } });
    res.json(nomEquipament);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.nomEquipament.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Nom no trobat' });
  if (req.usuari!.rol !== 'FEDERACIO' && existent.agrupacioId !== req.usuari!.agrupacioId) {
    return res.status(403).json({ error: 'No pots eliminar aquest nom' });
  }
  try {
    await prisma.nomEquipament.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: "No s'ha pogut eliminar el nom" });
  }
});

export default router;
