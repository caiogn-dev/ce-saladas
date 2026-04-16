/**
 * Hook for checkout form state management
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import * as storeApi from '../../../services/storeApi';
import {
  formatCPF,
  formatPhone,
  formatCEP,
  onlyDigits,
  validateCPF,
  STORE_ADDRESS,
  splitFullName,
} from '../utils';
import { readGuestInfoStatic } from '../../../hooks/useGuestInfo';

const CHECKOUT_DRAFT_VERSION = 1;

const getDraftStorageKey = () => `checkout_draft:${storeApi.STORE_SLUG}`;

const readCheckoutDraft = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(getDraftStorageKey());
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed?.version !== CHECKOUT_DRAFT_VERSION) {
      window.localStorage.removeItem(getDraftStorageKey());
      return null;
    }

    return parsed.data || null;
  } catch {
    return null;
  }
};

const writeCheckoutDraft = (data) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      getDraftStorageKey(),
      JSON.stringify({
        version: CHECKOUT_DRAFT_VERSION,
        data,
      }),
    );
  } catch {
    // Ignore storage failures.
  }
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const isValidPhone = (value) => onlyDigits(value).length === 11;

export const useCheckoutForm = () => {
  const { profile, user } = useAuth();
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
    zip_code: '',
  });

  const [errors, setErrors] = useState({});
  const [saveAddress, setSaveAddress] = useState(true);
  const [hasPreviousOrder, setHasPreviousOrder] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [isIdentificationComplete, setIsIdentificationComplete] = useState(false);

  // Track which fields user has already filled on the authenticated profile.
  const [existingFields, setExistingFields] = useState({
    name: false,
    email: false,
    phone: false,
    cpf: false,
    address: false,
  });

  // Load user data and any guest checkout draft on mount.
  useEffect(() => {
    const loadUserData = async () => {
      const currentProfile = profile || user;
      const checkoutDraft = readCheckoutDraft();

      if (storeApi.getAuthToken()) {
        try {
          const orders = await storeApi.getUserOrders();
          if (orders?.results?.length > 0) {
            setHasPreviousOrder(true);
          }
        } catch {
          // Ignore public/guest bootstrap failures.
        }
      }

      const newExistingFields = {
        name: !!(currentProfile?.first_name || currentProfile?.last_name),
        email: !!currentProfile?.email,
        phone: !!currentProfile?.phone,
        cpf: !!currentProfile?.cpf,
        address: !!currentProfile?.address,
      };
      setExistingFields(newExistingFields);

      // Priority: profile > guest info (ce_guest_info) > draft
      const guestInfo = readGuestInfoStatic() || {};
      const draftData = checkoutDraft || {};

      const profileName = currentProfile?.first_name && currentProfile?.last_name
        ? `${currentProfile.first_name} ${currentProfile.last_name}`.trim()
        : currentProfile?.first_name || '';

      const nextFormData = {
        name: profileName || guestInfo.name || draftData.name || '',
        email: currentProfile?.email || guestInfo.email || draftData.email || '',
        phone: currentProfile?.phone
          ? formatPhone(currentProfile.phone)
          : guestInfo.phone ? formatPhone(guestInfo.phone) : draftData.phone || '',
        cpf: currentProfile?.cpf ? formatCPF(currentProfile.cpf) : draftData.cpf || '',
        address: currentProfile?.address || draftData.address || '',
        number: currentProfile?.number || draftData.number || '',
        complement: currentProfile?.complement || draftData.complement || '',
        neighborhood: currentProfile?.neighborhood || draftData.neighborhood || '',
        city: currentProfile?.city || draftData.city || '',
        state: currentProfile?.state || draftData.state || '',
        zip_code: currentProfile?.zip_code ? formatCEP(currentProfile.zip_code) : draftData.zip_code || '',
      };

      setFormData(nextFormData);
      setSaveAddress(draftData.saveAddress ?? true);
      // Identification is complete when the customer already has a valid phone.
      setIsIdentificationComplete(
        Boolean(
          currentProfile?.phone || isValidPhone(nextFormData.phone)
        ),
      );
      setUserDataLoaded(true);
    };

    loadUserData();
  }, [profile, user]);

  // Persist guest checkout progress locally.
  useEffect(() => {
    if (!userDataLoaded) return;

    writeCheckoutDraft({
      ...formData,
      saveAddress,
      isIdentificationComplete,
    });
  }, [formData, saveAddress, isIdentificationComplete, userDataLoaded]);

  // Keep a mutable ref for shipping mode changes.
  useEffect(() => {
    saveAddressRef.current = saveAddress;
  }, [saveAddress]);

  const getIdentificationErrors = useCallback(() => {
    const nextErrors = {};
    if (!formData.phone.trim()) nextErrors.phone = 'Celular é obrigatório';
    else if (!isValidPhone(formData.phone)) nextErrors.phone = 'Celular inválido';
    return nextErrors;
  }, [formData.phone]);

  const validateIdentification = useCallback(() => {
    const identificationErrors = getIdentificationErrors();

    setErrors((prev) => ({
      ...prev,
      phone: identificationErrors.phone || '',
      identification: Object.keys(identificationErrors).length > 0
        ? 'Informe um celular válido para continuar'
        : '',
    }));

    return Object.keys(identificationErrors).length === 0;
  }, [getIdentificationErrors]);

  const setPhoneValue = useCallback((phone) => {
    const formattedPhone = formatPhone(phone);
    const validPhone = isValidPhone(formattedPhone);

    setFormData((prev) => ({ ...prev, phone: formattedPhone }));
    setIsIdentificationComplete(validPhone);
    setErrors((prev) => ({
      ...prev,
      phone: validPhone || !formattedPhone ? '' : prev.phone,
      identification: validPhone ? '' : prev.identification,
    }));
  }, []);

  // Handle form field changes.
  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    let formattedValue = value;

    if (name === 'cpf') formattedValue = formatCPF(value);
    else if (name === 'phone') formattedValue = formatPhone(value);
    else if (name === 'zip_code') formattedValue = formatCEP(value);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }, [errors]);

  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Set address from geolocation.
  const setAddressFromGeo = useCallback((geoAddress) => {
    if (!geoAddress) return;

    setFormData((prev) => ({
      ...prev,
      address: geoAddress.street || prev.address,
      number: geoAddress.number || prev.number,
      complement: geoAddress.complement || prev.complement,
      neighborhood: geoAddress.neighborhood || prev.neighborhood,
      city: geoAddress.city || prev.city,
      state: geoAddress.state || prev.state,
      zip_code: geoAddress.zip_code ? formatCEP(geoAddress.zip_code) : prev.zip_code,
    }));
  }, []);

  const handleShippingMethodChange = useCallback((method) => {
    if (method === 'pickup') {
      previousSavePref.current = saveAddressRef.current;
      setSaveAddress(false);

      deliveryAddressRef.current = {
        address: formData.address,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
      };

      setFormData((prev) => ({
        ...prev,
        address: STORE_ADDRESS.address,
        city: STORE_ADDRESS.city,
        state: STORE_ADDRESS.state,
        zip_code: formatCEP(STORE_ADDRESS.zip_code),
      }));
    } else {
      setSaveAddress(previousSavePref.current ?? true);

      if (deliveryAddressRef.current) {
        setFormData((prev) => ({ ...prev, ...deliveryAddressRef.current }));
      }
    }
  }, [formData]);

  const validateForm = useCallback((shippingMethod) => {
    const newErrors = {};

    if (!isIdentificationComplete) {
      newErrors.identification = 'Informe um celular válido para continuar.';
    }

    if (!formData.phone.trim() || !isValidPhone(formData.phone)) {
      newErrors.phone = 'Celular inválido';
    }

    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';

    const normalizedCpf = onlyDigits(formData.cpf);
    if (normalizedCpf && !validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    if (shippingMethod === 'delivery') {
      if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
      if (!formData.number.trim()) newErrors.number = 'Número é obrigatório';
      if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
      if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
      if (!formData.state) newErrors.state = 'Estado é obrigatório';
      if (!formData.zip_code.trim()) newErrors.zip_code = 'CEP é obrigatório';
      else if (onlyDigits(formData.zip_code).length !== 8) newErrors.zip_code = 'CEP inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isIdentificationComplete]);

  const buildCheckoutPayload = useCallback((shippingMethod, enableScheduling, scheduledDate, scheduledTimeSlot) => {
    const fullAddress = formData.number
      ? `${formData.address}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''}`
      : formData.address;

    const isPickup = shippingMethod === 'pickup';
    const deliveryAddress = isPickup ? {
      street: STORE_ADDRESS.address,
      city: STORE_ADDRESS.city,
      state: STORE_ADDRESS.state,
      zip_code: onlyDigits(STORE_ADDRESS.zip_code),
    } : {
      street: formData.address,
      number: formData.number || '',
      complement: formData.complement || '',
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
      shipping_address: isPickup ? STORE_ADDRESS.address : fullAddress,
      shipping_city: isPickup ? STORE_ADDRESS.city : formData.city,
      shipping_state: isPickup ? STORE_ADDRESS.state : formData.state,
      shipping_zip_code: isPickup ? onlyDigits(STORE_ADDRESS.zip_code) : onlyDigits(formData.zip_code),
      delivery_address: deliveryAddress,
      scheduled_date: enableScheduling && scheduledDate ? scheduledDate : null,
      scheduled_time_slot: enableScheduling && scheduledTimeSlot ? scheduledTimeSlot : null,
    };
  }, [formData]);

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
      payload.address = formData.address;
      payload.number = formData.number;
      payload.complement = formData.complement;
      payload.neighborhood = formData.neighborhood;
      payload.city = formData.city;
      payload.state = formData.state;
      payload.zip_code = onlyDigits(formData.zip_code);
    }

    return payload;
  }, [formData, profile, saveAddress]);

  const buildGuestInfoPayload = useCallback(() => ({
    name: formData.name.trim(),
    phone: onlyDigits(formData.phone),
    email: formData.email.trim(),
  }), [formData]);

  return {
    formData,
    errors,
    saveAddress,
    hasPreviousOrder,
    userDataLoaded,
    existingFields,
    isIdentificationComplete,
    handleChange,
    updateFormData,
    setAddressFromGeo,
    handleShippingMethodChange,
    validateIdentification,
    setPhoneValue,
    validateForm,
    buildCheckoutPayload,
    buildProfileUpdatePayload,
    buildGuestInfoPayload,
    setSaveAddress,
    setErrors,
  };
};

export default useCheckoutForm;
