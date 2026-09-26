import { prisma } from '../prisma';
import { compteDisponible } from './seguretat.service';

// Persones que han de llegir/respondre un avís: els comptes de voluntari i
// d'administrador AVPC de l'associació de l'avís (o de totes si és general)
// que encara estan actius.
export async function destinatarisAvis(avis: { agrupacioId: string | null }) {
  const usuaris = await prisma.usuari.findMany({
    where: {
      rol: { in: ['VOLUNTARI', 'ADMIN_AVPC'] },
      ...(avis.agrupacioId ? { agrupacioId: avis.agrupacioId } : {}),
    },
  });
  const disponibles = [];
  for (const u of usuaris) if (await compteDisponible(u)) disponibles.push(u);
  return disponibles;
}

// L'avís només és visible per a l'usuari si ja s'ha enviat i és de tota la
// federació o de la seva pròpia associació.
export function avisAdrecatA(avis: { agrupacioId: string | null; enviat: boolean }, usuari: { agrupacioId: string | null }) {
  return avis.enviat && (!avis.agrupacioId || avis.agrupacioId === usuari.agrupacioId);
}
