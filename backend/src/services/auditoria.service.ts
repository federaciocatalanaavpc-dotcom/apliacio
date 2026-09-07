import { prisma } from '../prisma';

// Deixa constància de qui crea, edita o elimina una fitxa amb dades
// personals sensibles (traçabilitat per a protecció de dades). No ha de
// bloquejar mai l'operació principal si falla.
export async function registrarAuditoria(dades: {
  usuariId: string;
  accio: 'CREAR' | 'EDITAR' | 'ELIMINAR' | 'EXPORTAR';
  entitat: string;
  entitatId: string;
  agrupacioId?: string | null;
  detall?: string;
}) {
  try {
    await prisma.registreAuditoria.create({ data: dades });
  } catch {
    // No interrompem l'acció principal si el registre d'auditoria falla.
  }
}
