/**
 * Hook for geolocation and address detection
 * Includes caching for route calculations to improve performance
 */
import { useState, useCallback } from 'react';
import * as storeApi from '../../../services/storeApi';
import { getStateCode, STORE_LOCATION } from '../utils';
import { getCachedRoute, cacheRoute } from '../../../utils/routeCache';

export const useGeolocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(null);
  const [detectedAddress, setDetectedAddress] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [deliveryInfo, setDeliveryInfo] = useState(null);

  // Reverse geocode using HERE Maps API
  const reverseGeocode = useCallback(async (lat, lng) => {
    const apiKey = process.env.NEXT_PUBLIC_HERE_API_KEY;
    if (!apiKey) {
      console.error('HERE API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&apikey=${apiKey}`
      );
      const data = await response.json();
      
      if (data && data.items && data.items.length > 0) {
        const item = data.items[0];
        const addr = item.address || {};
        return {
          street: addr.street || '',
          number: addr.houseNumber || '',
          neighborhood: addr.district || '',
          city: addr.city || '',
          state: addr.stateCode || getStateCode(addr.state || ''),
          zip_code: addr.postalCode || '',
          country: addr.countryName || 'Brasil',
          display_name: addr.label || '',
          lat,
          lng
        };
      }
      return null;
    } catch (err) {
      console.error('Reverse geocode error:', err);
      return null;
    }
  }, []);

  // Calculate route and delivery fee with caching
  const calculateRouteAndFee = useCallback(async (lat, lng) => {
    try {
      const storeLat = STORE_LOCATION?.latitude;
      const storeLng = STORE_LOCATION?.longitude;
      
      console.log('🗺️ calculateRouteAndFee called:', { lat, lng, storeLat, storeLng });
      
      // Check cache first for route
      let routeData = null;
      if (storeLat && storeLng) {
        const cachedRoute = getCachedRoute(storeLat, storeLng, lat, lng);
        if (cachedRoute) {
          console.log('🗺️ Route cache hit');
          routeData = cachedRoute;
        }
      }
      
      // If not cached, fetch from API
      if (!routeData) {
        console.log('🗺️ Fetching route from API...');
        routeData = await storeApi.calculateRoute(lat, lng);
        console.log('🗺️ Route API response:', routeData);
        if (routeData && storeLat && storeLng) {
          cacheRoute(storeLat, storeLng, lat, lng, routeData);
        }
      }

      // Get delivery fee - API returns delivery_fee, not fee
      console.log('🗺️ Fetching delivery validation...');
      const deliveryData = await storeApi.validateDeliveryAddress(lat, lng);
      console.log('📦 Delivery validation response:', deliveryData);
      
      // Use polyline from deliveryData (validate-delivery returns it) or routeData
      const polyline = deliveryData?.polyline || routeData?.polyline;
      console.log('🗺️ Polyline available:', !!polyline, polyline?.length);
      
      // Set route info with polyline
      const routeInfoData = {
        distance_km: deliveryData?.distance_km || routeData?.distance_km,
        duration_minutes: deliveryData?.duration_minutes || routeData?.duration_minutes,
        polyline: polyline,
        summary: routeData?.summary
      };
      console.log('🗺️ Setting routeInfo:', routeInfoData);
      setRouteInfo(routeInfoData);
      
      if (deliveryData) {
        const fee = Number(deliveryData.delivery_fee ?? deliveryData.fee ?? 0);
        const deliveryInfoData = {
          fee: fee,
          zone_name: deliveryData.delivery_zone || deliveryData.zone_name || 'Área de entrega',
          estimated_days: deliveryData.estimated_days || 0,
          distance_km: deliveryData.distance_km,
          duration_minutes: deliveryData.duration_minutes,
          estimated_minutes: deliveryData.estimated_minutes || deliveryData.duration_minutes,
          is_valid: deliveryData.is_valid !== false,
          polyline: polyline
        };
        console.log('📦 Setting deliveryInfo:', deliveryInfoData);
        setDeliveryInfo(deliveryInfoData);
      }

      return { routeData, deliveryData };
    } catch (err) {
      console.error('Route calculation error:', err);
      return null;
    }
  }, []);

  // Detect user location
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0 // Always get fresh location, no cache
        });
      });

      const { latitude, longitude, accuracy } = pos.coords;
      
      // Log accuracy for debugging
      console.log(`📍 GPS Location: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
      
      // Warn if accuracy is poor (> 100m)
      if (accuracy > 100) {
        console.warn(`⚠️ GPS accuracy is low: ${accuracy}m`);
      }
      
      setPosition({ lat: latitude, lng: longitude });

      // Reverse geocode
      const address = await reverseGeocode(latitude, longitude);
      if (address) {
        setDetectedAddress(address);
      }

      // Calculate route and fee
      await calculateRouteAndFee(latitude, longitude);

      setLoading(false);
      return { lat: latitude, lng: longitude, address, accuracy };
    } catch (err) {
      setLoading(false);
      
      if (err.code === 1) {
        setError('Permissão de localização negada. Por favor, permita o acesso à localização nas configurações do navegador.');
      } else if (err.code === 2) {
        setError('Não foi possível obter sua localização. Verifique se o GPS está ativado.');
      } else if (err.code === 3) {
        setError('Tempo esgotado ao obter localização. Tente novamente.');
      } else {
        setError('Erro ao obter localização');
      }
      return null;
    }
  }, [reverseGeocode, calculateRouteAndFee]);

  // Update location manually (from map click)
  const updateLocation = useCallback(async (lat, lng) => {
    setPosition({ lat, lng });
    setLoading(true);

    const address = await reverseGeocode(lat, lng);
    if (address) {
      setDetectedAddress(address);
    }

    await calculateRouteAndFee(lat, lng);
    setLoading(false);

    return address;
  }, [reverseGeocode, calculateRouteAndFee]);

  // Clear all data
  const clearLocation = useCallback(() => {
    setPosition(null);
    setDetectedAddress(null);
    setRouteInfo(null);
    setDeliveryInfo(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    position,
    detectedAddress,
    routeInfo,
    deliveryInfo,
    detectLocation,
    updateLocation,
    clearLocation,
    calculateRouteAndFee,
    setDeliveryInfo,
    setDetectedAddress,
    setPosition
  };
};

export default useGeolocation;
