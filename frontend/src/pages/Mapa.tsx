import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { Material, llistarMaterial } from '../services/material';
import BotoTornar from '../components/BotoTornar';

const iconaPerDefecte = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const CENTRE_CATALUNYA: [number, number] = [41.5912, 1.5209];

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default function Mapa() {
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const contenidorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);

  useEffect(() => {
    let cancelat = false;

    async function carregar() {
      setCarregant(true);
      try {
        const [agrupacions, material] = await Promise.all([llistarAgrupacions(), llistarMaterial()]);
        if (cancelat || !contenidorRef.current) return;

        const materialPerAgrupacio = new Map<string, Material[]>();
        for (const m of material) {
          const llista = materialPerAgrupacio.get(m.agrupacioId) || [];
          llista.push(m);
          materialPerAgrupacio.set(m.agrupacioId, llista);
        }

        const ambUbicacio = agrupacions.filter((a): a is Agrupacio & { latitud: number; longitud: number } => a.latitud != null && a.longitud != null);

        if (!mapaRef.current) {
          mapaRef.current = L.map(contenidorRef.current).setView(CENTRE_CATALUNYA, 8);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
          }).addTo(mapaRef.current);
        }
        const mapa = mapaRef.current;

        for (const a of ambUbicacio) {
          const materialAssociacio = materialPerAgrupacio.get(a.id) || [];
          const llistaHtml = materialAssociacio.length
            ? `<ul style="margin:6px 0 0;padding-left:18px;">${materialAssociacio
                .map((m) => `<li>${escapeHtml(m.nom)} · ${m.quantitat}</li>`)
                .join('')}</ul>`
            : '<p style="margin:6px 0 0;color:#7a6a58;">Sense material registrat.</p>';
          L.marker([a.latitud, a.longitud], { icon: iconaPerDefecte })
            .addTo(mapa)
            .bindPopup(`<strong>${escapeHtml(a.nom)}</strong>${llistaHtml}`);
        }

        if (ambUbicacio.length > 0) {
          const bounds = L.latLngBounds(ambUbicacio.map((a) => [a.latitud, a.longitud] as [number, number]));
          mapa.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch {
        if (!cancelat) setError('No s\'ha pogut carregar el mapa');
      } finally {
        if (!cancelat) setCarregant(false);
      }
    }

    carregar();
    return () => {
      cancelat = true;
      mapaRef.current?.remove();
      mapaRef.current = null;
    };
  }, []);

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <BotoTornar />
      <h1>Mapa d'associacions i material</h1>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Ubicació de la seu de cada associació (les que la tinguin marcada) i el material que hi ha registrat.
      </p>
      {error && <p className="text-error">{error}</p>}
      {carregant && <p className="text-muted">Carregant mapa...</p>}
      <div ref={contenidorRef} style={{ height: 520, borderRadius: 'var(--radius-md)', border: '1px solid var(--c-border)' }} />
    </div>
  );
}
