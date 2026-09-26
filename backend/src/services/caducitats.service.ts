import { prisma } from '../prisma';
import { enviarNotificacio } from './push.service';

const DIA_MS = 24 * 3600_000;
// Dies abans del venciment en què s'avisa (0 = ja caducat).
const LLINDARS = [30, 15, 7, 1];

export function diesFinsCaducitat(data: Date, ara = new Date()): number {
  return Math.ceil((data.getTime() - ara.getTime()) / DIA_MS);
}

export type EstatCaducitat = 'CADUCAT' | 'PROPERA' | 'OK';

export function estatCaducitat(data: Date, ara = new Date()): EstatCaducitat {
  const dies = diesFinsCaducitat(data, ara);
  if (dies <= 0) return 'CADUCAT';
  return dies <= LLINDARS[0] ? 'PROPERA' : 'OK';
}

// Llindar corresponent als dies que falten: 30/15/7/1, o 0 si ja ha caducat;
// null si encara falta més de 30 dies.
function llindarActual(dies: number): number | null {
  if (dies <= 0) return 0;
  const aplicables = LLINDARS.filter((l) => dies <= l);
  return aplicables.length ? Math.min(...aplicables) : null;
}

// Revisa totes les caducitats i avisa per push els comptes d'associació
// quan una entra en un llindar nou (o cada 7 dies mentre estigui caducada).
// Es pot cridar tantes vegades com es vulgui: no repeteix avisos.
export async function revisarCaducitats() {
  const ara = new Date();
  const llista = await prisma.caducitat.findMany({
    where: { dataCaducitat: { lte: new Date(ara.getTime() + LLINDARS[0] * DIA_MS) } },
  });
  const perAgrupacio = new Map<string, { noves: number; caducades: number }>();

  for (const c of llista) {
    const llindar = llindarActual(diesFinsCaducitat(c.dataCaducitat, ara));
    if (llindar === null) continue;
    const repetirCaducada = llindar === 0 && !!c.ultimAvisEl && ara.getTime() - c.ultimAvisEl.getTime() >= 7 * DIA_MS;
    const nou = c.ultimLlindar === null || llindar < c.ultimLlindar || repetirCaducada;
    if (!nou) continue;
    const resum = perAgrupacio.get(c.agrupacioId) || { noves: 0, caducades: 0 };
    resum.noves++;
    if (llindar === 0) resum.caducades++;
    perAgrupacio.set(c.agrupacioId, resum);
    await prisma.caducitat.update({ where: { id: c.id }, data: { ultimLlindar: llindar, ultimAvisEl: ara } });
  }

  for (const [agrupacioId, resum] of perAgrupacio) {
    const comptes = await prisma.usuari.findMany({ where: { agrupacioId, rol: 'AGRUPACIO' }, select: { id: true } });
    for (const u of comptes) {
      await enviarNotificacio(
        u.id,
        resum.caducades ? 'Caducitats vençudes' : 'Caducitats properes',
        `Tens ${resum.noves} caducitat(s) d'inventari per revisar.`
      );
    }
  }
}

// Comprovació al cap d'un minut de l'arrencada i després cada 6 hores.
export function iniciarRevisioCaducitats() {
  const executar = () => revisarCaducitats().catch((e) => console.warn('Revisió de caducitats fallida', e?.message));
  setTimeout(executar, 60_000);
  setInterval(executar, 6 * 3600_000);
}
