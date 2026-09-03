import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, potGestionarAgrupacio } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// Llista les formacions comunes de la federació (agrupacioId nul) més les
// pròpies de l'associació de l'usuari (o d'una associació concreta, si ho tria la federació)
router.get('/', async (req: AuthRequest, res) => {
  const agrupacioId =
    req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId;
  const formacions = await prisma.formacio.findMany({
    where: agrupacioId ? { OR: [{ agrupacioId: null }, { agrupacioId }] } : undefined,
    include: {
      agrupacio: { select: { id: true, nom: true } },
      inscripcions: { include: { membre: { select: { id: true, nom: true, cognoms: true, agrupacioId: true } } } },
    },
    orderBy: { creatEl: 'desc' },
  });
  res.json(formacions);
});

router.post('/', async (req: AuthRequest, res) => {
  const { nom, descripcio, agrupacioId, dataProgramada, obligatoria } = req.body;
  if (!nom) return res.status(400).json({ error: 'Cal indicar el nom de la formació' });

  const agrupacioFinal = req.usuari!.rol === 'FEDERACIO' ? agrupacioId || null : req.usuari!.agrupacioId;

  try {
    const formacio = await prisma.formacio.create({
      data: {
        nom,
        descripcio: descripcio || undefined,
        agrupacioId: agrupacioFinal,
        dataProgramada: dataProgramada ? new Date(dataProgramada) : undefined,
        obligatoria: !!obligatoria,
      },
    });
    res.status(201).json(formacio);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear la formació" });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.formacio.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Formació no trobada' });
  if (existent.agrupacioId && !potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: 'No pots eliminar aquesta formació' });
  }
  if (!existent.agrupacioId && req.usuari!.rol !== 'FEDERACIO') {
    return res.status(403).json({ error: 'Només la federació pot eliminar formacions comunes' });
  }
  await prisma.formacio.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Inscriu o actualitza l'estat d'un membre en una formació
router.post('/:id/inscripcions', async (req: AuthRequest, res) => {
  const { membreId, estat } = req.body;
  const formacio = await prisma.formacio.findUnique({ where: { id: req.params.id } });
  if (!formacio) return res.status(404).json({ error: 'Formació no trobada' });
  const membre = await prisma.membre.findUnique({ where: { id: membreId } });
  if (!membre) return res.status(404).json({ error: 'Membre no trobat' });
  if (!potGestionarAgrupacio(req, membre.agrupacioId)) {
    return res.status(403).json({ error: "No pots inscriure membres d'una altra associació" });
  }
  try {
    const inscripcio = await prisma.formacioMembre.upsert({
      where: { formacioId_membreId: { formacioId: req.params.id, membreId } },
      update: {
        estat: estat || 'PENDENT',
        dataCompletada: estat === 'COMPLETADA' ? new Date() : null,
      },
      create: {
        formacioId: req.params.id,
        membreId,
        estat: estat || 'PENDENT',
        dataCompletada: estat === 'COMPLETADA' ? new Date() : undefined,
      },
    });
    res.status(201).json(inscripcio);
  } catch {
    res.status(400).json({ error: "No s'ha pogut desar la inscripció" });
  }
});

router.delete('/inscripcions/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.formacioMembre.findUnique({ where: { id: req.params.id }, include: { membre: true } });
  if (!existent) return res.status(404).json({ error: 'Inscripció no trobada' });
  if (!potGestionarAgrupacio(req, existent.membre.agrupacioId)) {
    return res.status(403).json({ error: 'No pots eliminar aquesta inscripció' });
  }
  await prisma.formacioMembre.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
