import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { buildMediaUrl } from '../utils/media';
import { useCart } from '../context/CartContext';
import styles from './UpsellModal.module.css';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(value || 0),
  );

const stripMolho = (name) => name.replace(/^molho\s+/i, '').trim();

const UpsellItem = ({ item, onAdd, resetKey }) => {
  const [added, setAdded] = useState(false);
  const inStock = (item.stock_quantity ?? 1) > 0;
  const displayName = stripMolho(item.name);

  // Reset added state when the modal reopens (resetKey changes)
  useEffect(() => { setAdded(false); }, [resetKey]);

  const imgSrc = item.image_url ? buildMediaUrl(item.image_url) : null;

  return (
    <div className={styles.itemCard}>
      <div className={styles.itemImgWrap}>
        {imgSrc ? (
          <img src={imgSrc} alt={displayName} className={styles.itemImg} width="80" height="80" />
        ) : (
          <div className={styles.itemImgFallback} aria-hidden="true">
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>🥗</span>
          </div>
        )}
      </div>
      <span className={styles.itemName}>{displayName}</span>
      <span className={styles.itemPrice}>{formatCurrency(item.price)}</span>
      <button
        type="button"
        className={`${styles.itemAddBtn}${added ? ` ${styles.itemAddBtnDone}` : ''}${!inStock ? ` ${styles.itemAddBtnDisabled}` : ''}`}
        onClick={() => {
          if (!inStock || added) return;
          onAdd(item);
          setAdded(true);
        }}
        disabled={!inStock}
        aria-label={added ? 'Adicionado' : `Adicionar ${displayName}`}
      >
        {added ? <Check size={13} strokeWidth={2.5} /> : <Plus size={13} strokeWidth={2.5} />}
        <span>{added ? 'Adicionado' : 'Adicionar'}</span>
      </button>
    </div>
  );
};

const UpsellModal = ({ isOpen, onClose, onViewCart, sauces = [], drinks = [] }) => {
  const { addToCart, cartTotal } = useCart();
  // Increments each time the modal opens — used to reset UpsellItem added states
  const openCountRef = useRef(0);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      openCountRef.current += 1;
      setResetKey(openCountRef.current);
    }
  }, [isOpen]);

  // Keep rendered during close animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  if (!mounted) return null;

  const hasSauces = sauces.length > 0;
  const hasDrinks = drinks.length > 0;
  const hasSuggestions = hasSauces || hasDrinks;

  return (
    <>
      <div
        className={`${styles.overlay}${isOpen ? ` ${styles.overlayOpen}` : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Adicionar ao pedido"
        className={`${styles.sheet}${isOpen ? ` ${styles.sheetOpen}` : ''}`}
      >
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.successBadge} aria-hidden="true">
            <Check size={14} strokeWidth={2.5} />
          </span>
          <div className={styles.headerText}>
            <h2 className={styles.title}>Adicionado à sacola!</h2>
            {hasSuggestions && (
              <p className={styles.subtitle}>Quer complementar com um molho?</p>
            )}
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {hasSauces && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Adicionar + 1 molho?</h3>
              <div className={styles.itemsRow}>
                {sauces.map((item) => (
                  <UpsellItem
                    key={item.id}
                    item={item}
                    onAdd={addToCart}
                    resetKey={resetKey}
                  />
                ))}
              </div>
            </section>
          )}

          {hasDrinks && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Bebidas</h3>
              <div className={styles.itemsRow}>
                {drinks.map((item) => (
                  <UpsellItem
                    key={item.id}
                    item={item}
                    onAdd={addToCart}
                    resetKey={resetKey}
                  />
                ))}
              </div>
            </section>
          )}

          {!hasSuggestions && (
            <p className={styles.empty}>Sem sugestões no momento.</p>
          )}
        </div>

        {/* Footer CTA */}
        <div className={styles.footer}>
          <button type="button" className={styles.viewCartBtn} onClick={onViewCart}>
            Ver sacola
            <span className={styles.viewCartTotal}>· {formatCurrency(cartTotal)}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default UpsellModal;
