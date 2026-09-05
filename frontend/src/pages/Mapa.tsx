import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { Material, llistarMaterial } from '../services/material';
import { Vehicle, llistarVehicles } from '../services/vehicles';
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

// Demana la ubicació del dispositiu amb un límit de temps; si l'usuari la
// denega o triga massa, es continua sense (el mapa cau al comportament
// anterior de centrar-se segons les associacions).
function obtenirUbicacioDispositiu(): Promise<[number, number] | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
      () => resolve(null),
      { timeout: 6000, maximumAge: 60000 }
    );
  });
}

export default function Mapa() {
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const contenidorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelat = false;

    async function carregar() {
      setCarregant(true);
      try {
        const [agrupacions, material, vehicles, ubicacioDispositiu] = await Promise.all([
          llistarAgrupacions(),
          llistarMaterial(),
          llistarVehicles(),
          obtenirUbicacioDispositiu(),
        ]);
        if (cancelat || !contenidorRef.current) return;

        const materialPerAgrupacio = new Map<string, Material[]>();
        for (const m of material) {
          const llista = materialPerAgrupacio.get(m.agrupacioId) || [];
          llista.push(m);
          materialPerAgrupacio.set(m.agrupacioId, llista);
        }
        const vehiclesPerAgrupacio = new Map<string, Vehicle[]>();
        for (const v of vehicles) {
          const llista = vehiclesPerAgrupacio.get(v.agrupacioId) || [];
          llista.push(v);
          vehiclesPerAgrupacio.set(v.agrupacioId, llista);
        }

        const ambUbicacio = agrupacions.filter((a): a is Agrupacio & { latitud: number; longitud: number } => a.latitud != null && a.longitud != null);

        if (!mapaRef.current) {
          const satelit = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            { attribution: 'Tiles &copy; Esri', maxZoom: 19 }
          );
          const etiquetes = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            { attribution: 'Tiles &copy; Esri', maxZoom: 19 }
          );
          const carrer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
          });

          mapaRef.current = L.map(contenidorRef.current, { layers: [satelit, etiquetes] }).setView(CENTRE_CATALUNYA, 8);
          L.control
            .layers({ Satèl·lit: L.layerGroup([satelit, etiquetes]), Carrer: carrer })
            .addTo(mapaRef.current);
        }
        const mapa = mapaRef.current;
        const marcadorsPerId = new Map<string, L.Marker>();

        for (const a of ambUbicacio) {
          const vehiclesAssociacio = vehiclesPerAgrupacio.get(a.id) || [];
          const materialAssociacio = materialPerAgrupacio.get(a.id) || [];
          const resum = `${vehiclesAssociacio.length} vehicle${vehiclesAssociacio.length === 1 ? '' : 's'} · ${materialAssociacio.length} material${materialAssociacio.length === 1 ? '' : 's'}`;
          const contingut = document.createElement('div');
          contingut.innerHTML = `<strong>${escapeHtml(a.nom)}</strong><p style="margin:4px 0 8px;color:#7a6a58;">${resum}</p>`;
          const botoInventari = document.createElement('button');
          botoInventari.textContent = 'Veure inventari →';
          botoInventari.style.cssText = 'font-size:12px;';
          botoInventari.onclick = () => navigate(`/inventari?agrupacio=${a.id}&nom=${encodeURIComponent(a.nom)}`);
          contingut.appendChild(botoInventari);

          const marcador = L.marker([a.latitud, a.longitud], { icon: iconaPerDefecte })
            .addTo(mapa)
            .bindPopup(contingut)
            .bindTooltip(`<span data-id="${a.id}">${escapeHtml(a.municipi || a.nom)}</span>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -38],
              className: 'etiqueta-poble',
            });
          marcadorsPerId.set(a.id, marcador);
        }

        // L'etiqueta amb el nom del poble tapa visualment el marcador (sobretot
        // al mòbil, on és més fàcil tocar el text que la xinxeta petita). En
        // lloc de dependre de quan Leaflet crea el DOM de cada tooltip (té una
        // finestra de carrera amb bindTooltip), un sol listener delegat al
        // contenidor cobreix qualsevol etiqueta, present o futura.
        contenidorRef.current.onclick = (event) => {
          const target = (event.target as HTMLElement).closest('[data-id]');
          const id = target?.getAttribute('data-id');
          if (id) marcadorsPerId.get(id)?.openPopup();
        };

        if (ubicacioDispositiu) {
          L.circleMarker(ubicacioDispositiu, {
            radius: 8,
            color: '#1a73e8',
            fillColor: '#1a73e8',
            fillOpacity: 0.8,
            weight: 2,
          })
            .addTo(mapa)
            .bindPopup('La teva ubicació');
          mapa.setView(ubicacioDispositiu, 13);
        } else if (ambUbicacio.length > 0) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <BotoTornar />
      <h1>Mapa d'associacions i material</h1>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Ubicació de la seu de cada associació (les que la tinguin marcada). Clica una associació per veure'n
        l'inventari.
      </p>
      {error && <p className="text-error">{error}</p>}
      {carregant && <p className="text-muted">Carregant mapa...</p>}
      <div ref={contenidorRef} style={{ height: 520, borderRadius: 'var(--radius-md)', border: '1px solid var(--c-border)' }} />
    </div>
  );
}
