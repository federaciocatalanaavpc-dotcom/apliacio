import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, bloquejaVoluntaris } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// Retorna els tipus comuns (creats per la federació) més els propis de
// l'associació indicada (la seva mateixa si no és federació).
router.get('/', async (req: AuthRequest, res) => {
  const agrupacioId =
    req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId!;
  const tipus = await prisma.tipusServei.findMany({
    where: { OR: [{ agrupacioId: null }, ...(agrupacioId ? [{ agrupacioId }] : [])] },
    orderBy: { nom: 'asc' },
  });
  res.json(tipus);
});

router.post('/', bloquejaVoluntaris, async (req: AuthRequest, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom del tipus de servei' });
  const agrupacioId = req.usuari!.rol === 'FEDERACIO' ? null : req.usuari!.agrupacioId;
  try {
    const tipus = await prisma.tipusServei.create({ data: { nom, agrupacioId } });
    res.status(201).json(tipus);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear el tipus de servei (potser ja existeix)" });
  }
});

router.patch('/:id', bloquejaVoluntaris, async (req: AuthRequest, res) => {
  const existent = await prisma.tipusServei.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Tipus de servei no trobat' });
  if (req.usuari!.rol !== 'FEDERACIO' && existent.agrupacioId !== req.usuari!.agrupacioId) {
    return res.status(403).json({ error: 'No pots editar aquest tipus de servei' });
  }
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom del tipus de servei' });
  try {
    const tipus = await prisma.tipusServei.update({ where: { id: req.params.id }, data: { nom } });
    res.json(tipus);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

router.delete('/:id', bloquejaVoluntaris, async (req: AuthRequest, res) => {
  const existent = await prisma.tipusServei.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Tipus de servei no trobat' });
  if (req.usuari!.rol !== 'FEDERACIO' && existent.agrupacioId !== req.usuari!.agrupacioId) {
    return res.status(403).json({ error: 'No pots eliminar aquest tipus de servei' });
  }
  try {
    await prisma.tipusServei.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: "No s'ha pogut eliminar el tipus de servei" });
  }
});

export default router;
