// Tiles de carrer per als mapes Leaflet de l'app.
//
// NO fem servir tile.openstreetmap.org directament: els servidors gratuïts
// d'OpenStreetMap bloquegen (403 "Access blocked") les apps allotjades que
// generen trànsit continu des d'un servidor de producció, encara que sigui
// poc volum, perquè no compleixen la seva política d'ús de tiles
// (osm.wiki/Blocked exigeix allotjar-los tu mateix o fer servir un proveïdor
// intermediari). CARTO ofereix el mateix mapa (dades d'OpenStreetMap) amb
// tiles gratuïtes pensades per a aplicacions de tercers, sense clau d'API.
export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
export const TILE_SUBDOMAINS = 'abcd';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
export const TILE_MAX_ZOOM = 19;
