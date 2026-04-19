/**
 * DeliveryMapSimple - Simplified map component for delivery location selection
 * Uses Google Maps JS API. Geocoding/autosuggest via Django backend.
 */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../../styles/DeliveryMap.module.css';
import {
  loadGoogleMaps,
  createMap,
  createStoreMarker,
  createCustomerMarker,
  createPolyline,
  fitBounds,
  MAP_COLORS,
} from '../../services/googleMapService';
import * as storeApi from '../../services/storeApi';

const DeliveryMapSimple = ({
  storeLocation,
  customerLocation = null,
  routePolyline = null,
  onLocationSelect,
  onAddressFound,
  enableSelection = true,
  showSearch = true,
  showGpsButton = true,
  height = '350px',
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const resizeHandlerRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);

  const searchTimeoutRef = useRef(null);
  const resultsRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let mounted = true;

    const initMap = async () => {
      try {
        await loadGoogleMaps();
        if (!mounted || !mapContainerRef.current || mapRef.current) return;

        const center = storeLocation
          ? { lat: Number(storeLocation.latitude), lng: Number(storeLocation.longitude) }
          : { lat: -10.1853248, lng: -48.3037058 };

        const map = createMap(mapContainerRef.current, { center, zoom: 14 });
        mapRef.current = map;

        if (storeLocation?.latitude && storeLocation?.longitude) {
          storeMarkerRef.current = createStoreMarker(map, {
            lat: Number(storeLocation.latitude),
            lng: Number(storeLocation.longitude),
          });
        }

        if (enableSelection) {
          map.addListener('click', (e) => {
            handleLocationSelected(e.latLng.lat(), e.latLng.lng());
          });
        }

        resizeHandlerRef.current = () => window.google?.maps?.event?.trigger(map, 'resize');
        window.addEventListener('resize', resizeHandlerRef.current);

        if (mounted) setIsReady(true);
      } catch (err) {
        console.error('Map init error:', err);
        if (mounted) setError('Erro ao carregar o mapa');
      }
    };

    initMap();
    return () => {
      mounted = false;
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }
    };
  }, [storeLocation]);

  // Update customer marker when prop changes
  useEffect(() => {
    if (!isReady || !mapRef.current) return;

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setMap(null);
      customerMarkerRef.current = null;
    }

    if (!customerLocation) return;

    const lat = Number(customerLocation.lat || customerLocation.latitude);
    const lng = Number(customerLocation.lng || customerLocation.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    const marker = createCustomerMarker(mapRef.current, { lat, lng }, enableSelection);
    customerMarkerRef.current = marker;

    if (enableSelection) {
      marker.addListener('dragend', (e) => {
        handleLocationSelected(e.latLng.lat(), e.latLng.lng());
      });
    }

    if (storeLocation?.latitude && storeLocation?.longitude) {
      fitBounds(mapRef.current, [
        { lat: Number(storeLocation.latitude), lng: Number(storeLocation.longitude) },
        { lat, lng },
      ]);
    } else {
      mapRef.current.setCenter({ lat, lng });
      mapRef.current.setZoom(16);
    }
  }, [customerLocation, isReady, enableSelection, storeLocation]);

  // Update route polyline
  useEffect(() => {
    if (!isReady || !mapRef.current) return;

    if (routeLineRef.current) {
      routeLineRef.current.setMap(null);
      routeLineRef.current = null;
    }

    if (routePolyline && typeof routePolyline === 'string' && storeLocation) {
      try {
        const line = createPolyline(mapRef.current, routePolyline);
        routeLineRef.current = line;

        const path = window.google.maps.geometry.encoding.decodePath(routePolyline);
        if (path.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          path.forEach(p => bounds.extend(p));
          mapRef.current.fitBounds(bounds, 60);
        }
      } catch (err) {
        console.error('Route polyline error:', err);
      }
    }
  }, [routePolyline, isReady, storeLocation]);

  // Handle location selection (click / drag / GPS)
  const handleLocationSelected = useCallback(async (lat, lng) => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (isNaN(latitude) || isNaN(longitude)) return;

    setIsLoading(true);
    setError(null);

    try {
      if (mapRef.current) {
        const nextPosition = { lat: latitude, lng: longitude };
        if (customerMarkerRef.current) {
          customerMarkerRef.current.setPosition(nextPosition);
        } else {
          customerMarkerRef.current = createCustomerMarker(mapRef.current, nextPosition, enableSelection);
        }
        mapRef.current.panTo(nextPosition);
      }

      let address = {};
      try {
        const data = await storeApi.reverseGeocode(latitude, longitude);
        if (data) {
          address = {
            street: data.street || '',
            number: data.number || '',
            neighborhood: data.neighborhood || '',
            city: data.city || '',
            state: data.state || '',
            zip_code: data.zip_code || '',
            formatted_address: data.formatted_address || data.display_name || '',
            display_name: data.formatted_address || data.display_name || '',
          };
        }
      } catch (e) {
        console.warn('Reverse geocode failed:', e);
      }

      const locationData = { lat: latitude, lng: longitude, latitude, longitude, ...address };
      onLocationSelect?.(locationData);
      onAddressFound?.(address);
    } catch (err) {
      console.error('Location select error:', err);
      onLocationSelect?.({ lat: latitude, lng: longitude, latitude, longitude });
    } finally {
      setIsLoading(false);
    }
  }, [onLocationSelect, onAddressFound]);

  // GPS button
  const handleGetGPS = async () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 20000, maximumAge: 0,
        })
      );
      await handleLocationSelected(position.coords.latitude, position.coords.longitude);
    } catch (err) {
      const messages = {
        1: 'Permissão de localização negada.',
        2: 'Localização indisponível.',
        3: 'Tempo esgotado ao obter localização.',
      };
      setError(messages[err.code] || 'Erro ao obter localização');
    } finally {
      setIsLoading(false);
    }
  };

  // Search input handler
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    clearTimeout(searchTimeoutRef.current);

    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const digits = query.replace(/\D/g, '');
    if (digits.length === 8) {
      searchTimeoutRef.current = setTimeout(() => searchByCEP(digits), 300);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => searchByAddress(query), 400);
  };

  const searchByCEP = async (cep) => {
    setIsLoading(true);
    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const viaCepData = await viaCepRes.json();
      if (viaCepData.erro) { setError('CEP não encontrado'); return; }

      const addressStr = [viaCepData.logradouro, viaCepData.bairro, viaCepData.localidade, viaCepData.uf, 'Brasil']
        .filter(Boolean).join(', ');

      const geoData = await storeApi.geocodeAddress(addressStr);
      if (geoData?.latitude) {
        setSearchResults([{
          display_name: `${viaCepData.logradouro || ''}, ${viaCepData.bairro || ''}, ${viaCepData.localidade} - ${viaCepData.uf}`,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
        }]);
        setShowResults(true);
      } else {
        setError('Endereço não encontrado para este CEP');
      }
    } catch {
      setError('Erro ao buscar CEP');
    } finally {
      setIsLoading(false);
    }
  };

  const searchByAddress = async (query) => {
    try {
      const results = await storeApi.autosuggestAddress(query);
      if (Array.isArray(results) && results.length > 0) {
        setSearchResults(results.map(r => ({
          display_name: r.display_name || r.title || '',
          latitude: r.latitude || r.lat,
          longitude: r.longitude || r.lng,
        })));
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleResultSelect = async (result) => {
    setSearchQuery(result.display_name);
    setShowResults(false);
    setSearchResults([]);
    if (result.latitude && result.longitude) {
      await handleLocationSelected(Number(result.latitude), Number(result.longitude));
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleResultSelect(searchResults[0]);
    } else if (searchQuery.trim().length >= 3) {
      searchByAddress(searchQuery.trim());
    }
  };

  // Close results on outside click
  useEffect(() => {
    const handler = (e) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={styles.mapContainer}>
      {showSearch && (
        <div className={styles.searchWrapper} ref={resultsRef}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Digite o CEP ou endereço..."
              className={styles.searchInput}
            />
            {isLoading && <span className={styles.searchSpinner}>⏳</span>}
          </form>
          {showResults && searchResults.length > 0 && (
            <ul className={styles.searchResults}>
              {searchResults.map((result, index) => (
                <li key={index} onClick={() => handleResultSelect(result)} className={styles.searchResultItem}>
                  <span className={styles.resultIcon}>📍</span>
                  <span className={styles.resultText}>{result.display_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showGpsButton && enableSelection && (
        <button type="button" onClick={handleGetGPS} className={styles.gpsButton} disabled={isLoading} title="Usar minha localização">
          📍 Usar minha localização
        </button>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div ref={mapContainerRef} className={styles.map} style={{ height }} />

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
        </div>
      )}

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendMarker} style={{ backgroundColor: MAP_COLORS.primary }}>Cê</span>
          <span>Loja</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendMarker} style={{ backgroundColor: MAP_COLORS.secondary }}>👤</span>
          <span>Você</span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMapSimple;
