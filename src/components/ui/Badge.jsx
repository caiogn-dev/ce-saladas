import React from 'react';

/**
 * Badge component for status indicators and labels
 * @param {Object} props
 * @param {'default' | 'success' | 'warning' | 'error' | 'info' | 'marsala'} props.variant
 * @param {'sm' | 'md' | 'lg'} props.size
 * @param {boolean} props.dot - Show dot indicator
 * @param {boolean} props.pill - Rounded pill shape
 */
const Badge = ({
  variant = 'default',
  size = 'md',
  dot = false,
  pill = true,
  children,
  className = '',
  ...props
}) => {
  const classes = [
    'ui-badge',
    `ui-badge--${variant}`,
    `ui-badge--${size}`,
    pill && 'ui-badge--pill',
    dot && 'ui-badge--dot',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {dot && <span className="ui-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
};

export default Badge;
