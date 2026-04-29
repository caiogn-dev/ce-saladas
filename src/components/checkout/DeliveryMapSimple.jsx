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
  fitBounds,
  MAP_COLORS,
  createDirectionsRenderer,
  requestDirections,
  reverseGeocodeNative,
} from '../../services/googleMapService';
import * as storeApi from '../../services/storeApi';
import {
  extractLatLng,
  getStoreRegionErrorMessage,
  isLocalAddressCandidate,
  isSafeStoreCoordinateInput,
} from '../../utils/storeRegion';

class DeliveryMapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('[DeliveryMapSimple] render failed:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.mapContainer}>
          <div className={styles.errorMessage}>
            O mapa não pôde ser exibido agora. Você ainda pode informar o endereço manualmente.
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className={styles.gpsButton}
            style={{ position: 'static', marginTop: 12 }}
          >
            Tentar carregar o mapa novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function DeliveryMapSimpleInner({
  storeLocation,
  customerLocation = null,
  routePolyline = null,
  onLocationSelect,
  onAddressFound,
  enableSelection = true,
  showSearch = true,
  showGpsButton = true,
  height = '350px',
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const resizeHandlerRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);

  const searchTimeoutRef = useRef(null);
  const resultsRef = useRef(null);
  const handleLocationSelectedRef = useRef(null);

  // Handle location selection (click / drag / GPS)
  const handleLocationSelected = useCallback(async (lat, lng) => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (isNaN(latitude) || isNaN(longitude)) return;

    if (!isSafeStoreCoordinateInput({ lat: latitude, lng: longitude })) {
      setError(getStoreRegionErrorMessage());
      setShowResults(false);
      return;
    }

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
        const backendData = await storeApi.reverseGeocode(latitude, longitude);
        const nativeData = backendData ? null : await reverseGeocodeNative(latitude, longitude);
        const data = [backendData, nativeData].find((candidate) => candidate && isLocalAddressCandidate(candidate));
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
            address_confidence: data.address_confidence || '',
          };
        } else {
          setError(getStoreRegionErrorMessage());
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
  }, [enableSelection, onAddressFound, onLocationSelect]);

  handleLocationSelectedRef.current = handleLocationSelected;

  const disposeRouteRenderer = useCallback(() => {
    if (!directionsRendererRef.current) return;

    try {
      directionsRendererRef.current.setMap(null);
    } catch (err) {
      console.warn('Failed to detach directions renderer:', err);
    } finally {
      directionsRendererRef.current = null;
    }
  }, []);

  const disposeRouteLine = useCallback(() => {
    if (!routeLineRef.current) return;

    try {
      routeLineRef.current.setMap(null);
    } catch (err) {
      console.warn('Failed to detach route line:', err);
    } finally {
      routeLineRef.current = null;
    }
  }, []);

  const disposeMarker = useCallback((markerRef) => {
    if (!markerRef.current) return;

    try {
      window.google?.maps?.event?.clearInstanceListeners(markerRef.current);
      markerRef.current.setMap(null);
    } catch (err) {
      console.warn('Failed to detach map marker:', err);
    } finally {
      markerRef.current = null;
    }
  }, []);

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
            handleLocationSelectedRef.current?.(e.latLng.lat(), e.latLng.lng());
          });
        }

        resizeHandlerRef.current = () => window.google?.maps?.event?.trigger(map, 'resize');
        window.addEventListener('resize', resizeHandlerRef.current);

        if (mounted) setIsReady(true);
      } catch (err) {
        console.error('Map init error:', err);
        if (mounted) {
          setMapUnavailable(true);
          setError('O mapa não pôde ser carregado. Busque pelo CEP/endereço ou use sua localização para continuar.');
        }
      }
    };

    initMap();
    return () => {
      mounted = false;
      clearTimeout(searchTimeoutRef.current);
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }
      disposeRouteRenderer();
      disposeRouteLine();
      disposeMarker(customerMarkerRef);
      disposeMarker(storeMarkerRef);
      if (mapRef.current) {
        try {
          window.google?.maps?.event?.clearInstanceListeners(mapRef.current);
        } catch (err) {
          console.warn('Failed to clear map listeners:', err);
        } finally {
          mapRef.current = null;
        }
      }
    };
  }, [disposeMarker, disposeRouteLine, disposeRouteRenderer, storeLocation, enableSelection]);

  // Update customer marker when prop changes
  useEffect(() => {
    if (!isReady || !mapRef.current) return;

    disposeMarker(customerMarkerRef);

    if (!customerLocation) return;

    try {
      const coords = extractLatLng(customerLocation);
      if (!coords || !isSafeStoreCoordinateInput(coords, customerLocation)) return;
      const { lat, lng } = coords;

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
    } catch (err) {
      console.error('Customer marker render error:', err);
      setError('Erro ao atualizar os marcadores do mapa');
    }
  }, [customerLocation, disposeMarker, handleLocationSelected, isReady, enableSelection, storeLocation]);

  // Update route polyline
  useEffect(() => {
    if (!isReady || !mapRef.current) return;

    let cancelled = false;

    const renderDirections = async () => {
      disposeRouteLine();
      disposeRouteRenderer();

      if (!storeLocation || !customerLocation) return;

      const origin = {
        lat: Number(storeLocation.latitude),
        lng: Number(storeLocation.longitude),
      };
      const destination = {
        lat: Number(customerLocation.lat || customerLocation.latitude),
        lng: Number(customerLocation.lng || customerLocation.longitude),
      };

      if (
        [origin.lat, origin.lng, destination.lat, destination.lng].some(Number.isNaN)
        || !isSafeStoreCoordinateInput(destination, customerLocation)
      ) {
        return;
      }

      try {
        const renderer = await createDirectionsRenderer(mapRef.current, {
          suppressMarkers: true,
          preserveViewport: false,
        });
        const directions = await requestDirections(origin, destination);
        if (cancelled) {
          renderer.setMap(null);
          return;
        }
        renderer.setDirections(directions);
        directionsRendererRef.current = renderer;
      } catch (err) {
        console.error('Native directions render error:', err);
      }
    };

    renderDirections();

    return () => {
      cancelled = true;
      disposeRouteRenderer();
      disposeRouteLine();
    };
  }, [customerLocation, disposeRouteLine, disposeRouteRenderer, isReady, storeLocation, routePolyline]);

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
      if (position.coords.accuracy > 60) {
        setError(`GPS com precisão baixa (${Math.round(position.coords.accuracy)}m). Ajuste o pino no mapa se necessário.`);
      }
      const gpsCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
      if (!isSafeStoreCoordinateInput(gpsCoords)) {
        setError(getStoreRegionErrorMessage());
        return;
      }
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
      if (geoData?.latitude && isSafeStoreCoordinateInput(geoData, geoData)) {
        setSearchResults([{
          display_name: `${viaCepData.logradouro || ''}, ${viaCepData.bairro || ''}, ${viaCepData.localidade} - ${viaCepData.uf}`,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
        }]);
        setShowResults(true);
      } else {
        setError(getStoreRegionErrorMessage());
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
      const filteredResults = Array.isArray(results)
        ? results
            .map(r => ({
              display_name: r.display_name || r.title || '',
              latitude: r.latitude || r.lat,
              longitude: r.longitude || r.lng,
              city: r.city || '',
              state: r.state || '',
              country: r.country || '',
            }))
            .filter((result) => result.latitude && result.longitude && isSafeStoreCoordinateInput(result, result))
        : [];
      if (filteredResults.length > 0) {
        setSearchResults(filteredResults.map(r => ({
          display_name: r.display_name || r.title || '',
          latitude: r.latitude || r.lat,
          longitude: r.longitude || r.lng,
        })));
        setShowResults(true);
        setError(null);
      } else {
        const geocoded = await storeApi.geocodeAddress(query);
        if (geocoded?.latitude && isSafeStoreCoordinateInput(geocoded, geocoded)) {
          setSearchResults([{
            display_name: geocoded.display_name || geocoded.formatted_address || query,
            latitude: geocoded.latitude,
            longitude: geocoded.longitude,
          }]);
          setShowResults(true);
          setError(null);
        } else {
          setSearchResults([]);
          setShowResults(false);
          if (query.trim().length >= 3) {
            setError('Nenhum resultado válido em Palmas/TO foi encontrado para esta busca.');
          }
        }
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
    if (result.latitude && result.longitude && isSafeStoreCoordinateInput(result, result)) {
      await handleLocationSelected(Number(result.latitude), Number(result.longitude));
    } else {
      setError(getStoreRegionErrorMessage());
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
    <div className={`${styles.mapContainer} ${mapUnavailable ? styles.mapFallbackMode : ''}`}>
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

      {mapUnavailable ? (
        <div className={styles.mapFallbackPanel} style={{ minHeight: height }}>
          <div className={styles.mapFallbackIcon}>📍</div>
          <strong>Selecione pelo endereço</strong>
          <p>Digite seu CEP/endereço acima ou toque em “Usar minha localização”. A taxa será calculada normalmente pelo sistema.</p>
        </div>
      ) : (
        <div ref={mapContainerRef} className={styles.map} style={{ height }} />
      )}

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
        </div>
      )}

      {!mapUnavailable && (
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
      )}
    </div>
  );
}

export default function DeliveryMapSimple(props) {
  return (
    <DeliveryMapErrorBoundary>
      <DeliveryMapSimpleInner {...props} />
    </DeliveryMapErrorBoundary>
  );
}
