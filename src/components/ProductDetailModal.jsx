import React, { useMemo, useState, useEffect, useRef } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { buildMediaUrl } from '../utils/media';
import styles from './ProductDetailModal.module.css';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const getGalleryImages = (item) => {
  const rawImages = [
    item?.image_url,
    item?.image,
    item?.main_image_url,
    ...(Array.isArray(item?.images) ? item.images : []),
  ];

  return Array.from(
    new Set(
      rawImages
        .map((entry) => {
          if (!entry) return '';
          if (typeof entry === 'string') return buildMediaUrl(entry);
          if (typeof entry === 'object') {
            return buildMediaUrl(
              entry.url || entry.image || entry.src || entry.file || '',
            );
          }
          return '';
        })
        .filter(Boolean),
    ),
  );
};

const ProductDetailModal = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);

  // Keep last item visible during close animation
  const lastItemRef = useRef(item);
  if (item) lastItemRef.current = item;
  const displayItem = lastItemRef.current;

  const gallery = useMemo(
    () => (displayItem ? getGalleryImages(displayItem) : []),
    [displayItem],
  );

  // Reset quantity when a new item opens
  useEffect(() => {
    if (isOpen) setQuantity(1);
  }, [isOpen, item?.id]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Don't render until at least one item has been shown
  if (!isOpen && !displayItem) return null;

  const description = displayItem?.description || displayItem?.shortDescription;
  const isCombo = displayItem?.itemType === 'combo' || displayItem?.isCombo;
  const inStock = isCombo
    ? (displayItem?.stock_quantity ?? 1) > 0
    : Boolean(displayItem?.is_in_stock ?? ((displayItem?.stock_quantity ?? 0) > 0));

  const hasDiscount = displayItem?.original_price
    && Number(displayItem.original_price) > Number(displayItem.price);
  const savings = displayItem?.savings && Number(displayItem.savings) > 0
    ? Number(displayItem.savings)
    : 0;

  const tags = [
    ...(Array.isArray(displayItem?.tags) ? displayItem.tags.filter(Boolean).slice(0, 1) : []),
    displayItem?.categoryLabel || displayItem?.productTypeName,
    isCombo ? 'Combo' : null,
  ]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3);

  const handleAdd = () => {
    if (!inStock) return;
    for (let i = 0; i < quantity; i += 1) {
      onAddToCart?.(displayItem);
    }
  };

  const totalPrice = formatCurrency(Number(displayItem?.price || 0) * quantity);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.overlay}${isOpen ? ` ${styles.overlayOpen}` : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={displayItem?.name}
        className={`${styles.sheet}${isOpen ? ` ${styles.sheetOpen}` : ''}`}
      >
        {/* Hero image */}
        <div className={styles.hero}>
          {gallery[0] ? (
            <img src={gallery[0]} alt={displayItem?.name} className={styles.heroImg} />
          ) : (
            <div className={styles.heroFallback} aria-hidden="true" />
          )}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className={styles.body}>
          <div className={styles.bodyInner}>
            {tags.length > 0 && (
              <div className={styles.tagRow}>
                {tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}

            <h2 className={styles.name}>{displayItem?.name}</h2>

            <div className={styles.pricingRow}>
              {hasDiscount && (
                <span className={styles.originalPrice}>
                  {formatCurrency(displayItem.original_price)}
                </span>
              )}
              <span className={styles.price}>{formatCurrency(displayItem?.price)}</span>
              {savings > 0 && (
                <span className={styles.savings}>
                  Economize {formatCurrency(savings)}
                </span>
              )}
            </div>

            {description && (
              <p className={styles.description}>{description}</p>
            )}

            {isCombo
              && Array.isArray(displayItem?.comboItems)
              && displayItem.comboItems.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Conteúdo do combo</h3>
                <ul className={styles.list}>
                  {displayItem.comboItems.map((comboItem, index) => (
                    <li key={`${comboItem.product_name || index}-${index}`}>
                      <span>{comboItem.product_name || 'Item do combo'}</span>
                      <strong>×{comboItem.quantity || 1}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!inStock && (
              <div className={styles.outOfStock}>
                Produto indisponível no momento
              </div>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className={styles.footer}>
          <div className={styles.qty}>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || !inStock}
              aria-label="Remover um"
            >
              <Minus size={16} />
            </button>
            <span className={styles.qtyNum}>{quantity}</span>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={() => setQuantity((q) => q + 1)}
              disabled={!inStock}
              aria-label="Adicionar mais"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            type="button"
            className={`${styles.addBtn}${!inStock ? ` ${styles.addBtnDisabled}` : ''}`}
            onClick={handleAdd}
            disabled={!inStock}
          >
            {inStock ? `Adicionar · ${totalPrice}` : 'Indisponível'}
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductDetailModal;
