import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, potGestionarAgrupacio } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  const agrupacioId =
    req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId!;
  const vehicles = await prisma.vehicle.findMany({
    where: agrupacioId ? { agrupacioId } : undefined,
    include: { agrupacio: { select: { id: true, nom: true } } },
    orderBy: { matricula: 'asc' },
  });
  res.json(vehicles);
});

router.post('/', async (req: AuthRequest, res) => {
  const { agrupacioId, matricula, tipus, marca, model, propietat, empresaRenting, proximaRevisio, notes } = req.body;
  const agrupacioFinal = req.usuari!.rol === 'FEDERACIO' ? agrupacioId : req.usuari!.agrupacioId;
  if (!agrupacioFinal || !propietat) {
    return res.status(400).json({ error: "Cal indicar l'associació i la propietat del vehicle" });
  }
  if (!potGestionarAgrupacio(req, agrupacioFinal)) {
    return res.status(403).json({ error: "No pots crear vehicles d'una altra associació" });
  }
  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        agrupacioId: agrupacioFinal,
        matricula: matricula || undefined,
        tipus: tipus || undefined,
        marca: marca || undefined,
        model: model || undefined,
        propietat,
        empresaRenting: empresaRenting || undefined,
        proximaRevisio: proximaRevisio ? new Date(proximaRevisio) : undefined,
        notes: notes || undefined,
      },
    });
    res.status(201).json(vehicle);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear el vehicle (potser la matrícula ja existeix)" });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Vehicle no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: "No pots editar vehicles d'una altra associació" });
  }
  const { matricula, tipus, marca, model, propietat, empresaRenting, proximaRevisio, notes } = req.body;
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        matricula: matricula || null,
        tipus: tipus || null,
        marca: marca || null,
        model: model || null,
        propietat,
        empresaRenting: empresaRenting || null,
        proximaRevisio: proximaRevisio ? new Date(proximaRevisio) : null,
        notes: notes || null,
      },
    });
    res.json(vehicle);
  } catch {
    res.status(400).json({ error: "No s'ha pogut actualitzar el vehicle" });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Vehicle no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: "No pots eliminar vehicles d'una altra associació" });
  }
  await prisma.vehicle.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
