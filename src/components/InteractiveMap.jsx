'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadGoogleMaps,
  createMap,
  createStoreMarker,
  createCustomerMarker,
  createPolyline,
  createCircle,
  fitBounds,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_COLORS,
} from '../services/googleMapService';
import * as storeApi from '../services/storeApi';
import { STORE_LOCATION } from './checkout/utils';

const isValidCoordinate = (lat, lng) =>
  typeof lat === 'number' && typeof lng === 'number' &&
  !isNaN(lat) && !isNaN(lng) &&
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

const extractCoords = (location) => {
  if (!location) return null;
  const lat = Number(location.lat ?? location.latitude);
  const lng = Number(location.lng ?? location.longitude);
  return isValidCoordinate(lat, lng) ? { lat, lng } : null;
};

export default function InteractiveMap({
  initialLocation = null,
  storeLocation = null,
  customerLocation = null,
  routePolyline = null,
  onLocationSelect,
  onAddressChange,
  height = '400px',
  showSearch = true,
  showGeolocation = true,
  showMarker = true,
  showStoreMarker = true,
  showCustomerMarker = true,
  markerDraggable = true,
  enableSelection = true,
  showRoute = false,
  showZones = false,
  zones = [],
  className = '',
  placeholder = 'Buscar endereço ou CEP...',
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const zoneObjectsRef = useRef([]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [error, setError] = useState(null);

  const searchTimeoutRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Load Google Maps and create map
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let mounted = true;

    const init = async () => {
      try {
        await loadGoogleMaps();
        if (!mounted || !mapContainerRef.current || mapRef.current) return;

        const customerCoords = extractCoords(customerLocation) || extractCoords(initialLocation);
        const storeCoords = extractCoords(storeLocation) || extractCoords(STORE_LOCATION);

        let center = DEFAULT_CENTER;
        let zoom = DEFAULT_ZOOM;
        if (storeCoords) { center = storeCoords; zoom = 14; }
        if (customerCoords && !storeCoords) { center = customerCoords; zoom = 15; }

        const map = createMap(mapContainerRef.current, { center, zoom });
        mapRef.current = map;

        if (storeCoords && showStoreMarker) {
          storeMarkerRef.current = createStoreMarker(map, storeCoords);
        }

        if (customerCoords && (showMarker || showCustomerMarker)) {
          const draggable = markerDraggable && enableSelection;
          const marker = createCustomerMarker(map, customerCoords, draggable);
          customerMarkerRef.current = marker;

          if (draggable) {
            marker.addListener('dragend', (e) => {
              selectLocation(e.latLng.lat(), e.latLng.lng(), false);
            });
          }
        }

        if (enableSelection) {
          map.addListener('click', (e) => {
            selectLocation(e.latLng.lat(), e.latLng.lng());
          });
        }

        if (storeCoords && customerCoords && showStoreMarker) {
          fitBounds(map, [storeCoords, customerCoords]);
        }

        if (mounted) setIsLoaded(true);
      } catch (err) {
        console.error('[InteractiveMap] init failed:', err);
        if (mounted) setError('Erro ao carregar o mapa');
      }
    };

    init();

    return () => {
      mounted = false;
      if (mapRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(mapRef.current);
        mapRef.current = null;
        customerMarkerRef.current = null;
        storeMarkerRef.current = null;
        routeLineRef.current = null;
        zoneObjectsRef.current = [];
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update customer marker when prop changes
  useEffect(() => {
    if (!mapRef.current) return;
    const coords = extractCoords(customerLocation);
    if (!coords) return;

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setPosition(coords);
    } else if (showCustomerMarker) {
      const draggable = markerDraggable && enableSelection;
      const marker = createCustomerMarker(mapRef.current, coords, draggable);
      if (draggable) {
        marker.addListener('dragend', (e) => {
          selectLocation(e.latLng.lat(), e.latLng.lng(), false);
        });
      }
      customerMarkerRef.current = marker;
    }

    const storeCoords = extractCoords(storeLocation) || extractCoords(STORE_LOCATION);
    if (storeCoords) {
      fitBounds(mapRef.current, [storeCoords, coords]);
    } else {
      mapRef.current.setCenter(coords);
      mapRef.current.setZoom(15);
    }
  }, [customerLocation, showCustomerMarker, markerDraggable, enableSelection, storeLocation]);

  // Update route polyline
  useEffect(() => {
    if (!mapRef.current) return;

    if (routeLineRef.current) {
      routeLineRef.current.setMap(null);
      routeLineRef.current = null;
    }

    if (routePolyline && typeof routePolyline === 'string' && routePolyline.length > 0) {
      try {
        const line = createPolyline(mapRef.current, routePolyline);
        routeLineRef.current = line;

        // Fit bounds to route
        const path = window.google.maps.geometry.encoding.decodePath(routePolyline);
        if (path.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          path.forEach(p => bounds.extend(p));
          mapRef.current.fitBounds(bounds, 60);
        }
      } catch (err) {
        console.error('[InteractiveMap] polyline error:', err);
      }
    }
  }, [routePolyline, isLoaded]);

  // Update delivery zones
  useEffect(() => {
    if (!mapRef.current || !showZones) return;

    zoneObjectsRef.current.forEach(obj => obj.setMap(null));
    zoneObjectsRef.current = [];

    const zoneColors = [
      { stroke: MAP_COLORS.primary,   fill: MAP_COLORS.primary,   fillOpacity: 0.12 },
      { stroke: MAP_COLORS.secondary, fill: MAP_COLORS.secondary, fillOpacity: 0.12 },
      { stroke: '#4caf50',            fill: '#4caf50',            fillOpacity: 0.12 },
    ];

    zones.forEach((zone, i) => {
      if (!zone.center || !zone.radius) return;
      const center = {
        lat: Number(zone.center.latitude || zone.center.lat),
        lng: Number(zone.center.longitude || zone.center.lng),
      };
      const colors = zoneColors[i % zoneColors.length];
      const circle = createCircle(mapRef.current, center, zone.radius * 1000, {
        strokeColor: colors.stroke,
        fillColor: colors.fill,
        fillOpacity: colors.fillOpacity,
      });
      zoneObjectsRef.current.push(circle);
    });
  }, [zones, showZones, isLoaded]);

  // Reverse geocode via backend and notify parent
  const selectLocation = useCallback(async (latitude, longitude, updateMarker = true) => {
    if (!mapRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      if (updateMarker && showMarker) {
        if (customerMarkerRef.current) {
          customerMarkerRef.current.setPosition({ lat: latitude, lng: longitude });
        } else {
          const draggable = markerDraggable && enableSelection;
          const marker = createCustomerMarker(mapRef.current, { lat: latitude, lng: longitude }, draggable);
          if (draggable) {
            marker.addListener('dragend', (e) => {
              selectLocation(e.latLng.lat(), e.latLng.lng(), false);
            });
          }
          customerMarkerRef.current = marker;
        }
      }

      mapRef.current.panTo({ lat: latitude, lng: longitude });

      let addressData = {};
      try {
        const data = await storeApi.reverseGeocode(latitude, longitude);
        if (data) {
          addressData = {
            street: data.street || '',
            number: data.number || '',
            neighborhood: data.neighborhood || '',
            city: data.city || '',
            state: data.state || '',
            zip_code: data.zip_code || '',
            formatted_address: data.formatted_address || data.display_name || '',
          };
        }
      } catch (e) {
        console.warn('[InteractiveMap] reverse geocode failed', e);
      }

      const location = { latitude, longitude, ...addressData };
      setSelectedLocation(location);
      onLocationSelect?.(location);
      onAddressChange?.(addressData);
    } catch (err) {
      console.error('[InteractiveMap] selectLocation error', err);
      setError('Erro ao obter endereço');
      onLocationSelect?.({ latitude, longitude });
    } finally {
      setIsLoading(false);
    }
  }, [showMarker, markerDraggable, enableSelection, onLocationSelect, onAddressChange]);

  // Handle search input
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    clearTimeout(searchTimeoutRef.current);

    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const digits = query.replace(/\D/g, '');
    if (digits.length === 8) {
      searchTimeoutRef.current = setTimeout(() => handleCEPSearch(digits), 300);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await storeApi.autosuggestAddress(query);
        if (Array.isArray(results) && results.length > 0) {
          setSuggestions(results.map(r => ({
            display_name: r.display_name || r.title || '',
            latitude: r.latitude || r.lat,
            longitude: r.longitude || r.lng,
          })));
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }, []);

  const handleCEPSearch = useCallback(async (cep) => {
    setIsLoading(true);
    setError(null);
    try {
      // ViaCEP lookup
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const viaCepData = await viaCepRes.json();
      if (viaCepData.erro) {
        setError('CEP não encontrado');
        return;
      }
      const address = [viaCepData.logradouro, viaCepData.bairro, viaCepData.localidade, viaCepData.uf, 'Brasil']
        .filter(Boolean).join(', ');
      // Geocode via backend
      const geoData = await storeApi.geocodeAddress(address);
      if (geoData?.latitude) {
        setSuggestions([{
          display_name: `${viaCepData.logradouro || ''}, ${viaCepData.bairro || ''}, ${viaCepData.localidade} - ${viaCepData.uf}`,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
        }]);
        setShowSuggestions(true);
      } else {
        setError('Endereço não encontrado para este CEP');
      }
    } catch {
      setError('Erro ao buscar CEP');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSuggestionSelect = useCallback(async (suggestion) => {
    if (suggestion.error || suggestion.notDeliverable) {
      setError(suggestion.display_name);
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    if (suggestion.latitude && suggestion.longitude) {
      await selectLocation(Number(suggestion.latitude), Number(suggestion.longitude));
    }
  }, [selectLocation]);

  const handleSearchSubmit = useCallback(async (e) => {
    e?.preventDefault();
    const digits = searchQuery.replace(/\D/g, '');
    if (digits.length === 8) {
      await handleCEPSearch(digits);
    } else if (suggestions.length > 0) {
      await handleSuggestionSelect(suggestions[0]);
    } else if (searchQuery.length >= 3) {
      setIsLoading(true);
      try {
        const data = await storeApi.geocodeAddress(searchQuery);
        if (data?.latitude) {
          await selectLocation(Number(data.latitude), Number(data.longitude));
        } else {
          setError('Endereço não encontrado');
        }
      } catch {
        setError('Erro ao buscar endereço');
      } finally {
        setIsLoading(false);
      }
    }
  }, [searchQuery, suggestions, handleCEPSearch, handleSuggestionSelect, selectLocation]);

  const handleGetCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true, timeout: 20000, maximumAge: 0,
        })
      );
      await selectLocation(pos.coords.latitude, pos.coords.longitude);
    } catch (err) {
      const msgs = {
        1: 'Permissão de localização negada.',
        2: 'Localização indisponível.',
        3: 'Tempo esgotado ao obter localização.',
      };
      setError(msgs[err.code] || 'Erro ao obter localização');
    } finally {
      setIsLoading(false);
    }
  }, [selectLocation]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (error && !isLoaded) {
    return (
      <div className={`interactive-map-error ${className}`} style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffebee', color: '#c62828', borderRadius: 8 }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`interactive-map ${className}`}>
      {(showSearch || showGeolocation) && (
        <div className="map-controls">
          {showSearch && (
            <div className="map-search" ref={suggestionsRef}>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                  placeholder={placeholder}
                  className="search-input"
                />
                <button type="button" onClick={handleSearchSubmit} className="search-button" disabled={isLoading}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </button>
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map((s, i) => (
                    <li key={i} onClick={() => handleSuggestionSelect(s)}
                      className={`suggestion-item ${s.error ? 'suggestion-error' : ''}`}
                      style={s.error ? { color: '#dc3545', cursor: 'default', backgroundColor: '#fff5f5' } : {}}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>{s.display_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {showGeolocation && (
            <button type="button" onClick={handleGetCurrentLocation} className="geolocation-button" disabled={isLoading} title="Usar minha localização">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
              </svg>
            </button>
          )}
        </div>
      )}

      <div ref={mapContainerRef} className="map-container" style={{ height }}>
        {!isLoaded && (
          <div className="map-loading">
            <div className="loading-spinner" />
            <span>Carregando mapa...</span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="map-loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}

      {error && (
        <div className="map-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {selectedLocation && (selectedLocation.formatted_address || selectedLocation.display_name) && (
        <div className="selected-location">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="location-text">{selectedLocation.formatted_address || selectedLocation.display_name}</span>
        </div>
      )}

      <style jsx>{`
        .interactive-map { position: relative; width: 100%; border-radius: 8px; overflow: hidden; background: #f5f5f5; }
        .map-controls { display: flex; gap: 8px; padding: 12px; background: white; border-bottom: 1px solid #e0e0e0; }
        .map-search { flex: 1; position: relative; }
        .search-input-wrapper { display: flex; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .search-input { flex: 1; padding: 10px 12px; border: none; font-size: 14px; outline: none; }
        .search-button { padding: 10px 12px; background: #4CAF50; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .search-button:hover { background: #45a049; }
        .search-button:disabled { background: #ccc; cursor: not-allowed; }
        .suggestions-list { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; max-height: 200px; overflow-y: auto; z-index: 1000; list-style: none; margin: 0; padding: 0; box-shadow: 0 4px 6px rgba(0,0,0,.1); }
        .suggestion-item { display: flex; align-items: center; gap: 8px; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f0f0f0; }
        .suggestion-item:last-child { border-bottom: none; }
        .suggestion-item:hover { background: #f5f5f5; }
        .suggestion-item svg { flex-shrink: 0; color: #666; }
        .suggestion-item span { font-size: 13px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .geolocation-button { padding: 10px; background: white; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #666; transition: all .2s; }
        .geolocation-button:hover { background: #f5f5f5; color: #4CAF50; }
        .geolocation-button:disabled { opacity: .5; cursor: not-allowed; }
        .map-container { width: 100%; position: relative; }
        .map-loading { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: #f5f5f5; color: #666; }
        .map-loading-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.7); z-index: 1000; }
        .loading-spinner { width: 32px; height: 32px; border: 3px solid #f3f3f3; border-top: 3px solid #4CAF50; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .map-error { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #ffebee; color: #c62828; font-size: 13px; }
        .map-error button { background: none; border: none; color: #c62828; cursor: pointer; font-size: 18px; padding: 0 4px; }
        .selected-location { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #e8f5e9; border-top: 1px solid #c8e6c9; }
        .selected-location svg { flex-shrink: 0; color: #4CAF50; }
        .location-text { font-size: 13px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .interactive-map-error { display: flex; align-items: center; justify-content: center; background: #ffebee; color: #c62828; border-radius: 8px; }
      `}</style>
    </div>
  );
}
