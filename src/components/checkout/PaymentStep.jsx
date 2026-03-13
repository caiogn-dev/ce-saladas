import React from 'react';
import { ArrowLeft, CreditCard, ShieldCheck, UserRound } from 'lucide-react';
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
  onFormChange,
  isIdentificationComplete,
  onCompleteIdentification,
  onEditIdentification,
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
  mpPublicKey,
}) => {
  const total = Math.max(0, cartTotal + (shippingCost || 0) - discount);

  return (
    <div className={styles.paymentStep}>
      <button className={styles.backButton} onClick={onBack} type="button">
        <ArrowLeft size={16} />
        Voltar ao pedido
      </button>

      <div className={styles.stepSection}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><UserRound size={18} /></span>
          Seus dados
        </h2>
        <CustomerForm
          formData={formData}
          errors={errors}
          onChange={onFormChange}
          onCompleteIdentification={onCompleteIdentification}
          onEditIdentification={onEditIdentification}
          isIdentificationComplete={isIdentificationComplete}
          existingFields={existingFields}
          disabled={loading}
        />
      </div>

      {!isIdentificationComplete && (
        <div className={styles.paymentLockedHint}>
          Continue com e-mail e celular para liberar entrega, cupom e pagamento.
        </div>
      )}

      {isIdentificationComplete && (
        <>
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

          <div className={styles.stepSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}><CreditCard size={18} /></span>
              Forma de pagamento
            </h2>
            <PaymentMethodSelector
              paymentMethod={paymentMethod}
              onChange={onPaymentMethodChange}
              disabled={loading}
            />

            {paymentMethod === 'card' && mpPublicKey && (
              <div className={styles.cardPaymentContainer}>
                <CardPayment
                  initialization={{ amount: total }}
                  onSubmit={onSubmit}
                  onError={(error) => console.error('Erro no cartão:', error)}
                />
              </div>
            )}

            {paymentMethod === 'card' && !mpPublicKey && (
              <div className={styles.paymentLockedHint}>
                O pagamento com cartão abrirá a página segura do Mercado Pago.
              </div>
            )}
          </div>
        </>
      )}

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

      {paymentError && <div className={styles.errorMessage}>{paymentError}</div>}

      {isIdentificationComplete && (paymentMethod !== 'card' || !mpPublicKey) && (
        <button
          className={styles.submitButton}
          onClick={() => onSubmit({ method: paymentMethod, type: paymentMethod })}
          disabled={loading}
          type="button"
        >
          {loading ? 'Processando...' : (
            paymentMethod === 'pix' ? 'Gerar PIX' :
            paymentMethod === 'cash' ? 'Confirmar pedido' :
            'Ir para o pagamento'
          )}
        </button>
      )}

      <div className={styles.securePayment}>
        <ShieldCheck size={16} />
        Pagamento seguro via Mercado Pago
      </div>
    </div>
  );
};

export default PaymentStep;
