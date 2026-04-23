import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import styles from './MenuProductRow.module.css';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatMoney = (value) => currencyFormatter.format(Number(value || 0));

const normalizeTag = (t) => (t || '').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '');

const resolveHighlight = (product) => {
  const tags = (product.tags || []).map(normalizeTag);
  if (tags.some((t) => t.includes('mais pedido'))) return 'maisPedido';
  if (tags.some((t) => t.includes('recomendado'))) return 'recomendado';
  if (tags.some((t) => t.includes('novidade'))) return 'novidade';
  if (tags.some((t) => t.includes('edicao') && t.includes('limitada'))) return 'edicaoLimitada';
  if (product.isCombo) return 'combo';
  return null;
};

const HIGHLIGHT_LABEL = {
  maisPedido: 'Mais pedido',
  recomendado: 'Recomendado',
  novidade: 'Novidade',
  edicaoLimitada: 'Edição limitada',
  combo: 'Combo pronto',
};

const MenuProductRow = ({
  product,
  onOpenDetails,
  favoriteButton,
}) => {
  const [imageError, setImageError] = useState(false);
  const { cart } = useCart();

  const cartItem = cart.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const imageSrc = product.image_url || product.image || product.main_image_url;
  const inStock = (product.is_in_stock ?? true) || (product.stock_quantity ?? 1) > 0;
  const price = formatMoney(product.price);
  const hasDiscount = product.original_price && Number(product.original_price) > Number(product.price);
  const originalPrice = hasDiscount ? formatMoney(product.original_price) : null;
  const description = product.shortDescription || product.description;
  const discountPercentage = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.original_price)) * 100)
    : 0;

  const highlightType = resolveHighlight(product);

  const handleRowClick = () => onOpenDetails?.(product);

  const handleKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick();
    }
  };

  return (
    <article
      className={`${styles.row} ${!inStock ? styles.unavailable : ''}`}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`Ver detalhes de ${product.name}`}
    >
      <div className={styles.content}>
        {(highlightType || discountPercentage > 0) && (
          <div className={styles.badges}>
            {highlightType && (
              <span className={`${styles.badge} ${styles[highlightType]}`}>
                {HIGHLIGHT_LABEL[highlightType]}
              </span>
            )}
            {discountPercentage > 0 && (
              <span className={`${styles.badge} ${styles.badgeDiscount}`}>
                −{discountPercentage}%
              </span>
            )}
          </div>
        )}

        <div className={styles.header}>
          <h3 className={styles.name}>{product.name}</h3>
          <span className={styles.detailsHint}>
            Ver detalhes
            <ArrowUpRight size={14} />
          </span>
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
              <span className={styles.discount}>-{discountPercentage}%</span>
            )}
          </div>
          {quantity > 0 && (
            <span className={styles.cartBadge}>
              {quantity} na sacola
            </span>
          )}
          {!inStock && (
            <span className={styles.outOfStockLabel}>Indisponível</span>
          )}
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
