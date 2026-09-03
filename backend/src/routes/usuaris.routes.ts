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
    return res.status(400).json({ error: "Cal indicar l'associació per a un usuari d'associació" });
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

// Genera un nom d'usuari (login) únic a partir d'un text lliure (p.ex. el
// nom de l'associació), traient accents i caràcters no alfanumèrics.
const DIACRITICS_REGEX = new RegExp('[̀-ͯ]', 'g');

async function generarUsuariUnic(base: string): Promise<string> {
  const arrel =
    base
      .normalize('NFD')
      .replace(DIACRITICS_REGEX, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 30) || 'associacio';

  let candidat = arrel;
  let comptador = 1;
  while (await prisma.usuari.findUnique({ where: { usuari: candidat } })) {
    comptador += 1;
    candidat = `${arrel}${comptador}`;
  }
  return candidat;
}

// Crea en un sol pas una associació nova, el seu usuari d'accés (amb un
// login generat automàticament a partir del nom) i el/la president/a com
// a primer membre del seu roster.
router.post('/nova-associacio', async (req, res) => {
  const { nomAssociacio, president, provincia, contrasenya } = req.body;
  if (!nomAssociacio || !president || !contrasenya) {
    return res.status(400).json({ error: "Falten camps obligatoris (nom de l'associació, president i contrasenya)" });
  }
  if (contrasenya.length < 6) {
    return res.status(400).json({ error: 'La contrasenya ha de tenir almenys 6 caràcters' });
  }

  const usuariLogin = await generarUsuariUnic(nomAssociacio);
  const contrasenyaHash = await bcrypt.hash(contrasenya, 10);
  const [primerNom, ...resta] = president.trim().split(/\s+/);
  const cognoms = resta.join(' ');

  try {
    const resultat = await prisma.$transaction(async (tx) => {
      const agrupacio = await tx.agrupacio.create({
        data: { nom: nomAssociacio, president, provincia: provincia || undefined },
      });
      await tx.membre.create({
        data: { agrupacioId: agrupacio.id, nom: primerNom, cognoms: cognoms || primerNom },
      });
      const usuari = await tx.usuari.create({
        data: {
          nom: president,
          usuari: usuariLogin,
          contrasenya: contrasenyaHash,
          rol: 'AGRUPACIO',
          agrupacioId: agrupacio.id,
        },
      });
      return { agrupacio, usuari };
    });

    const { contrasenya: _c, ...usuariResta } = resultat.usuari;
    res.status(201).json({ agrupacio: resultat.agrupacio, usuari: usuariResta });
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear l'associació i l'usuari" });
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
