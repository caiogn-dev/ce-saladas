import React from 'react';

/**
 * Button component with multiple variants and sizes
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'} props.variant
 * @param {'sm' | 'md' | 'lg'} props.size
 * @param {boolean} props.fullWidth
 * @param {boolean} props.isLoading
 * @param {boolean} props.disabled
 * @param {React.ReactNode} props.leftIcon
 * @param {React.ReactNode} props.rightIcon
 * @param {React.ReactNode} props.children
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  type = 'button',
  ...props
}) => {
  const classes = [
    'ui-btn',
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    fullWidth && 'ui-btn--full',
    isLoading && 'ui-btn--loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="ui-btn__spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
          </svg>
        </span>
      )}
      {!isLoading && leftIcon && <span className="ui-btn__icon ui-btn__icon--left">{leftIcon}</span>}
      <span className="ui-btn__text">{children}</span>
      {!isLoading && rightIcon && <span className="ui-btn__icon ui-btn__icon--right">{rightIcon}</span>}
    </button>
  );
};

export default Button;
