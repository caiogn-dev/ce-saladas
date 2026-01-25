import React from 'react';

/**
 * Skeleton loader component for loading states
 * @param {Object} props
 * @param {'text' | 'circle' | 'rect' | 'card'} props.variant
 * @param {string | number} props.width
 * @param {string | number} props.height
 * @param {number} props.count - Number of skeleton items to render
 */
const Skeleton = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  style: customStyle = {},
  ...props
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...customStyle,
  };

  const classes = [
    'ui-skeleton',
    `ui-skeleton--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  const items = Array.from({ length: count }, (_, i) => (
    <span key={i} className={classes} style={style} {...props} />
  ));

  return count > 1 ? <>{items}</> : items[0];
};

/**
 * Product Card Skeleton - Matches ProductCard layout
 */
const ProductCardSkeleton = ({ index = 0 }) => {
  const animationDelay = `${index * 100}ms`;
  
  return (
    <div 
      className="ui-skeleton-product"
      style={{ '--skeleton-delay': animationDelay }}
    >
      <div className="ui-skeleton-product__image-wrapper">
        <Skeleton variant="rect" className="ui-skeleton-product__image" />
        <div className="ui-skeleton-product__price">
          <Skeleton variant="rect" width={70} height={32} />
        </div>
      </div>
      <div className="ui-skeleton-product__content">
        <Skeleton variant="text" width="75%" height={22} />
        <Skeleton variant="rect" width={50} height={24} style={{ borderRadius: '999px' }} />
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="80%" height={14} />
        <div className="ui-skeleton-product__button-wrapper">
          <Skeleton variant="rect" height={44} className="ui-skeleton-product__button" />
        </div>
      </div>
    </div>
  );
};

/**
 * List Item Skeleton
 */
const ListItemSkeleton = () => (
  <div className="ui-skeleton-list-item">
    <Skeleton variant="circle" width={48} height={48} />
    <div className="ui-skeleton-list-item__content">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" height={12} />
    </div>
  </div>
);

/**
 * Table Row Skeleton
 */
const TableRowSkeleton = ({ columns = 4 }) => {
  const widths = Array.from({ length: columns }, (_, i) => 40 + ((i * 13) % 40));

  return (
    <div className="ui-skeleton-table-row">
      {widths.map((width, i) => (
        <Skeleton key={i} variant="text" width={`${width}%`} />
      ))}
    </div>
  );
};

/**
 * Cart Item Skeleton
 */
const CartItemSkeleton = () => (
  <div className="ui-skeleton-cart-item">
    <Skeleton variant="rect" width={80} height={80} />
    <div className="ui-skeleton-cart-item__content">
      <Skeleton variant="text" width="70%" height={18} />
      <Skeleton variant="text" width="40%" height={14} />
      <Skeleton variant="text" width="30%" height={16} />
    </div>
  </div>
);

Skeleton.ProductCard = ProductCardSkeleton;
Skeleton.ListItem = ListItemSkeleton;
Skeleton.TableRow = TableRowSkeleton;
Skeleton.CartItem = CartItemSkeleton;

export default Skeleton;
