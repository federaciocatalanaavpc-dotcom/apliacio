import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, bloquejaVoluntaris } from '../middleware/auth.middleware';
import { enviarNotificacio } from '../services/push.service';

const router = Router();
router.use(requireAuth);
router.use(bloquejaVoluntaris);

// Envia una notificació push només als usuaris de la federació (per a
// associacions que necessiten escalar-hi alguna cosa urgent).
router.post('/', async (req: AuthRequest, res) => {
  const { titol, missatge } = req.body;
  if (!titol || !missatge) return res.status(400).json({ error: 'Cal indicar el títol i el missatge' });

  const usuarisFederacio = await prisma.usuari.findMany({ where: { rol: 'FEDERACIO' }, select: { id: true } });
  for (const u of usuarisFederacio) {
    await enviarNotificacio(u.id, titol, missatge);
  }
  res.status(201).json({ ok: true, notificats: usuarisFederacio.length });
});

export default router;
