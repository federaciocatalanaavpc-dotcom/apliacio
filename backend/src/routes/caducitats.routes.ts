import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, potGestionarAgrupacio, bloquejaVoluntaris } from '../middleware/auth.middleware';
import { diesFinsCaducitat, estatCaducitat, revisarCaducitats } from '../services/caducitats.service';

const router = Router();
router.use(requireAuth);
router.use(bloquejaVoluntaris);

const SELECCIO = {
  id: true,
  agrupacioId: true,
  vehicleId: true,
  materialId: true,
  concepte: true,
  dataCaducitat: true,
  notes: true,
  agrupacio: { select: { id: true, nom: true } },
  vehicle: { select: { id: true, matricula: true, marca: true, model: true } },
  material: { select: { id: true, nom: true } },
} as const;

function amb<T extends { dataCaducitat: Date }>(c: T) {
  return { ...c, dies: diesFinsCaducitat(c.dataCaducitat), estat: estatCaducitat(c.dataCaducitat) };
}

function agrupacioSollicitada(req: AuthRequest): string | undefined {
  return req.usuari!.rol === 'FEDERACIO' ? (req.query.agrupacioId as string | undefined) : req.usuari!.agrupacioId!;
}

router.get('/', async (req: AuthRequest, res) => {
  const agrupacioId = agrupacioSollicitada(req);
  const llista = await prisma.caducitat.findMany({
    where: agrupacioId ? { agrupacioId } : undefined,
    select: SELECCIO,
    orderBy: { dataCaducitat: 'asc' },
  });
  res.json(llista.map(amb));
});

// Resum per a la pantalla d'inici: quantes n'hi ha de caducades i properes.
router.get('/resum', async (req: AuthRequest, res) => {
  const agrupacioId = agrupacioSollicitada(req);
  const llista = await prisma.caducitat.findMany({
    where: { ...(agrupacioId ? { agrupacioId } : {}), dataCaducitat: { lte: new Date(Date.now() + 30 * 24 * 3600_000) } },
    select: { dataCaducitat: true },
  });
  res.json({
    caducades: llista.filter((c) => estatCaducitat(c.dataCaducitat) === 'CADUCAT').length,
    properes: llista.filter((c) => estatCaducitat(c.dataCaducitat) === 'PROPERA').length,
  });
});

router.post('/', async (req: AuthRequest, res) => {
  const { agrupacioId, vehicleId, materialId, concepte, dataCaducitat, notes } = req.body;
  const agrupacioFinal = req.usuari!.rol === 'FEDERACIO' ? agrupacioId : req.usuari!.agrupacioId;
  if (!agrupacioFinal || !concepte || !dataCaducitat) {
    return res.status(400).json({ error: "Cal indicar l'associació, el concepte i la data" });
  }
  if (!potGestionarAgrupacio(req, agrupacioFinal)) {
    return res.status(403).json({ error: 'No pots afegir caducitats a una altra associació' });
  }
  if (!!vehicleId === !!materialId) {
    return res.status(400).json({ error: 'Cal triar un vehicle o un material (només un)' });
  }
  const propietari = vehicleId
    ? await prisma.vehicle.findUnique({ where: { id: vehicleId } })
    : await prisma.material.findUnique({ where: { id: materialId } });
  if (!propietari || propietari.agrupacioId !== agrupacioFinal) {
    return res.status(400).json({ error: "L'element no pertany a aquesta associació" });
  }
  const data = new Date(dataCaducitat);
  if (Number.isNaN(data.getTime())) return res.status(400).json({ error: 'Data no vàlida' });
  const creada = await prisma.caducitat.create({
    data: {
      agrupacioId: agrupacioFinal,
      vehicleId: vehicleId || null,
      materialId: materialId || null,
      concepte,
      dataCaducitat: data,
      notes: notes || null,
    },
    select: SELECCIO,
  });
  revisarCaducitats().catch(() => {});
  res.status(201).json(amb(creada));
});

// Renovar: canvia la data (i reinicia els avisos) o edita concepte/notes.
router.patch('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.caducitat.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Caducitat no trobada' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) return res.status(403).json({ error: 'No pots editar aquesta caducitat' });
  const { concepte, dataCaducitat, notes } = req.body;
  const novaData = dataCaducitat ? new Date(dataCaducitat) : existent.dataCaducitat;
  if (Number.isNaN(novaData.getTime())) return res.status(400).json({ error: 'Data no vàlida' });
  const canviaData = novaData.getTime() !== existent.dataCaducitat.getTime();
  const actualitzada = await prisma.caducitat.update({
    where: { id: existent.id },
    data: {
      concepte: concepte !== undefined ? concepte : existent.concepte,
      notes: notes !== undefined ? notes || null : existent.notes,
      dataCaducitat: novaData,
      ...(canviaData ? { ultimLlindar: null, ultimAvisEl: null } : {}),
    },
    select: SELECCIO,
  });
  revisarCaducitats().catch(() => {});
  res.json(amb(actualitzada));
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existent = await prisma.caducitat.findUnique({ where: { id: req.params.id } });
  if (!existent) return res.status(404).json({ error: 'Caducitat no trobada' });
  if (!potGestionarAgrupacio(req, existent.agrupacioId)) return res.status(403).json({ error: 'No pots eliminar aquesta caducitat' });
  await prisma.caducitat.delete({ where: { id: existent.id } });
  res.status(204).send();
});

export default router;
