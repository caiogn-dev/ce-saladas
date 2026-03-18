import React, { useState } from 'react';
import styles from './MenuProductRow.module.css';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatMoney = (value) => currencyFormatter.format(Number(value || 0));

const MenuProductRow = ({
  product,
  onAddToCart,
  onOpenDetails,
  favoriteButton,
}) => {
  const [imageError, setImageError] = useState(false);

  const imageSrc = product.image_url || product.image || product.main_image_url;
  const inStock = (product.is_in_stock ?? true) || (product.stock_quantity ?? 1) > 0;
  const price = formatMoney(product.price);
  const hasDiscount = product.original_price && Number(product.original_price) > Number(product.price);
  const originalPrice = hasDiscount ? formatMoney(product.original_price) : null;
  const description = product.shortDescription || product.description;

  const handleRowClick = () => onOpenDetails?.(product);
  const handleAdd = (e) => {
    e.stopPropagation();
    if (inStock) onAddToCart?.(product);
  };

  return (
    <article
      className={`${styles.row} ${!inStock ? styles.unavailable : ''}`}
      onClick={handleRowClick}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.name}>{product.name}</h3>
          {product.isCombo && (
            <span className={styles.comboTag}>Combo</span>
          )}
        </div>

        {description && (
          <p className={styles.description}>{description}</p>
        )}

        <div className={styles.footer}>
          <div className={styles.pricing}>
            {originalPrice && (
              <span className={styles.originalPrice}>{originalPrice}</span>
            )}
            <span className={styles.price}>{price}</span>
            {hasDiscount && (
              <span className={styles.discount}>
                -{Math.round((1 - Number(product.price) / Number(product.original_price)) * 100)}%
              </span>
            )}
          </div>

          <button
            type="button"
            className={`${styles.addBtn} ${!inStock ? styles.addBtnDisabled : ''}`}
            onClick={handleAdd}
            disabled={!inStock}
            aria-label={inStock ? `Adicionar ${product.name}` : 'Produto indisponível'}
          >
            {inStock ? '+ Adicionar' : 'Esgotado'}
          </button>
        </div>
      </div>

      <div className={styles.imageWrapper}>
        {!imageError && imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className={styles.image}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.imageFallback}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="26" height="26">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <circle cx="9" cy="9" r="1" fill="currentColor" />
              <circle cx="15" cy="9" r="1" fill="currentColor" />
            </svg>
          </div>
        )}
        {!inStock && <div className={styles.outOfStockOverlay}>Esgotado</div>}
        {favoriteButton && (
          <div className={styles.favoriteSlot} onClick={(e) => e.stopPropagation()}>
            {favoriteButton}
          </div>
        )}
      </div>
    </article>
  );
};

export default MenuProductRow;
