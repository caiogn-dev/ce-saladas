/**
 * GPS loading state component
 */
import React from 'react';
import styles from '../../styles/Checkout.module.css';

const GpsLoadingState = ({ error, onRetry, onManualEntry }) => {
  if (error) {
    return (
      <div className={styles.gpsError}>
        <div className={styles.gpsErrorIcon}>📍</div>
        <p className={styles.gpsErrorMessage}>{error}</p>
        <div className={styles.gpsErrorActions}>
          <button
            type="button"
            className={styles.retryButton}
            onClick={onRetry}
          >
            🔄 Tentar novamente
          </button>
          <button
            type="button"
            className={styles.manualEntryButton}
            onClick={onManualEntry}
          >
            ✏️ Inserir manualmente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gpsLoading}>
      <div className={styles.gpsLoadingSpinner}>
        <div className={styles.spinner}></div>
      </div>
      <p className={styles.gpsLoadingText}>Detectando sua localização...</p>
      <p className={styles.gpsLoadingHint}>
        Permita o acesso à localização para preenchimento automático
      </p>
      <button
        type="button"
        className={styles.skipGpsButton}
        onClick={onManualEntry}
      >
        Pular e inserir manualmente
      </button>
    </div>
  );
};

export default GpsLoadingState;
