/**
 * Hook for checkout form state management
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import * as storeApi from '../../../services/storeApi';
import { 
  formatCPF, formatPhone, formatCEP, onlyDigits, 
  validateCPF, STORE_ADDRESS, splitFullName 
} from '../utils';

export const useCheckoutForm = () => {
  const { profile, user, updateProfile } = useAuth();
  const deliveryAddressRef = useRef(null);
  const previousSavePref = useRef(true);
  const saveAddressRef = useRef(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: ''
  });

  const [errors, setErrors] = useState({});
  const [saveAddress, setSaveAddress] = useState(true);
  const [hasPreviousOrder, setHasPreviousOrder] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  // Track which fields user has already filled
  const [existingFields, setExistingFields] = useState({
    name: false,
    email: false,
    phone: false,
    cpf: false,
    address: false
  });

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      const currentProfile = profile || user;
      
      // Check if user has previous orders
      try {
        const orders = await storeApi.getUserOrders();
        if (orders && orders.results && orders.results.length > 0) {
          setHasPreviousOrder(true);
        }
      } catch {
        // No previous orders
      }

      if (currentProfile) {
        const newExistingFields = {
          name: !!(currentProfile.first_name || currentProfile.last_name),
          email: !!currentProfile.email,
          phone: !!currentProfile.phone,
          cpf: !!currentProfile.cpf,
          address: !!currentProfile.address
        };
        setExistingFields(newExistingFields);

        setFormData((prev) => ({
          ...prev,
          name: currentProfile.first_name && currentProfile.last_name
            ? `${currentProfile.first_name} ${currentProfile.last_name}`.trim()
            : currentProfile.first_name || prev.name,
          email: currentProfile.email || prev.email,
          phone: currentProfile.phone ? formatPhone(currentProfile.phone) : prev.phone,
          cpf: currentProfile.cpf ? formatCPF(currentProfile.cpf) : prev.cpf,
          address: currentProfile.address || prev.address,
          city: currentProfile.city || prev.city,
          state: currentProfile.state || prev.state,
          zip_code: currentProfile.zip_code ? formatCEP(currentProfile.zip_code) : prev.zip_code
        }));
      }
      
      setUserDataLoaded(true);
    };

    loadUserData();
  }, [profile, user]);

  // Update saveAddressRef when saveAddress changes
  useEffect(() => {
    saveAddressRef.current = saveAddress;
  }, [saveAddress]);

  // Handle form field changes
  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    let formattedValue = value;
    
    if (name === 'cpf') formattedValue = formatCPF(value);
    else if (name === 'phone') formattedValue = formatPhone(value);
    else if (name === 'zip_code') formattedValue = formatCEP(value);
    
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }, [errors]);

  // Update form data directly
  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Set address from geolocation
  const setAddressFromGeo = useCallback((geoAddress) => {
    if (!geoAddress) return;
    
    setFormData((prev) => ({
      ...prev,
      address: geoAddress.street || prev.address,
      number: geoAddress.number || prev.number,
      neighborhood: geoAddress.neighborhood || prev.neighborhood,
      city: geoAddress.city || prev.city,
      state: geoAddress.state || prev.state,
      zip_code: geoAddress.zip_code ? formatCEP(geoAddress.zip_code) : prev.zip_code
    }));
  }, []);

  // Handle shipping method change
  const handleShippingMethodChange = useCallback((method) => {
    if (method === 'pickup') {
      previousSavePref.current = saveAddressRef.current;
      setSaveAddress(false);
      
      // Save current delivery address
      deliveryAddressRef.current = {
        address: formData.address,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code
      };
      
      // Set store address
      setFormData((prev) => ({
        ...prev,
        address: STORE_ADDRESS.address,
        city: STORE_ADDRESS.city,
        state: STORE_ADDRESS.state,
        zip_code: formatCEP(STORE_ADDRESS.zip_code)
      }));
    } else {
      setSaveAddress(previousSavePref.current ?? true);
      
      // Restore delivery address
      if (deliveryAddressRef.current) {
        setFormData((prev) => ({ ...prev, ...deliveryAddressRef.current }));
      }
    }
  }, [formData]);

  // Validate form
  const validateForm = useCallback((shippingMethod) => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'E-mail inválido';
    
    if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
    else if (onlyDigits(formData.phone).length < 10) newErrors.phone = 'Telefone inválido';
    
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório';
    else if (!validateCPF(formData.cpf)) newErrors.cpf = 'CPF inválido';

    if (shippingMethod === 'delivery') {
      if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
      if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
      if (!formData.state) newErrors.state = 'Estado é obrigatório';
      if (!formData.zip_code.trim()) newErrors.zip_code = 'CEP é obrigatório';
      else if (onlyDigits(formData.zip_code).length !== 8) newErrors.zip_code = 'CEP inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Build checkout payload
  const buildCheckoutPayload = useCallback((shippingMethod, enableScheduling, scheduledDate, scheduledTimeSlot) => {
    const fullAddress = formData.number 
      ? `${formData.address}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''}`
      : formData.address;

    const isPickup = shippingMethod === 'pickup';
    
    // Build delivery_address object for the API
    const deliveryAddress = isPickup ? {
      street: STORE_ADDRESS.address,
      city: STORE_ADDRESS.city,
      state: STORE_ADDRESS.state,
      zip_code: onlyDigits(STORE_ADDRESS.zip_code),
    } : {
      street: fullAddress,
      neighborhood: formData.neighborhood || '',
      city: formData.city,
      state: formData.state,
      zip_code: onlyDigits(formData.zip_code),
    };

    return {
      customer_name: formData.name.trim(),
      customer_email: formData.email.trim(),
      customer_phone: onlyDigits(formData.phone),
      cpf: onlyDigits(formData.cpf),
      // Legacy fields for backwards compatibility
      shipping_address: isPickup ? STORE_ADDRESS.address : fullAddress,
      shipping_city: isPickup ? STORE_ADDRESS.city : formData.city,
      shipping_state: isPickup ? STORE_ADDRESS.state : formData.state,
      shipping_zip_code: isPickup ? onlyDigits(STORE_ADDRESS.zip_code) : onlyDigits(formData.zip_code),
      // New delivery_address object for API
      delivery_address: deliveryAddress,
      scheduled_date: enableScheduling && scheduledDate ? scheduledDate : null,
      scheduled_time_slot: enableScheduling && scheduledTimeSlot ? scheduledTimeSlot : null,
    };
  }, [formData]);

  // Build profile update payload
  const buildProfileUpdatePayload = useCallback((shippingMethod) => {
    const payload = {};
    const { firstName, lastName } = splitFullName(formData.name);
    const normalizedEmail = formData.email.trim();
    const normalizedPhone = onlyDigits(formData.phone);
    const normalizedCpf = onlyDigits(formData.cpf);

    if (!profile?.first_name && firstName) payload.first_name = firstName;
    if (!profile?.last_name && lastName) payload.last_name = lastName;
    if (!profile?.email && normalizedEmail) payload.email = normalizedEmail;
    if (!profile?.phone && normalizedPhone) payload.phone = normalizedPhone;
    if (!profile?.cpf && normalizedCpf) payload.cpf = normalizedCpf;

    if (saveAddress && shippingMethod === 'delivery') {
      const fullAddress = formData.number 
        ? `${formData.address}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''}`
        : formData.address;
      payload.address = fullAddress;
      payload.city = formData.city;
      payload.state = formData.state;
      payload.zip_code = onlyDigits(formData.zip_code);
    }

    return payload;
  }, [formData, profile, saveAddress]);

  return {
    formData,
    errors,
    saveAddress,
    hasPreviousOrder,
    userDataLoaded,
    existingFields,
    handleChange,
    updateFormData,
    setAddressFromGeo,
    handleShippingMethodChange,
    validateForm,
    buildCheckoutPayload,
    buildProfileUpdatePayload,
    setSaveAddress,
    setErrors
  };
};

export default useCheckoutForm;
