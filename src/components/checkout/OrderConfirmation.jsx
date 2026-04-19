import React from 'react';
import { MapPinned, ShoppingCart, Store } from 'lucide-react';
import styles from '../../styles/CheckoutModal.module.css';
import { formatMoney, isZeroAmount, toFiniteNumber } from './utils';

const OrderConfirmation = ({
  cart,
  combos = [],
  cartTotal,
  shippingMethod,
  onShippingMethodChange,
  deliveryInfo,
  onSelectDeliveryAddress,
  confirmedAddress,
  onProceedToPayment,
}) => {
  const hasValidDeliverySelection = (
    shippingMethod === 'delivery'
    && confirmedAddress
    && deliveryInfo
    && deliveryInfo.is_valid !== false
  );
  const canProceed = shippingMethod === 'pickup' || hasValidDeliverySelection;
  const numericCartTotal = toFiniteNumber(cartTotal, 0);
  const shippingCost = shippingMethod === 'pickup' ? 0 : toFiniteNumber(deliveryInfo?.fee, 0);
  const total = numericCartTotal + shippingCost;

  return (
    <div className={styles.orderConfirmation}>
      <div className={styles.cartSection}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><ShoppingCart size={18} /></span>
          Seu pedido
        </h2>

        <div className={styles.cartItems}>
          {cart.map((item, index) => (
            <div key={item.id || index} className={styles.cartItem}>
              <div className={styles.itemImage}>
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className={styles.itemPlaceholder}>Item</div>
                )}
              </div>
              <div className={styles.itemDetails}>
                <h4>{item.name}</h4>
                <p className={styles.itemQty}>Quantidade: {item.quantity}</p>
                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                  <p className={styles.itemOptions}>{Object.values(item.selectedOptions).join(', ')}</p>
                )}
              </div>
              <div className={styles.itemPrice}>R$ {formatMoney(toFiniteNumber(item.price, 0) * toFiniteNumber(item.quantity, 1))}</div>
            </div>
          ))}
          {combos.map((item, index) => (
            <div key={item.cart_item_id || item.id || index} className={styles.cartItem}>
              <div className={styles.itemImage}>
                {item.isSalad ? (
                  <div className={styles.itemPlaceholder}>🥗</div>
                ) : item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className={styles.itemPlaceholder}>Combo</div>
                )}
              </div>
              <div className={styles.itemDetails}>
                <h4>{item.name}</h4>
                <p className={styles.itemQty}>Quantidade: {item.quantity}</p>
                {item.notes && <p className={styles.itemOptions}>{item.notes}</p>}
              </div>
              <div className={styles.itemPrice}>R$ {formatMoney(toFiniteNumber(item.price, 0) * toFiniteNumber(item.quantity, 1))}</div>
            </div>
          ))}
        </div>

        <div className={styles.cartSubtotal}>
          <span>Subtotal</span>
          <span>R$ {formatMoney(numericCartTotal)}</span>
        </div>
      </div>

      <div className={styles.deliverySection}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><MapPinned size={18} /></span>
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
            <div className={styles.optionIcon}><MapPinned size={24} /></div>
            <div className={styles.optionContent}>
              <h3>Entrega</h3>
              <p>Receba no conforto da sua casa.</p>
              {shippingMethod === 'delivery' && deliveryInfo && (
                <div className={styles.deliveryFee}>
                  Taxa:{' '}
                  {isZeroAmount(deliveryInfo.fee) ? (
                    <span className={styles.freeDelivery}>Grátis</span>
                  ) : (
                    <span>R$ {formatMoney(deliveryInfo.fee)}</span>
                  )}
                  {deliveryInfo.zone_name && <span className={styles.zoneBadge}>{deliveryInfo.zone_name}</span>}
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
                    type="button"
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
                    type="button"
                  >
                    Selecionar endereço
                  </button>
                )}
              </div>
            )}
          </div>

          {shippingMethod === 'delivery' && confirmedAddress && (
            <div className={styles.confirmedAddress}>
              <div className={styles.addressPin}><MapPinned size={20} /></div>
              <div className={styles.addressText}>
                <p className={styles.addressStreet}>
                  {confirmedAddress.street}
                  {confirmedAddress.number && `, ${confirmedAddress.number}`}
                </p>
                {confirmedAddress.complement && (
                  <p className={styles.addressComplement}>Complemento: {confirmedAddress.complement}</p>
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
            <div className={styles.optionIcon}><Store size={24} /></div>
            <div className={styles.optionContent}>
              <h3>Retirar no local</h3>
              <p>Q. 112 Sul, Rua SR 1, conjunto 06, lote 04.</p>
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
          <span>R$ {formatMoney(numericCartTotal)}</span>
        </div>
        <div className={styles.totalRow}>
          <span>Entrega</span>
          <span>
            {shippingMethod === 'pickup' ? (
              <span className={styles.freeText}>Grátis</span>
            ) : deliveryInfo ? (
              isZeroAmount(deliveryInfo.fee) ? (
                <span className={styles.freeText}>Grátis</span>
              ) : (
                `R$ ${formatMoney(deliveryInfo.fee)}`
              )
            ) : (
              <span className={styles.pendingText}>Selecione o endereço</span>
            )}
          </span>
        </div>
        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
          <span>Total</span>
          <span>R$ {formatMoney(total)}</span>
        </div>
      </div>

      <button className={styles.proceedButton} onClick={onProceedToPayment} disabled={!canProceed} type="button">
        {canProceed ? 'Continuar para identificação' : 'Selecione o endereço de entrega'}
      </button>
    </div>
  );
};

export default OrderConfirmation;
