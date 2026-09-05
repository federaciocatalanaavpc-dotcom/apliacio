import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Afegeix el token a totes les peticions si hi és
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UsuariActual {
  id: string;
  nom: string;
  usuari: string;
  rol: 'FEDERACIO' | 'AGRUPACIO';
  agrupacioId: string | null;
  agrupacioNom: string | null;
}

export async function login(usuari: string, contrasenya: string): Promise<UsuariActual> {
  const { data } = await api.post('/auth/login', { usuari, contrasenya });
  localStorage.setItem('token', data.token);
  localStorage.setItem('usuari', JSON.stringify(data.usuari));
  return data.usuari;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuari');
}

export function getUsuariActual(): UsuariActual | null {
  const raw = localStorage.getItem('usuari');
  return raw ? JSON.parse(raw) : null;
}

// Cada usuari pot canviar la seva pròpia contrasenya (cal saber l'actual).
// La federació mai veu les contrasenyes en clar; només les pot restablir
// des de Gestionar usuaris.
export async function canviarContrasenya(contrasenyaActual: string, contrasenyaNova: string) {
  await api.patch('/auth/contrasenya', { contrasenyaActual, contrasenyaNova });
}

// Els fitxers (desats a la base de dades) es serveixen darrere d'autenticació,
// així que no es poden obrir amb un <a href> normal (el navegador no hi
// afegiria el token). Es descarreguen com a blob amb el token i s'obren amb
// una URL d'objecte temporal.
export async function obrirFitxerProtegit(urlRelatiu: string) {
  const { data } = await api.get(urlRelatiu, { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
