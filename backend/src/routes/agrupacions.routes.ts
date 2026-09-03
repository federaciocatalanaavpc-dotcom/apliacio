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
  const { nom, provincia, municipi, comarca, adreca, telefon, email, president, dataFundacio, latitud, longitud } = req.body;
  if (!nom) {
    return res.status(400).json({ error: "Cal indicar el nom de l'associació" });
  }
  try {
    const agrupacio = await prisma.agrupacio.create({
      data: {
        nom,
        provincia: provincia || undefined,
        municipi: municipi || undefined,
        comarca: comarca || undefined,
        adreca: adreca || undefined,
        telefon: telefon || undefined,
        email: email || undefined,
        president: president || undefined,
        dataFundacio: dataFundacio ? new Date(dataFundacio) : undefined,
        latitud: latitud !== undefined && latitud !== '' ? Number(latitud) : undefined,
        longitud: longitud !== undefined && longitud !== '' ? Number(longitud) : undefined,
      },
    });
    res.status(201).json(agrupacio);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear l'associació" });
  }
});

// El nom de l'associació i el nom dels seus usuaris han d'anar sempre
// lligats: si es canvia el nom aquí, es sincronitza als seus usuaris.
router.patch('/:id', requireFederacio, async (req, res) => {
  const { nom, provincia, municipi, comarca, adreca, telefon, email, president, dataFundacio, actiu, latitud, longitud } = req.body;
  try {
    const agrupacio = await prisma.$transaction(async (tx) => {
      const actualitzada = await tx.agrupacio.update({
        where: { id: req.params.id },
        data: {
          nom,
          provincia: provincia || null,
          municipi: municipi || null,
          comarca: comarca || null,
          adreca: adreca || null,
          telefon: telefon || null,
          email: email || null,
          president: president || null,
          dataFundacio: dataFundacio ? new Date(dataFundacio) : null,
          latitud: latitud !== undefined && latitud !== '' ? Number(latitud) : null,
          longitud: longitud !== undefined && longitud !== '' ? Number(longitud) : null,
          actiu,
        },
      });
      if (nom) {
        await tx.usuari.updateMany({
          where: { agrupacioId: req.params.id, rol: 'AGRUPACIO' },
          data: { nom },
        });
      }
      return actualitzada;
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
      error: "No es pot eliminar l'associació perquè té dades associades (vehicles, material...). Desactiva-la en lloc d'eliminar-la.",
    });
  }
});

export default router;
