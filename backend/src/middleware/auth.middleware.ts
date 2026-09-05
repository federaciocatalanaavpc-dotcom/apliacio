import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'canvia_aquest_secret';

export interface AuthRequest extends Request {
  usuari?: { id: string; rol: 'FEDERACIO' | 'AGRUPACIO' | 'VOLUNTARI'; agrupacioId: string | null };
}

// Comprova que hi ha un token vàlid i afegeix l'usuari a la request
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const capçalera = req.headers.authorization;
  if (!capçalera || !capçalera.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionat' });
  }
  const token = capçalera.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: string;
      rol: 'FEDERACIO' | 'AGRUPACIO' | 'VOLUNTARI';
      agrupacioId: string | null;
    };
    req.usuari = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invàlid o caducat' });
  }
}

// Permet l'accés només a usuaris de la federació
export function requireFederacio(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.usuari?.rol !== 'FEDERACIO') {
    return res.status(403).json({ error: 'Acció reservada a la federació' });
  }
  next();
}

// El compte d'un voluntari només s'ha de fer servir per veure/confirmar els
// seus propis serveis; comparteix agrupacioId amb el compte de la seva
// associació, així que sense aquest bloqueig colaria pels controls que
// només miren "és federació o coincideix l'agrupacioId" a les rutes
// generals (vehicles, material, documents, avisos...).
export function bloquejaVoluntaris(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.usuari?.rol === 'VOLUNTARI') {
    return res.status(403).json({ error: 'Aquesta secció no és per a comptes de voluntari' });
  }
  next();
}

// Un usuari de la federació pot gestionar qualsevol agrupació; un usuari
// d'agrupació només pot gestionar la seva pròpia. Un voluntari NO compta
// com a "pot gestionar" (encara que comparteixi agrupacioId amb el compte
// de la seva associació): només ha de poder fer les accions concretes que
// se li obrin explícitament (veure/confirmar els seus serveis), no editar
// vehicles, material, documents, etc.
export function potGestionarAgrupacio(req: AuthRequest, agrupacioId: string): boolean {
  if (req.usuari?.rol === 'FEDERACIO') return true;
  return req.usuari?.rol === 'AGRUPACIO' && req.usuari.agrupacioId === agrupacioId;
}
