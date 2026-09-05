import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, potGestionarAgrupacio } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

const SELECCIO = {
  id: true,
  agrupacioId: true,
  titol: true,
  numeracio: true,
  maxAssistents: true,
  collaboracioEmergencies: true,
  dataInici: true,
  dataFi: true,
  limitInscripcio: true,
  horaBase: true,
  horaSortida: true,
  tipus: true,
  categoria: true,
  localitat: true,
  sollicitant: true,
  latitud: true,
  longitud: true,
  adreca: true,
  descripcio: true,
  destinataris: true,
  arxivat: true,
  creatEl: true,
  creatPer: { select: { id: true, nom: true } },
  agrupacio: { select: { id: true, nom: true } },
  _count: { select: { assistencies: true } },
} as const;

function destinatariAfecta(destinataris: string | null, disponibilitat: string): boolean {
  if (!destinataris || destinataris === 'TOTS') return true;
  return destinataris.split(',').includes(disponibilitat);
}

router.get('/', async (req: AuthRequest, res) => {
  if (req.usuari!.rol === 'VOLUNTARI') {
    const voluntari = await prisma.voluntari.findUnique({ where: { usuariId: req.usuari!.id } });
    if (!voluntari) return res.status(404).json({ error: 'Fitxa de voluntari no trobada' });
    const serveis = await prisma.servei.findMany({
      where: { agrupacioId: voluntari.agrupacioId, arxivat: false },
      select: { ...SELECCIO, assistencies: { where: { voluntariId: voluntari.id } } },
      orderBy: { dataInici: 'asc' },
    });
    const visibles = serveis.filter((s) => s.assistencies.length > 0 || destinatariAfecta(s.destinataris, voluntari.disponibilitat));
    return res.json(
      visibles.map((s) => ({ ...s, assistenciaPropia: s.assistencies[0] || null, assistencies: undefined }))
    );
  }

  const agrupacioId =
    req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId!;
  const arxivat = req.query.arxivat === 'true';
  const serveis = await prisma.servei.findMany({
    where: { ...(agrupacioId ? { agrupacioId } : {}), arxivat },
    select: SELECCIO,
    orderBy: { dataInici: 'desc' },
  });
  res.json(serveis);
});

// Dades agregades per a Estadístiques: tots els serveis (oberts i arxivats)
// d'una associació amb les seves assistències, perquè el frontend pugui
// construir els gràfics (per tipus, per voluntari, en el temps) i l'informe
// PDF sense haver de fer una petició per servei.
router.get('/estadistiques/dades', async (req: AuthRequest, res) => {
  if (req.usuari!.rol === 'VOLUNTARI') return res.status(403).json({ error: 'No autoritzat' });
  const agrupacioId =
    req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId!;
  if (!agrupacioId) return res.status(400).json({ error: "Cal indicar l'associació" });
  const serveis = await prisma.servei.findMany({
    where: { agrupacioId },
    select: {
      id: true,
      titol: true,
      tipus: true,
      categoria: true,
      dataInici: true,
      arxivat: true,
      assistencies: {
        select: {
          confirmat: true,
          horesRealitzades: true,
          voluntari: { select: { id: true, nom: true, cognoms: true } },
        },
      },
    },
    orderBy: { dataInici: 'asc' },
  });
  res.json(serveis);
});

router.get('/:id', async (req: AuthRequest, res) => {
  const servei = await prisma.servei.findUnique({
    where: { id: req.params.id },
    select: {
      ...SELECCIO,
      assistencies: {
        include: { voluntari: { select: { id: true, nom: true, cognoms: true, indicatiu: true } } },
      },
    },
  });
  if (!servei) return res.status(404).json({ error: 'Servei no trobat' });
  if (req.usuari!.rol === 'VOLUNTARI') {
    const voluntari = await prisma.voluntari.findUnique({ where: { usuariId: req.usuari!.id } });
    if (!voluntari || voluntari.agrupacioId !== servei.agrupacioId) {
      return res.status(403).json({ error: 'No pots veure aquest servei' });
    }
  } else if (!potGestionarAgrupacio(req, servei.agrupacioId)) {
    return res.status(403).json({ error: 'No pots veure aquest servei' });
  }
  res.json(servei);
});

router.post('/', async (req: AuthRequest, res) => {
  if (req.usuari!.rol === 'VOLUNTARI') return res.status(403).json({ error: 'No autoritzat' });
  const {
    agrupacioId,
    titol,
    numeracio,
    maxAssistents,
    collaboracioEmergencies,
    dataInici,
    dataFi,
    limitInscripcio,
    horaBase,
    horaSortida,
    tipus,
    categoria,
    localitat,
    sollicitant,
    latitud,
    longitud,
    adreca,
    descripcio,
    destinataris,
  } = req.body;

  const agrupacioFinal = req.usuari!.rol === 'FEDERACIO' ? agrupacioId : req.usuari!.agrupacioId;
  if (!agrupacioFinal || !titol || !dataInici || !dataFi) {
    return res.status(400).json({ error: "Cal indicar l'associació, el títol i les dates d'inici i fi" });
  }
  if (!potGestionarAgrupacio(req, agrupacioFinal)) {
    return res.status(403).json({ error: "No pots crear serveis per a una altra associació" });
  }
  try {
    const servei = await prisma.servei.create({
      data: {
        agrupacioId: agrupacioFinal,
        titol,
        numeracio: numeracio || undefined,
        maxAssistents: maxAssistents ? Number(maxAssistents) : undefined,
        collaboracioEmergencies: !!collaboracioEmergencies,
        dataInici: new Date(dataInici),
        dataFi: new Date(dataFi),
        limitInscripcio: limitInscripcio ? new Date(limitInscripcio) : undefined,
        horaBase: horaBase ? new Date(horaBase) : undefined,
        horaSortida: horaSortida ? new Date(horaSortida) : undefined,
        tipus: tipus || undefined,
        categoria: categoria || undefined,
        localitat: localitat || undefined,
        sollicitant: sollicitant || undefined,
        latitud: latitud !== undefined && latitud !== '' ? Number(latitud) : undefined,
        longitud: longitud !== undefined && longitud !== '' ? Number(longitud) : undefined,
        adreca: adreca || undefined,
        descripcio: descripcio || undefined,
        destinataris: destinataris || 'TOTS',
        creatPerId: req.usuari!.id,
      },
      select: SELECCIO,
    });
    res.status(201).json(servei);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear el servei" });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.servei.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Servei no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: 'No pots editar aquest servei' });
  }
  const {
    titol,
    numeracio,
    maxAssistents,
    collaboracioEmergencies,
    dataInici,
    dataFi,
    limitInscripcio,
    horaBase,
    horaSortida,
    tipus,
    categoria,
    localitat,
    sollicitant,
    latitud,
    longitud,
    adreca,
    descripcio,
    destinataris,
    arxivat,
  } = req.body;
  try {
    const servei = await prisma.servei.update({
      where: { id: req.params.id },
      data: {
        titol,
        numeracio: numeracio || null,
        maxAssistents: maxAssistents ? Number(maxAssistents) : null,
        collaboracioEmergencies: !!collaboracioEmergencies,
        dataInici: dataInici ? new Date(dataInici) : undefined,
        dataFi: dataFi ? new Date(dataFi) : undefined,
        limitInscripcio: limitInscripcio ? new Date(limitInscripcio) : null,
        horaBase: horaBase ? new Date(horaBase) : null,
        horaSortida: horaSortida ? new Date(horaSortida) : null,
        tipus: tipus || null,
        categoria: categoria || null,
        localitat: localitat || null,
        sollicitant: sollicitant || null,
        latitud: latitud !== undefined && latitud !== null && latitud !== '' ? Number(latitud) : null,
        longitud: longitud !== undefined && longitud !== null && longitud !== '' ? Number(longitud) : null,
        adreca: adreca || null,
        descripcio: descripcio || null,
        destinataris: destinataris || 'TOTS',
        arxivat,
      },
      select: SELECCIO,
    });
    res.json(servei);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.servei.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Servei no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: 'No pots eliminar aquest servei' });
  }
  await prisma.servei.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// El voluntari confirma o cancel·la la seva pròpia assistència.
router.post('/:id/confirmar', async (req: AuthRequest, res) => {
  if (req.usuari!.rol !== 'VOLUNTARI') return res.status(403).json({ error: 'Només per a comptes de voluntari' });
  const voluntari = await prisma.voluntari.findUnique({ where: { usuariId: req.usuari!.id } });
  if (!voluntari) return res.status(404).json({ error: 'Fitxa de voluntari no trobada' });
  const servei = await prisma.servei.findUnique({ where: { id: req.params.id } });
  if (!servei || servei.agrupacioId !== voluntari.agrupacioId) {
    return res.status(404).json({ error: 'Servei no trobat' });
  }
  const assistencia = await prisma.assistenciaServei.upsert({
    where: { serveiId_voluntariId: { serveiId: servei.id, voluntariId: voluntari.id } },
    update: { confirmat: true },
    create: { serveiId: servei.id, voluntariId: voluntari.id, confirmat: true },
  });
  res.json(assistencia);
});

router.post('/:id/cancelar', async (req: AuthRequest, res) => {
  if (req.usuari!.rol !== 'VOLUNTARI') return res.status(403).json({ error: 'Només per a comptes de voluntari' });
  const voluntari = await prisma.voluntari.findUnique({ where: { usuariId: req.usuari!.id } });
  if (!voluntari) return res.status(404).json({ error: 'Fitxa de voluntari no trobada' });
  await prisma.assistenciaServei.updateMany({
    where: { serveiId: req.params.id, voluntariId: voluntari.id },
    data: { confirmat: false },
  });
  res.json({ ok: true });
});

// L'associació marca les hores reals fetes per un voluntari en un servei.
router.patch('/:id/assistencies/:voluntariId', async (req: AuthRequest, res) => {
  const servei = await prisma.servei.findUnique({ where: { id: req.params.id } });
  if (!servei) return res.status(404).json({ error: 'Servei no trobat' });
  if (!potGestionarAgrupacio(req, servei.agrupacioId)) {
    return res.status(403).json({ error: 'No pots editar les assistències d\'aquest servei' });
  }
  const { horaEntrada, horaSortida, horesRealitzades, notes, confirmat } = req.body;
  const assistencia = await prisma.assistenciaServei.upsert({
    where: { serveiId_voluntariId: { serveiId: req.params.id, voluntariId: req.params.voluntariId } },
    update: {
      horaEntrada: horaEntrada ? new Date(horaEntrada) : undefined,
      horaSortida: horaSortida ? new Date(horaSortida) : undefined,
      horesRealitzades: horesRealitzades !== undefined ? Number(horesRealitzades) : undefined,
      notes: notes || undefined,
      confirmat: confirmat !== undefined ? !!confirmat : undefined,
    },
    create: {
      serveiId: req.params.id,
      voluntariId: req.params.voluntariId,
      horaEntrada: horaEntrada ? new Date(horaEntrada) : undefined,
      horaSortida: horaSortida ? new Date(horaSortida) : undefined,
      horesRealitzades: horesRealitzades !== undefined ? Number(horesRealitzades) : undefined,
      notes: notes || undefined,
      confirmat: !!confirmat,
    },
  });
  res.json(assistencia);
});

export default router;
