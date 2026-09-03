import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite no resol bé les URL per defecte de les icones de Leaflet; cal
// apuntar-les manualment als fitxers importats.
const iconaPerDefecte = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const CENTRE_CATALUNYA: [number, number] = [41.5912, 1.5209];

export default function SelectorMapa({
  latitud,
  longitud,
  onCanviar,
}: {
  latitud: number | null;
  longitud: number | null;
  onCanviar: (lat: number, lng: number) => void;
}) {
  const contenidorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const marcadorRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!contenidorRef.current || mapaRef.current) return;
    const centreInicial: [number, number] = latitud && longitud ? [latitud, longitud] : CENTRE_CATALUNYA;
    const mapa = L.map(contenidorRef.current).setView(centreInicial, latitud && longitud ? 13 : 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapa);
    mapa.on('click', (e: L.LeafletMouseEvent) => {
      onCanviar(e.latlng.lat, e.latlng.lng);
    });
    mapaRef.current = mapa;
    return () => {
      mapa.remove();
      mapaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    if (latitud && longitud) {
      if (marcadorRef.current) {
        marcadorRef.current.setLatLng([latitud, longitud]);
      } else {
        marcadorRef.current = L.marker([latitud, longitud], { icon: iconaPerDefecte }).addTo(mapa);
      }
    }
  }, [latitud, longitud]);

  return (
    <div>
      <div ref={contenidorRef} style={{ height: 220, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--c-border)' }} />
      <p className="text-muted" style={{ fontSize: 11, margin: '4px 0 0' }}>
        Fes clic al mapa per marcar la ubicació de la seu.
      </p>
    </div>
  );
}
