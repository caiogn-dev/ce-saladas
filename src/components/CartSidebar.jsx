import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { buildMediaUrl } from '../utils/media';

const fmtMoney = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
    addToCart,
  } = useCart();

  const { products: storeProducts } = useStore();
  const [addedMolhos, setAddedMolhos] = useState(new Set());

  const molhosItems = useMemo(() => (storeProducts || []).filter((p) => {
    const text = [p.name, p.category_name, p.category_slug].join(' ').toLowerCase();
    return text.includes('molho');
  }), [storeProducts]);

  const cartHasMolho = useMemo(
    () => cart.some((item) => (item.name || '').toLowerCase().includes('molho')),
    [cart],
  );

  const showUpsellStrip = hasItems && !cartHasMolho && molhosItems.length > 0;

  const handleAddMolho = (product) => {
    if (addedMolhos.has(product.id)) return;
    addToCart(product);
    setAddedMolhos((prev) => new Set([...prev, product.id]));
  };

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
                          <ul className="cart-item-salad-notes">
                            {item.notes.split(' | ').map((part) => (
                              <li key={part}>{part}</li>
                            ))}
                          </ul>
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

        {showUpsellStrip && (
          <div className="cart-upsell">
            <p className="cart-upsell__label">Adicionar molho?</p>
            <div className="cart-upsell__row">
              {molhosItems.map((p) => {
                const done = addedMolhos.has(p.id);
                const imgSrc = p.main_image_url || p.main_image || p.image;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`cart-upsell__chip${done ? ' cart-upsell__chip--added' : ''}`}
                    onClick={() => handleAddMolho(p)}
                  >
                    {imgSrc ? (
                      <img
                        src={buildMediaUrl(imgSrc)}
                        alt={p.name}
                        className="cart-upsell__img"
                        width="34"
                        height="34"
                      />
                    ) : (
                      <div className="cart-upsell__img-fallback" />
                    )}
                    <div className="cart-upsell__info">
                      <span className="cart-upsell__name">{p.name}</span>
                      <span className="cart-upsell__price">{fmtMoney(p.price)}</span>
                    </div>
                    <span className={`cart-upsell__add${done ? ' cart-upsell__add--done' : ''}`} aria-hidden="true">
                      {done ? <Check size={12} strokeWidth={2.5} /> : <Plus size={12} strokeWidth={2.5} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
