/**
 * DeliveryMapSimple - Simplified map component for delivery location selection
 * 
 * Features:
 * - Store marker (fixed)
 * - Customer marker (draggable or fixed)
 * - Route line between store and customer
 * - CEP/Address search
 * - GPS location detection
 */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../../styles/DeliveryMap.module.css';

// HERE Maps configuration
const HERE_API_KEY = process.env.NEXT_PUBLIC_HERE_API_KEY || '';
const HERE_API_VERSION = '3.1';

// CDN URLs
const HERE_SCRIPTS = [
  `https://js.api.here.com/v3/${HERE_API_VERSION}/mapsjs-core.js`,
  `https://js.api.here.com/v3/${HERE_API_VERSION}/mapsjs-service.js`,
  `https://js.api.here.com/v3/${HERE_API_VERSION}/mapsjs-mapevents.js`,
  `https://js.api.here.com/v3/${HERE_API_VERSION}/mapsjs-ui.js`,
];
const HERE_CSS = `https://js.api.here.com/v3/${HERE_API_VERSION}/mapsjs-ui.css`;

// Colors
const COLORS = {
  marsala: '#722F37',
  gold: '#D4AF37',
  route: '#722F37',
};

// Create store marker icon using default HERE marker with custom color
const createStoreIcon = (H) => {
  // Use a simple colored circle marker
  const svgMarkup = `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" fill="#722F37" stroke="white" stroke-width="3"/>
    <text x="16" y="21" text-anchor="middle" fill="white" font-size="12" font-weight="bold">P</text>
  </svg>`;
  
  return new H.map.Icon(svgMarkup, {
    size: { w: 32, h: 32 },
    anchor: { x: 16, y: 16 }
  });
};

// Create customer marker icon
const createCustomerIcon = (H) => {
  const svgMarkup = `<svg width="28" height="28" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="12" fill="#D4AF37" stroke="white" stroke-width="3"/>
    <circle cx="14" cy="14" r="5" fill="white"/>
  </svg>`;
  
  return new H.map.Icon(svgMarkup, {
    size: { w: 28, h: 28 },
    anchor: { x: 14, y: 14 }
  });
};

// Load script helper
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Load CSS helper
const loadCSS = (href) => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

// Global state for HERE Maps
let hereMapsLoaded = false;
let hereMapsLoading = null;

const loadHereMaps = async () => {
  if (hereMapsLoaded) return;
  if (hereMapsLoading) return hereMapsLoading;
  
  hereMapsLoading = (async () => {
    for (const src of HERE_SCRIPTS) {
      await loadScript(src);
    }
    loadCSS(HERE_CSS);
    hereMapsLoaded = true;
  })();
  
  return hereMapsLoading;
};

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
  const platformRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const behaviorRef = useRef(null);
  
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  
  const searchTimeoutRef = useRef(null);
  const resultsRef = useRef(null);
  
  // Debug props
  useEffect(() => {
    console.log('🗺️ DeliveryMapSimple props:', {
      storeLocation,
      customerLocation,
      routePolyline: routePolyline ? 'present' : 'null',
      enableSelection
    });
  }, [storeLocation, customerLocation, routePolyline, enableSelection]);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let mounted = true;
    
    const initMap = async () => {
      try {
        await loadHereMaps();
        if (!mounted || !mapContainerRef.current) return;
        
        const H = window.H;
        
        // Create platform
        const platform = new H.service.Platform({ apikey: HERE_API_KEY });
        platformRef.current = platform;
        
        // Create map
        const defaultLayers = platform.createDefaultLayers();
        const center = storeLocation 
          ? { lat: storeLocation.latitude, lng: storeLocation.longitude }
          : { lat: -10.1854332, lng: -48.3038653 };
        
        const map = new H.Map(
          mapContainerRef.current,
          defaultLayers.vector.normal.map,
          { zoom: 14, center, pixelRatio: window.devicePixelRatio || 1 }
        );
        mapRef.current = map;
        
        // Add interaction
        const mapEvents = new H.mapevents.MapEvents(map);
        const behavior = new H.mapevents.Behavior(mapEvents);
        behaviorRef.current = behavior;
        
        // Add UI
        H.ui.UI.createDefault(map, defaultLayers);
        
        // Handle resize
        const resizeHandler = () => map.getViewPort().resize();
        window.addEventListener('resize', resizeHandler);
        
        // Add store marker - always visible
        if (storeLocation && storeLocation.latitude && storeLocation.longitude) {
          const storeIcon = createStoreIcon(H);
          const storeMarker = new H.map.Marker(
            { lat: Number(storeLocation.latitude), lng: Number(storeLocation.longitude) },
            { icon: storeIcon }
          );
          map.addObject(storeMarker);
          storeMarkerRef.current = storeMarker;
          console.log('✅ Store marker added:', storeLocation.latitude, storeLocation.longitude);
        } else {
          console.log('❌ No store location provided');
        }
        
        // Add click handler for selection
        if (enableSelection) {
          map.addEventListener('tap', handleMapTap);
        }
        
        setIsReady(true);
        
        // Cleanup
        return () => {
          window.removeEventListener('resize', resizeHandler);
          map.dispose();
        };
      } catch (err) {
        console.error('Map init error:', err);
        if (mounted) setError('Erro ao carregar o mapa');
      }
    };
    
    initMap();
    
    return () => {
      mounted = false;
    };
  }, [storeLocation]);

  // Update customer marker when location changes
  useEffect(() => {
    if (!isReady || !mapRef.current) return;
    
    const H = window.H;
    const map = mapRef.current;
    
    // Remove existing marker
    if (customerMarkerRef.current) {
      try {
        map.removeObject(customerMarkerRef.current);
      } catch (e) {}
      customerMarkerRef.current = null;
    }
    
    // Only add marker if we have a valid customer location
    if (!customerLocation) {
      console.log('❌ No customer location');
      return;
    }
    
    const lat = customerLocation.lat || customerLocation.latitude;
    const lng = customerLocation.lng || customerLocation.longitude;
    
    if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
      console.log('❌ Invalid customer coordinates:', lat, lng);
      return;
    }
    
    const latNum = Number(lat);
    const lngNum = Number(lng);
    
    console.log('✅ Adding customer marker at:', latNum, lngNum);
    
    // Create new marker with customer icon
    const customerIcon = createCustomerIcon(H);
    const marker = new H.map.Marker({ lat: latNum, lng: lngNum }, { icon: customerIcon });
    
    if (enableSelection) {
      marker.draggable = true;
    }
    
    map.addObject(marker);
    customerMarkerRef.current = marker;
    
    // Center map to show both markers with padding
    if (storeLocation && storeLocation.latitude && storeLocation.longitude) {
      fitMapToBounds(map, storeLocation, { lat: latNum, lng: lngNum });
    } else {
      map.setCenter({ lat: latNum, lng: lngNum });
      map.setZoom(16);
    }
  }, [customerLocation, isReady, storeLocation]);
  
  // Handle marker dragging
  useEffect(() => {
    if (!isReady || !mapRef.current || !enableSelection) return;
    
    const map = mapRef.current;
    
    const onDragStart = (ev) => {
      if (ev.target === customerMarkerRef.current) {
        behaviorRef.current?.disable();
      }
    };
    
    const onDrag = (ev) => {
      if (ev.target === customerMarkerRef.current) {
        const pointer = ev.currentPointer;
        const geoPoint = map.screenToGeo(pointer.viewportX, pointer.viewportY);
        ev.target.setGeometry(geoPoint);
      }
    };
    
    const onDragEnd = (ev) => {
      behaviorRef.current?.enable();
      if (ev.target === customerMarkerRef.current) {
        const geo = ev.target.getGeometry();
        handleLocationSelected(geo.lat, geo.lng);
      }
    };
    
    map.addEventListener('dragstart', onDragStart);
    map.addEventListener('drag', onDrag);
    map.addEventListener('dragend', onDragEnd);
    
    return () => {
      map.removeEventListener('dragstart', onDragStart);
      map.removeEventListener('drag', onDrag);
      map.removeEventListener('dragend', onDragEnd);
    };
  }, [isReady, enableSelection]);

  // Update route line when polyline changes
  useEffect(() => {
    if (!isReady || !mapRef.current) return;
    
    const H = window.H;
    const map = mapRef.current;
    
    // Remove existing route
    if (routeLineRef.current) {
      try {
        if (Array.isArray(routeLineRef.current)) {
          routeLineRef.current.forEach(obj => map.removeObject(obj));
        } else {
          map.removeObject(routeLineRef.current);
        }
      } catch (e) {}
      routeLineRef.current = null;
    }
    
    // Add new route if polyline provided
    if (routePolyline && typeof routePolyline === 'string' && storeLocation) {
      try {
        console.log('🛣️ Drawing route polyline');
        const lineString = H.geo.LineString.fromFlexiblePolyline(routePolyline);
        
        // Get the first point of the polyline
        const firstPoint = lineString.extractPoint(0);
        const storeLat = Number(storeLocation.latitude);
        const storeLng = Number(storeLocation.longitude);
        
        // Create a group to hold all route objects
        const routeObjects = [];
        
        // Add connector line from store pin to route start (if they differ)
        const distance = Math.sqrt(
          Math.pow(firstPoint.lat - storeLat, 2) + 
          Math.pow(firstPoint.lng - storeLng, 2)
        );
        
        if (distance > 0.0001) { // Only add connector if points are different
          const connectorLine = new H.geo.LineString();
          connectorLine.pushPoint({ lat: storeLat, lng: storeLng });
          connectorLine.pushPoint(firstPoint);
          
          const connector = new H.map.Polyline(connectorLine, {
            style: {
              strokeColor: COLORS.route,
              lineWidth: 5,
              lineCap: 'round',
              lineJoin: 'round',
              lineDash: [2, 4] // Dashed line for connector
            }
          });
          map.addObject(connector);
          routeObjects.push(connector);
        }
        
        // Add main route polyline
        const polyline = new H.map.Polyline(lineString, {
          style: {
            strokeColor: COLORS.route,
            lineWidth: 5,
            lineCap: 'round',
            lineJoin: 'round'
          }
        });
        map.addObject(polyline);
        routeObjects.push(polyline);
        
        routeLineRef.current = routeObjects;
        console.log('✅ Route drawn successfully');
        
        // Fit map to show the route
        const bounds = polyline.getBoundingBox();
        if (bounds) {
          map.getViewModel().setLookAtData({ bounds }, true);
        }
      } catch (err) {
        console.error('❌ Error creating route line:', err);
      }
    } else {
      console.log('ℹ️ No route polyline to draw');
    }
  }, [routePolyline, isReady, storeLocation]);

  // Fit map to show both store and customer
  const fitMapToBounds = (map, store, customer) => {
    try {
      const H = window.H;
      
      const storeLat = Number(store.latitude || store.lat);
      const storeLng = Number(store.longitude || store.lng);
      const custLat = Number(customer.lat);
      const custLng = Number(customer.lng);
      
      if (isNaN(storeLat) || isNaN(storeLng) || isNaN(custLat) || isNaN(custLng)) return;
      
      // Create a group with both points to get bounds
      const group = new H.map.Group();
      group.addObject(new H.map.Marker({ lat: storeLat, lng: storeLng }));
      group.addObject(new H.map.Marker({ lat: custLat, lng: custLng }));
      
      const bounds = group.getBoundingBox();
      if (bounds) {
        map.getViewModel().setLookAtData({ bounds }, true);
        // Zoom out a bit for padding
        setTimeout(() => {
          const zoom = map.getZoom();
          if (zoom > 14) map.setZoom(zoom - 1);
        }, 100);
      }
    } catch (err) {
      console.error('fitMapToBounds error:', err);
    }
  };

  // Handle map tap
  const handleMapTap = useCallback((evt) => {
    if (!enableSelection || !mapRef.current) return;
    
    const coord = mapRef.current.screenToGeo(
      evt.currentPointer.viewportX,
      evt.currentPointer.viewportY
    );
    
    handleLocationSelected(coord.lat, coord.lng);
  }, [enableSelection]);

  // Handle location selection - called when user clicks map, drags marker, or uses GPS
  const handleLocationSelected = async (lat, lng) => {
    // Validate coordinates
    const latitude = Number(lat);
    const longitude = Number(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      console.error('Invalid coordinates:', lat, lng);
      setError('Coordenadas inválidas');
      return;
    }
    
    console.log('Location selected:', latitude, longitude);
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Reverse geocode to get address
      const address = await reverseGeocodeHERE(latitude, longitude);
      
      // Call parent callbacks with validated coordinates
      const locationData = { 
        lat: latitude, 
        lng: longitude,
        latitude: latitude,
        longitude: longitude,
        ...address 
      };
      
      console.log('Calling onLocationSelect with:', locationData);
      onLocationSelect?.(locationData);
      onAddressFound?.(address);
    } catch (err) {
      console.error('Reverse geocode error:', err);
      // Still call onLocationSelect even if geocoding fails
      onLocationSelect?.({ lat: latitude, lng: longitude, latitude, longitude });
    } finally {
      setIsLoading(false);
    }
  };

  // Reverse geocode using HERE API
  const reverseGeocodeHERE = async (lat, lng) => {
    const response = await fetch(
      `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&lang=pt-BR&apikey=${HERE_API_KEY}`
    );
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      const addr = item.address || {};
      
      // Build a clean address display
      let streetDisplay = addr.street || '';
      if (addr.houseNumber) {
        streetDisplay = `${streetDisplay}, ${addr.houseNumber}`;
      }
      
      return {
        street: addr.street || '',
        number: addr.houseNumber || '',
        neighborhood: addr.district || '',
        city: addr.city || '',
        state: addr.stateCode || '',
        zip_code: addr.postalCode || '',
        formatted_address: addr.label || '',
        display_name: streetDisplay || addr.label || '',
      };
    }
    
    return {};
  };

  // Handle GPS button click
  const handleGetGPS = async () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0 // Force fresh location
        });
      });
      
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      console.log('GPS coordinates obtained:', lat, lng);
      
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        setError('Coordenadas inválidas recebidas do GPS');
        setIsLoading(false);
        return;
      }
      
      await handleLocationSelected(lat, lng);
    } catch (err) {
      console.error('GPS error:', err);
      const messages = {
        1: 'Permissão de localização negada. Habilite nas configurações do navegador.',
        2: 'Localização indisponível. Verifique se o GPS está ativado.',
        3: 'Tempo esgotado ao obter localização. Tente novamente.'
      };
      setError(messages[err.code] || 'Erro ao obter localização');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    // Check if it's a CEP (8 digits)
    const cleanQuery = query.replace(/\D/g, '');
    if (cleanQuery.length === 8) {
      searchTimeoutRef.current = setTimeout(() => searchByCEP(cleanQuery), 300);
      return;
    }
    
    // Search by address
    searchTimeoutRef.current = setTimeout(() => searchByAddress(query), 400);
  };

  // Search by CEP using ViaCEP + HERE geocoding
  const searchByCEP = async (cep) => {
    setIsLoading(true);
    try {
      // First get address from ViaCEP
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const viaCepData = await viaCepResponse.json();
      
      if (viaCepData.erro) {
        setSearchResults([]);
        setShowResults(false);
        setError('CEP não encontrado');
        return;
      }
      
      // Build search query for HERE
      const searchAddress = [
        viaCepData.logradouro,
        viaCepData.bairro,
        viaCepData.localidade,
        viaCepData.uf,
        'Brasil'
      ].filter(Boolean).join(', ');
      
      // Geocode with HERE
      const hereResponse = await fetch(
        `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(searchAddress)}&in=countryCode:BRA&limit=1&apikey=${HERE_API_KEY}`
      );
      const hereData = await hereResponse.json();
      
      if (hereData.items && hereData.items.length > 0) {
        const item = hereData.items[0];
        setSearchResults([{
          display_name: `${viaCepData.logradouro || ''}, ${viaCepData.bairro || ''}, ${viaCepData.localidade} - ${viaCepData.uf}`,
          latitude: item.position.lat,
          longitude: item.position.lng,
          address: {
            street: viaCepData.logradouro || '',
            neighborhood: viaCepData.bairro || '',
            city: viaCepData.localidade || '',
            state: viaCepData.uf || '',
            zip_code: cep,
          }
        }]);
        setShowResults(true);
      } else {
        setError('Endereço não encontrado para este CEP');
      }
    } catch (err) {
      console.error('CEP search error:', err);
      setError('Erro ao buscar CEP');
    } finally {
      setIsLoading(false);
    }
  };

  // Search by address using HERE Autosuggest
  const searchByAddress = async (query) => {
    try {
      // Use store location as center for better results
      const center = storeLocation 
        ? `${storeLocation.latitude},${storeLocation.longitude}`
        : '-10.1854332,-48.3038653';
      
      const response = await fetch(
        `https://autosuggest.search.hereapi.com/v1/autosuggest?q=${encodeURIComponent(query)}&at=${center}&in=countryCode:BRA&limit=5&apikey=${HERE_API_KEY}`
      );
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const results = data.items
          .filter(item => item.position)
          .map(item => ({
            display_name: item.title,
            latitude: item.position.lat,
            longitude: item.position.lng,
            address: item.address || {}
          }));
        
        setSearchResults(results);
        setShowResults(results.length > 0);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (err) {
      console.error('Address search error:', err);
    }
  };

  // Handle search result selection
  const handleResultSelect = async (result) => {
    setSearchQuery(result.display_name);
    setShowResults(false);
    setSearchResults([]);
    
    if (result.latitude && result.longitude) {
      await handleLocationSelected(result.latitude, result.longitude);
    }
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleResultSelect(searchResults[0]);
    }
  };

  // Close results on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.mapContainer}>
      {/* Search bar */}
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
                <li 
                  key={index}
                  onClick={() => handleResultSelect(result)}
                  className={styles.searchResultItem}
                >
                  <span className={styles.resultIcon}>📍</span>
                  <span className={styles.resultText}>{result.display_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {/* GPS Button */}
      {showGpsButton && enableSelection && (
        <button 
          type="button"
          onClick={handleGetGPS}
          className={styles.gpsButton}
          disabled={isLoading}
          title="Usar minha localização"
        >
          📍 Usar minha localização
        </button>
      )}
      
      {/* Error message */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className={styles.map}
        style={{ height }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}
      
      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendMarker} style={{ backgroundColor: COLORS.marsala }}>P</span>
          <span>Loja</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendMarker} style={{ backgroundColor: COLORS.gold }}>👤</span>
          <span>Você</span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMapSimple;
