/**
 * Payment method selector component
 */
import React from 'react';
import styles from '../../styles/Checkout.module.css';

const PaymentMethodSelector = ({
  paymentMethod,
  onChange,
  disabled = false
}) => {
  const methods = [
    {
      value: 'pix',
      icon: '💠',
      name: 'PIX',
      description: 'Pagamento instantâneo'
    },
    {
      value: 'card',
      icon: '💳',
      name: 'Cartão',
      description: 'Crédito ou débito'
    },
    {
      value: 'cash',
      icon: '💵',
      name: 'Dinheiro',
      description: 'Pague na entrega/retirada'
    }
  ];

  return (
    <div className={styles.paymentMethodSelector}>
      {methods.map((method) => (
        <label key={method.value} className={styles.paymentOption}>
          <input
            type="radio"
            name="paymentMethod"
            value={method.value}
            checked={paymentMethod === method.value}
            onChange={() => onChange(method.value)}
            disabled={disabled}
          />
          <div className={styles.paymentContent}>
            <div className={styles.paymentHeader}>
              <span className={styles.paymentIcon}>{method.icon}</span>
              <span className={styles.paymentName}>{method.name}</span>
            </div>
            <div className={styles.paymentDescription}>
              {method.description}
            </div>
          </div>
        </label>
      ))}
    </div>
  );
};

export default PaymentMethodSelector;
