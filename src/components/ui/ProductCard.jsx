import React, { useState } from 'react';
import Button from './Button';
import Badge from './Badge';

/**
 * ProductCard - Componente padronizado para exibição de produtos
 * @param {Object} props
 * @param {Object} props.product - Dados do produto
 * @param {Function} props.onAddToCart - Callback ao adicionar ao carrinho
 * @param {React.ReactNode} props.favoriteButton - Botão de favorito
 * @param {React.ReactNode} props.stockBadge - Badge de estoque
 * @param {string} props.weightLabel - Label de peso (ex: "500g")
 * @param {number} props.index - Índice para animação staggered
 */
const ProductCard = ({
  product,
  onAddToCart,
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

  const handleAddToCart = () => {
    if (onAddToCart && inStock) {
      onAddToCart(product);
    }
  };

  return (
    <article 
      className={`product-card ${className}`}
      style={{ '--animation-delay': animationDelay }}
    >
      {/* Imagem */}
      <div className="product-card__image-wrapper">
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

        {/* Preço */}
        <div className="product-card__price">
          <span className="product-card__price-currency">R$</span>
          <span className="product-card__price-value">{Number(product.price).toFixed(2)}</span>
        </div>

        {/* Favorito */}
        {favoriteButton && (
          <div className="product-card__favorite">
            {favoriteButton}
          </div>
        )}

        {/* Badge de estoque */}
        {stockBadge && (
          <div className="product-card__stock">
            {stockBadge}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="product-card__content">
        <h3 className="product-card__name">{product.name}</h3>
        
        {weightLabel && (
          <Badge variant="marsala" size="sm" className="product-card__weight">
            {weightLabel}
          </Badge>
        )}
        
        {product.description && (
          <p className="product-card__description">{product.description}</p>
        )}

        <div className="product-card__actions">
          <Button
            variant={inStock ? 'outline' : 'ghost'}
            fullWidth
            onClick={handleAddToCart}
            disabled={!inStock}
          >
            {inStock ? 'Adicionar' : 'Indisponível'}
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
