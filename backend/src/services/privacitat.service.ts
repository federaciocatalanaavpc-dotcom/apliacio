import {prisma} from '../prisma';
export const VERSIO_PRIVACITAT='2026-09-14.1';
export function lecturaValida(body:any){return body?.privacitatLlegida===true && body?.privacitatVersio===VERSIO_PRIVACITAT;}
// Constatació de lectura, no consentiment genèric ni renúncia de drets.
export async function registrarLectura(id:string){
 await prisma.$transaction(async tx=>{
  const changed=await tx.usuari.updateMany({where:{id,OR:[{privacitatVersio:null},{privacitatVersio:{not:VERSIO_PRIVACITAT}}]},data:{privacitatVersio:VERSIO_PRIVACITAT,privacitatLlegidaEl:new Date()}});
  if(changed.count)await tx.registreAuditoria.create({data:{usuariId:id,accio:'LLEGIR',entitat:'InformacioPrivacitat',entitatId:id,detall:'Versió '+VERSIO_PRIVACITAT}});
 });
}
