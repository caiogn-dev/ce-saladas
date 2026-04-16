/**
 * IdentificationStep
 * Replaces the old email+phone form in CustomerForm.
 * Three branches: authenticated | phone-verified | unidentified
 */
import { useEffect, useState } from 'react';
import WhatsAppOTPModal from '../WhatsAppOTPModal';
import styles from '../../styles/Checkout.module.css';

function formatPhoneDisplay(value) {
  const d = (value || '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return d;
}

export default function IdentificationStep({
  phone = '',
  onPhoneChange,
  isIdentificationComplete = false,
  onIdentificationComplete,
  onEditIdentification,
  isAuthenticated = false,
  userName = '',
  onSignOut,
  disabled = false,
}) {
  const [otpOpen, setOtpOpen] = useState(false);
  const [inputPhone, setInputPhone] = useState(phone.replace(/\D/g, ''));

  useEffect(() => {
    const normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone !== inputPhone) {
      setInputPhone(normalizedPhone);
    }
  }, [phone, inputPhone]);

  const handleOtpSuccess = (userData) => {
    const phoneFromOTP = userData?.phone_number || userData?.user?.phone || inputPhone;
    const normalized = (phoneFromOTP || '').replace(/\D/g, '');
    onPhoneChange?.(normalized);
    onIdentificationComplete?.(normalized);
    setOtpOpen(false);
  };

  const handleInputPhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setInputPhone(digits);
    onPhoneChange?.(digits);
  };

  // ── Branch A: Authenticated ──
  if (isAuthenticated) {
    return (
      <div className={styles.identificationCard}>
        <div className={styles.identificationSummary}>
          <div className={styles.identificationSummaryItem}>
            <span className={styles.identificationSummaryLabel}>
              {userName ? `Olá, ${userName.split(' ')[0]}!` : 'Autenticado via WhatsApp'}
            </span>
            {phone && <strong>{formatPhoneDisplay(phone.replace(/\D/g, ''))}</strong>}
          </div>
          <button
            type="button"
            className={styles.identificationLink}
            onClick={onSignOut}
            disabled={disabled}
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  // ── Branch B: Phone verified this session ──
  if (isIdentificationComplete && phone) {
    return (
      <div className={styles.identificationCard}>
        <div className={styles.identificationSummary}>
          <div className={styles.identificationSummaryItem}>
            <span className={styles.identificationSummaryLabel}>
              <span style={{ color: 'var(--clr-leaf-500, #649e20)', marginRight: '0.35rem' }}>✓</span>
              Celular verificado
            </span>
            <strong>{formatPhoneDisplay(phone.replace(/\D/g, ''))}</strong>
          </div>
          <button
            type="button"
            className={styles.identificationLink}
            onClick={onEditIdentification}
            disabled={disabled}
          >
            Alterar
          </button>
        </div>
      </div>
    );
  }

  // ── Branch C: Not identified ──
  return (
    <div className={styles.identificationCard}>
      <div className={styles.formSectionHeader}>
        <span className={styles.formSectionEyebrow}>Identificação</span>
        <p className={styles.formSectionDescription}>
          Informe seu celular para continuar. Sem senha, sem cadastro obrigatório.
        </p>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="id-phone">Celular</label>
        <input
          id="id-phone"
          type="tel"
          inputMode="numeric"
          value={formatPhoneDisplay(inputPhone)}
          onChange={handleInputPhoneChange}
          placeholder="(63) 99999-9999"
          className={styles.input}
          disabled={disabled}
          autoComplete="tel"
        />
      </div>

      <button
        type="button"
        className={styles.identificationButton}
        onClick={() => setOtpOpen(true)}
        disabled={disabled || inputPhone.length < 10}
      >
        <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.74 5.49 2.035 7.8L0 32l8.418-2.01A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm7.27 19.426c-.398-.2-2.355-1.162-2.72-1.294-.365-.133-.63-.2-.895.2-.265.398-1.028 1.294-1.26 1.56-.232.265-.464.298-.863.1-.398-.2-1.682-.62-3.203-1.977-1.184-1.056-1.983-2.36-2.215-2.758-.232-.398-.025-.613.174-.812.179-.178.398-.465.597-.697.2-.232.265-.398.398-.664.133-.265.066-.497-.033-.697-.1-.2-.895-2.16-1.227-2.957-.323-.776-.65-.671-.895-.683l-.763-.013c-.265 0-.697.1-1.062.497-.365.398-1.394 1.362-1.394 3.32s1.427 3.851 1.626 4.116c.2.265 2.809 4.287 6.808 6.014.951.41 1.694.656 2.272.839.955.303 1.824.26 2.511.158.766-.114 2.355-.962 2.687-1.892.332-.93.332-1.727.232-1.892-.099-.166-.364-.265-.763-.465z"/>
        </svg>
        Verificar via WhatsApp
      </button>

      <p className={styles.identificationHelp}>
        Você receberá um código gratuito no seu WhatsApp.
      </p>

      <WhatsAppOTPModal
        isOpen={otpOpen}
        onClose={() => setOtpOpen(false)}
        onSuccess={handleOtpSuccess}
        initialPhone={inputPhone}
        title="Confirme seu celular"
        subtitle="Enviaremos um código de verificação via WhatsApp."
      />
    </div>
  );
}
