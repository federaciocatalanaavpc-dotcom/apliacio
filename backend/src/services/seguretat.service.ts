import 'dotenv/config';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as OTPAuth from 'otpauth';
import { Usuari } from '@prisma/client';
import { prisma } from '../prisma';

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32 || secret === 'canvia_aquest_secret') throw new Error('Configura JWT_SECRET amb almenys 32 caràcters aleatoris');
const key = crypto.createHash('sha256').update('avpc-mfa-v1:' + secret).digest();
const options = { algorithms: ['HS256'] as jwt.Algorithm[], issuer: 'app-federacio', audience: 'app-federacio' };
export const hashToken = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
export const esAdministrador = (rol: string) => ['FEDERACIO', 'AGRUPACIO', 'ADMIN_AVPC'].includes(rol);
export function passwordValida(p: unknown): p is string {
  return typeof p === 'string' && p.length >= 12 && Buffer.byteLength(p, 'utf8') <= 72 && !/^(.)\1+$/.test(p) && !['123456789012','password1234','contrasenya123','contraseña123'].includes(p.toLowerCase());
}
export function xifrar(value: string) {
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data=Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv,data,cipher.getAuthTag()]).toString('base64');
}
export function desxifrar(value: string) {
  const b = Buffer.from(value, 'base64'); const decipher = crypto.createDecipheriv('aes-256-gcm', key, b.subarray(0, 12));
  decipher.setAuthTag(b.subarray(-16)); return Buffer.concat([decipher.update(b.subarray(12, -16)), decipher.final()]).toString('utf8');
}
export function tokenPer(u: Pick<Usuari, 'id' | 'sessionVersion'>, purpose: 'access' | 'setup' | 'mfa', mfaPassed = false) {
  return jwt.sign({ id: u.id, sv: u.sessionVersion, purpose, mfaPassed }, secret!, { algorithm: 'HS256', issuer: options.issuer, audience: options.audience, expiresIn: purpose === 'access' ? '8h' : '10m' });
}
export function llegirToken(token: string) {
  const p = jwt.verify(token, secret!, options) as jwt.JwtPayload;
  if (typeof p.id !== 'string' || !Number.isInteger(p.sv)) throw new Error('Token invàlid');
  return p;
}
export async function compteDisponible(u: Usuari | null) {
  if (!u || !u.actiu) return false;
  if (u.rol !== 'FEDERACIO' && !u.agrupacioId) return false;
  if (u.agrupacioId && !(await prisma.agrupacio.findUnique({ where: { id: u.agrupacioId }, select: { actiu: true } }))?.actiu) return false;
  if (['VOLUNTARI','ADMIN_AVPC'].includes(u.rol)) {
    const v = await prisma.voluntari.findUnique({ where: { usuariId: u.id }, select: { actiu: true, dataBaixa: true, agrupacioId:true } });
    if (!v || v.agrupacioId!==u.agrupacioId || !v.actiu || (v.dataBaixa && v.dataBaixa <= new Date())) return false;
  }
  return true;
}
// Llista explícita: mai incloure secrets, hashes d'invitació o codis de recuperació.
export function usuariPublic(u: Usuari) {
  return { id:u.id, nom:u.nom, usuari:u.usuari, rol:u.rol, agrupacioId:u.agrupacioId, actiu:u.actiu, creatEl:u.creatEl, mfaEnabled:u.mfaEnabled };
}
export async function resultatLogin(u: Usuari, mfaPassed = false): Promise<any> {
  if (u.mfaEnabled && !mfaPassed) return { pas:'mfa', repte:tokenPer(u,'mfa') };
  if (u.passwordMustChange) return { pas:'password', repte:tokenPer(u,'setup',mfaPassed) };
  if (esAdministrador(u.rol) && !u.mfaEnabled) return { pas:'enrol', repte:tokenPer(u,'setup') };
  const ag = u.agrupacioId ? await prisma.agrupacio.findUnique({ where:{id:u.agrupacioId},select:{nom:true} }) : null;
  return { token:tokenPer(u,'access',mfaPassed), usuari:{...usuariPublic(u),agrupacioNom:ag?.nom || null} };
}
export async function repteValid(token: unknown, purpose: 'setup' | 'mfa') {
  if (typeof token !== 'string') return null;
  try {
    const p=llegirToken(token);
    if(p.purpose!==purpose) return null;
    const u=await prisma.usuari.findUnique({where:{id:p.id}});
    if(!u || u.sessionVersion!==p.sv || u.accessTokenHash || !await compteDisponible(u)) return null;
    if(u.authLockedUntil && u.authLockedUntil > new Date()) return null;
    return {u,p};
  } catch { return null; }
}
export async function intentFallat(id:string) {
  const u=await prisma.usuari.update({where:{id},data:{authFailed:{increment:1}}});
  if(u.authFailed>=10) await prisma.usuari.update({where:{id},data:{authLockedUntil:new Date(Date.now()+15*60_000)}});
}
export function totp(u: Pick<Usuari,'usuari'>, secretBase32: string) {
  return new OTPAuth.TOTP({ issuer:'App Federació', label:u.usuari, algorithm:'SHA1', digits:6, period:30, secret:OTPAuth.Secret.fromBase32(secretBase32) });
}
export async function validarMfa(u: Usuari, code: unknown, pending = false) {
  if(typeof code !== 'string') return false;
  const enc = pending ? u.mfaPendingSecret : u.mfaSecret;
  if(!enc) return false;
  const delta=totp(u,desxifrar(enc)).validate({token:code.replace(/\s/g,''),window:1});
  if(delta !== null) {
    const step=Math.floor(Date.now()/30000)+delta;
    const saved=await prisma.usuari.updateMany({where:{id:u.id,sessionVersion:u.sessionVersion,mfaLastStep:{lt:step}, ...(pending?{mfaPendingSecret:enc}:{mfaSecret:enc})},data:{mfaLastStep:step}});
    return saved.count===1;
  }
  if(pending) return false;
  const hashed=hashToken(code.trim());
  if(!u.mfaRecovery.includes(hashed)) return false;
  const saved=await prisma.usuari.updateMany({where:{id:u.id,sessionVersion:u.sessionVersion,mfaRecovery:{equals:u.mfaRecovery}},data:{mfaRecovery:u.mfaRecovery.filter(v=>v!==hashed)}});
  return saved.count===1;
}
export function prepararInvitacio() {
  const token=crypto.randomBytes(32).toString('base64url');
  return {token, data:{accessTokenHash:hashToken(token),accessExpires:new Date(Date.now()+24*3600_000),passwordMustChange:true}};
}
export function urlInvitacio(token:string) {
  return (process.env.FRONTEND_URL || 'https://avpc-federacio-frontend.onrender.com')+'/login#invitacio='+token;
}
export async function passwordAleatoria() { return bcrypt.hash(crypto.randomBytes(32).toString('base64url'),12); }
