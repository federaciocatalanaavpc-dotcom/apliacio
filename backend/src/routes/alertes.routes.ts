import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { avisAdrecatA } from '../services/alertes.service';

// Alertes rebudes pel propi usuari (voluntari o administrador AVPC): llista,
// confirmació de lectura i resposta "vaig" / "no puc".
const router = Router();
router.use(requireAuth);

const DIES_VISIBLES = 30;

router.get('/meves', async (req: AuthRequest, res) => {
  const u = req.usuari!;
  const desde = new Date(Date.now() - DIES_VISIBLES * 24 * 3600_000);
  const avisos = await prisma.avis.findMany({
    where: {
      enviat: true,
      dataEnviament: { gte: desde },
      OR: [{ agrupacioId: null }, ...(u.agrupacioId ? [{ agrupacioId: u.agrupacioId }] : [])],
    },
    select: {
      id: true,
      titol: true,
      cos: true,
      dataEnviament: true,
      demanaResposta: true,
      lectures: { where: { usuariId: u.id }, select: { llegitEl: true, resposta: true, respostaEl: true } },
    },
    orderBy: { dataEnviament: 'desc' },
    take: 50,
  });
  res.json(avisos.map(({ lectures, ...a }) => ({ ...a, lectura: lectures[0] || null })));
});

async function carregarAvisPropi(req: AuthRequest, res: any) {
  const avis = await prisma.avis.findUnique({ where: { id: req.params.id } });
  if (!avis || !avisAdrecatA(avis, req.usuari!)) {
    res.status(404).json({ error: 'Alerta no trobada' });
    return null;
  }
  return avis;
}

router.post('/:id/llegit', async (req: AuthRequest, res) => {
  const avis = await carregarAvisPropi(req, res);
  if (!avis) return;
  await prisma.lecturaAvis.upsert({
    where: { avisId_usuariId: { avisId: avis.id, usuariId: req.usuari!.id } },
    update: {},
    create: { avisId: avis.id, usuariId: req.usuari!.id },
  });
  res.json({ ok: true });
});

router.post('/:id/resposta', async (req: AuthRequest, res) => {
  const avis = await carregarAvisPropi(req, res);
  if (!avis) return;
  const { resposta } = req.body;
  if (!avis.demanaResposta || !['VAIG', 'NO_PUC'].includes(resposta)) {
    return res.status(400).json({ error: 'Resposta no vàlida' });
  }
  const lectura = await prisma.lecturaAvis.upsert({
    where: { avisId_usuariId: { avisId: avis.id, usuariId: req.usuari!.id } },
    update: { resposta, respostaEl: new Date() },
    create: { avisId: avis.id, usuariId: req.usuari!.id, resposta, respostaEl: new Date() },
    select: { llegitEl: true, resposta: true, respostaEl: true },
  });
  res.json(lectura);
});

export default router;
