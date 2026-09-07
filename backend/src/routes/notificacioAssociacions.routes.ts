import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireFederacio } from '../middleware/auth.middleware';
import { enviarNotificacio } from '../services/push.service';

const router = Router();
router.use(requireAuth);
router.use(requireFederacio);

// Envia una notificació push a tots els usuaris d'associació (un compte
// per associació), per a comunicats generals de la federació.
router.post('/', async (req, res) => {
  const { titol, missatge } = req.body;
  if (!titol || !missatge) return res.status(400).json({ error: 'Cal indicar el títol i el missatge' });

  const usuarisAssociacio = await prisma.usuari.findMany({ where: { rol: 'AGRUPACIO' }, select: { id: true } });
  for (const u of usuarisAssociacio) {
    await enviarNotificacio(u.id, titol, missatge);
  }
  res.status(201).json({ ok: true, notificats: usuarisAssociacio.length });
});

export default router;
