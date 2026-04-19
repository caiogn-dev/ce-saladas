/**
 * Hook for delivery/shipping management
 */
import { useState, useCallback, useEffect } from 'react';
import * as storeApi from '../../../services/storeApi';
import { onlyDigits, STORE_ADDRESS } from '../utils';

const toFiniteNumber = (value, fallback = 0) => {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const useDelivery = () => {
  const [shippingMethod, setShippingMethod] = useState('delivery');
  const [shippingCost, setShippingCost] = useState(null);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);

  // Load delivery zones on mount
  useEffect(() => {
    const loadZones = async () => {
      try {
        const zones = await storeApi.getDeliveryZones();
        if (zones && zones.zones) {
          setDeliveryZones(zones.zones);
        }
      } catch {
        // Zones not available
      }
    };
    loadZones();
  }, []);

  // Fetch address from CEP
  const fetchAddressFromCEP = useCallback(async (cep) => {
    const cleanCEP = onlyDigits(cep);
    if (cleanCEP.length !== 8) return null;
    
    setLoadingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      if (!response.ok) throw new Error(`ViaCEP error: ${response.status}`);
      const data = await response.json();
      
      if (!data.erro) {
        const addressData = {
          address: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        };
        setLoadingCEP(false);
        return addressData;
      }
    } catch {
      // CEP lookup failed
    }
    setLoadingCEP(false);
    return null;
  }, []);

  // Calculate delivery fee by CEP
  const calculateDeliveryFeeByCEP = useCallback(async (cep, addressData = {}) => {
    const cleanCEP = onlyDigits(cep);
    if (cleanCEP.length !== 8) return null;
    
    setLoadingDelivery(true);
    try {
      const data = await storeApi.calculateDeliveryFee(null, cleanCEP);
      if (data && data.fee !== undefined) {
        const info = {
          fee: toFiniteNumber(data.fee, 0),
          estimated_days: Number(data.estimated_days) || 0,
          zone_name: data.zone_name || 'Área de entrega',
          distance_km: toFiniteNumber(data.distance_km, 0),
          estimated_minutes: toFiniteNumber(data.estimated_minutes, 0)
        };
        setDeliveryInfo(info);
        setShippingCost(info.fee);
        setLoadingDelivery(false);
        return info;
      }
    } catch {
      setShippingCost(null);
      setDeliveryInfo(null);
    }
    setLoadingDelivery(false);
    return null;
  }, []);

  // Calculate delivery fee by coordinates
  const calculateDeliveryFeeByCoords = useCallback(async (lat, lng) => {
    setLoadingDelivery(true);
    try {
      const data = await storeApi.validateDeliveryAddress(lat, lng);
      console.log('📦 Delivery validation response:', data);
      if (data) {
        if (data.is_valid === false) {
          setDeliveryInfo({
            fee: 0,
            zone_name: data.delivery_zone || data.zone_name || 'Fora da área de entrega',
            estimated_days: data.estimated_days || 0,
            distance_km: toFiniteNumber(data.distance_km, 0),
            duration_minutes: toFiniteNumber(data.duration_minutes, 0),
            estimated_minutes: toFiniteNumber(data.estimated_minutes ?? data.duration_minutes, 0),
            is_valid: false,
            polyline: '',
            message: data.message || 'Endereço fora da área de entrega.',
          });
          setShippingCost(null);
          setLoadingDelivery(false);
          return null;
        }
        // API returns delivery_fee, not fee
        const fee = toFiniteNumber(data.delivery_fee ?? data.fee, 0);
        const distanceKm = toFiniteNumber(data.distance_km, 0);
        const durationMinutes = toFiniteNumber(data.duration_minutes, 0);
        const info = {
          fee: fee,
          zone_name: data.delivery_zone || data.zone_name || 'Área de entrega',
          estimated_days: data.estimated_days || 0,
          distance_km: distanceKm,
          duration_minutes: durationMinutes,
          estimated_minutes: toFiniteNumber(data.estimated_minutes ?? data.duration_minutes, durationMinutes),
          is_valid: data.is_valid !== false,
          polyline: data.polyline
        };
        setDeliveryInfo(info);
        setShippingCost(fee);
        setLoadingDelivery(false);
        return info;
      }
    } catch (err) {
      console.error('❌ Delivery validation error:', err);
      setShippingCost(null);
      setDeliveryInfo(null);
    }
    setLoadingDelivery(false);
    return null;
  }, []);

  // Handle shipping method change
  const handleMethodChange = useCallback((method) => {
    setShippingMethod(method);
    if (method === 'pickup') {
      setShippingCost(0);
      setDeliveryInfo(null);
    }
  }, []);

  // Clear delivery info
  const clearDeliveryInfo = useCallback(() => {
    setDeliveryInfo(null);
    setShippingCost(null);
  }, []);

  return {
    shippingMethod,
    shippingCost,
    deliveryInfo,
    deliveryZones,
    loadingDelivery,
    loadingCEP,
    setShippingMethod: handleMethodChange,
    setShippingCost,
    setDeliveryInfo,
    fetchAddressFromCEP,
    calculateDeliveryFeeByCEP,
    calculateDeliveryFeeByCoords,
    clearDeliveryInfo
  };
};

export default useDelivery;
