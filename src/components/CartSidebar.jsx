import React from 'react';
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
    isCartOpen, 
    toggleCart 
  } = useCart();

  if (!isCartOpen) return null;

  const isEmpty = !hasItems;

  return (
    <>
      <div className="cart-overlay" onClick={toggleCart} />

      <div className="cart-sidebar">
        <div className="cart-header">
          <h2>Seu Pedido</h2>
          <button onClick={toggleCart} className="cart-close-btn" aria-label="Fechar">
            ✕
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
              <p>Seu carrinho está vazio.</p>
              <button onClick={toggleCart} className="btn-secondary">
                Ver cardápio
              </button>
            </div>
          ) : (
            <>
              {/* Products Section */}
              {cart.length > 0 && (
                <div className="cart-section">
                  <h3 className="cart-section-title">
                    <span>🍝</span> Produtos
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
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              aria-label="Diminuir quantidade"
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              aria-label="Aumentar quantidade"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="cart-item-remove"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {productTotal > 0 && (
                    <div className="cart-section-subtotal">
                      <span>Subtotal produtos:</span>
                      <span>R$ {productTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Combos Section */}
              {combos.length > 0 && (
                <div className="cart-section cart-section-combos">
                  <h3 className="cart-section-title">
                    <span>🎁</span> Combos
                  </h3>
                  {combos.map((item) => (
                    <div key={`combo-${item.id}`} className="cart-item cart-item-combo">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="cart-item-image" />
                      )}
                      <div className="cart-item-details">
                        <h4 className="cart-item-name">
                          <span className="combo-badge">COMBO</span>
                          {item.name}
                        </h4>
                        <p className="cart-item-price">R$ {Number(item.price).toFixed(2)}</p>

                        <div className="cart-item-actions">
                          <div className="quantity-control">
                            <button
                              onClick={() => updateComboQuantity(item.id, -1)}
                              aria-label="Diminuir quantidade"
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => updateComboQuantity(item.id, 1)}
                              aria-label="Aumentar quantidade"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeComboFromCart(item.id)}
                            className="cart-item-remove"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {comboTotal > 0 && (
                    <div className="cart-section-subtotal">
                      <span>Subtotal combos:</span>
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
            <div className="cart-total">
              <span>Total:</span>
              <span>R$ {cartTotal.toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={toggleCart}
              className="btn-primary cart-checkout-btn"
            >
              FINALIZAR PEDIDO
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
