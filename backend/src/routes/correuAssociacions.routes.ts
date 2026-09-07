import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireFederacio } from '../middleware/auth.middleware';
import { enviarCorreuMassiu } from '../services/mail.service';

const router = Router();
router.use(requireAuth);
router.use(requireFederacio);

// Envia un correu massiu a totes les associacions que tinguin un email
// registrat a la seva fitxa (Agrupacio.email), una petició per associació.
router.post('/', async (req, res) => {
  const { titol, missatge } = req.body;
  if (!titol || !missatge) return res.status(400).json({ error: 'Cal indicar el títol i el missatge' });

  const agrupacions = await prisma.agrupacio.findMany({
    where: { email: { not: null } },
    select: { email: true },
  });
  const destinataris = agrupacions.map((a) => a.email!).filter(Boolean);
  if (destinataris.length === 0) {
    return res.status(400).json({ error: 'Cap associació té un correu registrat' });
  }

  const enviats = await enviarCorreuMassiu(destinataris, titol, missatge);
  res.status(201).json({ ok: true, total: destinataris.length, enviats });
});

export default router;
