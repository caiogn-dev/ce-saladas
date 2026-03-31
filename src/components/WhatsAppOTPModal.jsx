import { useEffect, useRef, useCallback } from 'react';
import useWhatsAppOTP from '../hooks/useWhatsAppOTP';

// Format phone for display: 63991386719 → (63) 99138-6719
function formatPhoneDisplay(value) {
  const d = (value || '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return d;
}

function WhatsAppIcon() {
  return (
    <svg className="otp-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.74 5.49 2.035 7.8L0 32l8.418-2.01A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.77-1.854l-.485-.29-5.003 1.196 1.23-4.867-.318-.5A13.267 13.267 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.907c-.398-.2-2.355-1.162-2.72-1.294-.365-.133-.63-.2-.895.2-.265.398-1.028 1.294-1.26 1.56-.232.265-.464.298-.863.1-.398-.2-1.682-.62-3.203-1.977-1.184-1.056-1.983-2.36-2.215-2.758-.232-.398-.025-.613.174-.812.179-.178.398-.465.597-.697.2-.232.265-.398.398-.664.133-.265.066-.497-.033-.697-.1-.2-.895-2.16-1.227-2.957-.323-.776-.65-.671-.895-.683l-.763-.013c-.265 0-.697.1-1.062.497-.365.398-1.394 1.362-1.394 3.32s1.427 3.851 1.626 4.116c.2.265 2.809 4.287 6.808 6.014.951.41 1.694.656 2.272.839.955.303 1.824.26 2.511.158.766-.114 2.355-.962 2.687-1.892.332-.93.332-1.727.232-1.892-.099-.166-.364-.265-.763-.465z" fill="currentColor"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

/**
 * WhatsAppOTPModal
 *
 * Props:
 *   isOpen       – boolean
 *   onClose      – () => void
 *   onSuccess    – (userData) => void   called after successful verification
 *   initialPhone – string (optional pre-fill)
 *   title        – string (optional)
 *   subtitle     – string (optional)
 */
export default function WhatsAppOTPModal({
  isOpen,
  onClose,
  onSuccess,
  initialPhone = '',
  title = 'Entre com WhatsApp',
  subtitle = 'Enviaremos um código de verificação gratuito.',
}) {
  const digitRefs = useRef([]);
  const phoneInputRef = useRef(null);

  const otp = useWhatsAppOTP({
    onSuccess: (data) => {
      onSuccess?.(data);
    },
  });

  // Pre-fill phone from prop
  useEffect(() => {
    if (isOpen && initialPhone) {
      otp.setPhone(initialPhone.replace(/\D/g, ''));
    }
    if (isOpen) {
      otp.reset();
      if (initialPhone) otp.setPhone(initialPhone.replace(/\D/g, ''));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Auto-close after success
  useEffect(() => {
    if (otp.state === 'success') {
      const t = setTimeout(() => onClose?.(), 1400);
      return () => clearTimeout(t);
    }
  }, [otp.state, onClose]);

  // Focus first digit when code_sent
  useEffect(() => {
    if (otp.state === 'code_sent') {
      setTimeout(() => digitRefs.current[0]?.focus(), 80);
    }
  }, [otp.state]);

  // Trap ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Handle digit input
  const handleDigitChange = useCallback((index, value) => {
    // Handle paste of full 6-digit code
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 6) {
      const digits = cleaned.split('');
      digits.forEach((d, i) => {
        if (digitRefs.current[i]) digitRefs.current[i].value = d;
      });
      otp.setCode(cleaned);
      otp.verifyCode(cleaned);
      return;
    }

    const digit = cleaned.slice(-1);
    if (digitRefs.current[index]) digitRefs.current[index].value = digit;

    const currentDigits = Array.from({ length: 6 }, (_, i) =>
      digitRefs.current[i]?.value || ''
    );
    const newCode = currentDigits.join('');
    otp.setCode(newCode);

    if (digit && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
    if (newCode.length === 6 && !newCode.includes('')) {
      otp.verifyCode(newCode);
    }
  }, [otp]);

  const handleDigitKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace') {
      if (!digitRefs.current[index]?.value && index > 0) {
        digitRefs.current[index - 1].value = '';
        digitRefs.current[index - 1].focus();
        const currentDigits = Array.from({ length: 6 }, (_, i) =>
          digitRefs.current[i]?.value || ''
        );
        otp.setCode(currentDigits.join(''));
      }
    }
  }, [otp]);

  const handlePhoneKeyDown = (e) => {
    if (e.key === 'Enter') otp.sendCode();
  };

  if (!isOpen) return null;

  const isLoading = otp.state === 'sending' || otp.state === 'verifying';

  return (
    <div className="otp-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="otp-sheet" role="dialog" aria-modal="true" aria-labelledby="otp-title">

        <button className="otp-close" onClick={onClose} aria-label="Fechar">
          <CloseIcon />
        </button>

        <div className="otp-header">
          <WhatsAppIcon />
          <h2 className="otp-title" id="otp-title">{title}</h2>
          <p className="otp-subtitle">{subtitle}</p>
        </div>

        {/* ── SUCCESS ── */}
        {otp.state === 'success' && (
          <div className="otp-success">
            <div className="otp-success-icon"><CheckIcon /></div>
            <p className="otp-success-title">
              {otp.successData?.user?.name
                ? `Bem-vindo, ${otp.successData.user.name.split(' ')[0]}!`
                : 'Autenticado com sucesso!'}
            </p>
            <p className="otp-success-sub">Redirecionando...</p>
          </div>
        )}

        {/* ── LOADING ── */}
        {isLoading && (
          <div className="otp-loading">
            <div className="otp-spinner" />
            <span>{otp.state === 'sending' ? 'Enviando código...' : 'Verificando...'}</span>
          </div>
        )}

        {/* ── IDLE / ERROR — phone entry ── */}
        {(otp.state === 'idle' || otp.state === 'error') && !isLoading && (
          <>
            {otp.error && <div className="otp-error">{otp.error}</div>}
            <div className="otp-field-group">
              <label className="otp-label" htmlFor="otp-phone">Número de celular</label>
              <div className="otp-phone-row">
                <div className="otp-country-code">🇧🇷 +55</div>
                <input
                  id="otp-phone"
                  ref={phoneInputRef}
                  className="otp-phone-input"
                  type="tel"
                  inputMode="numeric"
                  placeholder="(63) 99999-9999"
                  value={formatPhoneDisplay(otp.phone)}
                  onChange={(e) => otp.setPhone(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={handlePhoneKeyDown}
                  autoFocus
                  autoComplete="tel"
                />
              </div>
            </div>
            <button
              className="otp-btn otp-btn-primary"
              onClick={() => otp.sendCode()}
              disabled={otp.phone.length < 10}
            >
              Enviar código via WhatsApp
            </button>
            <p className="otp-privacy">
              Sem senha. Sem cadastro obrigatório.
            </p>
          </>
        )}

        {/* ── CODE SENT — digit grid ── */}
        {otp.state === 'code_sent' && !isLoading && (
          <>
            {/* Phone confirmed badge */}
            <div className="otp-phone-confirmed">
              <CheckIcon />
              <span>Código enviado para <strong>(+55) {formatPhoneDisplay(otp.phone)}</strong></span>
              <button className="otp-change-phone" onClick={() => otp.reset()}>Alterar</button>
            </div>

            {otp.error && <div className="otp-error">{otp.error}</div>}

            <p className="otp-code-label">Digite o código de 6 dígitos recebido no WhatsApp</p>

            <div className="otp-digits">
              {Array.from({ length: 6 }, (_, i) => (
                <input
                  key={i}
                  ref={(el) => { digitRefs.current[i] = el; }}
                  className={`otp-digit${otp.code[i] ? ' otp-digit--filled' : ''}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="6"
                  autoComplete="one-time-code"
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  aria-label={`Dígito ${i + 1}`}
                />
              ))}
            </div>

            <div className="otp-resend">
              {otp.resendCooldown > 0 ? (
                <span>Reenviar em {otp.resendCooldown}s</span>
              ) : (
                <button className="otp-resend-btn" onClick={otp.resendCode}>
                  Reenviar código
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
