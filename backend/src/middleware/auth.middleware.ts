import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'canvia_aquest_secret';

export interface AuthRequest extends Request {
  usuari?: { id: string; rol: 'FEDERACIO' | 'AGRUPACIO'; agrupacioId: string | null };
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
      rol: 'FEDERACIO' | 'AGRUPACIO';
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

// Un usuari de la federació pot gestionar qualsevol agrupació; un usuari
// d'agrupació només pot gestionar la seva pròpia.
export function potGestionarAgrupacio(req: AuthRequest, agrupacioId: string): boolean {
  return req.usuari?.rol === 'FEDERACIO' || req.usuari?.agrupacioId === agrupacioId;
}
