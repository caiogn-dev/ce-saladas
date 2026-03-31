import React from 'react';
import IdentificationStep from './IdentificationStep';
import styles from '../../styles/Checkout.module.css';

const CustomerForm = ({
  formData,
  errors,
  onChange,
  onCompleteIdentification,
  onEditIdentification,
  isIdentificationComplete = false,
  existingFields = {},
  disabled = false,
  isAuthenticated = false,
  userName = '',
  onSignOut,
  onPhoneChange,
}) => (
  <div className={styles.customerForm}>
    <IdentificationStep
      phone={formData.phone}
      onPhoneChange={onPhoneChange}
      isIdentificationComplete={isIdentificationComplete}
      onIdentificationComplete={onCompleteIdentification}
      onEditIdentification={onEditIdentification}
      isAuthenticated={isAuthenticated}
      userName={userName}
      onSignOut={onSignOut}
      disabled={disabled}
    />

    {isIdentificationComplete && (
      <div className={styles.personalDataCard}>
        <div className={styles.formSectionHeader}>
          <span className={styles.formSectionEyebrow}>Dados pessoais</span>
          <p className={styles.formSectionDescription}>
            Preencha apenas o necessário para concluir o pedido.
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Nome completo *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder="Seu nome completo"
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            disabled={disabled || existingFields.name}
            autoComplete="name"
          />
          {errors.name && <span className={styles.errorText}>{errors.name}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>CPF (opcional)</label>
          <input
            type="text"
            name="cpf"
            value={formData.cpf}
            onChange={onChange}
            placeholder="000.000.000-00"
            className={`${styles.input} ${errors.cpf ? styles.inputError : ''}`}
            disabled={disabled || existingFields.cpf}
            inputMode="numeric"
          />
          {errors.cpf && <span className={styles.errorText}>{errors.cpf}</span>}
          {existingFields.cpf && <span className={styles.savedFieldHint}>CPF já cadastrado</span>}
        </div>
      </div>
    )}
  </div>
);

export default CustomerForm;
