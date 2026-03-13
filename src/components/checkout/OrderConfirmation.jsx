/**
 * Order Confirmation - Initial step showing cart items and delivery method selection
 */
import React from 'react';
import styles from '../../styles/CheckoutModal.module.css';

const OrderConfirmation = ({
  cart,
  cartTotal,
  shippingMethod,
  onShippingMethodChange,
  deliveryInfo,
  onSelectDeliveryAddress,
  confirmedAddress,
  onProceedToPayment,
}) => {
  const canProceed = shippingMethod === 'pickup' || (shippingMethod === 'delivery' && confirmedAddress);
  const shippingCost = shippingMethod === 'pickup' ? 0 : (deliveryInfo?.fee || 0);
  const total = cartTotal + shippingCost;

  return (
    <div className={styles.orderConfirmation}>
      <div className={styles.cartSection}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🛒</span>
          Seu pedido
        </h2>

        <div className={styles.cartItems}>
          {cart.map((item, index) => (
            <div key={item.id || index} className={styles.cartItem}>
              <div className={styles.itemImage}>
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className={styles.itemPlaceholder}>🥗</div>
                )}
              </div>
              <div className={styles.itemDetails}>
                <h4>{item.name}</h4>
                <p className={styles.itemQty}>Quantidade: {item.quantity}</p>
                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                  <p className={styles.itemOptions}>
                    {Object.values(item.selectedOptions).join(', ')}
                  </p>
                )}
              </div>
              <div className={styles.itemPrice}>
                R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.cartSubtotal}>
          <span>Subtotal</span>
          <span>R$ {cartTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.deliverySection}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🚚</span>
          Como deseja receber?
        </h2>

        <div className={styles.deliveryOptions}>
          <div
            className={`${styles.deliveryOption} ${shippingMethod === 'delivery' ? styles.selected : ''}`}
            onClick={() => onShippingMethodChange('delivery')}
          >
            <div className={styles.optionRadio}>
              <input
                type="radio"
                checked={shippingMethod === 'delivery'}
                onChange={() => onShippingMethodChange('delivery')}
              />
            </div>
            <div className={styles.optionIcon}>🏍️</div>
            <div className={styles.optionContent}>
              <h3>Entrega</h3>
              <p>Receba no conforto da sua casa</p>
              {shippingMethod === 'delivery' && deliveryInfo && (
                <div className={styles.deliveryFee}>
                  Taxa: {deliveryInfo.fee === 0 ? (
                    <span className={styles.freeDelivery}>Gratis</span>
                  ) : (
                    <span>R$ {deliveryInfo.fee.toFixed(2)}</span>
                  )}
                  {deliveryInfo.zone_name && (
                    <span className={styles.zoneBadge}>{deliveryInfo.zone_name}</span>
                  )}
                </div>
              )}
            </div>
            {shippingMethod === 'delivery' && (
              <div className={styles.optionAction}>
                {confirmedAddress ? (
                  <button
                    className={styles.changeAddressBtn}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectDeliveryAddress();
                    }}
                  >
                    Alterar
                  </button>
                ) : (
                  <button
                    className={styles.selectAddressBtn}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectDeliveryAddress();
                    }}
                  >
                    Selecionar endereco
                  </button>
                )}
              </div>
            )}
          </div>

          {shippingMethod === 'delivery' && confirmedAddress && (
            <div className={styles.confirmedAddress}>
              <div className={styles.addressPin}>📍</div>
              <div className={styles.addressText}>
                <p className={styles.addressStreet}>
                  {confirmedAddress.street}
                  {confirmedAddress.number && `, ${confirmedAddress.number}`}
                </p>
                {confirmedAddress.complement && (
                  <p className={styles.addressComplement}>
                    Complemento: {confirmedAddress.complement}
                  </p>
                )}
                <p className={styles.addressCity}>
                  {confirmedAddress.neighborhood && `${confirmedAddress.neighborhood}, `}
                  {confirmedAddress.city} - {confirmedAddress.state}
                </p>
              </div>
            </div>
          )}

          <div
            className={`${styles.deliveryOption} ${shippingMethod === 'pickup' ? styles.selected : ''}`}
            onClick={() => onShippingMethodChange('pickup')}
          >
            <div className={styles.optionRadio}>
              <input
                type="radio"
                checked={shippingMethod === 'pickup'}
                onChange={() => onShippingMethodChange('pickup')}
              />
            </div>
            <div className={styles.optionIcon}>🏪</div>
            <div className={styles.optionContent}>
              <h3>Retirar no local</h3>
              <p>Q. 112 Sul Rua SR 1, conj. 06 lote 04</p>
              <div className={styles.pickupBenefit}>
                <span className={styles.freeTag}>Sem taxa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.orderTotal}>
        <div className={styles.totalRow}>
          <span>Subtotal</span>
          <span>R$ {cartTotal.toFixed(2)}</span>
        </div>
        <div className={styles.totalRow}>
          <span>Entrega</span>
          <span>
            {shippingMethod === 'pickup' ? (
              <span className={styles.freeText}>Gratis</span>
            ) : deliveryInfo ? (
              deliveryInfo.fee === 0 ? (
                <span className={styles.freeText}>Gratis</span>
              ) : (
                `R$ ${deliveryInfo.fee.toFixed(2)}`
              )
            ) : (
              <span className={styles.pendingText}>Selecione o endereco</span>
            )}
          </span>
        </div>
        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
      </div>

      <button
        className={styles.proceedButton}
        onClick={onProceedToPayment}
        disabled={!canProceed}
      >
        {canProceed ? 'Continuar para identificacao' : 'Selecione o endereco de entrega'}
      </button>
    </div>
  );
};

export default OrderConfirmation;
