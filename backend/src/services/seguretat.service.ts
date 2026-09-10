import 'dotenv/config';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Usuari } from '@prisma/client';
import { prisma } from '../prisma';

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32 || secret === 'canvia_aquest_secret') throw new Error('Configura JWT_SECRET amb almenys 32 caràcters aleatoris');
const options = { algorithms: ['HS256'] as jwt.Algorithm[], issuer: 'app-federacio', audience: 'app-federacio' };
export const hashToken = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
export function passwordValida(p: unknown): p is string {
  return typeof p === 'string' && p.length >= 12 && Buffer.byteLength(p, 'utf8') <= 72 && !/^(.)\1+$/.test(p) && !['123456789012','password1234','contrasenya123','contraseña123'].includes(p.toLowerCase());
}
export function tokenPer(u: Pick<Usuari, 'id' | 'sessionVersion'>, purpose: 'access' | 'setup') {
  return jwt.sign({ id: u.id, sv: u.sessionVersion, purpose }, secret!, { algorithm: 'HS256', issuer: options.issuer, audience: options.audience, expiresIn: purpose === 'access' ? '8h' : '10m' });
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
  return { id:u.id, nom:u.nom, usuari:u.usuari, rol:u.rol, agrupacioId:u.agrupacioId, actiu:u.actiu, creatEl:u.creatEl };
}
export async function resultatLogin(u: Usuari): Promise<any> {
  if (u.passwordMustChange) return { pas:'password', repte:tokenPer(u,'setup') };
  const ag = u.agrupacioId ? await prisma.agrupacio.findUnique({ where:{id:u.agrupacioId},select:{nom:true} }) : null;
  return { token:tokenPer(u,'access'), usuari:{...usuariPublic(u),agrupacioNom:ag?.nom || null} };
}
export async function repteValid(token: unknown, purpose: 'setup') {
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
export function prepararInvitacio() {
  const token=crypto.randomBytes(32).toString('base64url');
  return {token, data:{accessTokenHash:hashToken(token),accessExpires:new Date(Date.now()+24*3600_000),passwordMustChange:true}};
}
export function urlInvitacio(token:string) {
  return (process.env.FRONTEND_URL || 'https://avpc-federacio-frontend.onrender.com')+'/login#invitacio='+token;
}
export async function passwordAleatoria() { return bcrypt.hash(crypto.randomBytes(32).toString('base64url'),12); }
