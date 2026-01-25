import React from 'react';

/**
 * Card component for content containers
 * @param {Object} props
 * @param {'default' | 'elevated' | 'outlined'} props.variant
 * @param {boolean} props.hoverable
 * @param {boolean} props.noPadding
 * @param {string} props.className
 */
const Card = ({
  variant = 'default',
  hoverable = false,
  noPadding = false,
  children,
  className = '',
  onClick,
  ...props
}) => {
  const classes = [
    'ui-card',
    `ui-card--${variant}`,
    hoverable && 'ui-card--hoverable',
    noPadding && 'ui-card--no-padding',
    onClick && 'ui-card--clickable',
    className,
  ].filter(Boolean).join(' ');

  const Component = onClick ? 'button' : 'div';

  return (
    <Component 
      className={classes} 
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
};

/**
 * Card Header component
 */
const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`ui-card__header ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Card Body component
 */
const CardBody = ({ children, className = '', ...props }) => (
  <div className={`ui-card__body ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Card Footer component
 */
const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`ui-card__footer ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Card Image component
 */
const CardImage = ({ src, alt, className = '', fallback, ...props }) => {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError || !src) {
    return (
      <div className={`ui-card__image ui-card__image--fallback ${className}`} {...props}>
        {fallback || (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <div className={`ui-card__image ${isLoading ? 'ui-card__image--loading' : ''} ${className}`}>
      <img 
        src={src} 
        alt={alt} 
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        {...props}
      />
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Image = CardImage;

export default Card;
