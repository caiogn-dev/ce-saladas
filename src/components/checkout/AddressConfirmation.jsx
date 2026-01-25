/**
 * Address confirmation component - shows detected address and asks for confirmation
 */
import React from 'react';
import styles from '../../styles/Checkout.module.css';

const AddressConfirmation = ({
  detectedAddress,
  routeInfo,
  deliveryInfo,
  onConfirm,
  onEdit,
  onManualEntry,
  loading
}) => {
  if (!detectedAddress) return null;

  const formatDistance = (km) => {
    if (!km) return '';
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  return (
    <div className={styles.addressConfirmation}>
      <div className={styles.confirmationHeader}>
        <div className={styles.locationIcon}>📍</div>
        <h3>Confirme seu endereço de entrega</h3>
      </div>

      <div className={styles.detectedAddressCard}>
        <div className={styles.addressMain}>
          <p className={styles.streetAddress}>
            {detectedAddress.street}
            {detectedAddress.number && `, ${detectedAddress.number}`}
          </p>
          {detectedAddress.neighborhood && (
            <p className={styles.neighborhood}>{detectedAddress.neighborhood}</p>
          )}
          <p className={styles.cityState}>
            {detectedAddress.city}
            {detectedAddress.state && ` - ${detectedAddress.state}`}
            {detectedAddress.zip_code && ` • CEP: ${detectedAddress.zip_code}`}
          </p>
        </div>

        {(routeInfo || deliveryInfo) && (
          <div className={styles.deliveryDetails}>
            {routeInfo && (
              <div className={styles.routeInfo}>
                <span className={styles.routeIcon}>🚗</span>
                <span>{formatDistance(routeInfo.distance_km)}</span>
                {routeInfo.duration_minutes && (
                  <span className={styles.routeDuration}>
                    • {formatDuration(routeInfo.duration_minutes)}
                  </span>
                )}
              </div>
            )}
            {deliveryInfo && (
              <div className={styles.feeInfo}>
                <span className={styles.feeLabel}>Taxa de entrega:</span>
                <span className={styles.feeValue}>
                  {deliveryInfo.fee === 0 ? (
                    <span className={styles.freeDelivery}>Grátis!</span>
                  ) : (
                    `R$ ${deliveryInfo.fee.toFixed(2)}`
                  )}
                </span>
                {deliveryInfo.zone_name && (
                  <span className={styles.zoneName}>({deliveryInfo.zone_name})</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.numberQuestion}>
        <label className={styles.questionLabel}>
          O número está correto?
        </label>
        <p className={styles.questionHint}>
          {detectedAddress.number 
            ? `Número detectado: ${detectedAddress.number}`
            : 'Não foi possível detectar o número. Por favor, confirme ou edite.'}
        </p>
      </div>

      <div className={styles.confirmationActions}>
        <button
          type="button"
          className={styles.confirmButton}
          onClick={onConfirm}
          disabled={loading}
        >
          ✓ Sim, está correto
        </button>
        <button
          type="button"
          className={styles.editButton}
          onClick={onEdit}
          disabled={loading}
        >
          ✏️ Editar número/complemento
        </button>
        <button
          type="button"
          className={styles.manualButton}
          onClick={onManualEntry}
          disabled={loading}
        >
          📝 Inserir outro endereço
        </button>
      </div>
    </div>
  );
};

export default AddressConfirmation;
