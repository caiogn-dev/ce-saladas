import React, { forwardRef, useId } from 'react';

/**
 * Input component with label, error state, and icons
 */
const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  size = 'md',
  className = '',
  id,
  ...props
}, ref) => {
  const reactId = useId();
  const inputId = id || `input-${reactId}`;
  
  const wrapperClasses = [
    'ui-input-wrapper',
    fullWidth && 'ui-input-wrapper--full',
    className,
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'ui-input',
    `ui-input--${size}`,
    error && 'ui-input--error',
    leftIcon && 'ui-input--with-left-icon',
    rightIcon && 'ui-input--with-right-icon',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={inputId} className="ui-input__label">
          {label}
        </label>
      )}
      <div className="ui-input__container">
        {leftIcon && (
          <span className="ui-input__icon ui-input__icon--left" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error || helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {rightIcon && (
          <span className="ui-input__icon ui-input__icon--right" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>
      {(error || helperText) && (
        <span 
          id={`${inputId}-helper`}
          className={`ui-input__helper ${error ? 'ui-input__helper--error' : ''}`}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
