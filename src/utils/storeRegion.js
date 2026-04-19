const DEFAULT_STORE_LAT = -10.1853248;
const DEFAULT_STORE_LNG = -48.3037058;
const DEFAULT_SAFE_RADIUS_KM = 35;
const DEFAULT_CITY = 'palmas';
const DEFAULT_STATE_CODE = 'to';
const DEFAULT_COUNTRY_CODES = new Set(['br', 'bra']);
const DEFAULT_MAP_BOUNDS = {
  north: -10.02,
  south: -10.42,
  west: -48.58,
  east: -48.08,
};

const toFiniteNumber = (value) => {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeText = (value) => (
  typeof value === 'string'
    ? value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
    : ''
);

export const STORE_CENTER = {
  lat: toFiniteNumber(process.env.NEXT_PUBLIC_STORE_LAT) ?? DEFAULT_STORE_LAT,
  lng: toFiniteNumber(process.env.NEXT_PUBLIC_STORE_LNG) ?? DEFAULT_STORE_LNG,
};

export const STORE_SAFE_RADIUS_KM = toFiniteNumber(process.env.NEXT_PUBLIC_STORE_SAFE_RADIUS_KM) ?? DEFAULT_SAFE_RADIUS_KM;

export const STORE_MAP_BOUNDS = {
  north: toFiniteNumber(process.env.NEXT_PUBLIC_STORE_BOUNDS_NORTH) ?? DEFAULT_MAP_BOUNDS.north,
  south: toFiniteNumber(process.env.NEXT_PUBLIC_STORE_BOUNDS_SOUTH) ?? DEFAULT_MAP_BOUNDS.south,
  west: toFiniteNumber(process.env.NEXT_PUBLIC_STORE_BOUNDS_WEST) ?? DEFAULT_MAP_BOUNDS.west,
  east: toFiniteNumber(process.env.NEXT_PUBLIC_STORE_BOUNDS_EAST) ?? DEFAULT_MAP_BOUNDS.east,
};

export function extractLatLng(value) {
  if (!value || typeof value !== 'object') return null;

  const lat = toFiniteNumber(value.lat ?? value.latitude);
  const lng = toFiniteNumber(value.lng ?? value.longitude);

  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export function haversineKm(origin, destination) {
  const from = extractLatLng(origin);
  const to = extractLatLng(destination);
  if (!from || !to) return null;

  const earthRadiusKm = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function isWithinStoreBounds(value) {
  const coords = extractLatLng(value);
  if (!coords) return false;

  return (
    coords.lat <= STORE_MAP_BOUNDS.north
    && coords.lat >= STORE_MAP_BOUNDS.south
    && coords.lng >= STORE_MAP_BOUNDS.west
    && coords.lng <= STORE_MAP_BOUNDS.east
  );
}

export function isWithinStoreRadius(value, maxDistanceKm = STORE_SAFE_RADIUS_KM) {
  const coords = extractLatLng(value);
  if (!coords) return false;

  const distanceKm = haversineKm(STORE_CENTER, coords);
  return typeof distanceKm === 'number' && distanceKm <= maxDistanceKm;
}

export function isLocalAddressCandidate(address = {}) {
  if (!address || typeof address !== 'object') return true;

  const city = normalizeText(address.city);
  const state = normalizeText(address.state ?? address.state_code);
  const country = normalizeText(address.country ?? address.country_code);

  const cityMatches = !city || city.includes(DEFAULT_CITY);
  const stateMatches = !state || state === DEFAULT_STATE_CODE || state.includes('tocantins');
  const countryMatches = !country || country.includes('brasil') || country.includes('brazil') || DEFAULT_COUNTRY_CODES.has(country);

  return cityMatches && stateMatches && countryMatches;
}

export function isSafeStoreCoordinateInput(value, address = null) {
  const coords = extractLatLng(value);
  if (!coords) return false;

  return (
    isWithinStoreBounds(coords)
    && isWithinStoreRadius(coords)
    && isLocalAddressCandidate(address)
  );
}

export function getStoreRegionErrorMessage() {
  return 'Selecione um endereço em Palmas/TO, próximo à área de entrega da loja.';
}
