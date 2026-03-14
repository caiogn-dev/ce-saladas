import React, { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Button from './Button';
import Badge from './Badge';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const ProductCard = ({
  product,
  onAddToCart,
  onOpenDetails,
  favoriteButton,
  stockBadge,
  weightLabel,
  index = 0,
  className = '',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const inStock = Number(product.stock_quantity) > 0;
  const imageSrc = product.image || product.image_url;
  const animationDelay = `${index * 50}ms`;
  const formattedPrice = currencyFormatter.format(Number(product.price || 0));
  const formattedOriginalPrice = product.original_price
    ? currencyFormatter.format(Number(product.original_price))
    : null;
  const isCombo = product.itemType === 'combo' || product.isCombo;

  const eyebrow = useMemo(() => {
    const primaryTag = Array.isArray(product.tags) ? product.tags.find(Boolean) : '';

    return (
      primaryTag
      || product.categoryLabel
      || product.productTypeName
      || (isCombo ? 'Monte sua salada' : 'Salada')
    );
  }, [isCombo, product.categoryLabel, product.productTypeName, product.tags]);

  const description = product.shortDescription || product.description;

  const secondaryMeta = useMemo(() => {
    const meta = [];

    if (weightLabel) {
      meta.push(weightLabel);
    }

    if (product.productTypeName && product.productTypeName !== eyebrow) {
      meta.push(product.productTypeName);
    }

    if (isCombo) {
      meta.push('Montagem personalizada');
    }

    return meta.slice(0, 2);
  }, [eyebrow, isCombo, product.productTypeName, weightLabel]);

  const handleAddToCart = () => {
    if (onAddToCart && inStock) {
      onAddToCart(product);
    }
  };

  const handleOpenDetails = () => {
    if (onOpenDetails) {
      onOpenDetails(product);
    }
  };

  return (
    <article
      className={`product-card ${isCombo ? 'product-card--combo' : ''} ${className}`.trim()}
      style={{ '--animation-delay': animationDelay }}
    >
      <div
        className={`product-card__image-wrapper ${onOpenDetails ? 'product-card__image-wrapper--interactive' : ''}`}
        onClick={handleOpenDetails}
      >
        {eyebrow && (
          <div className="product-card__eyebrow">
            <span>{eyebrow}</span>
          </div>
        )}

        <div className={`product-card__image ${imageLoaded ? 'loaded' : ''} ${imageError ? 'error' : ''}`}>
          {!imageError && imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="product-card__image-fallback">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span>Sem imagem</span>
            </div>
          )}
        </div>

        {favoriteButton && (
          <div
            className="product-card__favorite"
            onClick={(event) => event.stopPropagation()}
          >
            {favoriteButton}
          </div>
        )}

        {stockBadge && (
          <div
            className="product-card__stock"
            onClick={(event) => event.stopPropagation()}
          >
            {stockBadge}
          </div>
        )}
      </div>

      <div className="product-card__content">
        <div
          className={`product-card__info ${onOpenDetails ? 'product-card__info--interactive' : ''}`}
          onClick={handleOpenDetails}
        >
          <div className="product-card__header">
            <h3 className="product-card__name">{product.name}</h3>
            {product.original_price && Number(product.original_price) > Number(product.price) && (
              <span className="product-card__original-price">{formattedOriginalPrice}</span>
            )}
          </div>

          {description && (
            <p className="product-card__description">{description}</p>
          )}

          {secondaryMeta.length > 0 && (
            <div className="product-card__meta">
              {secondaryMeta.map((metaItem) => (
                <Badge key={metaItem} variant="marsala" size="sm" className="product-card__weight">
                  {metaItem}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="product-card__footer">
          <div className="product-card__pricing">
            <span className="product-card__price-label">
              {isCombo ? 'A partir de' : 'Preço'}
            </span>
            <div className="product-card__price">
              <span className="product-card__price-value">{formattedPrice}</span>
            </div>
          </div>

          <div className="product-card__actions">
            {onOpenDetails && (
              <button
                type="button"
                className="product-card__details"
                onClick={handleOpenDetails}
              >
                Ver detalhes
                <ArrowUpRight size={16} />
              </button>
            )}

            <Button
              variant={inStock ? 'primary' : 'ghost'}
              fullWidth
              onClick={(event) => {
                event.stopPropagation();
                handleAddToCart();
              }}
              disabled={!inStock}
            >
              {inStock ? 'Adicionar' : 'Indisponível'}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
