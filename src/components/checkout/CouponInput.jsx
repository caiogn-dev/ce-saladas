/**
 * Coupon input component
 *
 * Three visual states:
 *   collapsed  — shows "Tenho um cupom de desconto ›" toggle
 *   expanded   — shows the text input + Aplicar button
 *   applied    — shows the applied-coupon chip with remove button
 */
import React, { useEffect, useRef, useState } from 'react';
import styles from '../../styles/Checkout.module.css';

const CouponInput = ({
  couponCode,
  couponError,
  appliedCoupon,
  loadingCoupon,
  onChange,
  onApply,
  onRemove,
  disabled = false,
  placeholder = 'Digite o código',
}) => {
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  // Stay expanded if there's an error (user needs to see it)
  useEffect(() => {
    if (couponError) setExpanded(true);
  }, [couponError]);

  // Applied coupon chip
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

  // Collapsed toggle
  if (!expanded) {
    return (
      <button
        type="button"
        className={styles.couponToggle}
        onClick={() => setExpanded(true)}
        disabled={disabled}
      >
        <span className={styles.couponToggleIcon}>🏷️</span>
        Tenho um cupom de desconto
        <span className={styles.couponToggleArrow}>›</span>
      </button>
    );
  }

  // Expanded input
  return (
    <div className={styles.couponInput}>
      <div className={styles.couponInputHeader}>
        <label className={styles.label}>Cupom de desconto</label>
        <button
          type="button"
          className={styles.couponCollapseLink}
          onClick={() => setExpanded(false)}
          disabled={disabled}
        >
          Fechar
        </button>
      </div>
      <div className={styles.couponInputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={couponCode}
          onChange={onChange}
          onKeyDown={(e) => e.key === 'Enter' && couponCode.trim() && onApply()}
          placeholder={placeholder}
          className={`${styles.input} ${couponError ? styles.inputError : ''}`}
          disabled={disabled || loadingCoupon}
          autoComplete="off"
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
