import {Router,Response,NextFunction} from 'express';
import {Prisma} from '@prisma/client';
import {prisma} from '../prisma';
import {AuthRequest,requireFederacio,potGestionarAgrupacio} from '../middleware/auth.middleware';
import {coordina,consultaServei,participa,seleccioParticipants} from '../services/permisosServei.service';
import {ErrorFitxatge,dataFitxatge,calcularHores} from '../services/fitxatgeServei.service';
const router=Router();
const wrap=(fn:(q:AuthRequest,r:Response)=>Promise<unknown>)=>(q:AuthRequest,r:Response,n:NextFunction)=>fn(q,r).catch(e=>e instanceof ErrorFitxatge?r.status(e.status).json({error:e.message}):n(e));
function fail(status:number,msg:string):never {throw new ErrorFitxatge(status,msg);}
const resum={id:true,conjunt:true,versioCoordinacio:true,agrupacioId:true,titol:true,dataInici:true,dataFi:true,arxivat:true,collaboracioEmergencies:true,descripcio:true,adreca:true,latitud:true,longitud:true,participants:seleccioParticipants} as const;
const persona={id:true,nom:true,cognoms:true,indicatiu:true,agrupacioId:true,actiu:true,agrupacio:{select:{id:true,nom:true}}} as const;
async function config(body:any,tx:Prisma.TransactionClient){
 if(typeof body.titol!=='string'||!body.titol.trim()||body.titol.length>200)fail(400,'Indica un títol de fins a 200 caràcters');
 const dataInici=dataFitxatge(body.dataInici),dataFi=dataFitxatge(body.dataFi);calcularHores(dataInici,dataFi);
 if(!Array.isArray(body.participants)||body.participants.length<2||body.participants.length>200)fail(400,'Selecciona almenys dues AVPC');
 const participants=body.participants.map((p:any)=>{if(!p||typeof p.agrupacioId!=='string'||typeof p.coordinadora!=='boolean')fail(400,'Participants no vàlids');return {agrupacioId:p.agrupacioId as string,coordinadora:p.coordinadora as boolean};});
 const ids=participants.map((p:{agrupacioId:string})=>p.agrupacioId);
 if(new Set(ids).size!==ids.length||await tx.agrupacio.count({where:{id:{in:ids},actiu:true}})!==ids.length)fail(400,'Les AVPC han de ser actives i no repetides');
 const text=(key:string,max:number)=>{if(body[key]!=null&&(typeof body[key]!=='string'||body[key].length>max))fail(400,'Text massa llarg o no vàlid');return body[key]?.trim()||null;};
 const latitud=body.latitud??null,longitud=body.longitud??null;
 if(!((latitud===null&&longitud===null)||(typeof latitud==='number'&&Number.isFinite(latitud)&&Math.abs(latitud)<=90&&typeof longitud==='number'&&Number.isFinite(longitud)&&Math.abs(longitud)<=180)))fail(400,'Ubicació no vàlida');
 if(typeof body.collaboracioEmergencies!=='boolean')fail(400,'Indica si és una emergència');
 return {participants,ids,data:{titol:body.titol.trim(),dataInici,dataFi,collaboracioEmergencies:body.collaboracioEmergencies,descripcio:text('descripcio',10000),adreca:text('adreca',500),latitud,longitud}};
}
router.get('/conjunts',wrap(async(req,res)=>{
 if(req.usuari!.rol==='VOLUNTARI')fail(403,'Consulta els teus serveis des del teu espai');
 const serveis=await prisma.servei.findMany({where:{conjunt:true,arxivat:req.query.arxivat==='true',...(req.usuari!.rol==='FEDERACIO'?{}:{participants:{some:{agrupacioId:req.usuari!.agrupacioId!}}})},select:resum,orderBy:{dataInici:'desc'}});
 res.json(serveis.map(s=>({...s,potCoordinar:coordina(req,s)})));
}));
router.post('/conjunts',requireFederacio,wrap(async(req,res)=>{
 const servei=await prisma.$transaction(async tx=>{
  const c=await config(req.body,tx);
  const s=await tx.servei.create({data:{...c.data,conjunt:true,agrupacioId:c.ids[0],creatPerId:req.usuari!.id,destinataris:'TOTS',participants:{create:c.participants}},select:resum});
  await tx.registreAuditoria.create({data:{usuariId:req.usuari!.id,accio:'CREAR',entitat:'ServeiConjunt',entitatId:s.id,detall:JSON.stringify(c.participants)}});return s;
 });res.status(201).json(servei);
}));
router.patch('/conjunts/:id',requireFederacio,wrap(async(req,res)=>{
 const servei=await prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "Servei" WHERE id=${req.params.id} FOR UPDATE`;
  const s=await tx.servei.findUnique({where:{id:req.params.id},include:{participants:true}});
  if(!s?.conjunt)fail(404,'Servei conjunt no trobat');
  if(req.body.versioCoordinacio!==s.versioCoordinacio)fail(409,'El servei ha canviat. Recarrega abans de desar');
  const c=await config(req.body,tx);
  if(await tx.assistenciaServei.count({where:{serveiId:s.id,voluntari:{agrupacioId:{notIn:c.ids}}}}))fail(409,'No pots retirar una AVPC que té assistents; pots retirar-li la coordinació');
  if(typeof req.body.arxivat!=='boolean')fail(400,'Estat del servei no vàlid');
  if(req.body.arxivat && await tx.assistenciaServei.count({where:{serveiId:s.id,horaEntrada:{not:null},horaSortida:null}}))fail(409,'Encara hi ha voluntaris fitxats: registra les sortides abans de tancar');
  await tx.participacioServei.deleteMany({where:{serveiId:s.id}});
  const updated=await tx.servei.update({where:{id:s.id},data:{...c.data,agrupacioId:c.ids[0],arxivat:req.body.arxivat,versioCoordinacio:{increment:1},participants:{create:c.participants}},select:resum});
  await tx.registreAuditoria.create({data:{usuariId:req.usuari!.id,accio:'EDITAR',entitat:'ServeiConjunt',entitatId:s.id,detall:JSON.stringify({abans:s.participants,despres:c.participants,tancat:req.body.arxivat})}});return updated;
 });res.json(servei);
}));
// Minimal operational roster: no contact, identification or private profile fields.
router.get('/:id/equip',wrap(async(req,res)=>{
 const s=await prisma.servei.findUnique({where:{id:req.params.id},include:{participants:true}});
 if(!s)fail(404,'Servei no trobat');if(!consultaServei(req,s))fail(403,'No pots consultar aquest equip');
 const voluntaris=await prisma.voluntari.findMany({where:s.conjunt?{assistencies:{some:{serveiId:s.id}},...(coordina(req,s)?{}:{agrupacioId:req.usuari!.agrupacioId!})}:{agrupacioId:s.agrupacioId,actiu:true},select:persona,orderBy:[{nom:'asc'},{cognoms:'asc'}]});res.json(voluntaris);
}));
router.get('/:id/candidats',wrap(async(req,res)=>{
 const s=await prisma.servei.findUnique({where:{id:req.params.id},include:{participants:true}});
 if(!s?.conjunt)fail(404,'Servei no trobat');if(!consultaServei(req,s))fail(403,'No pots aportar voluntaris');
 const ids=req.usuari!.rol==='FEDERACIO'?s.participants.map(p=>p.agrupacioId):[req.usuari!.agrupacioId!];
 res.json(await prisma.voluntari.findMany({where:{actiu:true,agrupacioId:{in:ids},assistencies:{none:{serveiId:s.id}}},select:persona,orderBy:{nom:'asc'}}));
}));
router.post('/:id/equip/:voluntariId',wrap(async(req,res)=>{
 await prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "Servei" WHERE id=${req.params.id} FOR UPDATE`;
  const s=await tx.servei.findUnique({where:{id:req.params.id},include:{participants:true}}),v=await tx.voluntari.findUnique({where:{id:req.params.voluntariId}});
  if(!s?.conjunt)fail(404,'Servei no trobat');
  if(!v?.actiu||!participa(s,v.agrupacioId)||!potGestionarAgrupacio(req,v.agrupacioId))fail(403,'Només pots aportar voluntaris de la teva AVPC');
  if(s.arxivat)fail(409,'El servei està tancat');
  await tx.assistenciaServei.upsert({where:{serveiId_voluntariId:{serveiId:s.id,voluntariId:v.id}},create:{serveiId:s.id,voluntariId:v.id},update:{}});
  await tx.registreAuditoria.create({data:{usuariId:req.usuari!.id,accio:'CREAR',entitat:'EquipServei',entitatId:s.id,agrupacioId:v.agrupacioId,detall:'Voluntari incorporat: '+v.id}});
 });res.json({ok:true});
}));
router.delete('/:id/equip/:voluntariId',wrap(async(req,res)=>{
 await prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "Servei" WHERE id=${req.params.id} FOR UPDATE`;
  const s=await tx.servei.findUnique({where:{id:req.params.id},include:{participants:true}}),v=await tx.voluntari.findUnique({where:{id:req.params.voluntariId}});
  if(!s?.conjunt)fail(404,'Servei no trobat');
  if(!v||!participa(s,v.agrupacioId)||!(coordina(req,s)||potGestionarAgrupacio(req,v.agrupacioId)))fail(403,'No pots retirar aquest assistent');
  if(s.arxivat)fail(409,'El servei està tancat');
  const a=await tx.assistenciaServei.findUnique({where:{serveiId_voluntariId:{serveiId:s.id,voluntariId:v.id}}});
  if(a?.horaEntrada||a?.horaSortida||a?.horesRealitzades!=null)fail(409,'No es pot retirar una persona amb fitxatges o hores');
  await tx.assistenciaServei.deleteMany({where:{serveiId:s.id,voluntariId:v.id}});
  await tx.registreAuditoria.create({data:{usuariId:req.usuari!.id,accio:'ELIMINAR',entitat:'EquipServei',entitatId:s.id,agrupacioId:v.agrupacioId,detall:'Voluntari retirat: '+v.id}});
 });res.json({ok:true});
}));
export default router;
