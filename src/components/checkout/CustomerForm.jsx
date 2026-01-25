/**
 * Customer information form component
 */
import React from 'react';
import styles from '../../styles/Checkout.module.css';

const CustomerForm = ({
  formData,
  errors,
  onChange,
  existingFields = {},
  hasPreviousOrder = false,
  disabled = false
}) => {
  // If user has previous order and all fields are filled, show minimal form
  const showMinimalForm = hasPreviousOrder && existingFields.name && existingFields.email && existingFields.phone;

  if (showMinimalForm) {
    return (
      <div className={styles.customerFormMinimal}>
        <div className={styles.savedCustomerInfo}>
          <div className={styles.savedInfoHeader}>
            <span className={styles.checkIcon}>✓</span>
            <span>Dados salvos</span>
          </div>
          <div className={styles.savedInfoDetails}>
            <p><strong>{formData.name}</strong></p>
            <p>{formData.email}</p>
            <p>{formData.phone}</p>
          </div>
        </div>

        {/* Only show CPF if not already saved */}
        {!existingFields.cpf && (
          <div className={styles.formGroup}>
            <label className={styles.label}>CPF *</label>
            <input
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={onChange}
              placeholder="000.000.000-00"
              className={`${styles.input} ${errors.cpf ? styles.inputError : ''}`}
              disabled={disabled}
            />
            {errors.cpf && <span className={styles.errorText}>{errors.cpf}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.customerForm}>
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
        />
        {errors.name && <span className={styles.errorText}>{errors.name}</span>}
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>E-mail *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="seu@email.com"
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            disabled={disabled || existingFields.email}
          />
          {errors.email && <span className={styles.errorText}>{errors.email}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Telefone *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            placeholder="(11) 99999-9999"
            className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
            disabled={disabled || existingFields.phone}
          />
          {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>CPF *</label>
        <input
          type="text"
          name="cpf"
          value={formData.cpf}
          onChange={onChange}
          placeholder="000.000.000-00"
          className={`${styles.input} ${errors.cpf ? styles.inputError : ''}`}
          disabled={disabled || existingFields.cpf}
        />
        {errors.cpf && <span className={styles.errorText}>{errors.cpf}</span>}
        {existingFields.cpf && (
          <span className={styles.savedFieldHint}>CPF já cadastrado</span>
        )}
      </div>
    </div>
  );
};

export default CustomerForm;
