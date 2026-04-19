/**
 * Hook for geolocation and address detection
 * Includes caching for route calculations to improve performance
 */
import { useState, useCallback } from 'react';
import * as storeApi from '../../../services/storeApi';
import { getStateCode, STORE_ADDRESS, STORE_LOCATION } from '../utils';
import { getCachedRoute, cacheRoute } from '../../../utils/routeCache';

const requestCurrentPosition = (options) => new Promise((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject, options);
});

export const useGeolocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(null);
  const [detectedAddress, setDetectedAddress] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [deliveryInfo, setDeliveryInfo] = useState(null);

  // Reverse geocode via backend (Google Maps)
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const data = await storeApi.reverseGeocode(lat, lng);
      if (data) {
        return {
          street: data.street || '',
          number: data.number || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          country: 'Brasil',
          display_name: data.formatted_address || data.display_name || '',
          lat,
          lng,
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
      setError('Geolocalizacao nao suportada pelo navegador');
      return null;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError('A localizacao do navegador so funciona em conexao segura (HTTPS).');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      let pos;

      try {
        pos = await requestCurrentPosition({
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        });
      } catch (highAccuracyError) {
        const shouldRetryWithRelaxedAccuracy = [2, 3].includes(highAccuracyError?.code);
        if (!shouldRetryWithRelaxedAccuracy) {
          throw highAccuracyError;
        }

        console.warn('High accuracy geolocation failed, retrying with relaxed settings', highAccuracyError);

        pos = await requestCurrentPosition({
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 300000,
        });
      }

      const { latitude, longitude, accuracy } = pos.coords;

      console.log(`GPS Location: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);

      if (accuracy > 100) {
        console.warn(`GPS accuracy is low: ${accuracy}m`);
      }

      setPosition({ lat: latitude, lng: longitude });

      const address = await reverseGeocode(latitude, longitude);
      const fallbackAddress = address || {
        street: '',
        number: '',
        neighborhood: '',
        city: STORE_ADDRESS.city,
        state: STORE_ADDRESS.state,
        zip_code: '',
        lat: latitude,
        lng: longitude,
      };
      setDetectedAddress(fallbackAddress);

      await calculateRouteAndFee(latitude, longitude);

      setLoading(false);
      return { lat: latitude, lng: longitude, address: fallbackAddress, accuracy };
    } catch (err) {
      setLoading(false);

      if (err.code === 1) {
        setError('Permissao de localizacao negada. Permita o acesso nas configuracoes do Safari/navegador.');
      } else if (err.code === 2) {
        setError('Nao foi possivel obter sua localizacao. Verifique se o GPS e a localizacao precisa estao ativados.');
      } else if (err.code === 3) {
        setError('Tempo esgotado ao obter localizacao. Tente novamente.');
      } else {
        setError('Erro ao obter localizacao');
      }
      return null;
    }
  }, [reverseGeocode, calculateRouteAndFee]);

  // Update location manually (from map click)
  const updateLocation = useCallback(async (lat, lng) => {
    setPosition({ lat, lng });
    setLoading(true);

    const address = await reverseGeocode(lat, lng);
    const fallbackAddress = address || {
      street: '',
      number: '',
      neighborhood: '',
      city: STORE_ADDRESS.city,
      state: STORE_ADDRESS.state,
      zip_code: '',
      lat,
      lng,
    };
    setDetectedAddress(fallbackAddress);

    await calculateRouteAndFee(lat, lng);
    setLoading(false);

    return fallbackAddress;
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
