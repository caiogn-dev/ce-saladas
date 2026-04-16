/**
 * IdentificationStep
 * Checkout identification based only on the customer's phone number.
 */
import styles from '../../styles/Checkout.module.css';

export default function IdentificationStep({
  phone = '',
  onPhoneChange,
  isIdentificationComplete = false,
  isAuthenticated = false,
  userName = '',
  onSignOut,
  disabled = false,
}) {
  const handleInputPhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    onPhoneChange?.(digits);
  };

  if (isAuthenticated) {
    return (
      <div className={styles.identificationCard}>
        <div className={styles.identificationSummary}>
          <div className={styles.identificationSummaryItem}>
            <span className={styles.identificationSummaryLabel}>
              {userName ? `Olá, ${userName.split(' ')[0]}!` : 'Autenticado via WhatsApp'}
            </span>
            {phone && <strong>{phone}</strong>}
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
          value={phone}
          onChange={handleInputPhoneChange}
          placeholder="(63) 99999-9999"
          className={styles.input}
          disabled={disabled}
          autoComplete="tel"
        />
      </div>

      <p className={styles.identificationHelp}>
        {isIdentificationComplete
          ? 'Celular informado. Vamos usar esse número para contato sobre o pedido.'
          : 'Digite seu celular com DDD para continuar.'}
      </p>
    </div>
  );
}
