/**
 * Payment Step - Customer info and payment method selection
 */
import React, { useState } from 'react';
import { CardPayment } from '@mercadopago/sdk-react';
import styles from '../../styles/CheckoutModal.module.css';
import CustomerForm from './CustomerForm';
import PaymentMethodSelector from './PaymentMethodSelector';
import CouponInput from './CouponInput';
import SchedulingSection from './SchedulingSection';

const PaymentStep = ({
  formData,
  errors,
  existingFields,
  hasPreviousOrder,
  onFormChange,
  paymentMethod,
  onPaymentMethodChange,
  coupon,
  onApplyCoupon,
  scheduling,
  cartTotal,
  shippingCost,
  discount,
  onSubmit,
  onBack,
  loading,
  paymentError,
  mpPublicKey
}) => {
  const total = Math.max(0, cartTotal + (shippingCost || 0) - discount);

  return (
    <div className={styles.paymentStep}>
      {/* Back Button */}
      <button className={styles.backButton} onClick={onBack}>
        ← Voltar ao pedido
      </button>

      {/* Customer Info */}
      <div className={styles.stepSection}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>👤</span>
          Seus Dados
        </h2>
        <CustomerForm
          formData={formData}
          errors={errors}
          onChange={onFormChange}
          existingFields={existingFields}
          hasPreviousOrder={hasPreviousOrder}
          disabled={loading}
        />
      </div>

      {/* Scheduling */}
      <div className={styles.stepSection}>
        <SchedulingSection
          enableScheduling={scheduling.enabled}
          scheduledDate={scheduling.date}
          scheduledTimeSlot={scheduling.timeSlot}
          onEnableChange={scheduling.setEnabled}
          onDateChange={scheduling.setDate}
          onTimeSlotChange={scheduling.setTimeSlot}
          disabled={loading}
        />
      </div>

      {/* Coupon */}
      <div className={styles.stepSection}>
        <CouponInput
          couponCode={coupon.couponCode}
          couponError={coupon.couponError}
          appliedCoupon={coupon.appliedCoupon}
          loadingCoupon={coupon.loadingCoupon}
          onChange={coupon.handleCouponChange}
          onApply={onApplyCoupon}
          onRemove={coupon.removeCoupon}
          disabled={loading}
        />
      </div>

      {/* Payment Method */}
      <div className={styles.stepSection}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>💳</span>
          Forma de Pagamento
        </h2>
        <PaymentMethodSelector
          paymentMethod={paymentMethod}
          onChange={onPaymentMethodChange}
          disabled={loading}
        />

        {/* Card Payment Form */}
        {paymentMethod === 'card' && mpPublicKey && (
          <div className={styles.cardPaymentContainer}>
            <CardPayment
              initialization={{ amount: total }}
              onSubmit={onSubmit}
              onError={(error) => console.error('Card error:', error)}
            />
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className={styles.paymentSummary}>
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>R$ {cartTotal.toFixed(2)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Entrega</span>
          <span>
            {shippingCost === 0 ? (
              <span className={styles.freeText}>Grátis</span>
            ) : (
              `R$ ${(shippingCost || 0).toFixed(2)}`
            )}
          </span>
        </div>
        {discount > 0 && (
          <div className={`${styles.summaryRow} ${styles.discountRow}`}>
            <span>Desconto {coupon.appliedCoupon && `(${coupon.appliedCoupon.code})`}</span>
            <span>-R$ {discount.toFixed(2)}</span>
          </div>
        )}
        <div className={`${styles.summaryRow} ${styles.totalRow}`}>
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Error Message */}
      {paymentError && (
        <div className={styles.errorMessage}>
          {paymentError}
        </div>
      )}

      {/* Submit Button (for non-card payments) */}
      {paymentMethod !== 'card' && (
        <button
          className={styles.submitButton}
          onClick={() => onSubmit({ method: paymentMethod, type: paymentMethod })}
          disabled={loading}
        >
          {loading ? 'Processando...' : (
            paymentMethod === 'pix' ? 'GERAR PIX' :
            paymentMethod === 'cash' ? 'CONFIRMAR PEDIDO' :
            'FINALIZAR PEDIDO'
          )}
        </button>
      )}

      {/* Secure Payment Badge */}
      <div className={styles.securePayment}>
        <span>🔒</span>
        Pagamento seguro via Mercado Pago
      </div>
    </div>
  );
};

export default PaymentStep;
