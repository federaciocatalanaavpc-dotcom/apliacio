import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, bloquejaVoluntaris } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);
router.use(bloquejaVoluntaris);

// Registre d'auditoria: la federació el veu tot (o filtrat per associació);
// una associació només el seu propi.
router.get('/', async (req: AuthRequest, res) => {
  const agrupacioId =
    req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId!;
  const entitat = req.query.entitat as string | undefined;
  const registres = await prisma.registreAuditoria.findMany({
    where: {
      ...(agrupacioId ? { agrupacioId } : {}),
      ...(entitat ? { entitat } : {}),
    },
    select: {
      id: true,
      accio: true,
      entitat: true,
      entitatId: true,
      detall: true,
      creatEl: true,
      usuari: { select: { id: true, nom: true } },
    },
    orderBy: { creatEl: 'desc' },
    take: 200,
  });
  res.json(registres);
});

export default router;
