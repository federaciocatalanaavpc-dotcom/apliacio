import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, potGestionarAgrupacio } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  const agrupacioId =
    req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId!;
  const membres = await prisma.membre.findMany({
    where: agrupacioId ? { agrupacioId } : undefined,
    include: { agrupacio: { select: { id: true, nom: true } }, documents: true },
    orderBy: [{ cognoms: 'asc' }, { nom: 'asc' }],
  });
  res.json(membres);
});

router.post('/', async (req: AuthRequest, res) => {
  const { agrupacioId, nom, cognoms, dni, dataNaixement, telefon, email, dataAlta, notes } = req.body;
  const agrupacioFinal = req.usuari!.rol === 'FEDERACIO' ? agrupacioId : req.usuari!.agrupacioId;
  if (!agrupacioFinal || !nom || !cognoms) {
    return res.status(400).json({ error: 'Falten camps obligatoris (associació, nom i cognoms)' });
  }
  if (!potGestionarAgrupacio(req, agrupacioFinal)) {
    return res.status(403).json({ error: "No pots crear membres d'una altra associació" });
  }
  try {
    const membre = await prisma.membre.create({
      data: {
        agrupacioId: agrupacioFinal,
        nom,
        cognoms,
        dni: dni || undefined,
        dataNaixement: dataNaixement ? new Date(dataNaixement) : undefined,
        telefon: telefon || undefined,
        email: email || undefined,
        dataAlta: dataAlta ? new Date(dataAlta) : undefined,
        notes: notes || undefined,
      },
    });
    res.status(201).json(membre);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear el membre" });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.membre.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Membre no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: "No pots editar membres d'una altra associació" });
  }
  const { nom, cognoms, dni, dataNaixement, telefon, email, dataBaixa, actiu, notes } = req.body;
  try {
    const membre = await prisma.membre.update({
      where: { id: req.params.id },
      data: {
        nom,
        cognoms,
        dni: dni || null,
        dataNaixement: dataNaixement ? new Date(dataNaixement) : null,
        telefon: telefon || null,
        email: email || null,
        dataBaixa: dataBaixa ? new Date(dataBaixa) : null,
        actiu,
        notes: notes || null,
      },
    });
    res.json(membre);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis del membre" });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.membre.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Membre no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: "No pots eliminar membres d'una altra associació" });
  }
  await prisma.membre.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
