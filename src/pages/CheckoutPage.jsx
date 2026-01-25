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
import * as storeApi from '../services/storeApi';
import styles from '../styles/CheckoutFlow.module.css';

// Import modular components
import {
  LocationModal,
  OrderConfirmation,
  PaymentStep,
  CheckoutProgress,
  useCheckoutForm,
  useGeolocation,
  useDelivery,
  useCoupon,
  formatCEP
} from '../components/checkout';

const CheckoutPage = () => {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const { updateProfile } = useAuth();
  const mpPublicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;

  // Custom hooks
  const checkoutForm = useCheckoutForm();
  const geolocation = useGeolocation();
  const delivery = useDelivery();
  const coupon = useCoupon();

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

  // Initialize Mercado Pago
  useEffect(() => {
    if (mpPublicKey) {
      initMercadoPago(mpPublicKey, { locale: 'pt-BR' });
    }
  }, [mpPublicKey]);

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
  const handleLocationConfirm = useCallback((locationData) => {
    setConfirmedAddress(locationData.address);
    checkoutForm.setAddressFromGeo(locationData.address);
    
    if (locationData.deliveryInfo) {
      delivery.setDeliveryInfo(locationData.deliveryInfo);
      delivery.setShippingCost(locationData.deliveryInfo.fee);
    }
    
    setShowLocationModal(false);
  }, [checkoutForm, delivery]);

  // Handle proceed to payment
  const handleProceedToPayment = useCallback(() => {
    setCurrentStep('payment');
  }, []);

  // Handle back to order
  const handleBackToOrder = useCallback(() => {
    setCurrentStep('order');
  }, []);

  // Handle coupon apply
  const handleApplyCoupon = useCallback(() => {
    const total = cartTotal + (delivery.shippingCost || 0);
    coupon.applyCoupon(total);
  }, [cartTotal, delivery.shippingCost, coupon]);

  // Calculate discount
  const discountAmount = coupon.calculateDiscount(cartTotal, delivery.shippingCost || 0);

  // Process checkout
  const processCheckout = async (paymentPayload) => {
    if (!checkoutForm.validateForm(delivery.shippingMethod)) {
      return;
    }

    setLoading(true);
    setPaymentError('');

    try {
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
        payment_method: paymentPayload.method || paymentPayload.type || 'pix',
        payment: paymentPayload
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

      // Cache payment data with access token
      if (orderNumber) {
        try {
          sessionStorage.setItem(
            `mp_payment_${orderNumber}`,
            JSON.stringify({ 
              ...payment, 
              order_number: orderNumber,
              access_token: accessToken,
              total_amount: response.total_amount
            })
          );
        } catch {
          // Storage not available
        }
      }

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

      // Navigate based on payment status - use access_token for secure access
      const tokenParam = accessToken ? `token=${accessToken}` : `order=${orderNumber}`;
      
      if (payment) {
        const paymentStatus = payment.status;
        const paymentMethod = payment.payment_method || checkoutData.payment_method;

        // Cash payment goes directly to success
        if (paymentMethod === 'cash') {
          router.push(`/sucesso?${tokenParam}&method=cash`);
          return;
        }

        if (paymentStatus === 'approved') {
          router.push(`/sucesso?${tokenParam}`);
          return;
        }

        if (paymentStatus === 'rejected') {
          const errorCode = payment.status_detail || '';
          router.push(`/erro?${tokenParam}&error=${errorCode}`);
          return;
        }

        router.push(`/pendente?${tokenParam}`);
        return;
      }

      // Fallback - use pix_ticket_url if available (Mercado Pago payment page)
      const paymentLink = response.pix_ticket_url || response.payment_link || response.init_point || response.sandbox_init_point;
      if (paymentLink) {
        window.location.href = paymentLink;
        return;
      }

      if (orderNumber) {
        router.push(`/pendente?${tokenParam}`);
      }
    } catch (error) {
      setPaymentError(error.message || 'Erro ao processar pedido');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if cart is empty
  if (cart.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <div className={styles.emptyCartContent}>
          <span className={styles.emptyCartIcon}>🛒</span>
          <h2>Seu carrinho está vazio</h2>
          <p>Adicione produtos antes de finalizar o pedido.</p>
          <Link href="/cardapio" className={styles.backButton}>
            Ver Cardápio
          </Link>
        </div>
      </div>
    );
  }

  // Map step names to indices for CheckoutProgress
  const stepIndex = useMemo(() => {
    return currentStep === 'order' ? 0 : 1;
  }, [currentStep]);

  const completedSteps = useMemo(() => {
    if (currentStep === 'payment') return [0];
    return [];
  }, [currentStep]);

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.checkoutContainer}>
        {/* Header */}
        <div className={styles.checkoutHeader}>
          <Link href="/cardapio" className={styles.backLink}>
            ← Voltar ao Cardápio
          </Link>
          <h1>Finalizar Pedido</h1>
          
          {/* Progress Steps - Using CheckoutProgress component */}
          <CheckoutProgress
            steps={['Pedido', 'Pagamento']}
            currentStep={stepIndex}
            completedSteps={completedSteps}
          />
        </div>

        {/* Main Content */}
        <div className={styles.checkoutContent}>
          {currentStep === 'order' && (
            <OrderConfirmation
              cart={cart}
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
              hasPreviousOrder={checkoutForm.hasPreviousOrder}
              onFormChange={checkoutForm.handleChange}
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
            />
          )}
        </div>
      </div>

      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onConfirm={handleLocationConfirm}
        geolocation={geolocation}
        delivery={delivery}
      />
    </div>
  );
};

export default CheckoutPage;
