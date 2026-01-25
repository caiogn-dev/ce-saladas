import React, { useState, useCallback } from 'react';
import Button from './Button';

/**
 * PIX Payment component with QR Code display and copy-to-clipboard
 */
const PixPayment = ({
  pixCode,
  qrCodeBase64,
  qrCodeUrl,
  amount,
  expiresAt,
  onCopy,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!pixCode) return;

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(pixCode);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = pixCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setCopyError(false);
      onCopy?.();

      // Reset after 3 seconds
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch {
      // Copy failed - show error state to user
      setCopyError(true);
      setTimeout(() => {
        setCopyError(false);
      }, 3000);
    }
  }, [pixCode, onCopy]);

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expirado';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ${minutes % 60}min`;
    }
    
    return `${minutes}min ${seconds}s`;
  };

  const timeRemaining = getTimeRemaining();
  const isExpired = timeRemaining === 'Expirado';

  // Determine QR code source
  const qrCodeSrc = qrCodeBase64 
    ? (qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`)
    : qrCodeUrl;

  return (
    <div className={`pix-payment ${isExpired ? 'pix-payment--expired' : ''} ${className}`}>
      {/* Header */}
      <div className="pix-payment__header">
        <div className="pix-payment__logo">
          <svg viewBox="0 0 512 512" fill="currentColor">
            <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.9 231.1 518.9 200.8 488.6L103.3 391.2H112.6C132.6 391.2 151.5 383.4 165.7 369.2L242.4 292.5zM262.5 218.9C257.1 224.4 247.9 224.5 242.4 218.9L165.7 142.2C151.5 128 132.6 120.2 112.6 120.2H103.3L200.2 23.3C230.5-7.1 279.7-7.1 310 23.3L407.7 120.9H392.6C372.6 120.9 353.7 128.7 339.5 142.9L262.5 218.9z"/>
            <path d="M112.6 142.7C126.4 142.7 139.1 148.3 148.7 157.9L225.4 234.6C233.6 242.8 244.5 247.4 256 247.4C267.5 247.4 278.4 242.8 286.6 234.6L363.3 157.9C372.9 148.3 385.6 142.7 399.4 142.7H445.2L488.6 186.1C518.9 216.4 518.9 265.6 488.6 295.9L445.2 339.3H399.4C385.6 339.3 372.9 333.7 363.3 324.1L286.6 247.4C278.4 239.2 267.5 234.6 256 234.6C244.5 234.6 233.6 239.2 225.4 247.4L148.7 324.1C139.1 333.7 126.4 339.3 112.6 339.3H66.8L23.4 295.9C-6.9 265.6-6.9 216.4 23.4 186.1L66.8 142.7H112.6z"/>
          </svg>
          <span>Pague com PIX</span>
        </div>
        {amount && (
          <div className="pix-payment__amount">
            R$ {Number(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>

      {/* QR Code */}
      {qrCodeSrc && (
        <div className="pix-payment__qr">
          <div className="pix-payment__qr-container">
            <img 
              src={qrCodeSrc} 
              alt="QR Code PIX" 
              className="pix-payment__qr-image"
            />
            {isExpired && (
              <div className="pix-payment__qr-overlay">
                <span>QR Code Expirado</span>
              </div>
            )}
          </div>
          <p className="pix-payment__qr-hint">
            Escaneie o QR Code com o app do seu banco
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="pix-payment__divider">
        <span>ou copie o código</span>
      </div>

      {/* PIX Code */}
      {pixCode && (
        <div className="pix-payment__code">
          <div className="pix-payment__code-box">
            <code className="pix-payment__code-text">
              {pixCode.length > 50 ? `${pixCode.substring(0, 50)}...` : pixCode}
            </code>
          </div>
          <Button
            variant={copied ? 'secondary' : 'primary'}
            onClick={handleCopy}
            disabled={isExpired}
            fullWidth
            leftIcon={
              copied ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              )
            }
          >
            {copied ? 'Copiado!' : copyError ? 'Erro ao copiar' : 'Copiar código PIX'}
          </Button>
        </div>
      )}

      {/* Timer */}
      {timeRemaining && !isExpired && (
        <div className="pix-payment__timer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Expira em: <strong>{timeRemaining}</strong></span>
        </div>
      )}

      {/* Instructions */}
      <div className="pix-payment__instructions">
        <h4>Como pagar:</h4>
        <ol>
          <li>Abra o app do seu banco</li>
          <li>Escolha pagar com PIX</li>
          <li>Escaneie o QR Code ou cole o código</li>
          <li>Confirme o pagamento</li>
        </ol>
      </div>
    </div>
  );
};

export default PixPayment;
