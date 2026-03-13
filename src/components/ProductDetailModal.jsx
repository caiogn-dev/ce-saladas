import React, { useMemo } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { buildMediaUrl } from '../utils/media';
import styles from './ProductDetailModal.module.css';

const formatCurrency = (value) => Number(value || 0).toFixed(2);

const toLabel = (value) => String(value || '')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizePrimitive = (value) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizePrimitive(item))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'object') {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Nao';
  }

  return String(value);
};

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
              entry.url
              || entry.image
              || entry.src
              || entry.file
              || ''
            );
          }
          return '';
        })
        .filter(Boolean)
    )
  );
};

const buildDetailRows = (item) => {
  const merged = {
    ...(item?.attributes || {}),
    ...(item?.typeAttributes || {}),
  };

  return Object.entries(merged)
    .map(([key, value]) => ({
      label: toLabel(key),
      value: normalizePrimitive(value),
    }))
    .filter((entry) => entry.value);
};

const ProductDetailModal = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const gallery = useMemo(() => getGalleryImages(item), [item]);
  const details = useMemo(() => buildDetailRows(item), [item]);

  if (!item) {
    return null;
  }

  const isCombo = item.itemType === 'combo' || item.isCombo;
  const inStock = isCombo
    ? (item.stock_quantity ?? 1) > 0
    : Boolean(item.is_in_stock ?? ((item.stock_quantity ?? 0) > 0));

  const badges = [
    item.categoryLabel,
    item.productTypeName,
    item.weightLabel,
    isCombo ? 'Combo' : 'Produto',
  ].filter(Boolean);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={item.name}
      className={styles.modal}
    >
      <div className={styles.layout}>
        <div className={styles.mediaColumn}>
          <div className={styles.heroImage}>
            {gallery[0] ? (
              <img src={gallery[0]} alt={item.name} />
            ) : (
              <div className={styles.imageFallback}>Sem imagem</div>
            )}
          </div>

          {gallery.length > 1 && (
            <div className={styles.gallery}>
              {gallery.slice(0, 4).map((image, index) => (
                <div key={`${image}-${index}`} className={styles.galleryThumb}>
                  <img src={image} alt={`${item.name} ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.contentColumn}>
          <div className={styles.badges}>
            {badges.map((badge) => (
              <Badge key={badge} variant="outline" size="sm">
                {badge}
              </Badge>
            ))}
            <Badge variant={inStock ? 'success' : 'ghost'} size="sm">
              {inStock ? 'Disponivel' : 'Indisponivel'}
            </Badge>
          </div>

          <div className={styles.pricing}>
            {item.original_price && Number(item.original_price) > Number(item.price) && (
              <span className={styles.originalPrice}>
                R$ {formatCurrency(item.original_price)}
              </span>
            )}
            <div className={styles.currentPrice}>
              R$ {formatCurrency(item.price)}
            </div>
            {item.savings && Number(item.savings) > 0 && (
              <div className={styles.savings}>
                Economize R$ {formatCurrency(item.savings)}
              </div>
            )}
          </div>

          {(item.shortDescription || item.description) && (
            <p className={styles.description}>
              {item.description || item.shortDescription}
            </p>
          )}

          {isCombo && Array.isArray(item.comboItems) && item.comboItems.length > 0 && (
            <section className={styles.section}>
              <h3>O que acompanha</h3>
              <ul className={styles.list}>
                {item.comboItems.map((comboItem, index) => (
                  <li key={`${comboItem.product_name || comboItem.product || index}-${index}`}>
                    <span>{comboItem.product_name || 'Item do combo'}</span>
                    <strong>x{comboItem.quantity || 1}</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {details.length > 0 && (
            <section className={styles.section}>
              <h3>Mais detalhes</h3>
              <dl className={styles.detailsGrid}>
                {details.map((detail) => (
                  <div key={detail.label} className={styles.detailCard}>
                    <dt>{detail.label}</dt>
                    <dd>{detail.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {Array.isArray(item.tags) && item.tags.length > 0 && (
            <section className={styles.section}>
              <h3>Tags</h3>
              <div className={styles.tags}>
                {item.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className={styles.actions}>
            <Button variant="ghost" onClick={onClose}>
              Continuar olhando
            </Button>
            <Button
              variant={inStock ? 'primary' : 'ghost'}
              onClick={() => onAddToCart?.(item)}
              disabled={!inStock}
            >
              {inStock ? 'Adicionar ao carrinho' : 'Item indisponivel'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetailModal;
