import {participa,gestionaAssistents} from './permisosServei.service';
import { prisma } from '../prisma';
import { aturarUbicacio } from './ubicacioServei.service';
import { AuthRequest, potGestionarAgrupacio } from '../middleware/auth.middleware';

export class ErrorFitxatge extends Error { constructor(public status: number, message: string) { super(message); } }
export function dataFitxatge(valor: unknown): Date {
  if (typeof valor !== 'string' || !/T.*(Z|[+-]\d{2}:\d{2})$/.test(valor)) throw new ErrorFitxatge(400, 'Cal indicar data i hora amb zona horària');
  const d = new Date(valor);
  if (!Number.isFinite(d.getTime())) throw new ErrorFitxatge(400, 'Data no vàlida');
  return d;
}
export function calcularHores(entrada: Date, sortida: Date): number {
  if (sortida <= entrada) throw new ErrorFitxatge(400, 'La sortida ha de ser posterior a l’entrada');
  return Math.round((sortida.getTime() - entrada.getTime()) / 36000) / 100;
}

// Bloquegem el servei per serialitzar dobles clics i correccions simultànies.
export async function desarFitxatge(req: AuthRequest, mode: 'entrada' | 'sortida' | 'admin') {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Servei" WHERE id = ${req.params.id} FOR UPDATE`;
    const servei = await tx.servei.findUnique({where:{id:req.params.id},include:{participants:true}});
    if (!servei) throw new ErrorFitxatge(404,'Servei no trobat');
    const personal = mode !== 'admin';
    if (personal && req.usuari!.rol !== 'VOLUNTARI') throw new ErrorFitxatge(403,'Només per al teu compte de voluntari');
    const v = personal ? await tx.voluntari.findUnique({where:{usuariId:req.usuari!.id}}) : await tx.voluntari.findUnique({where:{id:req.params.voluntariId}});
    if (!v || !participa(servei,v.agrupacioId) || (!personal && !gestionaAssistents(req,servei,v.agrupacioId))) throw new ErrorFitxatge(403,'El voluntari no pertany a aquesta AVPC');
    const key={serveiId_voluntariId:{serveiId:servei.id,voluntariId:v.id}};
    const anterior=await tx.assistenciaServei.findUnique({where:key});
    if(servei.conjunt && !anterior)throw new ErrorFitxatge(403,'El voluntari no està incorporat al servei conjunt');
    const ara=new Date(); let entrada=anterior?.horaEntrada || null, sortida=anterior?.horaSortida || null;
    if (personal) {
      if (!v.actiu) throw new ErrorFitxatge(403,'Voluntari inactiu');
      if (Object.keys(req.body || {}).length) throw new ErrorFitxatge(400,'El fitxatge utilitza l’hora del servidor');
      if (mode==='entrada') {
        if (entrada) return anterior!;
        if (servei.arxivat) throw new ErrorFitxatge(409,'Servei arxivat: demana la correcció a un administrador');
        if (anterior?.horesRealitzades != null) throw new ErrorFitxatge(409,'Aquest servei ja té hores registrades');
        if (!anterior?.confirmat && servei.destinataris && servei.destinataris!=='TOTS' && !servei.destinataris.split(',').includes(v.disponibilitat)) throw new ErrorFitxatge(403,'No ets destinatari d’aquest servei');
        entrada=ara;
      } else {
        if (!entrada) throw new ErrorFitxatge(409,'Primer has de fitxar l’entrada');
        if (sortida) return anterior!;
        sortida=ara;
      }
    } else if (req.body.validarHorariServei === true) {
      if (servei.dataFi > ara) throw new ErrorFitxatge(400,'Es poden validar les hores quan el servei hagi acabat');
      if (entrada || sortida || anterior?.horesRealitzades != null) throw new ErrorFitxatge(409,'Ja hi ha un fitxatge o hores: utilitza Corregir horaris');
      entrada=servei.dataInici;sortida=servei.dataFi;
    } else {
      if (!Object.prototype.hasOwnProperty.call(req.body,'horaEntrada') || !Object.prototype.hasOwnProperty.call(req.body,'horaSortida') || 'horesRealitzades' in req.body) throw new ErrorFitxatge(400,'Indica entrada i sortida; les hores es calculen automàticament');
      entrada=dataFitxatge(req.body.horaEntrada);
      sortida=req.body.horaSortida===null ? null : dataFitxatge(req.body.horaSortida);
      if (entrada>ara || (sortida && sortida>ara)) throw new ErrorFitxatge(400,'No es poden registrar fitxatges futurs');
    }
    const hores=entrada && sortida ? calcularHores(entrada,sortida) : null;
    const resultat=await tx.assistenciaServei.upsert({where:key,create:{serveiId:servei.id,voluntariId:v.id,confirmat:true,horaEntrada:entrada,horaSortida:sortida,horesRealitzades:hores},update:{confirmat:true,horaEntrada:entrada,horaSortida:sortida,horesRealitzades:hores}});
    await tx.registreAuditoria.create({data:{usuariId:req.usuari!.id,accio:'EDITAR',entitat:'AssistenciaServei',entitatId:resultat.id,agrupacioId:servei.agrupacioId,detall:JSON.stringify({accio:personal?mode:req.body.validarHorariServei?'validar-horari-servei':'corregir-horaris',abans:{entrada:anterior?.horaEntrada,sortida:anterior?.horaSortida,hores:anterior?.horesRealitzades},despres:{entrada,sortida,hores}})}});
    if (sortida) aturarUbicacio(resultat.id);
    return resultat;
  });
}
