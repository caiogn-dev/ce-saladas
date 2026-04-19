/**
 * Google Maps JS API loader and map helpers.
 * All geocoding/autosuggest goes through the Django backend (storeApi).
 * Only map rendering uses the Google Maps JS API loaded here.
 */

import { STORE_MAP_BOUNDS, isSafeStoreCoordinateInput, isLocalAddressCandidate } from '../utils/storeRegion';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';
export const DEFAULT_CENTER = { lat: -10.1853248, lng: -48.3037058 };
export const DEFAULT_ZOOM = 14;
export const MAP_COLORS = {
  primary: '#649e20',   // clr-leaf-500 (Cê Saladas green)
  secondary: '#f97316', // clr-terra-400 (Cê Saladas terra/orange)
  route: '#4c7c14',     // clr-leaf-700
};

let _loadPromise = null;
let _routesLibraryPromise = null;

export function loadGoogleMaps() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (_loadPromise) return _loadPromise;
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_KEY is not configured'));
  }

  _loadPromise = new Promise((resolve, reject) => {
    const callbackName = '__googleMapsReady__';
    const scriptId = 'google-maps-js-api';
    const existingScript = document.getElementById(scriptId);
    let timeoutId = null;

    const cleanup = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      delete window[callbackName];
      delete window.gm_authFailure;
    };

    const fail = (error) => {
      _loadPromise = null;
      cleanup();
      reject(error);
    };

    window[callbackName] = () => {
      cleanup();
      resolve(window.google.maps);
    };

    window.gm_authFailure = () => {
      fail(new Error('Google Maps JS API authentication failed'));
    };

    timeoutId = window.setTimeout(() => {
      fail(new Error('Timed out while loading Google Maps JS API'));
    }, 15000);

    if (existingScript) {
      existingScript.addEventListener('error', () => {
        fail(new Error('Failed to load Google Maps JS API'));
      }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&callback=${callbackName}&loading=async`;
    script.async = true;
    script.onerror = () => {
      fail(new Error('Failed to load Google Maps JS API'));
    };
    document.head.appendChild(script);
  });

  return _loadPromise;
}

export async function loadRoutesLibrary() {
  const maps = await loadGoogleMaps();
  if (!maps) {
    throw new Error('Google Maps JS API is not available');
  }

  if (_routesLibraryPromise) return _routesLibraryPromise;

  _routesLibraryPromise = (async () => {
    if (typeof maps.importLibrary === 'function') {
      return maps.importLibrary('routes');
    }
    return {
      DirectionsService: maps.DirectionsService,
      DirectionsRenderer: maps.DirectionsRenderer,
      TravelMode: maps.TravelMode,
      DirectionsStatus: maps.DirectionsStatus,
    };
  })();

  return _routesLibraryPromise;
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
    minZoom: options.minZoom || 12,
    maxZoom: options.maxZoom || 19,
    gestureHandling: options.gestureHandling || 'greedy',
    restriction: options.restriction || {
      latLngBounds: STORE_MAP_BOUNDS,
      strictBounds: true,
    },
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
    fillColor: options.fillColor || MAP_COLORS.primary,
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

export async function createDirectionsRenderer(map, options = {}) {
  const { DirectionsRenderer } = await loadRoutesLibrary();
  return new DirectionsRenderer({
    map,
    suppressMarkers: options.suppressMarkers ?? true,
    preserveViewport: options.preserveViewport ?? false,
    polylineOptions: {
      strokeColor: options.strokeColor || MAP_COLORS.route,
      strokeWeight: options.strokeWeight || 5,
      strokeOpacity: options.strokeOpacity || 0.85,
    },
  });
}

export async function requestDirections(origin, destination, options = {}) {
  const maps = await loadGoogleMaps();
  const { DirectionsService, TravelMode } = await loadRoutesLibrary();
  const service = new DirectionsService();

  return service.route({
    origin,
    destination,
    travelMode: options.travelMode || TravelMode.DRIVING || maps.TravelMode.DRIVING,
    provideRouteAlternatives: false,
    region: options.region || 'br',
    language: options.language || 'pt-BR',
  });
}

function parseAddressComponents(result) {
  const components = {};
  (result?.address_components || []).forEach((component) => {
    const types = new Set(component.types || []);
    const longName = component.long_name || '';
    const shortName = component.short_name || '';

    if (types.has('route')) components.street = longName;
    if (types.has('street_number')) components.number = longName;
    if (types.has('neighborhood')) components.neighborhood = longName;
    if ((types.has('sublocality') || types.has('sublocality_level_1')) && !components.neighborhood) {
      components.neighborhood = longName;
    }
    if (types.has('locality')) components.city = longName;
    if (types.has('administrative_area_level_1')) {
      components.state = longName;
      components.state_code = shortName;
    }
    if (types.has('postal_code')) components.zip_code = longName;
    if (types.has('country')) components.country = longName;
  });

  return components;
}

export async function reverseGeocodeNative(lat, lng) {
  if (!isSafeStoreCoordinateInput({ lat, lng })) {
    return null;
  }

  const maps = await loadGoogleMaps();
  const geocoder = new maps.Geocoder();
  const response = await geocoder.geocode({
    location: { lat, lng },
    language: 'pt-BR',
    region: 'BR',
  });

  const result = response?.results?.[0];
  if (!result) return null;

  const components = parseAddressComponents(result);
  const payload = {
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    formatted_address: result.formatted_address || '',
    display_name: result.formatted_address || '',
    address_confidence: result.geometry?.location_type || '',
    ...components,
  };

  return isLocalAddressCandidate(payload) ? payload : null;
}
