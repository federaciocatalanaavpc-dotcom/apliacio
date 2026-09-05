import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, potGestionarAgrupacio } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// Llista TOT el material de totes les agrupacions (només lectura fora de la
// pròpia), perquè en cas d'emergència es pugui saber què hi ha disponible a prop.
router.get('/', async (_req, res) => {
  const material = await prisma.material.findMany({
    include: { agrupacio: { select: { id: true, nom: true, municipi: true } } },
    orderBy: { nom: 'asc' },
  });
  res.json(material);
});

router.post('/', async (req: AuthRequest, res) => {
  const { agrupacioId, nom, quantitat, estat, notes } = req.body;
  const agrupacioFinal = req.usuari!.rol === 'FEDERACIO' ? agrupacioId : req.usuari!.agrupacioId;
  if (!agrupacioFinal || !nom) {
    return res.status(400).json({ error: "Cal indicar l'associació i el nom del material" });
  }
  if (!potGestionarAgrupacio(req, agrupacioFinal)) {
    return res.status(403).json({ error: 'No pots afegir material a una altra associació' });
  }
  try {
    const material = await prisma.material.create({
      data: {
        agrupacioId: agrupacioFinal,
        nom,
        quantitat: quantitat ?? 0,
        estat: estat || undefined,
        notes: notes || undefined,
      },
    });
    res.status(201).json(material);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear el material" });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.material.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Material no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: "No pots editar material d'una altra associació" });
  }
  const { nom, quantitat, estat, notes } = req.body;
  try {
    const material = await prisma.material.update({
      where: { id: req.params.id },
      data: { nom, quantitat, estat, notes: notes || null },
    });
    res.json(material);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis del material" });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.material.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Material no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: "No pots eliminar material d'una altra associació" });
  }
  await prisma.material.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
