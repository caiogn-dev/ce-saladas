import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal component with backdrop and animations
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.title
 * @param {'sm' | 'md' | 'lg' | 'xl' | 'full'} props.size
 * @param {boolean} props.closeOnBackdrop
 * @param {boolean} props.showCloseButton
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true,
  children,
  className = '',
  footer,
}) => {
  // Handle escape key
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="ui-modal__backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className={`ui-modal ui-modal--${size} ${className}`}>
        {(title || showCloseButton) && (
          <div className="ui-modal__header">
            {title && (
              <h2 id="modal-title" className="ui-modal__title">{title}</h2>
            )}
            {showCloseButton && (
              <button 
                className="ui-modal__close"
                onClick={onClose}
                aria-label="Fechar modal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="ui-modal__body">
          {children}
        </div>
        {footer && (
          <div className="ui-modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
