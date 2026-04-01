import React, { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

const CartSidebar = () => {
  const {
    cart,
    combos,
    removeFromCart,
    removeComboFromCart,
    updateQuantity,
    updateComboQuantity,
    cartTotal,
    productTotal,
    comboTotal,
    hasItems,
    cartCount,
    isCartOpen,
    closeCart,
  } = useCart();

  useEffect(() => {
    if (!isCartOpen || typeof window === 'undefined') return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeCart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeCart, isCartOpen]);

  if (!isCartOpen) return null;

  const isEmpty = !hasItems;

  return (
    <>
      <div className="cart-overlay" onClick={closeCart} />

      <div className="cart-sidebar">
        <div className="cart-header">
          <div className="cart-header__copy">
            <h2>Sua sacola</h2>
            <p>{hasItems ? `${cartCount} item(ns) prontos para finalizar` : 'Escolha seus itens e finalize com poucos toques.'}</p>
          </div>
          <button onClick={closeCart} className="cart-close-btn" aria-label="Fechar">
            x
          </button>
        </div>

        <div className="cart-items">
          {isEmpty ? (
            <div className="cart-empty">
              <span className="cart-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M6 6h15l-1.5 9h-12zM6 6l-1.5-3h-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                  <circle cx="18" cy="20" r="1.5" fill="currentColor" />
                </svg>
              </span>
              <p>Sua sacola esta vazia.</p>
              <Link href="/cardapio" onClick={closeCart} className="btn-secondary">
                Ver cardapio
              </Link>
            </div>
          ) : (
            <>
              {cart.length > 0 && (
                <div className="cart-section">
                  <h3 className="cart-section-title">
                    <span>Itens</span> Produtos
                  </h3>
                  {cart.map((item) => (
                    <div key={`product-${item.id}`} className="cart-item">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="cart-item-image" />
                      )}
                      <div className="cart-item-details">
                        <h4 className="cart-item-name">{item.name}</h4>
                        <p className="cart-item-price">R$ {Number(item.price).toFixed(2)}</p>

                        <div className="cart-item-actions">
                          <div className="quantity-control">
                            <button onClick={() => updateQuantity(item.id, -1)} aria-label="Diminuir quantidade">
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} aria-label="Aumentar quantidade">
                              +
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="cart-item-remove">
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {productTotal > 0 && (
                    <div className="cart-section-subtotal">
                      <span>Subtotal dos produtos:</span>
                      <span>R$ {productTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {combos.length > 0 && (
                <div className="cart-section cart-section-combos">
                  <h3 className="cart-section-title">
                    <span>Combos</span> Selecoes
                  </h3>
                  {combos.map((item) => (
                    <div key={`combo-${item.cart_item_id || item.id}`} className={`cart-item cart-item-combo${item.isSalad ? ' cart-item-salad' : ''}`}>
                      {item.image && (
                        <img src={item.image} alt={item.name} className="cart-item-image" />
                      )}
                      {item.isSalad && !item.image && (
                        <span className="cart-item-salad-emoji" aria-hidden="true">SAL</span>
                      )}
                      <div className="cart-item-details">
                        <h4 className="cart-item-name">
                          <span className={item.isSalad ? 'salad-badge' : 'combo-badge'}>
                            {item.isSalad ? 'SALADA' : 'COMBO'}
                          </span>
                          {item.name}
                        </h4>
                        {item.isSalad && item.notes && (
                          <p className="cart-item-salad-notes">{item.notes}</p>
                        )}
                        <p className="cart-item-price">R$ {Number(item.price).toFixed(2)}</p>

                        <div className="cart-item-actions">
                          <div className="quantity-control">
                            <button onClick={() => updateComboQuantity(item.id, -1)} aria-label="Diminuir quantidade">
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateComboQuantity(item.id, 1)} aria-label="Aumentar quantidade">
                              +
                            </button>
                          </div>
                          <button onClick={() => removeComboFromCart(item.id)} className="cart-item-remove">
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {comboTotal > 0 && (
                    <div className="cart-section-subtotal">
                      <span>Subtotal dos combos:</span>
                      <span>R$ {comboTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {hasItems && (
          <div className="cart-footer">
            <p className="cart-footer__meta">Entrega, retirada e pagamento sao confirmados no checkout.</p>
            <div className="cart-total">
              <span>Total:</span>
              <span>R$ {cartTotal.toFixed(2)}</span>
            </div>
            <Link href="/checkout" onClick={closeCart} className="btn-primary cart-checkout-btn">
              Finalizar pedido
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
