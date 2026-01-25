/**
 * Address form component
 */
import React from 'react';
import styles from '../../styles/Checkout.module.css';
import { BRAZILIAN_STATES } from './utils';

const AddressForm = ({
  formData,
  errors,
  onChange,
  onCEPBlur,
  loadingCEP,
  showMapButton = true,
  onOpenMap,
  disabled = false
}) => {
  return (
    <div className={styles.addressForm}>
      {showMapButton && (
        <div className={styles.mapButtonContainer}>
          <button
            type="button"
            className={styles.selectOnMapButton}
            onClick={onOpenMap}
            disabled={disabled}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Selecionar no mapa
          </button>
        </div>
      )}

      <div className={styles.formRow}>
        <div className={styles.formGroup} style={{ flex: '0 0 140px' }}>
          <label className={styles.label}>CEP *</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              name="zip_code"
              value={formData.zip_code}
              onChange={onChange}
              onBlur={onCEPBlur}
              placeholder="00000-000"
              className={`${styles.input} ${errors.zip_code ? styles.inputError : ''}`}
              disabled={disabled || loadingCEP}
            />
            {loadingCEP && <span className={styles.inputSpinner}>⏳</span>}
          </div>
          {errors.zip_code && <span className={styles.errorText}>{errors.zip_code}</span>}
        </div>

        <div className={styles.formGroup} style={{ flex: 1 }}>
          <label className={styles.label}>Endereço *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={onChange}
            placeholder="Rua, Avenida, etc."
            className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
            disabled={disabled}
          />
          {errors.address && <span className={styles.errorText}>{errors.address}</span>}
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup} style={{ flex: '0 0 100px' }}>
          <label className={styles.label}>Número *</label>
          <input
            type="text"
            name="number"
            value={formData.number || ''}
            onChange={onChange}
            placeholder="Nº"
            className={`${styles.input} ${errors.number ? styles.inputError : ''}`}
            disabled={disabled}
          />
          {errors.number && <span className={styles.errorText}>{errors.number}</span>}
        </div>

        <div className={styles.formGroup} style={{ flex: 1 }}>
          <label className={styles.label}>Complemento</label>
          <input
            type="text"
            name="complement"
            value={formData.complement || ''}
            onChange={onChange}
            placeholder="Apto, Bloco, etc. (opcional)"
            className={styles.input}
            disabled={disabled}
          />
        </div>

        <div className={styles.formGroup} style={{ flex: 1 }}>
          <label className={styles.label}>Bairro</label>
          <input
            type="text"
            name="neighborhood"
            value={formData.neighborhood || ''}
            onChange={onChange}
            placeholder="Bairro"
            className={styles.input}
            disabled={disabled}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup} style={{ flex: 1 }}>
          <label className={styles.label}>Cidade *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={onChange}
            placeholder="Cidade"
            className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
            disabled={disabled}
          />
          {errors.city && <span className={styles.errorText}>{errors.city}</span>}
        </div>

        <div className={styles.formGroup} style={{ flex: '0 0 180px' }}>
          <label className={styles.label}>Estado *</label>
          <select
            name="state"
            value={formData.state}
            onChange={onChange}
            className={`${styles.select} ${errors.state ? styles.inputError : ''}`}
            disabled={disabled}
          >
            <option value="">Selecione</option>
            {BRAZILIAN_STATES.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
          {errors.state && <span className={styles.errorText}>{errors.state}</span>}
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
