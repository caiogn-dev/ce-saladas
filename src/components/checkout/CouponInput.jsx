/**
 * Coupon input component
 */
import React from 'react';
import styles from '../../styles/Checkout.module.css';

const CouponInput = ({
  couponCode,
  couponError,
  appliedCoupon,
  loadingCoupon,
  onChange,
  onApply,
  onRemove,
  disabled = false
}) => {
  if (appliedCoupon) {
    return (
      <div className={styles.appliedCoupon}>
        <div className={styles.couponInfo}>
          <span className={styles.couponIcon}>🎟️</span>
          <div className={styles.couponDetails}>
            <span className={styles.couponCode}>{appliedCoupon.code}</span>
            {appliedCoupon.description && (
              <span className={styles.couponDescription}>{appliedCoupon.description}</span>
            )}
            <span className={styles.couponDiscount}>
              {appliedCoupon.discount_type === 'percentage'
                ? `-${appliedCoupon.discount_value}%`
                : `-R$ ${appliedCoupon.discount_amount?.toFixed(2) || appliedCoupon.discount_value?.toFixed(2)}`}
            </span>
          </div>
        </div>
        <button
          type="button"
          className={styles.removeCouponButton}
          onClick={onRemove}
          disabled={disabled}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className={styles.couponInput}>
      <label className={styles.label}>Cupom de desconto</label>
      <div className={styles.couponInputWrapper}>
        <input
          type="text"
          value={couponCode}
          onChange={onChange}
          placeholder="Digite o código"
          className={`${styles.input} ${couponError ? styles.inputError : ''}`}
          disabled={disabled || loadingCoupon}
        />
        <button
          type="button"
          className={styles.applyCouponButton}
          onClick={onApply}
          disabled={disabled || loadingCoupon || !couponCode.trim()}
        >
          {loadingCoupon ? '...' : 'Aplicar'}
        </button>
      </div>
      {couponError && <span className={styles.errorText}>{couponError}</span>}
    </div>
  );
};

export default CouponInput;
