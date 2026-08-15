import React from 'react';
import { MapPinned, ShoppingBag, Store } from 'lucide-react';
import styles from '../../styles/Checkout.module.css';
import { formatMoney, rotuloDoFrete } from './utils';

const ShippingMethodSelector = ({
  shippingMethod,
  onChange,
  deliveryInfo,
  loadingDelivery,
  disabled = false,
}) => {
  // A classificação vem de `estadoDoFrete` (fonte única); aqui só a palavra
  // do pendente muda — no checkout a cotação está a caminho.
  const formatFee = (info) => rotuloDoFrete(info, { pendente: 'Calculando...' });

  return (
    <div className={styles.shippingMethodSelector}>
      <label className={styles.methodOption}>
        <input
          type="radio"
          name="shippingMethod"
          value="delivery"
          checked={shippingMethod === 'delivery'}
          onChange={() => onChange('delivery')}
          disabled={disabled}
        />
        <div className={styles.methodContent}>
          <div className={styles.methodHeader}>
            <span className={styles.methodIcon} aria-hidden="true"><ShoppingBag size={18} /></span>
            <span className={styles.methodName}>Entrega</span>
          </div>
          <div className={styles.methodDetails}>
            {loadingDelivery ? (
              <span className={styles.loadingText}>Calculando frete...</span>
            ) : deliveryInfo ? (
              <>
                <span className={styles.methodPrice}>{formatFee(deliveryInfo.fee)}</span>
                {deliveryInfo.zone_name && <span className={styles.methodZone}> - {deliveryInfo.zone_name}</span>}
                {deliveryInfo.estimated_days > 0 && (
                  <span className={styles.methodDays}> ({deliveryInfo.estimated_days} dias)</span>
                )}
              </>
            ) : (
              <span className={styles.methodHint}>Informe o endereço para calcular.</span>
            )}
          </div>
        </div>
      </label>

      <label className={styles.methodOption}>
        <input
          type="radio"
          name="shippingMethod"
          value="pickup"
          checked={shippingMethod === 'pickup'}
          onChange={() => onChange('pickup')}
          disabled={disabled}
        />
        <div className={styles.methodContent}>
          <div className={styles.methodHeader}>
            <span className={styles.methodIcon} aria-hidden="true"><Store size={18} /></span>
            <span className={styles.methodName}>Retirada</span>
          </div>
          <div className={styles.methodDetails}>
            <span className={styles.methodPrice}>Sem frete</span>
            <span className={styles.methodHint}> na loja</span>
          </div>
        </div>
      </label>
    </div>
  );
};

export default ShippingMethodSelector;
