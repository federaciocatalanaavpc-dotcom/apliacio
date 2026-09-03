import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma';
import { requireAuth, requireFederacio } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);
router.use(requireFederacio); // gestió d'usuaris, només per a la federació

router.get('/', async (_req, res) => {
  const usuaris = await prisma.usuari.findMany({
    include: { agrupacio: { select: { id: true, nom: true } } },
    orderBy: { nom: 'asc' },
  });
  res.json(usuaris.map(({ contrasenya, ...u }) => u));
});

router.post('/', async (req, res) => {
  const { nom, usuari, contrasenya, rol, agrupacioId } = req.body;
  if (!nom || !usuari || !contrasenya || !rol) {
    return res.status(400).json({ error: 'Falten camps obligatoris' });
  }
  if (rol === 'AGRUPACIO' && !agrupacioId) {
    return res.status(400).json({ error: "Cal indicar l'agrupació per a un usuari d'agrupació" });
  }
  try {
    const contrasenyaHash = await bcrypt.hash(contrasenya, 10);
    const nou = await prisma.usuari.create({
      data: {
        nom,
        usuari: usuari.toLowerCase(),
        contrasenya: contrasenyaHash,
        rol,
        agrupacioId: rol === 'AGRUPACIO' ? agrupacioId : null,
      },
    });
    const { contrasenya: _c, ...resta } = nou;
    res.status(201).json(resta);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear l'usuari (potser el nom d'usuari ja existeix)" });
  }
});

router.patch('/:id', async (req, res) => {
  const { nom, rol, agrupacioId, actiu, contrasenya } = req.body;
  try {
    const data: any = {
      nom,
      rol,
      agrupacioId: rol === 'AGRUPACIO' ? agrupacioId : rol ? null : undefined,
      actiu,
    };
    if (contrasenya) {
      data.contrasenya = await bcrypt.hash(contrasenya, 10);
    }
    const actualitzat = await prisma.usuari.update({ where: { id: req.params.id }, data });
    const { contrasenya: _c, ...resta } = actualitzat;
    res.json(resta);
  } catch {
    res.status(400).json({ error: "No s'ha pogut actualitzar l'usuari" });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.usuari.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(409).json({
      error: "No s'ha pogut eliminar l'usuari (potser té registres associats; prova de desactivar-lo en lloc d'eliminar-lo)",
    });
  }
});

export default router;
