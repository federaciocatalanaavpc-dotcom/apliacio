import { api } from './api';

export interface Usuari {
  id: string;
  nom: string;
  usuari: string;
  rol: 'FEDERACIO' | 'AGRUPACIO';
  agrupacioId: string | null;
  agrupacio: { id: string; nom: string } | null;
  actiu: boolean;
  creatEl: string;
}

export async function llistarUsuaris(): Promise<Usuari[]> {
  const { data } = await api.get('/usuaris');
  return data;
}

export async function crearUsuari(dades: {
  nom: string;
  usuari: string;
  contrasenya: string;
  rol: 'FEDERACIO' | 'AGRUPACIO';
  agrupacioId?: string;
}): Promise<Usuari> {
  const { data } = await api.post('/usuaris', dades);
  return data;
}

export async function editarUsuari(
  id: string,
  dades: Partial<{ nom: string; rol: 'FEDERACIO' | 'AGRUPACIO'; agrupacioId: string; actiu: boolean; contrasenya: string }>
): Promise<Usuari> {
  const { data } = await api.patch(`/usuaris/${id}`, dades);
  return data;
}

export async function eliminarUsuari(id: string) {
  await api.delete(`/usuaris/${id}`);
}

// Crea en un sol pas una associació i el seu usuari d'accés (amb un login
// generat automàticament a partir del nom de l'associació).
export async function crearUsuariNovaAssociacio(dades: {
  nomAssociacio: string;
  usuari?: string;
  email?: string;
  provincia?: string;
  contrasenya: string;
}): Promise<{ agrupacio: { id: string; nom: string }; usuari: Usuari }> {
  const { data } = await api.post('/usuaris/nova-associacio', dades);
  return data;
}
