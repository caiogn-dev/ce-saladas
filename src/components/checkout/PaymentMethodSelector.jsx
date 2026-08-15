import React from 'react';
import { Banknote, CreditCard, QrCode } from 'lucide-react';
import styles from '../../styles/Checkout.module.css';

/**
 * "Dinheiro" respondia COM O QUÊ o cliente paga; a dúvida dele no checkout é
 * ONDE e QUANDO. E a tela já sabe a resposta — ele acabou de escolher entrega
 * ou retirada —, então mandá-lo ler "na entrega ou retirada" e descobrir qual
 * é o caso dele é devolver uma pergunta que já estava respondida.
 *
 * Sem método de envio definido o rótulo fica neutro: prometer "na entrega"
 * para quem ainda não escolheu seria adivinhação.
 */
const rotuloPresencial = (shippingMethod) => {
  if (shippingMethod === 'delivery') {
    return { name: 'Pagar na entrega', description: 'Você paga quando o pedido chegar' };
  }
  if (shippingMethod === 'pickup') {
    return { name: 'Pagar na retirada', description: 'Você paga quando buscar o pedido na loja' };
  }
  return { name: 'Pagamento presencial', description: 'Você paga no encontro, não agora' };
};

const buildMethods = (shippingMethod) => [
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
    // O `value` continua 'cash': mudar o texto não pode virar mudança de
    // contrato com o backend.
    ...rotuloPresencial(shippingMethod),
  },
];


const PaymentMethodSelector = ({
  paymentMethod,
  onChange,
  disabled = false,
  shippingMethod = null,
}) => (
  <div className={styles.paymentMethodSelector}>
    {buildMethods(shippingMethod).map((method) => {
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
