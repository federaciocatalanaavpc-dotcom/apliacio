import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireFederacio, AuthRequest } from '../middleware/auth.middleware';
import { prepararInvitacio, urlInvitacio, passwordAleatoria, usuariPublic } from '../services/seguretat.service';
const router=Router(); router.use(requireAuth); router.use(requireFederacio);
router.get('/',async(_req,res)=>{
 const rows=await prisma.usuari.findMany({include:{agrupacio:{select:{id:true,nom:true}}},orderBy:{nom:'asc'}});
 res.json(rows.map(u=>({...usuariPublic(u),agrupacio:u.agrupacio})));
});
router.post('/',async(req,res)=>{
 const {nom,usuari,rol,agrupacioId}=req.body;
 if(typeof nom!=='string'||!nom.trim()||typeof usuari!=='string'||!usuari.trim()||!['FEDERACIO','AGRUPACIO'].includes(rol)||(rol==='AGRUPACIO'&&!agrupacioId))return res.status(400).json({error:'Falten camps obligatoris'});
 const invite=prepararInvitacio();
 const u=await prisma.usuari.create({data:{nom:nom.trim(),usuari:usuari.trim().toLowerCase(),rol,agrupacioId:rol==='AGRUPACIO'?agrupacioId:null,contrasenya:await passwordAleatoria(),...invite.data}});
 res.status(201).json({...usuariPublic(u),invitacioUrl:urlInvitacio(invite.token)});
});
async function generarUsuariUnic(base:string){
 const arrel=base.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,30)||'associacio';
 let candidate=arrel, n=1;while(await prisma.usuari.findUnique({where:{usuari:candidate}}))candidate=arrel+(++n); return candidate;
}
router.post('/nova-associacio',async(req,res)=>{
 const {nomAssociacio,usuari,email,provincia}=req.body;
 if(typeof nomAssociacio!=='string'||!nomAssociacio.trim())return res.status(400).json({error:'Cal el nom de l’associació'});
 const login=typeof usuari==='string'&&usuari.trim()?usuari.trim().toLowerCase():await generarUsuariUnic(nomAssociacio);
 const invite=prepararInvitacio(), password=await passwordAleatoria();
 const result=await prisma.$transaction(async tx=>{
  const ag=await tx.agrupacio.create({data:{nom:nomAssociacio,email:email||null,provincia:provincia||null}});
  const u=await tx.usuari.create({data:{nom:nomAssociacio,usuari:login,rol:'AGRUPACIO',agrupacioId:ag.id,contrasenya:password,...invite.data}});
  return {agrupacio:ag,usuari:usuariPublic(u),invitacioUrl:urlInvitacio(invite.token)};
 });res.status(201).json(result);
});
router.patch('/:id',async(req:AuthRequest,res)=>{
 const {nom,rol,agrupacioId,actiu,contrasenya}=req.body;
 const old=await prisma.usuari.findUnique({where:{id:req.params.id},include:{voluntariPerfil:{select:{id:true}}}});
 if(!old)return res.status(404).json({error:'Usuari no trobat'});
 if(contrasenya!==undefined)return res.status(400).json({error:'Utilitza una invitació per restablir l’accés.'});
 const allowed=old.voluntariPerfil?['VOLUNTARI','ADMIN_AVPC']:['FEDERACIO','AGRUPACIO'];
 if(rol!==undefined&&!allowed.includes(rol))return res.status(400).json({error:'Gestiona els rols de voluntaris des de Gestió AVPC.'});
 if(req.params.id===req.usuari!.id&&(actiu===false||(rol&&rol!==old.rol)))return res.status(400).json({error:'No pots retirar el teu propi accés.'});
 if(old.voluntariPerfil && agrupacioId!==undefined && agrupacioId!==old.agrupacioId)return res.status(400).json({error:'El compte està vinculat a la seva fitxa de voluntari.'});
 const finalRole=rol||old.rol;
 const ag=finalRole==='FEDERACIO'?null:(agrupacioId===undefined?old.agrupacioId:agrupacioId);
 if(finalRole!=='FEDERACIO'&&!ag)return res.status(400).json({error:'Cal una associació.'});
 const u=await prisma.$transaction(async tx=>{
  const u=await tx.usuari.update({where:{id:old.id},data:{nom,rol,actiu,agrupacioId:ag,sessionVersion:{increment:1},accessTokenHash:null,accessExpires:null}});
  if(u.rol==='AGRUPACIO'&&u.agrupacioId&&nom)await tx.agrupacio.update({where:{id:u.agrupacioId},data:{nom}});
  if(actiu===false)await tx.subscripcioPush.deleteMany({where:{usuariId:old.id}});
  return u;
 });res.json(usuariPublic(u));
});
router.delete('/:id',async(req:AuthRequest,res)=>{
 if(req.params.id===req.usuari!.id)return res.status(400).json({error:'No pots eliminar el teu propi compte.'});
 try{await prisma.usuari.delete({where:{id:req.params.id}});res.status(204).send();}
 catch{res.status(409).json({error:'Aquest usuari té registres associats. Pots desactivar-lo.'});}
});
export default router;
