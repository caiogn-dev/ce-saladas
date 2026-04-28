/**
 * Checkout Page V2 - New flow with order confirmation first
 * 
 * Flow:
 * 1. Order Confirmation - Show cart items, select delivery/pickup
 * 2. If Delivery - Location Modal popup for GPS/address selection
 * 3. Payment Step - Customer info and payment
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import * as storeApi from '../services/storeApi';
import styles from '../styles/CheckoutFlow.module.css';
import useLastAddress from '../hooks/useLastAddress';
import useGuestInfo from '../hooks/useGuestInfo';

// Import modular components
import {
  LocationModal,
  OrderConfirmation,
  PaymentStep,
  CheckoutProgress,
  useCheckoutForm,
  useGeolocation,
  useDelivery,
  useCoupon
} from '../components/checkout';

const normalizeString = (value) => (
  typeof value === 'string' ? value.trim().toLowerCase() : ''
);

const dispatchMetaPixelEvent = (eventName, customData = {}, eventId = '') => {
  if (typeof window === 'undefined' || !eventName) return;
  window.dispatchEvent(new CustomEvent('meta:pixel-event', {
    detail: { eventName, customData, eventId },
  }));
};

const buildMetaEventId = (eventName) => {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return `${eventName}:${window.crypto.randomUUID()}`;
  }
  return `${eventName}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
};

const getCookieValue = (name) => {
  if (typeof document === 'undefined' || !name) return '';
  const cookie = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : '';
};

const buildMetaPurchasePayload = (eventId) => ({
  event_name: 'Purchase',
  event_id: eventId,
  fbp: getCookieValue('_fbp'),
  fbc: getCookieValue('_fbc'),
  event_source_url: typeof window !== 'undefined' ? window.location.href : '',
});

const ALLOWED_REDIRECT_HOSTS = [
  'www.mercadopago.com.br',
  'www.mercadopago.com',
  'mercadopago.com.br',
  'mercadopago.com',
  'checkout.mercadopago.com.br',
  'checkout.mercadopago.com',
  'sandbox.mercadopago.com.br',
  'sandbox.mercadopago.com',
];

const isSafePaymentUrl = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_REDIRECT_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
};

const resolveCardMethodFromPayload = (paymentPayload = {}) => {
  const direct = normalizeString(
    paymentPayload.selected_payment_method
    || paymentPayload.selectedPaymentMethod
    || paymentPayload.method
    || paymentPayload.type
  );

  if (direct === 'credit_card' || direct === 'debit_card') {
    return direct;
  }

  const formData = paymentPayload.form_data || paymentPayload.formData || {};
  const fromForm = normalizeString(
    formData.selected_payment_method
    || formData.selectedPaymentMethod
    || formData.payment_type
    || formData.paymentType
  );

  if (fromForm === 'credit_card' || fromForm === 'debit_card') {
    return fromForm;
  }

  return 'card';
};

const resolveCheckoutPaymentMethod = (selectedMethod, paymentPayload = {}) => {
  const normalizedSelected = normalizeString(selectedMethod);

  if (normalizedSelected === 'card') {
    return resolveCardMethodFromPayload(paymentPayload);
  }

  if (normalizedSelected === 'cash' || normalizedSelected === 'dinheiro') {
    return 'cash';
  }

  return 'pix';
};

const normalizePaymentPayload = (selectedMethod, paymentPayload = {}) => {
  const normalizedSelected = normalizeString(selectedMethod);

  if (normalizedSelected !== 'card') {
    return paymentPayload || { method: normalizedSelected || 'pix' };
  }

  const formData = paymentPayload.form_data || paymentPayload.formData || {};
  const payer = paymentPayload.payer || {};
  const payerFromForm = formData.payer || {};
  const identification = payer.identification || payerFromForm.identification || {};

  return {
    method: 'card',
    selected_payment_method: resolveCardMethodFromPayload(paymentPayload),
    token: formData.token || paymentPayload.token || '',
    payment_method_id: formData.paymentMethodId || formData.payment_method_id || paymentPayload.payment_method_id || '',
    issuer_id: formData.issuerId || formData.issuer_id || paymentPayload.issuer_id || '',
    installments: formData.installments || paymentPayload.installments || 1,
    payer: {
      email: formData.cardholderEmail || payer.email || paymentPayload.email || '',
      identification_type: formData.identificationType || identification.type || '',
      identification_number: formData.identificationNumber || identification.number || '',
    },
  };
};

const hasDirectCardPayload = (paymentPayload = {}) => (
  Boolean(paymentPayload?.token && paymentPayload?.payment_method_id)
);

const extractMercadoPagoErrorMessage = (error) => {
  if (!error) {
    return 'Erro ao carregar o formulário do cartão.';
  }

  if (typeof error === 'string') {
    return error;
  }

  const firstCause = Array.isArray(error.cause) ? error.cause[0] : error.cause;
  return (
    firstCause?.description
    || firstCause?.message
    || error.message
    || 'Erro ao carregar o formulário do cartão.'
  );
};

class CheckoutSubtreeBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('[CheckoutSubtreeBoundary] subtree render failed:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74', borderRadius: 12, padding: 16, marginTop: 16 }}>
          <p style={{ margin: 0 }}>O bloco de localização falhou ao renderizar. Tente abrir novamente.</p>
          <button type="button" onClick={this.handleRetry} style={{ marginTop: 12, border: 0, borderRadius: 999, padding: '10px 16px', background: '#f97316', color: '#fff', cursor: 'pointer' }}>
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const CheckoutPage = () => {
  const router = useRouter();
  const { cart, combos, cartTotal, clearCart, hasItems } = useCart();
  const cartItemCount = [...(cart || []), ...(combos || [])].reduce(
    (total, item) => total + Number(item.quantity || 1),
    0
  );
  const { updateProfile, isAuthenticated, user, profile, signOut } = useAuth();
  const { isStoreOpen, availability } = useStore();
  const mpPublicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
  const { readLastAddress, saveLastAddress } = useLastAddress();
  const { saveGuestInfo, buildMergePayload } = useGuestInfo();

  // Custom hooks
  const checkoutForm = useCheckoutForm();
  const geolocation = useGeolocation();
  const delivery = useDelivery();
  const coupon = useCoupon();
  const discountAmount = useMemo(
    () => coupon.calculateDiscount(cartTotal, delivery.shippingCost || 0),
    [coupon, cartTotal, delivery.shippingCost]
  );

  // Flow state
  const [currentStep, setCurrentStep] = useState('order'); // 'order' | 'payment'
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState(null);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [paymentError, setPaymentError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Scheduling state
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState('');

  const applyResolvedDeliveryInfo = useCallback((info) => {
    if (!info) {
      delivery.setDeliveryInfo(null);
      delivery.setShippingCost(null);
      return;
    }

    delivery.setDeliveryInfo(info);
    delivery.setShippingCost(info.is_valid === false ? null : info.fee);
  }, [delivery]);

  const buildAddressValidationString = useCallback((address) => {
    if (!address) return '';

    return [
      address.street && address.number ? `${address.street}, ${address.number}` : address.street,
      address.complement,
      address.neighborhood,
      address.city,
      address.state,
      address.zip_code,
    ].filter(Boolean).join(', ');
  }, []);

  const restoreDeliveryForAddress = useCallback(async (address) => {
    if (!address || delivery.shippingMethod !== 'delivery') {
      return null;
    }

    const lat = address.lat ?? address.latitude ?? null;
    const lng = address.lng ?? address.longitude ?? null;

    if (lat != null && lng != null) {
      return delivery.calculateDeliveryFeeByCoords(lat, lng);
    }

    const addressString = buildAddressValidationString(address);
    if (!addressString) {
      return null;
    }

    return delivery.calculateDeliveryFeeByAddress(addressString);
  }, [buildAddressValidationString, delivery]);

  // Initialize Mercado Pago
  useEffect(() => {
    if (mpPublicKey) {
      initMercadoPago(mpPublicKey, { locale: 'pt-BR' });
    }
  }, [mpPublicKey]);

  // Pre-populate delivery address: profile > localStorage
  useEffect(() => {
    if (!checkoutForm.userDataLoaded) return;

    const currentProfile = profile || user;
    const hasProfileAddress = currentProfile?.address && currentProfile?.city;

    if (hasProfileAddress) {
      const addr = {
        street: currentProfile.address,
        number: currentProfile.number || '',
        complement: currentProfile.complement || '',
        neighborhood: currentProfile.neighborhood || '',
        city: currentProfile.city,
        state: currentProfile.state || '',
        zip_code: currentProfile.zip_code || '',
      };
      setConfirmedAddress(addr);
      checkoutForm.setAddressFromGeo(addr);
      return;
    }

    const last = readLastAddress();
    if (last?.address) {
      setConfirmedAddress(last.address);
      checkoutForm.setAddressFromGeo(last.address);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutForm.userDataLoaded]);

  useEffect(() => {
    if (!checkoutForm.userDataLoaded) return;
    if (delivery.shippingMethod !== 'delivery') return;
    if (!confirmedAddress) return;
    if (delivery.loadingDelivery) return;
    if (delivery.shippingCost !== null) return;

    let cancelled = false;

    const resolveSavedDelivery = async () => {
      const resolved = await restoreDeliveryForAddress(confirmedAddress);
      if (cancelled) return;
      applyResolvedDeliveryInfo(resolved);
    };

    resolveSavedDelivery();

    return () => {
      cancelled = true;
    };
  }, [
    applyResolvedDeliveryInfo,
    checkoutForm.userDataLoaded,
    confirmedAddress,
    delivery.loadingDelivery,
    delivery.shippingCost,
    delivery.shippingMethod,
    restoreDeliveryForAddress,
  ]);

  // Handle shipping method change
  const handleShippingMethodChange = useCallback((method) => {
    delivery.setShippingMethod(method);
    checkoutForm.handleShippingMethodChange(method);
    
    if (method === 'delivery' && !confirmedAddress) {
      // Open location modal when selecting delivery
      setShowLocationModal(true);
    }
  }, [delivery, checkoutForm, confirmedAddress]);

  // Handle select delivery address button
  const handleSelectDeliveryAddress = useCallback(() => {
    setShowLocationModal(true);
  }, []);

  // Handle location confirmation from modal
  const handleLocationConfirm = useCallback(async (locationData) => {
    setConfirmedAddress(locationData.address);
    checkoutForm.setAddressFromGeo(locationData.address);

    // Persist for next visit
    saveLastAddress(locationData.address);

    // Save to profile immediately if authenticated and profile has no address yet
    if (isAuthenticated && locationData.address) {
      const currentProfile = profile || user;
      if (!currentProfile?.address) {
        updateProfile({
          address: locationData.address.street || '',
          number: locationData.address.number || '',
          complement: locationData.address.complement || '',
          neighborhood: locationData.address.neighborhood || '',
          city: locationData.address.city || '',
          state: locationData.address.state || '',
          zip_code: (locationData.address.zip_code || '').replace(/\D/g, ''),
        }).catch(() => { /* non-critical */ });
      }
    }

    const resolvedDeliveryInfo = locationData.deliveryInfo
      || await restoreDeliveryForAddress(locationData.address);

    applyResolvedDeliveryInfo(resolvedDeliveryInfo);

    setShowLocationModal(false);
  }, [
    applyResolvedDeliveryInfo,
    checkoutForm,
    saveLastAddress,
    isAuthenticated,
    profile,
    restoreDeliveryForAddress,
    updateProfile,
    user,
  ]);

  // Handle proceed to payment
  const handleProceedToPayment = useCallback(() => {
    dispatchMetaPixelEvent('InitiateCheckout', {
      currency: 'BRL',
      value: Number(cartTotal + (delivery.shippingCost || 0) - discountAmount),
      num_items: Number(cartItemCount || 0),
    }, buildMetaEventId('InitiateCheckout'));
    setCurrentStep('payment');
  }, [cartItemCount, cartTotal, delivery.shippingCost, discountAmount]);

  // Handle back to order
  const handleBackToOrder = useCallback(() => {
    setCurrentStep('order');
  }, []);

  // Handle coupon apply
  const handleApplyCoupon = useCallback(() => {
    const total = cartTotal + (delivery.shippingCost || 0);
    coupon.applyCoupon(total);
  }, [cartTotal, delivery.shippingCost, coupon]);

  const handleCardBrickError = useCallback((error) => {
    console.error('Erro no CardPayment Brick:', error);
    setPaymentError(extractMercadoPagoErrorMessage(error));
  }, []);

  // Process checkout
  const processCheckout = async (paymentPayload) => {
    if (!checkoutForm.validateForm(delivery.shippingMethod)) {
      // Scroll to first visible error so the user can see what needs to be filled
      setTimeout(() => {
        const firstError = document.querySelector('[class*="inputError"], [class*="errorText"], [class*="error"]');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      setPaymentError('Preencha todos os campos obrigatórios antes de continuar.');
      return;
    }
    setPaymentError('');

    setLoading(true);
    setPaymentError('');

    try {
      const resolvedPaymentMethod = resolveCheckoutPaymentMethod(paymentMethod, paymentPayload);
      const normalizedPaymentPayload = normalizePaymentPayload(paymentMethod, paymentPayload);
      const purchaseEventId = buildMetaEventId('Purchase');

      dispatchMetaPixelEvent('AddPaymentInfo', {
        currency: 'BRL',
        value: Number(cartTotal + (delivery.shippingCost || 0) - discountAmount),
        payment_type: resolvedPaymentMethod,
      }, buildMetaEventId('AddPaymentInfo'));

      if (normalizeString(paymentMethod) === 'card') {
        if (!mpPublicKey) {
          throw new Error('Pagamento com cartão indisponível: a chave pública do Mercado Pago não está configurada no frontend.');
        }

        if (!hasDirectCardPayload(normalizedPaymentPayload)) {
          throw new Error('Os dados do cartão não foram gerados corretamente pelo Mercado Pago. Recarregue a página e tente novamente.');
        }
      }

      const checkoutData = {
        ...checkoutForm.buildCheckoutPayload(
          delivery.shippingMethod,
          enableScheduling,
          scheduledDate,
          scheduledTimeSlot
        ),
        shipping_method: delivery.shippingMethod,
        delivery_method: delivery.shippingMethod,
        coupon_code: coupon.appliedCoupon ? coupon.appliedCoupon.code : '',
        payment_method: resolvedPaymentMethod,
        payment: normalizedPaymentPayload,
        meta: buildMetaPurchasePayload(purchaseEventId),
      };
      
      const response = await storeApi.checkout(checkoutData);

      if (response.payment_error) {
        let msg = response.payment_error;
        if (typeof msg === 'object') msg = JSON.stringify(msg);
        throw new Error(`Erro no pagamento: ${msg}`);
      }

      const payment = response.payment;
      const orderNumber = response.order_number;
      const accessToken = response.access_token;

      dispatchMetaPixelEvent('Purchase', {
        currency: 'BRL',
        value: Number(response.total_amount || response.total || 0),
        order_id: orderNumber || response.order_id || '',
        content_type: 'product',
        num_items: Number(cartItemCount || 0),
      }, purchaseEventId);

      // Update profile if needed
      if (checkoutForm.saveAddress) {
        const profilePayload = checkoutForm.buildProfileUpdatePayload(delivery.shippingMethod);
        if (Object.keys(profilePayload).length > 0) {
          try {
            await updateProfile(profilePayload);
          } catch {
            // Profile update failed - not critical
          }
        }
      }

      // Clear cart
      clearCart();

      // Save guest info for pre-population in future orders
      saveGuestInfo(checkoutForm.buildGuestInfoPayload());

      // Merge guest info into profile if authenticated and profile is missing fields
      if (isAuthenticated) {
        const mergePayload = buildMergePayload(profile || user);
        if (Object.keys(mergePayload).length > 0) {
          updateProfile(mergePayload).catch(() => { /* non-critical */ });
        }
      }

      // Store access token in sessionStorage to avoid exposing it in the URL.
      // Success/pending pages read from sessionStorage first, then fall back to
      // the order number (which is safe to expose).
      if (accessToken) {
        try { sessionStorage.setItem('ce_order_access_token', accessToken); } catch { /* ignore */ }
      }
      const orderParam = orderNumber ? `order=${orderNumber}` : '';

      if (payment) {
        const paymentStatus = payment.status;
        const paymentMethod = normalizeString(payment.payment_method || checkoutData.payment_method);
        const checkoutUrl = payment.checkout_url
          || response.payment_link
          || response.init_point
          || response.sandbox_init_point
          || payment.init_point
          || payment.sandbox_init_point;

        if (payment.requires_redirect && checkoutUrl) {
          if (!isSafePaymentUrl(checkoutUrl)) {
            setPaymentError('URL de pagamento inválida. Contate o suporte.');
            return;
          }
          window.location.href = checkoutUrl;
          return;
        }

        // Cash payment goes directly to success
        if (paymentMethod === 'cash') {
          router.push(`/sucesso?${orderParam}&method=cash`);
          return;
        }

        if (paymentStatus === 'approved') {
          router.push(`/sucesso?${orderParam}`);
          return;
        }

        if (paymentStatus === 'rejected') {
          const errorCode = payment.status_detail || '';
          router.push(`/erro?${orderParam}&error=${errorCode}`);
          return;
        }

        router.push(`/pendente?${orderParam}`);
        return;
      }

      // Fallback - use pix_ticket_url if available (Mercado Pago payment page)
      const paymentLink = response.pix_ticket_url || response.payment_link || response.init_point || response.sandbox_init_point;
      if (paymentLink) {
        if (!isSafePaymentUrl(paymentLink)) {
          setPaymentError('URL de pagamento inválida. Contate o suporte.');
          return;
        }
        window.location.href = paymentLink;
        return;
      }

      if (orderNumber) {
        router.push(`/pendente?${orderParam}`);
      }
    } catch (error) {
      setPaymentError(error.message || 'Erro ao processar pedido');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if cart is empty
  if (!hasItems) {
    return (
      <div className={styles.emptyCart}>
        <div className={styles.emptyCartContent}>
          <span className={styles.emptyCartIcon}>🛒</span>
          <h2>Sua sacola está vazia</h2>
          <p>Adicione itens antes de finalizar o pedido.</p>
          <Link href="/cardapio" className={styles.backButton}>
            Ver cardápio
          </Link>
        </div>
      </div>
    );
  }

  // Map step names to indices for CheckoutProgress
  const stepIndex = currentStep === 'order' ? 0 : 1;
  const completedSteps = currentStep === 'payment' ? [0] : [];

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.checkoutContainer}>
        {/* Header */}
        <div className={styles.checkoutHeader}>
          <Link href="/cardapio" className={styles.backLink}>
            ← Voltar ao cardápio
          </Link>
          <h1>Finalizar Pedido</h1>
          
          {/* Progress Steps - Using CheckoutProgress component */}
          <CheckoutProgress
            steps={['Pedido', 'Checkout']}
            currentStep={stepIndex}
            completedSteps={completedSteps}
          />
        </div>

        {/* Store closed banner */}
        {availability && !isStoreOpen && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#991b1b', fontSize: 14 }}>
            <strong>Loja fechada no momento.</strong>{' '}
            {availability.hours
              ? `Horário de hoje: ${availability.hours.open} – ${availability.hours.close}.`
              : 'Verifique o horário de funcionamento.'}
            {' '}Você pode fazer seu pedido mas ele será processado quando reabrirmos.
          </div>
        )}

        {/* Main Content */}
        <div className={styles.checkoutContent}>
          {currentStep === 'order' && (
            <OrderConfirmation
              cart={cart}
              combos={combos}
              cartTotal={cartTotal}
              shippingMethod={delivery.shippingMethod}
              onShippingMethodChange={handleShippingMethodChange}
              deliveryInfo={delivery.deliveryInfo}
              onSelectDeliveryAddress={handleSelectDeliveryAddress}
              confirmedAddress={confirmedAddress}
              onProceedToPayment={handleProceedToPayment}
            />
          )}

          {currentStep === 'payment' && (
            <PaymentStep
              formData={checkoutForm.formData}
              errors={checkoutForm.errors}
              existingFields={checkoutForm.existingFields}
              onFormChange={checkoutForm.handleChange}
              isIdentificationComplete={checkoutForm.isIdentificationComplete}
              onPhoneChange={checkoutForm.setPhoneValue}
              isAuthenticated={isAuthenticated}
              userName={profile?.first_name || user?.first_name || ''}
              onSignOut={signOut}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              coupon={coupon}
              onApplyCoupon={handleApplyCoupon}
              scheduling={{
                enabled: enableScheduling,
                date: scheduledDate,
                timeSlot: scheduledTimeSlot,
                setEnabled: setEnableScheduling,
                setDate: setScheduledDate,
                setTimeSlot: setScheduledTimeSlot
              }}
              cartTotal={cartTotal}
              shippingCost={delivery.shippingMethod === 'pickup' ? 0 : delivery.shippingCost}
              discount={discountAmount}
              onSubmit={processCheckout}
              onBack={handleBackToOrder}
              loading={loading}
              paymentError={paymentError}
              mpPublicKey={mpPublicKey}
              onCardError={handleCardBrickError}
            />
          )}
        </div>
      </div>

      {/* Location Modal */}
      <CheckoutSubtreeBoundary>
        <LocationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onConfirm={handleLocationConfirm}
          geolocation={geolocation}
          delivery={delivery}
          savedAddress={readLastAddress()?.address || null}
        />
      </CheckoutSubtreeBoundary>
    </div>
  );
};

export default CheckoutPage;
