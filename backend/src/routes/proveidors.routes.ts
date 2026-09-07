import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, potGestionarAgrupacio, bloquejaVoluntaris } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);
router.use(bloquejaVoluntaris);

const SELECCIO = {
  id: true,
  agrupacioId: true,
  nom: true,
  categoria: true,
  contacte: true,
  telefon: true,
  email: true,
  adreca: true,
  notes: true,
  actiu: true,
  creatEl: true,
  agrupacio: { select: { id: true, nom: true, municipi: true } },
} as const;

// Directori compartit: totes les associacions autenticades poden consultar
// els proveïdors aportats per la resta d'AVPC. Els permisos d'edició i
// eliminació continuen limitats a la pròpia associació (o Federació).
router.get('/', async (req: AuthRequest, res) => {
  const agrupacioId = req.query.agrupacioId as string | undefined;
  const nomesMeus = req.query.nomesMeus === 'true';

  let filtreAgrupacio: string | undefined;
  if (req.usuari!.rol === 'FEDERACIO') {
    filtreAgrupacio = agrupacioId;
  } else if (nomesMeus) {
    filtreAgrupacio = req.usuari!.agrupacioId || undefined;
  }

  const proveidors = await prisma.proveidor.findMany({
    where: filtreAgrupacio ? { agrupacioId: filtreAgrupacio } : undefined,
    select: SELECCIO,
    orderBy: [{ nom: 'asc' }, { creatEl: 'desc' }],
  });
  res.json(proveidors);
});

router.post('/', async (req: AuthRequest, res) => {
  const { agrupacioId, nom, categoria, contacte, telefon, email, adreca, notes } = req.body;

  const agrupacioFinal = req.usuari!.rol === 'FEDERACIO' ? agrupacioId : req.usuari!.agrupacioId;
  if (!agrupacioFinal || !nom) {
    return res.status(400).json({ error: "Cal indicar l'associació i el nom" });
  }
  if (!potGestionarAgrupacio(req, agrupacioFinal)) {
    return res.status(403).json({ error: 'No pots afegir proveïdors a una altra associació' });
  }

  try {
    const proveidor = await prisma.proveidor.create({
      data: {
        agrupacioId: agrupacioFinal,
        nom,
        categoria: categoria || undefined,
        contacte: contacte || undefined,
        telefon: telefon || undefined,
        email: email || undefined,
        adreca: adreca || undefined,
        notes: notes || undefined,
      },
      select: SELECCIO,
    });
    res.status(201).json(proveidor);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear el proveïdor" });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.proveidor.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Proveïdor no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: 'No pots editar aquest proveïdor' });
  }
  const { nom, categoria, contacte, telefon, email, adreca, notes, actiu } = req.body;
  try {
    const proveidor = await prisma.proveidor.update({
      where: { id: req.params.id },
      data: {
        nom,
        categoria: categoria || null,
        contacte: contacte || null,
        telefon: telefon || null,
        email: email || null,
        adreca: adreca || null,
        notes: notes || null,
        actiu,
      },
      select: SELECCIO,
    });
    res.json(proveidor);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.proveidor.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Proveïdor no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: 'No pots eliminar aquest proveïdor' });
  }
  await prisma.proveidor.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
