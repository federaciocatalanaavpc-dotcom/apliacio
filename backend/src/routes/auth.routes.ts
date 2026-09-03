import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'canvia_aquest_secret';

// Registre del primer usuari (només funciona si encara no hi ha cap usuari a la base
// de dades). Un cop creat el primer usuari de la federació, aquesta ruta queda tancada
// per sempre; la resta d'usuaris s'han de crear des de /api/usuaris.
router.post('/registre', async (req, res) => {
  const { nom, usuari, contrasenya } = req.body;
  if (!nom || !usuari || !contrasenya) {
    return res.status(400).json({ error: 'Falten camps obligatoris' });
  }
  if (contrasenya.length < 6) {
    return res.status(400).json({ error: 'La contrasenya ha de tenir almenys 6 caràcters' });
  }
  const hiHaUsuaris = (await prisma.usuari.count()) > 0;
  if (hiHaUsuaris) {
    return res.status(403).json({
      error: 'El registre obert només es pot fer servir per crear el primer usuari. Demana a la federació que et creï el compte.',
    });
  }
  try {
    const contrasenyaHash = await bcrypt.hash(contrasenya, 10);
    const nouUsuari = await prisma.usuari.create({
      data: { nom, usuari: usuari.toLowerCase(), contrasenya: contrasenyaHash, rol: 'FEDERACIO' },
    });
    res.status(201).json({ id: nouUsuari.id, nom: nouUsuari.nom, usuari: nouUsuari.usuari, rol: nouUsuari.rol });
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear l'usuari (potser el nom d'usuari ja existeix)" });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { usuari, contrasenya } = req.body;
  const trobat = await prisma.usuari.findUnique({
    where: { usuari },
    include: { agrupacio: { select: { nom: true } } },
  });
  if (!trobat || !trobat.actiu) {
    return res.status(401).json({ error: 'Credencials incorrectes' });
  }
  const coincideix = await bcrypt.compare(contrasenya, trobat.contrasenya);
  if (!coincideix) {
    return res.status(401).json({ error: 'Credencials incorrectes' });
  }
  const token = jwt.sign(
    { id: trobat.id, rol: trobat.rol, agrupacioId: trobat.agrupacioId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({
    token,
    usuari: {
      id: trobat.id,
      nom: trobat.nom,
      usuari: trobat.usuari,
      rol: trobat.rol,
      agrupacioId: trobat.agrupacioId,
      agrupacioNom: trobat.agrupacio?.nom || null,
    },
  });
});

// Cada usuari pot canviar la seva pròpia contrasenya (cal saber l'actual).
// Les contrasenyes es guarden xifrades: ni la federació ni ningú les pot
// veure en clar un cop creades, només restablir-les.
router.patch('/contrasenya', requireAuth, async (req: AuthRequest, res) => {
  const { contrasenyaActual, contrasenyaNova } = req.body;
  if (!contrasenyaActual || !contrasenyaNova) {
    return res.status(400).json({ error: 'Cal indicar la contrasenya actual i la nova' });
  }
  if (contrasenyaNova.length < 6) {
    return res.status(400).json({ error: 'La nova contrasenya ha de tenir almenys 6 caràcters' });
  }
  const usuari = await prisma.usuari.findUnique({ where: { id: req.usuari!.id } });
  if (!usuari) return res.status(404).json({ error: 'Usuari no trobat' });
  const coincideix = await bcrypt.compare(contrasenyaActual, usuari.contrasenya);
  if (!coincideix) {
    return res.status(401).json({ error: 'La contrasenya actual no és correcta' });
  }
  const contrasenyaHash = await bcrypt.hash(contrasenyaNova, 10);
  await prisma.usuari.update({ where: { id: usuari.id }, data: { contrasenya: contrasenyaHash } });
  res.json({ ok: true });
});

export default router;
