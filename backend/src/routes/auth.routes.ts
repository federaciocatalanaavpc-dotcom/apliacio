import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest, potGestionarAgrupacio } from '../middleware/auth.middleware';
import { compteDisponible, resultatLogin, repteValid, passwordValida, intentFallat, xifrar, desxifrar, totp, validarMfa, hashToken, tokenPer, prepararInvitacio, urlInvitacio } from '../services/seguretat.service';
import * as OTPAuth from 'otpauth';
const router=Router();
const dummy=bcrypt.hash('dummy-'+crypto.randomBytes(20).toString('hex'),12);
router.post('/registre', (_req,res)=>res.status(403).json({error:'El registre públic està desactivat. Demana una invitació.'}));
router.post('/login',async(req,res)=>{
 const {usuari,contrasenya}=req.body;
 if(typeof usuari!=='string'||typeof contrasenya!=='string'||contrasenya.length>128) return res.status(401).json({error:'Credencials incorrectes'});
 const u=await prisma.usuari.findUnique({where:{usuari:usuari.trim().toLowerCase()}});
 const ok=await bcrypt.compare(contrasenya,u?.contrasenya||await dummy);
 if(!u||!ok||!await compteDisponible(u)||u.accessTokenHash||(u.authLockedUntil&&u.authLockedUntil>new Date())) {
  if(u&&!ok) await intentFallat(u.id);
  return res.status(401).json({error:'Accés no disponible. Revisa les credencials o demana una invitació al teu administrador.'});
 }
 const result=await resultatLogin(u);
 if(result.token || (u.authLockedUntil && u.authLockedUntil <= new Date()))await prisma.usuari.update({where:{id:u.id},data:{authFailed:0,authLockedUntil:null}});
 res.json(result);
});
router.post('/completar-contrasenya',async(req,res)=>{
 const ctx=await repteValid(req.body.repte,'setup');
 if(!ctx||!ctx.u.passwordMustChange||(ctx.u.mfaEnabled&&!ctx.p.mfaPassed)) return res.status(401).json({error:'Torna a iniciar sessió'});
 if(!passwordValida(req.body.contrasenya)) return res.status(400).json({error:'Utilitza una contrasenya pròpia de 12 caràcters o més (màxim 72 bytes).'});
 if(await bcrypt.compare(req.body.contrasenya,ctx.u.contrasenya)) return res.status(400).json({error:'Tria una contrasenya diferent de l’anterior.'});
 const hash=await bcrypt.hash(req.body.contrasenya,12);
 const saved=await prisma.usuari.updateMany({where:{id:ctx.u.id,sessionVersion:ctx.u.sessionVersion,passwordMustChange:true},data:{contrasenya:hash,passwordMustChange:false,sessionVersion:{increment:1}}});
 if(!saved.count) return res.status(401).json({error:'El repte ha caducat'});
 res.json(await resultatLogin(await prisma.usuari.findUniqueOrThrow({where:{id:ctx.u.id}}),!!ctx.p.mfaPassed));
});
router.post('/invitacio',async(req,res)=>{
 const {token,contrasenya}=req.body;
 if(typeof token!=='string'||!passwordValida(contrasenya)) return res.status(400).json({error:'Enllaç invàlid o contrasenya massa curta (mínim 12 caràcters).'});
 const u=await prisma.usuari.findUnique({where:{accessTokenHash:hashToken(token)}});
 if(!u||!u.accessExpires||u.accessExpires<new Date()||!await compteDisponible(u)) return res.status(400).json({error:'La invitació ha caducat o ja s’ha utilitzat.'});
 const hash=await bcrypt.hash(contrasenya,12);
 const changed=await prisma.usuari.updateMany({where:{id:u.id,accessTokenHash:hashToken(token),accessExpires:{gt:new Date()}},data:{contrasenya:hash,accessTokenHash:null,accessExpires:null,passwordMustChange:false,sessionVersion:{increment:1},authFailed:0,authLockedUntil:null}});
 if(!changed.count) return res.status(400).json({error:'La invitació ja s’ha utilitzat.'});
 res.json(await resultatLogin(await prisma.usuari.findUniqueOrThrow({where:{id:u.id}})));
});
router.post('/mfa/iniciar',async(req,res)=>{
 const ctx=await repteValid(req.body.repte,'setup');
 if(!ctx||ctx.u.passwordMustChange||ctx.u.mfaEnabled) return res.status(401).json({error:'Torna a iniciar sessió'});
 let enc=ctx.u.mfaPendingSecret;
 if(!enc){
  const candidate=xifrar(new OTPAuth.Secret({size:20}).base32);
  await prisma.usuari.updateMany({where:{id:ctx.u.id,sessionVersion:ctx.u.sessionVersion,mfaPendingSecret:null,mfaEnabled:false},data:{mfaPendingSecret:candidate}});
  enc=(await prisma.usuari.findUniqueOrThrow({where:{id:ctx.u.id}})).mfaPendingSecret;
 }
 if(!enc)return res.status(409).json({error:'Torna a iniciar sessió'});
 const secret=desxifrar(enc); res.json({secret,uri:totp(ctx.u,secret).toString()});
});
router.post('/mfa/activar',async(req,res)=>{
 const ctx=await repteValid(req.body.repte,'setup');
 if(!ctx||ctx.u.passwordMustChange||ctx.u.mfaEnabled) return res.status(401).json({error:'Torna a iniciar sessió'});
 if(!await validarMfa(ctx.u,req.body.codi,true)){await intentFallat(ctx.u.id);return res.status(400).json({error:'Codi incorrecte o ja utilitzat'});}
 const recovery=Array.from({length:8},()=>crypto.randomBytes(12).toString('hex'));
 const changed=await prisma.usuari.updateMany({where:{id:ctx.u.id,sessionVersion:ctx.u.sessionVersion,mfaEnabled:false,mfaPendingSecret:ctx.u.mfaPendingSecret},data:{mfaSecret:ctx.u.mfaPendingSecret,mfaPendingSecret:null,mfaEnabled:true,mfaRecovery:recovery.map(hashToken),sessionVersion:{increment:1},authFailed:0,authLockedUntil:null}});
 if(!changed.count) return res.status(409).json({error:'Configuració ja completada'});
 res.json({...await resultatLogin(await prisma.usuari.findUniqueOrThrow({where:{id:ctx.u.id}}),true),recovery});
});
router.post('/mfa/verificar',async(req,res)=>{
 const ctx=await repteValid(req.body.repte,'mfa');
 if(!ctx||!ctx.u.mfaEnabled) return res.status(401).json({error:'Torna a iniciar sessió'});
 if(!await validarMfa(ctx.u,req.body.codi)){await intentFallat(ctx.u.id);return res.status(400).json({error:'Codi incorrecte o ja utilitzat'});}
 await prisma.usuari.update({where:{id:ctx.u.id},data:{authFailed:0,authLockedUntil:null}});
 res.json(await resultatLogin(ctx.u,true));
});
router.patch('/contrasenya',requireAuth,async(req:AuthRequest,res)=>{
 const {contrasenyaActual,contrasenyaNova}=req.body;
 const u=await prisma.usuari.findUniqueOrThrow({where:{id:req.usuari!.id}});
 if(typeof contrasenyaActual!=='string'||!await bcrypt.compare(contrasenyaActual,u.contrasenya))return res.status(401).json({error:'Contrasenya actual incorrecta'});
 if(!passwordValida(contrasenyaNova))return res.status(400).json({error:'La nova contrasenya ha de tenir almenys 12 caràcters.'});
 const updated=await prisma.usuari.update({where:{id:u.id},data:{contrasenya:await bcrypt.hash(contrasenyaNova,12),sessionVersion:{increment:1},passwordMustChange:false,accessTokenHash:null,accessExpires:null}});
 res.json({ok:true,token:tokenPer(updated,'access',u.mfaEnabled)});
});
router.post('/sortir',requireAuth,async(req:AuthRequest,res)=>{
 await prisma.$transaction([
  prisma.usuari.update({where:{id:req.usuari!.id},data:{sessionVersion:{increment:1}}}),
  prisma.subscripcioPush.deleteMany({where:{usuariId:req.usuari!.id}}),
 ]); res.json({ok:true});
});
router.get('/me',requireAuth,async(req:AuthRequest,res)=>{
 const u=await prisma.usuari.findUniqueOrThrow({where:{id:req.usuari!.id}});
 res.json((await resultatLogin(u,u.mfaEnabled)).usuari);
});
router.post('/invitacions/:id',requireAuth,async(req:AuthRequest,res)=>{
 const u=await prisma.usuari.findUnique({where:{id:req.params.id}});
 if(!u||!await compteDisponible(u))return res.status(404).json({error:'Compte no disponible'});
 const esFederacio=req.usuari!.rol==='FEDERACIO';
 if(!esFederacio && (!u.agrupacioId||!['VOLUNTARI','ADMIN_AVPC'].includes(u.rol)||!potGestionarAgrupacio(req,u.agrupacioId)))return res.status(403).json({error:'No pots gestionar aquest compte'});
 if(u.id===req.usuari!.id)return res.status(400).json({error:'Canvia la teva contrasenya des del perfil.'});
 const inv=prepararInvitacio();
 await prisma.$transaction([
  prisma.usuari.update({where:{id:u.id},data:{...inv.data,sessionVersion:{increment:1},mfaPendingSecret:null}}),
  prisma.subscripcioPush.deleteMany({where:{usuariId:u.id}})
 ]);
 res.json({invitacioUrl:urlInvitacio(inv.token)});
});
export default router;
