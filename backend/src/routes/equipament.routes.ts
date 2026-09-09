import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, potGestionarAgrupacio, bloquejaVoluntaris } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

const SELECCIO_ARTICLE = {
  id: true,
  agrupacioId: true,
  tipus: true,
  nom: true,
  talla: true,
  estocTotal: true,
  notes: true,
  creatEl: true,
  agrupacio: { select: { id: true, nom: true, municipi: true } },
  _count: { select: { assignacions: true } },
} as const;

const SELECCIO_ASSIGNACIO = {
  id: true,
  articleId: true,
  voluntariId: true,
  quantitat: true,
  dataAssignacio: true,
  dataRetorn: true,
  notes: true,
  creatEl: true,
  article: { select: { id: true, tipus: true, nom: true, talla: true, agrupacioId: true } },
  voluntari: { select: { id: true, nom: true, cognoms: true } },
} as const;

function agrupacioSollicitada(req: AuthRequest): string | undefined {
  return req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId!;
}

// L'equipament (roba i EPI) que el propi voluntari té assignat ara mateix
// (i, si es demana, també l'historial de retornades).
router.get('/assignacions/meves', async (req: AuthRequest, res) => {
  if (!['VOLUNTARI', 'ADMIN_AVPC'].includes(req.usuari!.rol)) return res.status(403).json({ error: 'Només per a comptes de voluntari' });
  const voluntari = await prisma.voluntari.findUnique({ where: { usuariId: req.usuari!.id } });
  if (!voluntari) return res.status(404).json({ error: 'Fitxa de voluntari no trobada' });
  const nomesActives = req.query.actives !== 'false';
  const assignacions = await prisma.assignacioEquipament.findMany({
    where: { voluntariId: voluntari.id, ...(nomesActives ? { dataRetorn: null } : {}) },
    select: SELECCIO_ASSIGNACIO,
    orderBy: { dataAssignacio: 'desc' },
  });
  res.json(assignacions);
});

router.use(bloquejaVoluntaris);

// --- Articles (estoc) ---

router.get('/articles', async (req: AuthRequest, res) => {
  const agrupacioId = agrupacioSollicitada(req);
  const tipus = req.query.tipus as string | undefined;
  const articles = await prisma.articleEquipament.findMany({
    where: { ...(agrupacioId ? { agrupacioId } : {}), ...(tipus ? { tipus: tipus as any } : {}) },
    select: SELECCIO_ARTICLE,
    orderBy: { nom: 'asc' },
  });
  const assignats = await prisma.assignacioEquipament.groupBy({
    by: ['articleId'],
    where: { dataRetorn: null, articleId: { in: articles.map((a) => a.id) } },
    _sum: { quantitat: true },
  });
  const assignatsPerArticle = new Map(assignats.map((a) => [a.articleId, a._sum.quantitat || 0]));
  res.json(
    articles.map((a) => ({ ...a, estocAssignat: assignatsPerArticle.get(a.id) || 0, estocLliure: a.estocTotal - (assignatsPerArticle.get(a.id) || 0) }))
  );
});

router.post('/articles', async (req: AuthRequest, res) => {
  const { agrupacioId, tipus, nom, talla, estocTotal, notes } = req.body;
  const agrupacioFinal = req.usuari!.rol === 'FEDERACIO' ? agrupacioId : req.usuari!.agrupacioId;
  if (!agrupacioFinal || !tipus || !nom) {
    return res.status(400).json({ error: "Cal indicar l'associació, el tipus i el nom" });
  }
  if (!potGestionarAgrupacio(req, agrupacioFinal)) {
    return res.status(403).json({ error: 'No pots afegir equipament a una altra associació' });
  }
  try {
    const article = await prisma.articleEquipament.create({
      data: {
        agrupacioId: agrupacioFinal,
        tipus,
        nom,
        talla: talla || undefined,
        estocTotal: estocTotal ? Number(estocTotal) : 0,
        notes: notes || undefined,
      },
      select: SELECCIO_ARTICLE,
    });
    res.status(201).json({ ...article, estocAssignat: 0, estocLliure: article.estocTotal });
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear l'article" });
  }
});

router.patch('/articles/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.articleEquipament.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Article no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: "No pots editar aquest article" });
  }
  const { nom, talla, estocTotal, notes } = req.body;
  try {
    const article = await prisma.articleEquipament.update({
      where: { id: req.params.id },
      data: {
        nom: nom !== undefined ? nom : existent.nom,
        talla: talla !== undefined ? (talla || null) : existent.talla,
        estocTotal: estocTotal !== undefined ? Number(estocTotal) : existent.estocTotal,
        notes: notes !== undefined ? (notes || null) : existent.notes,
      },
      select: SELECCIO_ARTICLE,
    });
    res.json(article);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

router.delete('/articles/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.articleEquipament.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Article no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: "No pots eliminar aquest article" });
  }
  try {
    await prisma.articleEquipament.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(409).json({ error: "No es pot eliminar (té assignacions registrades)" });
  }
});

// --- Assignacions (control per voluntari) ---

router.get('/assignacions', async (req: AuthRequest, res) => {
  const agrupacioId = agrupacioSollicitada(req);
  const tipus = req.query.tipus as string | undefined;
  const voluntariId = req.query.voluntariId as string | undefined;
  const nomesActives = req.query.actives === 'true';
  const assignacions = await prisma.assignacioEquipament.findMany({
    where: {
      ...(voluntariId ? { voluntariId } : {}),
      ...(nomesActives ? { dataRetorn: null } : {}),
      article: {
        ...(agrupacioId ? { agrupacioId } : {}),
        ...(tipus ? { tipus: tipus as any } : {}),
      },
    },
    select: SELECCIO_ASSIGNACIO,
    orderBy: { dataAssignacio: 'desc' },
  });
  res.json(assignacions);
});

router.post('/assignacions', async (req: AuthRequest, res) => {
  const { articleId, voluntariId, quantitat, notes } = req.body;
  if (!articleId || !voluntariId) {
    return res.status(400).json({ error: "Cal indicar l'article i el voluntari" });
  }
  const article = await prisma.articleEquipament.findUnique({ where: { id: articleId } });
  if (!article) return res.status(404).json({ error: 'Article no trobat' });
  if (!potGestionarAgrupacio(req, article.agrupacioId)) {
    return res.status(403).json({ error: 'No pots assignar equipament a una altra associació' });
  }
  const voluntari = await prisma.voluntari.findUnique({ where: { id: voluntariId } });
  if (!voluntari || voluntari.agrupacioId !== article.agrupacioId) {
    return res.status(400).json({ error: 'El voluntari no pertany a la mateixa associació que l\'article' });
  }
  const quantitatFinal = quantitat ? Number(quantitat) : 1;

  try {
    const assignacio = await prisma.$transaction(async (tx) => {
      const assignatAra = await tx.assignacioEquipament.aggregate({
        where: { articleId, dataRetorn: null },
        _sum: { quantitat: true },
      });
      const lliure = article.estocTotal - (assignatAra._sum.quantitat || 0);
      if (quantitatFinal > lliure) {
        throw new Error('ESTOC_INSUFICIENT');
      }
      return tx.assignacioEquipament.create({
        data: { articleId, voluntariId, quantitat: quantitatFinal, notes: notes || undefined },
        select: SELECCIO_ASSIGNACIO,
      });
    });
    res.status(201).json(assignacio);
  } catch (err: any) {
    if (err.message === 'ESTOC_INSUFICIENT') {
      return res.status(400).json({ error: 'No hi ha prou estoc lliure d\'aquest article' });
    }
    res.status(400).json({ error: "No s'ha pogut crear l'assignació" });
  }
});

// Marca l'assignació com a retornada (allibera estoc) o desa canvis a notes/quantitat.
router.patch('/assignacions/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.assignacioEquipament.findUnique({
    where: { id: req.params.id },
    include: { article: true },
  });
  if (!existent) return res.status(404).json({ error: 'Assignació no trobada' });
  if (!potGestionarAgrupacio(req, existent.article.agrupacioId)) {
    return res.status(403).json({ error: "No pots editar aquesta assignació" });
  }
  const { retornar, notes } = req.body;
  try {
    const assignacio = await prisma.assignacioEquipament.update({
      where: { id: req.params.id },
      data: {
        dataRetorn: retornar !== undefined ? (retornar ? new Date() : null) : existent.dataRetorn,
        notes: notes !== undefined ? (notes || null) : existent.notes,
      },
      select: SELECCIO_ASSIGNACIO,
    });
    res.json(assignacio);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

router.delete('/assignacions/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.assignacioEquipament.findUnique({
    where: { id: req.params.id },
    include: { article: true },
  });
  if (!existent) return res.status(404).json({ error: 'Assignació no trobada' });
  if (!potGestionarAgrupacio(req, existent.article.agrupacioId)) {
    return res.status(403).json({ error: "No pots eliminar aquesta assignació" });
  }
  await prisma.assignacioEquipament.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
