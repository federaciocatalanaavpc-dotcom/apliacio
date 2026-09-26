import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, potGestionarAgrupacio, bloquejaVoluntaris } from '../middleware/auth.middleware';
import { enviarAvis } from '../services/scheduler.service';
import { destinatarisAvis } from '../services/alertes.service';

const router = Router();
router.use(requireAuth);
router.use(bloquejaVoluntaris);

router.get('/', async (req: AuthRequest, res) => {
  const agrupacioId =
    req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId;
  const avisos = await prisma.avis.findMany({
    where: agrupacioId ? { OR: [{ agrupacioId: null }, { agrupacioId }] } : undefined,
    include: { agrupacio: { select: { id: true, nom: true } } },
    orderBy: { dataEnviament: 'desc' },
  });
  res.json(avisos);
});

router.post('/', async (req: AuthRequest, res) => {
  const { titol, cos, agrupacioId, dataEnviament, demanaResposta } = req.body;
  if (!titol || !cos) return res.status(400).json({ error: "Cal indicar el títol i el text de l'avís" });

  // Una agrupació només pot avisar la seva pròpia gent; la federació pot
  // triar una agrupació concreta o deixar-ho en blanc per avisar tothom.
  const agrupacioFinal = req.usuari!.rol === 'FEDERACIO' ? agrupacioId || null : req.usuari!.agrupacioId;

  try {
    const avis = await prisma.avis.create({
      data: {
        titol,
        cos,
        demanaResposta: !!demanaResposta,
        agrupacioId: agrupacioFinal,
        dataEnviament: dataEnviament ? new Date(dataEnviament) : new Date(),
      },
    });
    if (avis.dataEnviament <= new Date()) {
      await enviarAvis(avis.id);
    }
    res.status(201).json(avis);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear l'avís" });
  }
});

// Seguiment d'un avís: qui l'ha llegit i qui ha respost "vaig" / "no puc".
router.get('/:id/seguiment', async (req: AuthRequest, res) => {
  const avis = await prisma.avis.findUnique({ where: { id: req.params.id } });
  if (!avis) return res.status(404).json({ error: 'Avís no trobat' });
  if (avis.agrupacioId ? !potGestionarAgrupacio(req, avis.agrupacioId) : req.usuari!.rol !== 'FEDERACIO') {
    return res.status(403).json({ error: "No pots veure el seguiment d'aquest avís" });
  }
  const [destinataris, lectures] = await Promise.all([
    destinatarisAvis(avis),
    prisma.lecturaAvis.findMany({ where: { avisId: avis.id } }),
  ]);
  const perUsuari = new Map(lectures.map((l) => [l.usuariId, l]));
  const files = destinataris.map((u) => {
    const l = perUsuari.get(u.id);
    return {
      nom: u.nom,
      estat: l?.resposta || (l ? 'LLEGIT' : 'PENDENT'),
      llegitEl: l?.llegitEl || null,
      respostaEl: l?.respostaEl || null,
    };
  });
  const compta = (e: string) => files.filter((f) => f.estat === e).length;
  res.json({
    demanaResposta: avis.demanaResposta,
    total: files.length,
    vaig: compta('VAIG'),
    noPuc: compta('NO_PUC'),
    llegits: files.filter((f) => f.estat !== 'PENDENT').length,
    pendents: compta('PENDENT'),
    destinataris: files.sort((a, b) => a.nom.localeCompare(b.nom)),
  });
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.avis.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Avís no trobat' });
  if (existent.agrupacioId && !potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: "No pots eliminar l'avís d'una altra associació" });
  }
  if (!existent.agrupacioId && req.usuari!.rol !== 'FEDERACIO') {
    return res.status(403).json({ error: 'Només la federació pot eliminar avisos generals' });
  }
  await prisma.avis.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
