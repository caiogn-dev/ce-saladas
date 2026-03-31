import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import useWhatsAppOTP from '../hooks/useWhatsAppOTP';

function formatPhoneDisplay(value) {
  const d = (value || '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return d;
}

const Login = () => {
  const router = useRouter();
  const { fetchProfile } = useAuth();

  const returnToParam = router.query.returnTo;
  const returnTo = Array.isArray(returnToParam)
    ? returnToParam[0]
    : returnToParam || '/cardapio';

  const [digitValues, setDigitValues] = useState(Array(6).fill(''));
  const digitRefs = React.useRef([]);

  const otp = useWhatsAppOTP({
    onSuccess: async () => {
      await fetchProfile({ force: true });
      router.replace(returnTo);
    },
  });

  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 6) {
      const digits = cleaned.split('');
      setDigitValues(digits);
      digits.forEach((d, i) => {
        if (digitRefs.current[i]) digitRefs.current[i].value = d;
      });
      otp.setCode(cleaned);
      otp.verifyCode(cleaned);
      return;
    }
    const digit = cleaned.slice(-1);
    const newDigits = [...digitValues];
    newDigits[index] = digit;
    setDigitValues(newDigits);
    otp.setCode(newDigits.join(''));
    if (digit && index < 5) digitRefs.current[index + 1]?.focus();
    if (newDigits.every(Boolean)) otp.verifyCode(newDigits.join(''));
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digitValues[index] && index > 0) {
      const newDigits = [...digitValues];
      newDigits[index - 1] = '';
      setDigitValues(newDigits);
      digitRefs.current[index - 1]?.focus();
    }
  };

  const isLoading = otp.state === 'sending' || otp.state === 'verifying';

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <Link href="/" className="auth-logo">Cê Saladas</Link>
            <p>Entre via WhatsApp — sem senha, rápido e seguro.</p>
          </div>

          {/* IDLE / ERROR — phone input */}
          {(otp.state === 'idle' || otp.state === 'error') && (
            <>
              {otp.error && <div className="auth-error">{otp.error}</div>}
              <div className="auth-form">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                    Número de celular
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ padding: '0 0.75rem', height: '3rem', border: '1.5px solid var(--color-border, #e0dbd5)', borderRadius: '0.625rem', background: 'var(--color-bg-muted)', display: 'flex', alignItems: 'center', fontSize: '1rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      🇧🇷 +55
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="(63) 99999-9999"
                      value={formatPhoneDisplay(otp.phone)}
                      onChange={(e) => otp.setPhone(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => { if (e.key === 'Enter') otp.sendCode(); }}
                      autoFocus
                      autoComplete="tel"
                      style={{ flex: 1, height: '3rem', padding: '0 0.875rem', border: '1.5px solid var(--color-border, #e0dbd5)', borderRadius: '0.625rem', fontSize: '1rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary auth-submit"
                  onClick={() => otp.sendCode()}
                  disabled={otp.phone.length < 10 || isLoading}
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  Enviar código via WhatsApp
                </button>
              </div>
            </>
          )}

          {/* LOADING */}
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              <div className="otp-spinner" />
              <span>{otp.state === 'sending' ? 'Enviando código...' : 'Verificando...'}</span>
            </div>
          )}

          {/* CODE SENT */}
          {otp.state === 'code_sent' && !isLoading && (
            <>
              {otp.error && <div className="auth-error">{otp.error}</div>}
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
                Código enviado para <strong>(+55) {formatPhoneDisplay(otp.phone)}</strong>
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
                {Array.from({ length: 6 }, (_, i) => (
                  <input
                    key={i}
                    ref={(el) => { digitRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    autoComplete="one-time-code"
                    value={digitValues[i]}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(i, e)}
                    style={{ width: '2.75rem', height: '3.25rem', border: '2px solid var(--color-border, #e0dbd5)', borderRadius: '0.625rem', textAlign: 'center', fontSize: '1.375rem', fontWeight: 700 }}
                  />
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                {otp.resendCooldown > 0 ? (
                  <span>Reenviar em {otp.resendCooldown}s</span>
                ) : (
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-terra-400)', fontWeight: 500, textDecoration: 'underline' }}
                    onClick={otp.resendCode}
                  >
                    Reenviar código
                  </button>
                )}
              </div>
            </>
          )}

          <div className="auth-footer">
            <p><Link href="/">&larr; Voltar ao início</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
