import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireFederacio } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// Qualsevol usuari autenticat pot veure el llistat d'agrupacions (útil per
// saber qui és qui a la federació); només la federació les pot gestionar.
router.get('/', async (_req, res) => {
  const agrupacions = await prisma.agrupacio.findMany({ orderBy: { nom: 'asc' } });
  res.json(agrupacions);
});

router.post('/', requireFederacio, async (req, res) => {
  const { nom, municipi, comarca, adreca, telefon, email, president, dataFundacio } = req.body;
  if (!nom || !municipi) {
    return res.status(400).json({ error: "Cal indicar el nom i el municipi de l'associació" });
  }
  try {
    const agrupacio = await prisma.agrupacio.create({
      data: {
        nom,
        municipi,
        comarca: comarca || undefined,
        adreca: adreca || undefined,
        telefon: telefon || undefined,
        email: email || undefined,
        president: president || undefined,
        dataFundacio: dataFundacio ? new Date(dataFundacio) : undefined,
      },
    });
    res.status(201).json(agrupacio);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear l'associació" });
  }
});

router.patch('/:id', requireFederacio, async (req, res) => {
  const { nom, municipi, comarca, adreca, telefon, email, president, dataFundacio, actiu } = req.body;
  try {
    const agrupacio = await prisma.agrupacio.update({
      where: { id: req.params.id },
      data: {
        nom,
        municipi,
        comarca: comarca || null,
        adreca: adreca || null,
        telefon: telefon || null,
        email: email || null,
        president: president || null,
        dataFundacio: dataFundacio ? new Date(dataFundacio) : null,
        actiu,
      },
    });
    res.json(agrupacio);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis de l'associació" });
  }
});

router.delete('/:id', requireFederacio, async (req, res) => {
  try {
    await prisma.agrupacio.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(409).json({
      error: "No es pot eliminar l'associació perquè té dades associades (membres, vehicles...). Desactiva-la en lloc d'eliminar-la.",
    });
  }
});

export default router;
