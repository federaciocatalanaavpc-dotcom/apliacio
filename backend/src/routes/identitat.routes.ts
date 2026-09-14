import {Router} from 'express';
import multer from 'multer';
import {prisma} from '../prisma';
import {requireAuth,AuthRequest,potGestionarAgrupacio} from '../middleware/auth.middleware';
const router=Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:1024*1024,files:1,fields:0}});
router.get('/associacio/logo',requireAuth,async(req:AuthRequest,res)=>{
 const id=req.usuari!.agrupacioId;if(!id)return res.status(404).end();
 const logo=await prisma.logoAgrupacio.findUnique({where:{agrupacioId:id}});if(!logo)return res.status(404).end();
 res.setHeader('Content-Type','image/png');res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');res.send(logo.contingut);
});
router.put('/associacio/logo',requireAuth,(req:AuthRequest,res,next)=>{
 const id=req.usuari!.agrupacioId;if(!id||!potGestionarAgrupacio(req,id))return res.status(403).json({error:'Només els responsables de la teva AVPC poden canviar el logotip'});next();
},upload.single('logo'),async(req:AuthRequest,res)=>{
 const b=req.file?.buffer;
 if(!b||b.length<33||!b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))||b.subarray(12,16).toString()!=='IHDR'||b.readUInt32BE(16)<1||b.readUInt32BE(20)<1||b.readUInt32BE(16)>1024||b.readUInt32BE(20)>1024)return res.status(400).json({error:'Cal una imatge PNG vàlida de fins a 1 MB i 1.024 píxels'});
 const id=req.usuari!.agrupacioId!;await prisma.$transaction(async tx=>{
  await tx.logoAgrupacio.upsert({where:{agrupacioId:id},create:{agrupacioId:id,contingut:b},update:{contingut:b}});
  await tx.registreAuditoria.create({data:{usuariId:req.usuari!.id,accio:'EDITAR',entitat:'LogoAgrupacio',entitatId:id,agrupacioId:id}});
 });res.json({ok:true});
});
router.delete('/associacio/logo',requireAuth,async(req:AuthRequest,res)=>{
 const id=req.usuari!.agrupacioId;if(!id||!potGestionarAgrupacio(req,id))return res.status(403).json({error:'No pots canviar aquest logotip'});
 await prisma.$transaction([prisma.logoAgrupacio.deleteMany({where:{agrupacioId:id}}),prisma.registreAuditoria.create({data:{usuariId:req.usuari!.id,accio:'ELIMINAR',entitat:'LogoAgrupacio',entitatId:id,agrupacioId:id}})]);res.json({ok:true});
});
export default router;
