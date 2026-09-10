import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { clauPublicaVapid, enviarNotificacio } from '../services/push.service';

const router = Router();

// Clau pública VAPID: el frontend la necessita per subscriure's (no cal estar loguejat per llegir-la)
router.get('/clau-publica', (_req, res) => {
  res.json({ clauPublica: clauPublicaVapid() });
});

router.use(requireAuth);

router.post('/subscriure', async (req: AuthRequest, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Subscripció incompleta' });
  }
  try {
    const u=new URL(endpoint);
    if(u.protocol!=='https:' || u.port || !['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com','wns2-par02p.notify.windows.com'].includes(u.hostname) && !u.hostname.endsWith('.push.apple.com') && !u.hostname.endsWith('.notify.windows.com')) return res.status(400).json({error:'Servei push no admès'});
  } catch {return res.status(400).json({error:'Subscripció no vàlida'});}
  await prisma.subscripcioPush.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, usuariId: req.usuari!.id },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, usuariId: req.usuari!.id },
  });
  res.status(201).json({ ok: true });
});

router.post('/desubscriure', async (req: AuthRequest, res) => {
  const { endpoint } = req.body;
  await prisma.subscripcioPush.deleteMany({ where: { endpoint, usuariId: req.usuari!.id } });
  res.json({ ok: true });
});

router.post('/prova', async (req: AuthRequest, res) => {
  await enviarNotificacio(req.usuari!.id, 'AVPC Federació', 'Notificacions activades correctament.');
  res.json({ ok: true });
});

export default router;
