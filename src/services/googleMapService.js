/**
 * Google Maps JS API loader and map helpers.
 * All geocoding/autosuggest goes through the Django backend (storeApi).
 * Only map rendering uses the Google Maps JS API loaded here.
 */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';
export const DEFAULT_CENTER = { lat: -10.1853248, lng: -48.3037058 };
export const DEFAULT_ZOOM = 14;
export const MAP_COLORS = {
  primary: '#649e20',   // clr-leaf-500 (Cê Saladas green)
  secondary: '#f97316', // clr-terra-400 (Cê Saladas terra/orange)
  route: '#4c7c14',     // clr-leaf-700
};

let _loadPromise = null;

export function loadGoogleMaps() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (_loadPromise) return _loadPromise;

  _loadPromise = new Promise((resolve, reject) => {
    const callbackName = '__googleMapsReady__';
    window[callbackName] = () => resolve(window.google.maps);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&callback=${callbackName}&loading=async`;
    script.async = true;
    script.onerror = () => {
      _loadPromise = null;
      reject(new Error('Failed to load Google Maps JS API'));
    };
    document.head.appendChild(script);
  });

  return _loadPromise;
}

function svgToDataUrl(svg) {
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

const STORE_ICON_URL = svgToDataUrl(
  `<svg width="36" height="36" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="16" fill="#649e20" stroke="white" stroke-width="3"/>
    <text x="18" y="23" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="sans-serif">Cê</text>
  </svg>`
);

const CUSTOMER_ICON_URL = svgToDataUrl(
  `<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
    <circle cx="15" cy="15" r="13" fill="#f97316" stroke="white" stroke-width="3"/>
    <circle cx="15" cy="15" r="5" fill="white"/>
  </svg>`
);

export function createMap(container, options = {}) {
  const maps = window.google.maps;
  return new maps.Map(container, {
    center: options.center || DEFAULT_CENTER,
    zoom: options.zoom || DEFAULT_ZOOM,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    zoomControl: true,
    ...options,
  });
}

export function createStoreMarker(map, position) {
  const maps = window.google.maps;
  return new maps.Marker({
    position,
    map,
    icon: {
      url: STORE_ICON_URL,
      scaledSize: new maps.Size(36, 36),
      anchor: new maps.Point(18, 18),
    },
    title: 'Loja',
  });
}

export function createCustomerMarker(map, position, draggable = false) {
  const maps = window.google.maps;
  return new maps.Marker({
    position,
    map,
    icon: {
      url: CUSTOMER_ICON_URL,
      scaledSize: new maps.Size(30, 30),
      anchor: new maps.Point(15, 15),
    },
    draggable,
    title: 'Sua localização',
  });
}

export function createPolyline(map, encodedPolyline, options = {}) {
  const maps = window.google.maps;
  const path = maps.geometry.encoding.decodePath(encodedPolyline);
  const polyline = new maps.Polyline({
    path,
    map,
    strokeColor: options.strokeColor || MAP_COLORS.route,
    strokeWeight: options.strokeWeight || 5,
    strokeOpacity: options.strokeOpacity || 0.85,
  });
  return polyline;
}

export function createCircle(map, center, radiusM, options = {}) {
  const maps = window.google.maps;
  return new maps.Circle({
    center,
    radius: radiusM,
    map,
    strokeColor: options.strokeColor || MAP_COLORS.primary,
    strokeOpacity: options.strokeOpacity !== undefined ? options.strokeOpacity : 0.6,
    strokeWeight: options.strokeWeight || 2,
    fillColor: options.fillColor || PASTITA_COLORS.marsala,
    fillOpacity: options.fillOpacity !== undefined ? options.fillOpacity : 0.1,
  });
}

export function fitBounds(map, positions, padding = 60) {
  const maps = window.google.maps;
  if (!positions || positions.length === 0) return;
  const bounds = new maps.LatLngBounds();
  positions.forEach(pos => bounds.extend(pos));
  map.fitBounds(bounds, padding);
}
