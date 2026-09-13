import {Router} from 'express';
import {prisma} from '../prisma';
import {AuthRequest,potGestionarAgrupacio} from '../middleware/auth.middleware';
import {ErrorFitxatge} from '../services/fitxatgeServei.service';
import {iniciarUbicacio,aturarUbicacio,obtenirComparticio,actualitzarUbicacio,compararPunt} from '../services/ubicacioServei.service';
const router=Router();
const number=(v:unknown,min:number,max:number)=>typeof v==='number' && Number.isFinite(v) && v>=min && v<=max;
function fallo(status:number,msg:string):never {throw new ErrorFitxatge(status,msg);}
async function propia(req:AuthRequest,accio:'iniciar'|'actualitzar'|'aturar') {
  if(req.usuari!.rol!=='VOLUNTARI')fallo(403,'Només pots compartir des del teu compte de voluntari');
  return prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM "Servei" WHERE id = ${req.params.id} FOR UPDATE`;
    const a=await tx.assistenciaServei.findFirst({where:{serveiId:req.params.id,voluntari:{usuariId:req.usuari!.id,actiu:true,agrupacioId:req.usuari!.agrupacioId!}},include:{servei:true,voluntari:{include:{usuari:true}}}});
    if(!a || a.servei.agrupacioId!==req.usuari!.agrupacioId)fallo(404,'Assistència no trobada');
    if(accio==='aturar'){aturarUbicacio(a.id,req.body.comparticioId);return {ok:true};}
    if(!a.horaEntrada || a.horaSortida || a.servei.arxivat) {aturarUbicacio(a.id);fallo(409,'Cal estar fitxat en un servei obert per compartir ubicació');}
    if(accio==='iniciar'){
      if(req.body.acceptoCompartir!==true)fallo(400,'Cal activar expressament la compartició');
      return {comparticioId:iniciarUbicacio(a.id,req.usuari!.id,a.voluntari.usuari!.sessionVersion)};
    }
    const {latitud,longitud,precisio,capturadaEl,comparticioId}=req.body;
    const t=typeof capturadaEl==='string'?new Date(capturadaEl).getTime():NaN;
    if(!number(latitud,-90,90)||!number(longitud,-180,180)||!number(precisio,0,10000)||!Number.isFinite(t)||Date.now()-t>90_000||t>Date.now()+30_000)fallo(400,'La posició o la data GPS no són vàlides o són massa antigues');
    const s=obtenirComparticio(a.id);
    if(!s || s.sessionVersion!==a.voluntari.usuari!.sessionVersion || typeof comparticioId!=='string' || s.id!==comparticioId)fallo(410,'La compartició ha acabat; torna-la a activar');
    if(!actualitzarUbicacio(a.id,comparticioId,{latitud,longitud,precisio,capturadaEl:new Date(t).toISOString(),actualitzadaEl:new Date().toISOString()}))fallo(410,'La compartició ha acabat');
    return {ok:true};
  });
}
for(const [method,path,accio] of [['post','/:id/ubicacio/iniciar','iniciar'],['patch','/:id/ubicacio','actualitzar'],['delete','/:id/ubicacio','aturar']] as const) {
  router[method](path,async(req:AuthRequest,res)=>{try{res.json(await propia(req,accio));}catch(e){if(e instanceof ErrorFitxatge)return res.status(e.status).json({error:e.message});throw e;}});
}
router.get('/:id/ubicacions',async(req:AuthRequest,res)=>{
  const servei=await prisma.servei.findUnique({where:{id:req.params.id},select:{id:true,titol:true,agrupacioId:true,arxivat:true,latitud:true,longitud:true}});
  if(!servei)return res.status(404).json({error:'Servei no trobat'});
  if(!potGestionarAgrupacio(req,servei.agrupacioId))return res.status(403).json({error:'Accés reservat als responsables del servei'});
  const assistencies=await prisma.assistenciaServei.findMany({where:{serveiId:servei.id},include:{voluntari:{include:{usuari:true}}}});
  const files=assistencies.map(a=>{
    const s=obtenirComparticio(a.id),u=a.voluntari.usuari;
    const enServei=!!a.horaEntrada && !a.horaSortida && a.voluntari.actiu && !servei.arxivat;
    const permes=enServei && u?.actiu && !u.passwordMustChange && !u.accessTokenHash && u.rol==='VOLUNTARI' && u.sessionVersion===s?.sessionVersion;
    if(!permes)aturarUbicacio(a.id);
    const posicio=permes?s?.posicio||null:null;
    return {voluntariId:a.voluntariId,nom:a.voluntari.nom+' '+a.voluntari.cognoms,enServei,puntNom:a.puntNom,puntLatitud:a.puntLatitud,puntLongitud:a.puntLongitud,puntRadi:a.puntRadi,posicio,...compararPunt(posicio,a.puntLatitud,a.puntLongitud,a.puntRadi)};
  });
  res.json({servei,voluntaris:files});
});
router.patch('/:id/punts/:voluntariId',async(req:AuthRequest,res)=>{
  const servei=await prisma.servei.findUnique({where:{id:req.params.id}});
  if(!servei)return res.status(404).json({error:'Servei no trobat'});
  if(!potGestionarAgrupacio(req,servei.agrupacioId))return res.status(403).json({error:'No pots assignar punts en aquest servei'});
  const v=await prisma.voluntari.findUnique({where:{id:req.params.voluntariId}});
  if(!v || v.agrupacioId!==servei.agrupacioId)return res.status(403).json({error:'El voluntari no pertany a aquesta AVPC'});
  const {puntNom,puntLatitud,puntLongitud,puntRadi}=req.body;
  const buidar=puntLatitud===null && puntLongitud===null;
  if(!buidar && (typeof puntNom!=='string'||!puntNom.trim()||puntNom.length>100||!number(puntLatitud,-90,90)||!number(puntLongitud,-180,180)||!Number.isInteger(puntRadi)||!number(puntRadi,20,2000)))return res.status(400).json({error:'Indica un nom, un punt vàlid i un marge de 20 a 2.000 metres'});
  const data={puntNom:buidar?null:puntNom.trim(),puntLatitud:buidar?null:puntLatitud,puntLongitud:buidar?null:puntLongitud,puntRadi:buidar?100:puntRadi};
  await prisma.$transaction(async tx=>{
    const a=await tx.assistenciaServei.upsert({where:{serveiId_voluntariId:{serveiId:servei.id,voluntariId:v.id}},create:{serveiId:servei.id,voluntariId:v.id,...data},update:data});
    await tx.registreAuditoria.create({data:{usuariId:req.usuari!.id,accio:'EDITAR',entitat:'PuntServei',entitatId:a.id,agrupacioId:servei.agrupacioId,detall:buidar?'Punt retirat':'Punt assignat o modificat'}});
  });res.json({ok:true});
});
export default router;
