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

  // Calculate delivery fee by coordinates — delegated to backend at checkout time
  const calculateDeliveryFeeByCoords = useCallback(async (lat, lng) => {
    // Frontend no longer calculates delivery fee — backend does it at checkout
    return null;
  }, []);

  // Calculate delivery fee by address — delegated to backend at checkout time
  const calculateDeliveryFeeByAddress = useCallback(async (address) => {
    // Frontend no longer calculates delivery fee — backend does it at checkout
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
    calculateDeliveryFeeByAddress,
    clearDeliveryInfo
  };
};

export default useDelivery;
