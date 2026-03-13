/**
 * Customer information form component
 */
import React from 'react';
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
}) => (
  <div className={styles.customerForm}>
    <div className={styles.identificationCard}>
      <div className={styles.formSectionHeader}>
        <span className={styles.formSectionEyebrow}>Identificacao</span>
        <p className={styles.formSectionDescription}>
          Informe seu email e celular para continuar. Nao pedimos senha para finalizar o pedido.
        </p>
      </div>

      {!isIdentificationComplete ? (
        <>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                placeholder="seu@email.com"
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                disabled={disabled}
                autoComplete="email"
              />
              {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Celular *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={onChange}
                placeholder="(11) 99999-9999"
                className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                disabled={disabled}
                autoComplete="tel"
              />
              {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
            </div>
          </div>

          {errors.identification && (
            <div className={styles.identificationError}>{errors.identification}</div>
          )}

          <button
            type="button"
            className={styles.identificationButton}
            onClick={onCompleteIdentification}
            disabled={disabled}
          >
            Continuar
          </button>

          <p className={styles.identificationHelp}>
            Usaremos esses dados para confirmacao do pedido, contato de entrega e retomada rapida do checkout.
          </p>
        </>
      ) : (
        <div className={styles.identificationSummary}>
          <div className={styles.identificationSummaryItem}>
            <span className={styles.identificationSummaryLabel}>Email</span>
            <strong>{formData.email}</strong>
          </div>
          <div className={styles.identificationSummaryItem}>
            <span className={styles.identificationSummaryLabel}>Celular</span>
            <strong>{formData.phone}</strong>
          </div>
          <button
            type="button"
            className={styles.identificationLink}
            onClick={onEditIdentification}
            disabled={disabled}
          >
            Editar identificacao
          </button>
        </div>
      )}
    </div>

    {isIdentificationComplete && (
      <div className={styles.personalDataCard}>
        <div className={styles.formSectionHeader}>
          <span className={styles.formSectionEyebrow}>Dados pessoais</span>
          <p className={styles.formSectionDescription}>
            Preencha apenas o necessario para concluir o pedido.
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
          {existingFields.cpf && (
            <span className={styles.savedFieldHint}>CPF ja cadastrado</span>
          )}
        </div>
      </div>
    )}
  </div>
);

export default CustomerForm;
