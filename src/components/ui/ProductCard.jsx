import React, { useState } from 'react';
import Button from './Button';
import Badge from './Badge';

/**
 * ProductCard - standard storefront product tile.
 */
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
  const formattedPrice = Number(product.price).toFixed(2).replace('.', ',');

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
      className={`product-card ${className}`}
      style={{ '--animation-delay': animationDelay }}
    >
      <div
        className={`product-card__image-wrapper ${onOpenDetails ? 'product-card__image-wrapper--interactive' : ''}`}
        onClick={handleOpenDetails}
      >
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
            <div className="product-card__price">
              <span className="product-card__price-currency">R$</span>
              <span className="product-card__price-value">{formattedPrice}</span>
            </div>
          </div>

          {weightLabel && (
            <Badge variant="marsala" size="sm" className="product-card__weight">
              {weightLabel}
            </Badge>
          )}

          {product.description && (
            <p className="product-card__description">{product.description}</p>
          )}
        </div>

        <div className="product-card__actions">
          {onOpenDetails && (
            <button
              type="button"
              className="product-card__details"
              onClick={handleOpenDetails}
            >
              Ver detalhes
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
            {inStock ? 'Adicionar ao carrinho' : 'Indisponível'}
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
