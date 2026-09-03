import { prisma } from '../prisma';
import { enviarNotificacio } from './push.service';

// Envia un avís concret per push a tots els usuaris destinataris (els d'una
// agrupació concreta, o tots si l'avís és de tota la federació) i el marca
// com a enviat perquè el planificador no el torni a enviar.
export async function enviarAvis(avisId: string) {
  const avis = await prisma.avis.findUnique({ where: { id: avisId } });
  if (!avis || avis.enviat) return;

  const usuaris = await prisma.usuari.findMany({
    where: avis.agrupacioId ? { agrupacioId: avis.agrupacioId } : {},
    select: { id: true },
  });

  for (const u of usuaris) {
    await enviarNotificacio(u.id, avis.titol, avis.cos);
  }

  await prisma.avis.update({ where: { id: avisId }, data: { enviat: true } });
}

// Revisa cada minut si hi ha avisos programats per a una data futura que ja
// han arribat a la seva hora i encara no s'han enviat.
export function iniciarPlanificadorAvisos() {
  setInterval(async () => {
    const ara = new Date();
    const pendents = await prisma.avis.findMany({
      where: { enviat: false, dataEnviament: { lte: ara } },
    });
    for (const avis of pendents) {
      await enviarAvis(avis.id);
    }
  }, 60 * 1000); // cada minut
}
