// Geocodificació d'adreces via Nominatim (OpenStreetMap), el mateix proveïdor
// que ja fem servir per als mapes. És gratuït i no necessita clau d'API, però
// cal no abusar-ne (una petició per acció de l'usuari, mai automàtica en cada
// tecla).
export async function geocodificarAdreca(adreca: string): Promise<{ lat: number; lng: number } | null> {
  const consulta = `${adreca}, Catalunya`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(consulta)}`;
  const resposta = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resposta.ok) return null;
  const resultats = await resposta.json();
  if (!Array.isArray(resultats) || resultats.length === 0) return null;
  return { lat: Number(resultats[0].lat), lng: Number(resultats[0].lon) };
}
