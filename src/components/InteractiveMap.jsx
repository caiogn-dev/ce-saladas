'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  initHereMaps,
  createMap,
  createDeliveryMarker,
  createStoreMarker,
  createCircle,
  createPolyline,
  setMapCenter,
  enableObjectDragging,
  calculateDistance,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  PASTITA_COLORS,
  lookupCEP,
  geocodeBrazilianAddress,
  getCurrentLocation,
  reverseGeocode
} from '../services/hereMapService';
import { calculateRouteWithPolyline, getRouteSummary } from '../services/hereRoutingService';
import { STORE_LOCATION } from './checkout/utils';
import logger from '../services/logger';

// Helper function to validate coordinates
const isValidCoordinate = (lat, lng) => {
  return typeof lat === 'number' && 
         typeof lng === 'number' && 
         !isNaN(lat) && 
         !isNaN(lng) &&
         lat >= -90 && lat <= 90 &&
         lng >= -180 && lng <= 180;
};

// Helper to extract lat/lng from various formats
const extractCoords = (location) => {
  if (!location) return null;
  
  const lat = location.lat ?? location.latitude;
  const lng = location.lng ?? location.longitude;
  
  if (isValidCoordinate(lat, lng)) {
    return { lat, lng };
  }
  return null;
};

/**
 * Interactive Map Component using HERE Maps JavaScript API
 * 
 * Features:
 * - Click to select location
 * - Use current location (geolocation)
 * - Search for address (ViaCEP + HERE)
 * - Reverse geocoding on selection
 * - Draggable marker
 * - Route visualization
 * - Delivery zones display
 */
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
  // Debug: Log props on every render
  logger.info('InteractiveMap RENDER', {
    hasRoutePolyline: !!routePolyline,
    polylineLength: routePolyline?.length,
    polylinePreview: routePolyline?.substring(0, 30),
    hasCustomerLocation: !!customerLocation,
    hasStoreLocation: !!storeLocation
  });

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const zoneObjectsRef = useRef([]);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [routeInfo, setRouteInfo] = useState(null);
  const [error, setError] = useState(null);
  
  const searchTimeoutRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Initialize HERE Maps
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;

    const init = async () => {
      try {
        await initHereMaps();
        if (mounted) {
          setIsLoaded(true);
        }
      } catch (err) {
        logger.error('Failed to initialize HERE Maps', err);
        if (mounted) {
          setError('Erro ao carregar o mapa');
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Create map instance
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      // Extract and validate coordinates
      const customerCoords = extractCoords(customerLocation) || extractCoords(initialLocation);
      const storeCoords = extractCoords(storeLocation) || extractCoords(STORE_LOCATION);
      
      logger.info('InteractiveMap: Creating map', {
        customerCoords,
        storeCoords,
        showStoreMarker,
        showCustomerMarker,
        STORE_LOCATION
      });
      
      // Determine map center - ALWAYS prefer store location first for initial view
      // This ensures the map starts centered on Palmas, not in the ocean
      let center;
      let zoom;
      
      if (customerCoords && storeCoords) {
        // Both exist - we'll fit bounds later, start with store
        center = storeCoords;
        zoom = 14;
      } else if (customerCoords) {
        center = customerCoords;
        zoom = 15;
      } else if (storeCoords) {
        center = storeCoords;
        zoom = 14;
      } else {
        // Fallback to Palmas, TO (CÃª Saladas location)
        center = { lat: -10.1854332, lng: -48.3038653 };
        zoom = 13;
      }
      
      logger.info('InteractiveMap: Map center and zoom', { center, zoom });

      const instance = createMap(mapContainerRef.current, { center, zoom });
      mapInstanceRef.current = instance;

      // Add store marker if valid and enabled
      if (storeCoords && showStoreMarker) {
        logger.info('InteractiveMap: Adding store marker', storeCoords);
        try {
          const storeMarker = createStoreMarker(storeCoords);
          instance.map.addObject(storeMarker);
          storeMarkerRef.current = storeMarker;
        } catch (markerErr) {
          logger.error('Failed to create store marker', markerErr);
        }
      }

      // Add customer/delivery marker if location provided
      if (customerCoords && (showMarker || showCustomerMarker)) {
        logger.info('InteractiveMap: Adding delivery marker', customerCoords);
        try {
          const marker = createDeliveryMarker(customerCoords, { 
            draggable: markerDraggable && enableSelection 
          });
          instance.map.addObject(marker);
          markerRef.current = marker;
        } catch (markerErr) {
          logger.error('Failed to create delivery marker', markerErr);
        }
      }

      // Enable dragging if needed
      if (markerDraggable && enableSelection) {
        enableObjectDragging(instance.map, instance.behavior, handleDragEnd);
      }

      // Add click handler only if selection is enabled
      if (enableSelection) {
        instance.map.addEventListener('tap', handleMapClick);
      }

      // Fit bounds to show both markers if both exist
      if (storeCoords && customerCoords && showStoreMarker) {
        logger.info('InteractiveMap: Fitting bounds to show both markers');
        
        try {
          // Calculate bounds with padding
          const minLat = Math.min(storeCoords.lat, customerCoords.lat);
          const maxLat = Math.max(storeCoords.lat, customerCoords.lat);
          const minLng = Math.min(storeCoords.lng, customerCoords.lng);
          const maxLng = Math.max(storeCoords.lng, customerCoords.lng);
          
          // Add padding (about 20%)
          const latPadding = (maxLat - minLat) * 0.2 || 0.01;
          const lngPadding = (maxLng - minLng) * 0.2 || 0.01;
          
          const bounds = new window.H.geo.Rect(
            maxLat + latPadding,
            minLng - lngPadding,
            minLat - latPadding,
            maxLng + lngPadding
          );
          
          instance.map.getViewModel().setLookAtData({ bounds }, true);
          
          // Ensure reasonable zoom after bounds fit
          setTimeout(() => {
            const currentZoom = instance.map.getZoom();
            if (currentZoom > 16) {
              instance.map.setZoom(16);
            } else if (currentZoom < 11) {
              instance.map.setZoom(11);
            }
          }, 150);
        } catch (boundsErr) {
          logger.error('Failed to fit bounds', boundsErr);
        }
      }

    } catch (err) {
      logger.error('Failed to create map', err);
      setError('Erro ao criar o mapa');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.cleanup();
        mapInstanceRef.current = null;
        markerRef.current = null;
        storeMarkerRef.current = null;
        routeLineRef.current = null;
        zoneObjectsRef.current = [];
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Add store marker when storeLocation becomes available (after map is created)
  useEffect(() => {
    if (!mapInstanceRef.current || !showStoreMarker) return;
    if (storeMarkerRef.current) return; // Already added
    
    const storeCoords = extractCoords(storeLocation) || extractCoords(STORE_LOCATION);
    if (!storeCoords) return;
    
    const map = mapInstanceRef.current.map;
    logger.info('InteractiveMap: Late adding store marker', storeCoords);
    
    try {
      const storeMarker = createStoreMarker(storeCoords);
      map.addObject(storeMarker);
      storeMarkerRef.current = storeMarker;
    } catch (err) {
      logger.error('Failed to late-add store marker', err);
    }
  }, [storeLocation, showStoreMarker]);

  // Update customer marker when customerLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const customerCoords = extractCoords(customerLocation);
    if (!customerCoords) return;
    
    const map = mapInstanceRef.current.map;
    
    if (markerRef.current) {
      markerRef.current.setGeometry(customerCoords);
    } else if (showCustomerMarker) {
      try {
        const marker = createDeliveryMarker(customerCoords, { 
          draggable: markerDraggable && enableSelection 
        });
        map.addObject(marker);
        markerRef.current = marker;
      } catch (err) {
        logger.error('Failed to update customer marker', err);
      }
    }
  }, [customerLocation, showCustomerMarker, markerDraggable, enableSelection]);

  // Draw route polyline when provided
  // Use a ref to track if we need to draw the polyline after map is ready
  const pendingPolylineRef = useRef(null);
  
  useEffect(() => {
    // Store polyline for later if map not ready
    if (routePolyline && typeof routePolyline === 'string' && routePolyline.length > 0) {
      pendingPolylineRef.current = routePolyline;
    }
    
    // Wait for map to be ready
    if (!isLoaded || !mapInstanceRef.current) {
      logger.info('InteractiveMap: Polyline effect - map not ready, storing for later', { 
        isLoaded, 
        hasMap: !!mapInstanceRef.current,
        hasPolyline: !!routePolyline 
      });
      return;
    }
    
    const map = mapInstanceRef.current.map;
    
    // Remove existing route
    if (routeLineRef.current) {
      try {
        map.removeObject(routeLineRef.current);
        logger.info('InteractiveMap: Removed existing polyline');
      } catch (e) {
        // Object might already be removed
      }
      routeLineRef.current = null;
    }
    
    // Use current polyline or pending one
    const polylineToUse = routePolyline || pendingPolylineRef.current;
    
    // Draw new route if polyline provided
    if (polylineToUse && typeof polylineToUse === 'string' && polylineToUse.length > 0) {
      // Extract store and customer coordinates for connecting polyline to markers
      const storeCoords = extractCoords(storeLocation) || extractCoords(STORE_LOCATION);
      const customerCoords = extractCoords(customerLocation);
      
      logger.info('InteractiveMap: Drawing route polyline', { 
        length: polylineToUse.length,
        preview: polylineToUse.substring(0, 50) + '...',
        storeCoords,
        customerCoords
      });
      
      try {
        // Create polyline with start/end points to connect to markers
        // This ensures the polyline starts exactly at the store marker
        // and ends exactly at the customer marker
        const polyline = createPolyline(polylineToUse, {
          strokeColor: 'rgba(114, 47, 55, 1)', // Marsala red, full opacity
          lineWidth: 6,
          startPoint: storeCoords,  // Connect to store marker
          endPoint: customerCoords   // Connect to customer marker
        });
        
        if (!polyline) {
          logger.error('InteractiveMap: createPolyline returned null');
          return;
        }
        
        // Verify polyline has valid geometry before adding
        const geometry = polyline.getGeometry();
        if (!geometry) {
          logger.error('InteractiveMap: Polyline has no geometry');
          return;
        }
        
        // Get point count for logging
        const pointCount = geometry.getPointCount ? geometry.getPointCount() : 'unknown';
        logger.info('InteractiveMap: Polyline geometry valid', { pointCount });
        
        // Add to map
        map.addObject(polyline);
        routeLineRef.current = polyline;
        pendingPolylineRef.current = null; // Clear pending
        logger.info('InteractiveMap: âœ… Route polyline added to map successfully');
        
        // Fit bounds to show the entire route with padding
        try {
          const bounds = polyline.getBoundingBox();
          if (bounds) {
            logger.info('InteractiveMap: Polyline bounds', {
              top: bounds.getTop(),
              bottom: bounds.getBottom(),
              left: bounds.getLeft(),
              right: bounds.getRight()
            });
            
            // Expand bounds slightly for padding
            const top = bounds.getTop();
            const bottom = bounds.getBottom();
            const left = bounds.getLeft();
            const right = bounds.getRight();
            
            const latPadding = Math.abs(top - bottom) * 0.2 || 0.005;
            const lngPadding = Math.abs(right - left) * 0.2 || 0.005;
            
            const paddedBounds = new window.H.geo.Rect(
              top + latPadding,
              left - lngPadding,
              bottom - latPadding,
              right + lngPadding
            );
            
            map.getViewModel().setLookAtData({ bounds: paddedBounds }, true);
            
            // Ensure reasonable zoom
            setTimeout(() => {
              const currentZoom = map.getZoom();
              logger.info('InteractiveMap: Current zoom after bounds fit', { currentZoom });
              if (currentZoom > 16) {
                map.setZoom(16);
              } else if (currentZoom < 12) {
                map.setZoom(12);
              }
            }, 300);
          }
        } catch (boundsErr) {
          logger.warn('InteractiveMap: Could not adjust bounds for polyline', boundsErr);
        }
      } catch (err) {
        logger.error('InteractiveMap: Failed to draw route polyline:', err);
      }
    } else {
      logger.info('InteractiveMap: No polyline to draw', { 
        hasPolyline: !!routePolyline, 
        type: typeof routePolyline,
        length: routePolyline?.length 
      });
    }
  }, [isLoaded, routePolyline, storeLocation, customerLocation]);

  // Display zones
  useEffect(() => {
    if (!mapInstanceRef.current || !showZones) return;

    const map = mapInstanceRef.current.map;

    // Remove existing zone objects
    zoneObjectsRef.current.forEach(obj => {
      try {
        map.removeObject(obj);
      } catch (e) {
        // Object might already be removed
      }
    });
    zoneObjectsRef.current = [];

    // Add new zones
    zones.forEach((zone, index) => {
      if (zone.center && zone.radius) {
        const colors = [
          { fill: 'rgba(114, 47, 55, 0.15)', stroke: '#722F37' },
          { fill: 'rgba(212, 175, 55, 0.15)', stroke: '#D4AF37' },
          { fill: 'rgba(76, 175, 80, 0.15)', stroke: '#4CAF50' },
        ];
        const colorIndex = index % colors.length;
        
        const circle = createCircle(
          { lat: zone.center.latitude || zone.center.lat, lng: zone.center.longitude || zone.center.lng },
          zone.radius * 1000, // Convert km to meters
          {
            fillColor: colors[colorIndex].fill,
            strokeColor: colors[colorIndex].stroke,
            data: zone
          }
        );
        map.addObject(circle);
        zoneObjectsRef.current.push(circle);
      }
    });
  }, [zones, showZones, isLoaded]);

  // Handle map click
  const handleMapClick = useCallback(async (evt) => {
    if (!mapInstanceRef.current) return;
    
    const coord = mapInstanceRef.current.map.screenToGeo(
      evt.currentPointer.viewportX,
      evt.currentPointer.viewportY
    );
    
    await selectLocation(coord.lat, coord.lng);
  }, []);

  // Handle marker drag end
  const handleDragEnd = useCallback(async (event) => {
    if (event.type === 'marker' && event.position) {
      await selectLocation(event.position.lat, event.position.lng, false);
    }
  }, []);

  // Select location and reverse geocode
  const selectLocation = useCallback(async (latitude, longitude, updateMarker = true) => {
    if (!mapInstanceRef.current) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const map = mapInstanceRef.current.map;

      // Update or create marker
      if (updateMarker && showMarker) {
        if (markerRef.current) {
          markerRef.current.setGeometry({ lat: latitude, lng: longitude });
        } else {
          const marker = createDeliveryMarker(
            { lat: latitude, lng: longitude },
            { draggable: markerDraggable }
          );
          map.addObject(marker);
          markerRef.current = marker;
        }
      }

      // Center map
      setMapCenter(map, { lat: latitude, lng: longitude }, 15);

      // Try to get address via HERE reverse geocoding
      let addressData = {};
      try {
        const response = await fetch(
          `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${latitude},${longitude}&apikey=${process.env.NEXT_PUBLIC_HERE_API_KEY}`
        );
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          addressData = {
            street: item.address.street || '',
            number: item.address.houseNumber || '',
            neighborhood: item.address.district || '',
            city: item.address.city || '',
            state: item.address.stateCode || item.address.state || '',
            zip_code: item.address.postalCode || '',
            formatted_address: item.address.label || '',
          };
        }
      } catch (e) {
        logger.warn('Reverse geocoding failed', { error: e.message });
      }

      const location = {
        latitude,
        longitude,
        ...addressData,
      };

      setSelectedLocation(location);
      onLocationSelect?.(location);
      onAddressChange?.(addressData);

      // Calculate route if store location is set
      if (showRoute && storeLocation) {
        await calculateAndShowRoute(
          { lat: storeLocation.latitude, lng: storeLocation.longitude },
          { lat: latitude, lng: longitude }
        );
      }

    } catch (err) {
      logger.error('Error selecting location', err);
      setError('Erro ao obter endereÃ§o');
      
      const location = { latitude, longitude };
      setSelectedLocation(location);
      onLocationSelect?.(location);
    } finally {
      setIsLoading(false);
    }
  }, [showMarker, markerDraggable, onLocationSelect, onAddressChange, showRoute, storeLocation]);

  // Calculate and display route
  const calculateAndShowRoute = useCallback(async (origin, destination) => {
    if (!mapInstanceRef.current) return;

    try {
      const map = mapInstanceRef.current.map;

      // Remove existing route
      if (routeLineRef.current) {
        map.removeObject(routeLineRef.current);
        routeLineRef.current = null;
      }

      const routeData = await calculateRouteWithPolyline(origin, destination);
      
      map.addObject(routeData.mapPolyline);
      routeLineRef.current = routeData.mapPolyline;

      const summary = getRouteSummary(routeData);
      setRouteInfo({
        distance: routeData.distanceKm,
        duration: routeData.durationMinutes,
        summary: summary.full
      });

    } catch (err) {
      logger.error('Route calculation failed', err);
      setRouteInfo(null);
    }
  }, []);

  // Handle geolocation
  const handleGetCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const position = await getCurrentLocation();
      await selectLocation(position.latitude, position.longitude);
    } catch (err) {
      setError(err.message || 'Erro ao obter localizaÃ§Ã£o');
    } finally {
      setIsLoading(false);
    }
  }, [selectLocation]);

  // Handle search input
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Check if it's a CEP (8 digits)
    const cleanQuery = query.replace(/\D/g, '');
    if (cleanQuery.length === 8) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const cepData = await lookupCEP(cleanQuery);
          if (cepData && cepData.city) {
            // Only show CEPs from Palmas, TO
            const city = (cepData.city || '').toLowerCase();
            const state = (cepData.state || '').toLowerCase();
            if (!city.includes('palmas') || (state !== 'to' && state !== 'tocantins')) {
              setSuggestions([{
                display_name: `CEP ${cleanQuery} nÃ£o Ã© de Palmas - TO. SÃ³ entregamos em Palmas.`,
                error: true,
                notDeliverable: true
              }]);
              setShowSuggestions(true);
              return;
            }
            setSuggestions([{
              display_name: `${cepData.address}, ${cepData.neighborhood}, ${cepData.city} - ${cepData.state}`,
              cep: cleanQuery,
              logradouro: cepData.address,
              bairro: cepData.neighborhood,
              localidade: cepData.city,
              uf: cepData.state,
              ...cepData
            }]);
            setShowSuggestions(true);
          }
        } catch {
          setSuggestions([]);
        }
      }, 300);
      return;
    }

    // Search via HERE - use store location as center for better results
    const storeAt = `${STORE_LOCATION.latitude},${STORE_LOCATION.longitude}`;
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://autosuggest.search.hereapi.com/v1/autosuggest?q=${encodeURIComponent(query)}&at=${storeAt}&in=countryCode:BRA&limit=5&apikey=${process.env.NEXT_PUBLIC_HERE_API_KEY}`
        );
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const results = data.items
            .filter(item => item.position)
            .map(item => ({
              display_name: item.title,
              latitude: item.position.lat,
              longitude: item.position.lng,
              address: item.address
            }));
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
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

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (suggestion) => {
    // Don't select error suggestions
    if (suggestion.error || suggestion.notDeliverable) {
      setError(suggestion.display_name);
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);

    // If it's a CEP result, geocode the address
    if (suggestion.cep) {
      try {
        const geoData = await geocodeBrazilianAddress({
          street: suggestion.logradouro,
          city: suggestion.localidade,
          state: suggestion.uf
        });
        if (geoData && geoData.error) {
          setError(geoData.message);
          return;
        }
        if (geoData && geoData.latitude) {
          await selectLocation(geoData.latitude, geoData.longitude);
          return;
        }
      } catch {
        // Fall through to use HERE geocoding
      }
    }

    // Use coordinates from suggestion
    if (suggestion.latitude && suggestion.longitude) {
      await selectLocation(suggestion.latitude, suggestion.longitude);
    }
  }, [selectLocation]);

  // Handle CEP search
  const handleCEPSearch = useCallback(async (cep) => {
    if (cep.replace(/\D/g, '').length !== 8) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await geocodeBrazilianAddress(cep);
      if (result && result.error) {
        setError(result.message || 'SÃ³ entregamos em Palmas - TO');
      } else if (result && result.latitude) {
        await selectLocation(result.latitude, result.longitude);
        setSearchQuery(result.display_name || '');
      } else {
        setError('CEP nÃ£o encontrado');
      }
    } catch {
      setError('Erro ao buscar CEP');
    } finally {
      setIsLoading(false);
    }
  }, [selectLocation]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if input looks like a CEP
  const isCEPFormat = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 8 && /^\d{8}$/.test(digits);
  };

  // Handle search submit
  const handleSearchSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isCEPFormat(searchQuery)) {
      handleCEPSearch(searchQuery);
    } else if (suggestions.length > 0) {
      handleSuggestionSelect(suggestions[0]);
    } else if (searchQuery.length >= 3) {
      // Direct search via HERE geocoding
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(searchQuery)}&in=countryCode:BRA&limit=1&apikey=${process.env.NEXT_PUBLIC_HERE_API_KEY}`
        );
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          const result = {
            display_name: item.title,
            latitude: item.position.lat,
            longitude: item.position.lng,
            address: item.address
          };
          handleSuggestionSelect(result);
        } else {
          setError('EndereÃ§o nÃ£o encontrado');
        }
      } catch (err) {
        setError('Erro ao buscar endereÃ§o');
      } finally {
        setIsLoading(false);
      }
    }
  }, [searchQuery, suggestions, handleCEPSearch, handleSuggestionSelect]);

  if (error && !isLoaded) {
    return (
      <div className={`interactive-map-error ${className}`} style={{ height }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`interactive-map ${className}`}>
      {/* Search and controls */}
      {(showSearch || showGeolocation) && (
        <div className="map-controls">
          {showSearch && (
            <div onSubmit={handleSearchSubmit} className="map-search" ref={suggestionsRef}>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchSubmit(e))}
                  placeholder={placeholder}
                  className="search-input"
                />
                <button type="button" onClick={handleSearchSubmit} className="search-button" disabled={isLoading}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </div>
              
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={suggestion.place_id || index}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={`suggestion-item ${suggestion.error ? 'suggestion-error' : ''}`}
                      style={suggestion.error ? { color: '#dc3545', cursor: 'default', backgroundColor: '#fff5f5' } : {}}
                    >
                      {suggestion.error ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      )}
                      <span>{suggestion.display_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {showGeolocation && (
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="geolocation-button"
              disabled={isLoading}
              title="Usar minha localizaÃ§Ã£o"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
                <line x1="12" y1="2" x2="12" y2="4"></line>
                <line x1="12" y1="20" x2="12" y2="22"></line>
                <line x1="2" y1="12" x2="4" y2="12"></line>
                <line x1="20" y1="12" x2="22" y2="12"></line>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="map-container"
        style={{ height }}
      >
        {!isLoaded && (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <span>Carregando mapa...</span>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="map-loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="map-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Ã—</button>
        </div>
      )}

      {/* Route info */}
      {routeInfo && (
        <div className="route-info">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
          <span>{routeInfo.summary}</span>
        </div>
      )}

      {/* Selected location info */}
      {selectedLocation && (selectedLocation.formatted_address || selectedLocation.display_name) && (
        <div className="selected-location">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className="location-text">{selectedLocation.formatted_address || selectedLocation.display_name}</span>
        </div>
      )}

      <style jsx>{`
        .interactive-map {
          position: relative;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
        }

        .map-controls {
          display: flex;
          gap: 8px;
          padding: 12px;
          background: white;
          border-bottom: 1px solid #e0e0e0;
        }

        .map-search {
          flex: 1;
          position: relative;
        }

        .search-input-wrapper {
          display: flex;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        .search-input {
          flex: 1;
          padding: 10px 12px;
          border: none;
          font-size: 14px;
          outline: none;
        }

        .search-button {
          padding: 10px 12px;
          background: #4CAF50;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-button:hover {
          background: #45a049;
        }

        .search-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .suggestions-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 8px 8px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          list-style: none;
          margin: 0;
          padding: 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover {
          background: #f5f5f5;
        }

        .suggestion-item svg {
          flex-shrink: 0;
          color: #666;
        }

        .suggestion-item span {
          font-size: 13px;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .geolocation-button {
          padding: 10px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          transition: all 0.2s;
        }

        .geolocation-button:hover {
          background: #f5f5f5;
          color: #4CAF50;
        }

        .geolocation-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .map-container {
          width: 100%;
          position: relative;
        }

        .map-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #f5f5f5;
          color: #666;
        }

        .map-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.7);
          z-index: 1000;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .map-error {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: #ffebee;
          color: #c62828;
          font-size: 13px;
        }

        .map-error button {
          background: none;
          border: none;
          color: #c62828;
          cursor: pointer;
          font-size: 18px;
          padding: 0 4px;
        }

        .route-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: #fff3e0;
          border-top: 1px solid #ffe0b2;
        }

        .route-info svg {
          flex-shrink: 0;
          color: #f57c00;
        }

        .route-info span {
          font-size: 13px;
          color: #333;
          font-weight: 500;
        }

        .selected-location {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: #e8f5e9;
          border-top: 1px solid #c8e6c9;
        }

        .selected-location svg {
          flex-shrink: 0;
          color: #4CAF50;
        }

        .location-text {
          font-size: 13px;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .interactive-map-error {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffebee;
          color: #c62828;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

