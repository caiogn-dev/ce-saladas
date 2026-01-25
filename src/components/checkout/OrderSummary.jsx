/**
 * Order summary component
 */
import React from 'react';
import styles from '../../styles/Checkout.module.css';

const OrderSummary = ({
  cart,
  cartTotal,
  shippingCost,
  discount = 0,
  appliedCoupon = null
}) => {
  const subtotal = cartTotal;
  const shipping = shippingCost ?? 0;
  const total = Math.max(0, subtotal + shipping - discount);

  return (
    <div className={styles.orderSummary}>
      <h3 className={styles.summaryTitle}>Resumo do Pedido</h3>

      <div className={styles.cartItems}>
        {cart.map((item, index) => (
          <div key={item.id || index} className={styles.cartItem}>
            <div className={styles.itemInfo}>
              <h4 className={styles.itemName}>{item.name}</h4>
              <p className={styles.itemQty}>Qtd: {item.quantity}</p>
              {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                <p className={styles.itemOptions}>
                  {Object.entries(item.selectedOptions).map(([key, value]) => (
                    <span key={key}>{value}</span>
                  )).reduce((prev, curr) => [prev, ', ', curr])}
                </p>
              )}
            </div>
            <div className={styles.itemPrice}>
              R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summaryTotals}>
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>

        <div className={styles.summaryRow}>
          <span>Frete</span>
          <span>
            {shippingCost === null ? (
              'Calculando...'
            ) : shippingCost === 0 ? (
              <span className={styles.freeShipping}>Grátis</span>
            ) : (
              `R$ ${shipping.toFixed(2)}`
            )}
          </span>
        </div>

        {discount > 0 && (
          <div className={`${styles.summaryRow} ${styles.discountRow}`}>
            <span>
              Desconto
              {appliedCoupon && <span className={styles.couponTag}> ({appliedCoupon.code})</span>}
            </span>
            <span className={styles.discountValue}>-R$ {discount.toFixed(2)}</span>
          </div>
        )}

        <div className={`${styles.summaryRow} ${styles.totalRow}`}>
          <span>Total</span>
          <span className={styles.totalValue}>R$ {total.toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.securePayment}>
        <span className={styles.secureIcon}>🔒</span>
        Pagamento seguro via Mercado Pago
      </div>
    </div>
  );
};

export default OrderSummary;
