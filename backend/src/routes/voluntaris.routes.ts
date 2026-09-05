import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, potGestionarAgrupacio } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

const SELECCIO = {
  id: true,
  agrupacioId: true,
  nom: true,
  cognoms: true,
  telefon: true,
  dni: true,
  genere: true,
  dataNaixement: true,
  provincia: true,
  localitat: true,
  adreca: true,
  codiPostal: true,
  dataIngres: true,
  dataBaixa: true,
  numeroIdentificacio: true,
  indicatiu: true,
  carrec: true,
  altresEmails: true,
  altresAgrupacions: true,
  disponibilitat: true,
  actiu: true,
  creatEl: true,
  usuari: { select: { id: true, usuari: true, actiu: true } },
} as const;

// El roster de voluntaris: la federació el pot veure tot o filtrat per
// associació; una associació només veu el seu; un voluntari no hi té accés
// (fa servir /me per a la seva pròpia fitxa).
router.get('/', async (req: AuthRequest, res) => {
  if (req.usuari!.rol === 'VOLUNTARI') return res.status(403).json({ error: 'No autoritzat' });
  const agrupacioId =
    req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId!;
  const voluntaris = await prisma.voluntari.findMany({
    where: agrupacioId ? { agrupacioId } : undefined,
    select: SELECCIO,
    orderBy: [{ cognoms: 'asc' }, { nom: 'asc' }],
  });
  res.json(voluntaris);
});

// Fitxa pròpia del voluntari connectat (per a la seva pròpia app mòbil).
router.get('/me', async (req: AuthRequest, res) => {
  if (req.usuari!.rol !== 'VOLUNTARI') return res.status(403).json({ error: 'Només per a comptes de voluntari' });
  const voluntari = await prisma.voluntari.findUnique({ where: { usuariId: req.usuari!.id }, select: SELECCIO });
  if (!voluntari) return res.status(404).json({ error: 'Fitxa de voluntari no trobada' });
  res.json(voluntari);
});

// Estadístiques pròpies: només les assistències del voluntari connectat
// (no les de tota l'associació), per al seu propi resum d'hores.
router.get('/me/estadistiques', async (req: AuthRequest, res) => {
  if (req.usuari!.rol !== 'VOLUNTARI') return res.status(403).json({ error: 'Només per a comptes de voluntari' });
  const voluntari = await prisma.voluntari.findUnique({ where: { usuariId: req.usuari!.id } });
  if (!voluntari) return res.status(404).json({ error: 'Fitxa de voluntari no trobada' });
  const assistencies = await prisma.assistenciaServei.findMany({
    where: { voluntariId: voluntari.id },
    select: {
      confirmat: true,
      horesRealitzades: true,
      servei: { select: { titol: true, tipus: true, dataInici: true } },
    },
    orderBy: { servei: { dataInici: 'asc' } },
  });
  res.json(assistencies);
});

router.post('/', async (req: AuthRequest, res) => {
  const {
    agrupacioId,
    nom,
    cognoms,
    telefon,
    dni,
    genere,
    dataNaixement,
    provincia,
    localitat,
    adreca,
    codiPostal,
    dataIngres,
    numeroIdentificacio,
    indicatiu,
    carrec,
    altresEmails,
    altresAgrupacions,
    disponibilitat,
    emailAcces,
    contrasenyaAcces,
  } = req.body;

  const agrupacioFinal = req.usuari!.rol === 'FEDERACIO' ? agrupacioId : req.usuari!.agrupacioId;
  if (!agrupacioFinal || !nom || !cognoms) {
    return res.status(400).json({ error: "Cal indicar l'associació, el nom i els cognoms" });
  }
  if (!potGestionarAgrupacio(req, agrupacioFinal)) {
    return res.status(403).json({ error: "No pots afegir voluntaris a una altra associació" });
  }
  if (emailAcces && (!contrasenyaAcces || contrasenyaAcces.length < 6)) {
    return res.status(400).json({ error: "Cal una contrasenya d'accés d'almenys 6 caràcters" });
  }

  try {
    const voluntari = await prisma.$transaction(async (tx) => {
      let usuariId: string | undefined;
      if (emailAcces) {
        const contrasenyaHash = await bcrypt.hash(contrasenyaAcces, 10);
        const usuariNou = await tx.usuari.create({
          data: {
            nom: `${nom} ${cognoms}`,
            usuari: emailAcces.toLowerCase(),
            contrasenya: contrasenyaHash,
            rol: 'VOLUNTARI',
            agrupacioId: agrupacioFinal,
          },
        });
        usuariId = usuariNou.id;
      }
      return tx.voluntari.create({
        data: {
          agrupacioId: agrupacioFinal,
          nom,
          cognoms,
          telefon: telefon || undefined,
          dni: dni || undefined,
          genere: genere || undefined,
          dataNaixement: dataNaixement ? new Date(dataNaixement) : undefined,
          provincia: provincia || undefined,
          localitat: localitat || undefined,
          adreca: adreca || undefined,
          codiPostal: codiPostal || undefined,
          dataIngres: dataIngres ? new Date(dataIngres) : undefined,
          numeroIdentificacio: numeroIdentificacio || undefined,
          indicatiu: indicatiu || undefined,
          carrec: carrec || undefined,
          altresEmails: altresEmails || undefined,
          altresAgrupacions: altresAgrupacions || undefined,
          disponibilitat: disponibilitat || undefined,
          usuariId,
        },
        select: SELECCIO,
      });
    });
    res.status(201).json(voluntari);
  } catch {
    res.status(400).json({ error: "No s'ha pogut crear el voluntari (potser l'email d'accés ja existeix)" });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.voluntari.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Voluntari no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: "No pots editar aquest voluntari" });
  }
  const {
    nom,
    cognoms,
    telefon,
    dni,
    genere,
    dataNaixement,
    provincia,
    localitat,
    adreca,
    codiPostal,
    dataIngres,
    dataBaixa,
    numeroIdentificacio,
    indicatiu,
    carrec,
    altresEmails,
    altresAgrupacions,
    disponibilitat,
    actiu,
  } = req.body;
  try {
    const voluntari = await prisma.voluntari.update({
      where: { id: req.params.id },
      data: {
        nom,
        cognoms,
        telefon: telefon || null,
        dni: dni || null,
        genere: genere || null,
        dataNaixement: dataNaixement ? new Date(dataNaixement) : null,
        provincia: provincia || null,
        localitat: localitat || null,
        adreca: adreca || null,
        codiPostal: codiPostal || null,
        dataIngres: dataIngres ? new Date(dataIngres) : null,
        dataBaixa: dataBaixa ? new Date(dataBaixa) : null,
        numeroIdentificacio: numeroIdentificacio || null,
        indicatiu: indicatiu || null,
        carrec: carrec || null,
        altresEmails: altresEmails || null,
        altresAgrupacions: altresAgrupacions || null,
        disponibilitat: disponibilitat || undefined,
        actiu,
      },
      select: SELECCIO,
    });
    res.json(voluntari);
  } catch {
    res.status(400).json({ error: "No s'han pogut desar els canvis" });
  }
});

// El propi voluntari pot actualitzar la seva disponibilitat (és l'únic camp
// que té sentit que canviï ell mateix des del mòbil).
router.patch('/me/disponibilitat', async (req: AuthRequest, res) => {
  if (req.usuari!.rol !== 'VOLUNTARI') return res.status(403).json({ error: 'Només per a comptes de voluntari' });
  const { disponibilitat } = req.body;
  if (!disponibilitat) return res.status(400).json({ error: 'Cal indicar la disponibilitat' });
  try {
    const voluntari = await prisma.voluntari.update({
      where: { usuariId: req.usuari!.id },
      data: { disponibilitat },
      select: SELECCIO,
    });
    res.json(voluntari);
  } catch {
    res.status(400).json({ error: "No s'ha pogut actualitzar la disponibilitat" });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.voluntari.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Voluntari no trobat' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) {
    return res.status(403).json({ error: "No pots eliminar aquest voluntari" });
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.voluntari.delete({ where: { id: req.params.id } });
      if (existent.usuariId) await tx.usuari.delete({ where: { id: existent.usuariId } });
    });
    res.status(204).send();
  } catch {
    res.status(409).json({ error: "No s'ha pogut eliminar el voluntari (potser té assistències registrades)" });
  }
});

export default router;
