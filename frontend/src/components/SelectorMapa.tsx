import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { TILE_URL, TILE_SUBDOMAINS, TILE_ATTRIBUTION, TILE_MAX_ZOOM } from '../utils/mapTiles';

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
  descripcio = "Fes clic al mapa per marcar la ubicació de la seu.",
}: {
  descripcio?: string;
  latitud: number | null;
  longitud: number | null;
  onCanviar: (lat: number, lng: number) => void;
}) {
  const contenidorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const marcadorRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!contenidorRef.current || mapaRef.current) return;
    const centreInicial: [number, number] = latitud != null && longitud != null ? [latitud, longitud] : CENTRE_CATALUNYA;
    const mapa = L.map(contenidorRef.current).setView(centreInicial, latitud != null && longitud != null ? 13 : 8);
    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      subdomains: TILE_SUBDOMAINS,
      maxZoom: TILE_MAX_ZOOM,
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
    if (latitud != null && longitud != null) {
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
        {descripcio}
      </p>
    </div>
  );
}
