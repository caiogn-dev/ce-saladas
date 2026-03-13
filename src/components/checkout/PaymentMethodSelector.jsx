import React from 'react';
import { Banknote, CreditCard, QrCode } from 'lucide-react';
import styles from '../../styles/Checkout.module.css';

const methods = [
  {
    value: 'pix',
    icon: QrCode,
    name: 'PIX',
    description: 'Pagamento instantâneo',
  },
  {
    value: 'card',
    icon: CreditCard,
    name: 'Cartão',
    description: 'Crédito ou débito',
  },
  {
    value: 'cash',
    icon: Banknote,
    name: 'Dinheiro',
    description: 'Pagamento na entrega ou retirada',
  },
];

const PaymentMethodSelector = ({
  paymentMethod,
  onChange,
  disabled = false,
}) => (
  <div className={styles.paymentMethodSelector}>
    {methods.map((method) => {
      const Icon = method.icon;

      return (
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
              <span className={styles.paymentIcon} aria-hidden="true"><Icon size={18} /></span>
              <span className={styles.paymentName}>{method.name}</span>
            </div>
            <div className={styles.paymentDescription}>{method.description}</div>
          </div>
        </label>
      );
    })}
  </div>
);

export default PaymentMethodSelector;
