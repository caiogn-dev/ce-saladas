/**
 * Hook for geolocation and address detection
 * Includes caching for route calculations to improve performance
 */
import { useState, useCallback } from 'react';
import * as storeApi from '../../../services/storeApi';
import { STORE_ADDRESS, STORE_LOCATION } from '../utils';
import { getCachedRoute, cacheRoute } from '../../../utils/routeCache';
import {
  getStoreRegionErrorMessage,
  isLocalAddressCandidate,
  isSafeStoreCoordinateInput,
} from '../../../utils/storeRegion';

const toFiniteNumber = (value, fallback = 0) => {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(numeric) ? numeric : fallback;
};

const TARGET_LOCATION_ACCURACY_METERS = 40;
const MAX_AUTO_LOCATION_ACCURACY_METERS = 100;
const LOCATION_WATCH_TIMEOUT_MS = 15000;

const getAccuracy = (position) => toFiniteNumber(position?.coords?.accuracy, Infinity);

const requestBestCurrentPosition = () => new Promise((resolve, reject) => {
  let bestPosition = null;
  let settled = false;
  let watchId = null;
  let timeoutId = null;

  const cleanup = () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  };

  const finish = (position) => {
    if (settled) return;
    settled = true;
    cleanup();
    resolve(position);
  };

  const fail = (error) => {
    if (settled) return;
    settled = true;
    cleanup();
    reject(error);
  };

  timeoutId = window.setTimeout(() => {
    if (bestPosition) {
      finish(bestPosition);
      return;
    }

    fail({ code: 3, message: 'Tempo esgotado ao obter localizacao precisa.' });
  }, LOCATION_WATCH_TIMEOUT_MS);

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const accuracy = getAccuracy(position);
      if (!bestPosition || accuracy < getAccuracy(bestPosition)) {
        bestPosition = position;
      }

      if (accuracy <= TARGET_LOCATION_ACCURACY_METERS) {
        finish(position);
      }
    },
    (error) => {
      if (bestPosition) {
        finish(bestPosition);
        return;
      }

      fail(error);
    },
    {
      enableHighAccuracy: true,
      timeout: LOCATION_WATCH_TIMEOUT_MS,
      maximumAge: 0,
    },
  );
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
      if (!isSafeStoreCoordinateInput({ lat, lng })) {
        setRouteInfo(null);
        setDeliveryInfo(null);
        setError(getStoreRegionErrorMessage());
        return null;
      }

      const storeLat = STORE_LOCATION?.latitude;
      const storeLng = STORE_LOCATION?.longitude;
      
      // Check cache first for route
      let routeData = null;
      if (storeLat && storeLng) {
        const cachedRoute = getCachedRoute(storeLat, storeLng, lat, lng);
        if (cachedRoute) {
          routeData = cachedRoute;
        }
      }
      
      // If not cached, fetch from API
      if (!routeData) {
        routeData = await storeApi.calculateRoute(lat, lng);
        if (routeData && !routeData.fallback && storeLat && storeLng) {
          cacheRoute(storeLat, storeLng, lat, lng, routeData);
        }
      }

      // Get delivery fee - API returns delivery_fee, not fee
      const deliveryData = await storeApi.validateDeliveryAddress(lat, lng);
      setError(null);
      
      // Use polyline from deliveryData (validate-delivery returns it) or routeData
      const polyline = deliveryData?.polyline || routeData?.polyline;

      const distanceKm = toFiniteNumber(deliveryData?.distance_km ?? routeData?.distance_km, 0);
      const durationMinutes = toFiniteNumber(deliveryData?.duration_minutes ?? routeData?.duration_minutes, 0);

      if (deliveryData?.is_valid === false) {
        setRouteInfo(null);
        setDeliveryInfo({
          fee: 0,
          zone_name: deliveryData.delivery_zone || deliveryData.zone_name || 'Fora da área de entrega',
          estimated_days: deliveryData.estimated_days || 0,
          distance_km: distanceKm,
          duration_minutes: durationMinutes,
          estimated_minutes: toFiniteNumber(deliveryData.estimated_minutes ?? deliveryData.duration_minutes, durationMinutes),
          is_valid: false,
          polyline: '',
          message: deliveryData.message || getStoreRegionErrorMessage(),
        });
        setError(deliveryData.message || getStoreRegionErrorMessage());
        return { routeData, deliveryData };
      }
      
      // Set route info with polyline
      const routeInfoData = (!routeData?.fallback || polyline)
        ? {
            distance_km: distanceKm,
            duration_minutes: durationMinutes,
            polyline: polyline,
            summary: routeData?.summary,
            fallback: Boolean(routeData?.fallback),
          }
        : null;
      setRouteInfo(routeInfoData);
      
      if (deliveryData) {
        const fee = Number(deliveryData.delivery_fee ?? deliveryData.fee ?? 0);
        const deliveryInfoData = {
          fee: fee,
          zone_name: deliveryData.delivery_zone || deliveryData.zone_name || 'Área de entrega',
          estimated_days: deliveryData.estimated_days || 0,
          distance_km: distanceKm,
          duration_minutes: durationMinutes,
          estimated_minutes: toFiniteNumber(deliveryData.estimated_minutes ?? deliveryData.duration_minutes, durationMinutes),
          is_valid: deliveryData.is_valid !== false,
          polyline: polyline
        };
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
      const pos = await requestBestCurrentPosition();

      const { latitude, longitude, accuracy } = pos.coords;
      const numericAccuracy = toFiniteNumber(accuracy, Infinity);

      if (numericAccuracy > MAX_AUTO_LOCATION_ACCURACY_METERS) {
        setPosition(null);
        setDetectedAddress(null);
        setRouteInfo(null);
        setDeliveryInfo(null);
        setError(
          `Localizacao imprecisa (${Math.round(numericAccuracy)}m). Digite seu CEP/endereco para evitar erro na entrega.`
        );
        setLoading(false);
        return null;
      }

      if (!isSafeStoreCoordinateInput({ lat: latitude, lng: longitude })) {
        setPosition(null);
        setDetectedAddress(null);
        setRouteInfo(null);
        setDeliveryInfo(null);
        setError(getStoreRegionErrorMessage());
        setLoading(false);
        return null;
      }

      const address = await reverseGeocode(latitude, longitude);
      if (!address || !isLocalAddressCandidate(address)) {
        setPosition(null);
        setDetectedAddress(null);
        setRouteInfo(null);
        setDeliveryInfo(null);
        setError('Nao foi possivel confirmar seu endereco automaticamente. Digite seu CEP/endereco para evitar erro na entrega.');
        setLoading(false);
        return null;
      }

      setPosition({ lat: latitude, lng: longitude });
      setDetectedAddress(address);

      await calculateRouteAndFee(latitude, longitude);

      setLoading(false);
      return { lat: latitude, lng: longitude, address, accuracy: numericAccuracy };
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
  const updateLocation = useCallback(async (lat, lng, addressOverride = null) => {
    setPosition({ lat, lng });
    setLoading(true);
    setError(null);

    if (!isSafeStoreCoordinateInput({ lat, lng }, addressOverride)) {
      setDetectedAddress(null);
      setRouteInfo(null);
      setDeliveryInfo(null);
      setError(getStoreRegionErrorMessage());
      setLoading(false);
      return null;
    }

    const address = await reverseGeocode(lat, lng);
    const fallbackAddress = addressOverride || address || {
      street: '',
      number: '',
      neighborhood: '',
      city: STORE_ADDRESS.city,
      state: STORE_ADDRESS.state,
      zip_code: '',
      lat,
      lng,
    };
    if (!isLocalAddressCandidate(fallbackAddress)) {
      setDetectedAddress(null);
      setRouteInfo(null);
      setDeliveryInfo(null);
      setError(getStoreRegionErrorMessage());
      setLoading(false);
      return null;
    }
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
