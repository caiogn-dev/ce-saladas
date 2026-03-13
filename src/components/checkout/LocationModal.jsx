/**
 * Location Modal - Popup for GPS detection and address selection
 */
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../styles/CheckoutModal.module.css';
import { STORE_LOCATION } from './utils';
import InteractiveMap from '../InteractiveMap';

const resolveDetectedNumber = (value) => value?.address?.number || value?.number || '';

const LocationModal = ({
  isOpen,
  onClose,
  onConfirm,
  geolocation,
  delivery,
}) => {
  const {
    position,
    detectedAddress,
    deliveryInfo: detectedDeliveryInfo,
    routeInfo,
    loading,
    error,
    detectLocation,
    updateLocation,
  } = geolocation;

  const [manualMode, setManualMode] = useState(false);
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');

  const currentStep = manualMode ? 'map' : (detectedAddress ? 'confirm' : 'detecting');

  useEffect(() => {
    if (!isOpen || manualMode || detectedAddress || position) return undefined;

    let cancelled = false;

    detectLocation().then((result) => {
      if (cancelled) return;

      if (!result) {
        setManualMode(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, manualMode, detectedAddress, position, detectLocation]);

  const resetLocalState = useCallback(() => {
    setManualMode(false);
    setAddressStreet('');
    setAddressNeighborhood('');
    setAddressNumber('');
    setAddressComplement('');
  }, []);

  const handleClose = useCallback(() => {
    resetLocalState();
    onClose();
  }, [onClose, resetLocalState]);

  const handleSkipGps = useCallback(() => {
    setManualMode(true);
  }, []);

  const handleRetryGps = useCallback(() => {
    setManualMode(false);
    detectLocation().then((result) => {
      if (!result) {
        setManualMode(true);
      }
    });
  }, [detectLocation]);

  const handleMapLocationSelect = useCallback(async (location) => {
    const lat = location?.lat || location?.latitude;
    const lng = location?.lng || location?.longitude;

    if (!lat || !lng) return;

    await updateLocation(lat, lng);
    setManualMode(false);
  }, [updateLocation]);

  const resolvedStreet = addressStreet.trim() || detectedAddress?.street || '';
  const resolvedNeighborhood = addressNeighborhood.trim() || detectedAddress?.neighborhood || '';
  const resolvedNumber = addressNumber.trim() || detectedAddress?.number || '';
  const resolvedComplement = addressComplement.trim() || detectedAddress?.complement || '';
  const requiresNumber = !resolvedNumber && !resolveDetectedNumber(detectedAddress);

  const handleConfirmLocation = useCallback(() => {
    if (!detectedAddress) return;

    const mergedAddress = {
      ...detectedAddress,
      street: resolvedStreet,
      neighborhood: resolvedNeighborhood,
      number: resolvedNumber,
      complement: resolvedComplement,
    };

    const resolvedDeliveryInfo = detectedDeliveryInfo || delivery.deliveryInfo || {
      fee: 0,
      zone_name: 'Area de entrega',
    };

    onConfirm({
      address: mergedAddress,
      position,
      deliveryInfo: resolvedDeliveryInfo,
      routeInfo,
    });

    resetLocalState();
  }, [
    delivery.deliveryInfo,
    detectedAddress,
    detectedDeliveryInfo,
    onConfirm,
    position,
    resetLocalState,
    resolvedComplement,
    resolvedNeighborhood,
    resolvedNumber,
    resolvedStreet,
    routeInfo,
  ]);

  const formatDistance = (km) => {
    if (!km) return '';
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)} km`;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  const isAddressReady = (
    Boolean(resolvedStreet)
    && Boolean(resolvedNeighborhood)
    && Boolean(resolvedNumber || !requiresNumber)
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
        <button className={styles.closeButton} onClick={handleClose}>×</button>

        {currentStep === 'detecting' && (
          <div className={styles.detectingStep}>
            <div className={styles.gpsAnimation}>
              <div className={styles.pulseRing} />
              <div className={styles.gpsIcon}>📍</div>
            </div>
            <h2>Detectando sua localizacao...</h2>
            <p>Permita o acesso a localizacao para calcularmos a taxa de entrega.</p>

            {error ? (
              <div className={styles.errorBox}>
                <p>{error}</p>
                <div className={styles.errorActions}>
                  <button onClick={handleRetryGps} className={styles.retryBtn}>
                    Tentar novamente
                  </button>
                  <button onClick={handleSkipGps} className={styles.skipBtn}>
                    Inserir endereco manualmente
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleSkipGps} className={styles.skipLink}>
                Prefiro inserir o endereco manualmente
              </button>
            )}
          </div>
        )}

        {currentStep === 'map' && (
          <div className={styles.mapStep}>
            <h2>Selecione seu endereco no mapa</h2>

            <div className={styles.mapHintBanner}>
              <span className={styles.mapHintIcon}>👆</span>
              <span>Toque no mapa para marcar sua localizacao exata</span>
            </div>

            <div className={styles.mapContainer}>
              <InteractiveMap
                storeLocation={STORE_LOCATION}
                customerLocation={position}
                routePolyline={routeInfo?.polyline}
                onLocationSelect={handleMapLocationSelect}
                enableSelection={true}
                showStoreMarker={true}
                showCustomerMarker={!!position}
                height="350px"
              />
            </div>

            {loading && (
              <div className={styles.loadingOverlay}>
                <div className={styles.spinner} />
                <p>Buscando endereco...</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 'confirm' && detectedAddress && (
          <div className={styles.confirmStep}>
            <div className={styles.confirmHeader}>
              <h2>Endereco de entrega</h2>
              <button
                onClick={handleSkipGps}
                className={styles.editLocationBtn}
                title="Clique para ajustar a localizacao no mapa"
              >
                Ajustar no mapa
              </button>
            </div>

            <div
              className={styles.mapContainerClickable}
              onClick={handleSkipGps}
              title="Clique para ajustar a localizacao"
            >
              <InteractiveMap
                storeLocation={STORE_LOCATION}
                customerLocation={position}
                routePolyline={routeInfo?.polyline}
                enableSelection={false}
                showStoreMarker={true}
                showCustomerMarker={true}
                height="200px"
              />
              <div className={styles.mapEditOverlay}>
                <span>Toque para ajustar</span>
              </div>
            </div>

            <div className={styles.addressCardInline}>
              <div className={styles.addressMainInfo}>
                <div className={styles.addressIcon}>📍</div>
                <div className={styles.addressText}>
                  <p className={styles.streetName}>
                    {resolvedStreet}
                    {resolvedNumber && `, ${resolvedNumber}`}
                  </p>
                  <p className={styles.addressSecondary}>
                    {resolvedNeighborhood && `${resolvedNeighborhood} • `}
                    {detectedAddress.city}
                    {detectedAddress.state && ` - ${detectedAddress.state}`}
                  </p>
                </div>
              </div>

              <div className={styles.complementSection}>
                <div className={styles.complementField}>
                  <label className={styles.complementLabel}>
                    <span className={styles.complementIcon}>🛣️</span>
                    Logradouro *
                  </label>
                  <input
                    type="text"
                    className={styles.complementInput}
                    placeholder="Rua, avenida, quadra..."
                    value={resolvedStreet}
                    onChange={(event) => setAddressStreet(event.target.value)}
                  />
                </div>

                <div className={styles.complementGrid}>
                  <div className={styles.complementField}>
                    <label className={styles.complementLabel}>
                      <span className={styles.complementIcon}>#</span>
                      Numero *
                    </label>
                    <input
                      type="text"
                      className={styles.complementInput}
                      placeholder="Ex: 123"
                      value={resolvedNumber}
                      onChange={(event) => setAddressNumber(event.target.value)}
                    />
                    {requiresNumber && (
                      <p className={styles.complementHint}>
                        Nao detectamos o numero. Informe para liberar a entrega.
                      </p>
                    )}
                  </div>

                  <div className={styles.complementField}>
                    <label className={styles.complementLabel}>
                      <span className={styles.complementIcon}>📌</span>
                      Bairro *
                    </label>
                    <input
                      type="text"
                      className={styles.complementInput}
                      placeholder="Bairro"
                      value={resolvedNeighborhood}
                      onChange={(event) => setAddressNeighborhood(event.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.complementField}>
                  <label className={styles.complementLabel}>
                    <span className={styles.complementIcon}>🏠</span>
                    Complemento / referencia
                  </label>
                  <input
                    type="text"
                    className={styles.complementInput}
                    placeholder="Apto, bloco, portao, referencia (opcional)"
                    value={resolvedComplement}
                    onChange={(event) => setAddressComplement(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.deliveryStatsCompact}>
              <div className={styles.statCompact}>
                <span className={styles.statIcon}>📏</span>
                <span>
                  {routeInfo?.distance_km
                    ? formatDistance(routeInfo.distance_km)
                    : detectedDeliveryInfo?.distance_km
                    ? formatDistance(detectedDeliveryInfo.distance_km)
                    : '—'}
                </span>
              </div>
              <div className={styles.statDivider}>•</div>
              <div className={styles.statCompact}>
                <span className={styles.statIcon}>⏱️</span>
                <span>
                  {routeInfo?.duration_minutes
                    ? formatDuration(routeInfo.duration_minutes)
                    : detectedDeliveryInfo?.estimated_minutes
                    ? formatDuration(detectedDeliveryInfo.estimated_minutes)
                    : '—'}
                </span>
              </div>
              <div className={styles.statDivider}>•</div>
              <div className={`${styles.statCompact} ${styles.statFee}`}>
                <span className={styles.statIcon}>💰</span>
                <span className={styles.feeValue}>
                  {(detectedDeliveryInfo?.fee ?? delivery.deliveryInfo?.fee) === 0
                    ? 'Gratis'
                    : `R$ ${(detectedDeliveryInfo?.fee ?? delivery.deliveryInfo?.fee ?? 0).toFixed(2)}`}
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirmLocation}
              className={styles.confirmBtnFull}
              disabled={!isAddressReady}
            >
              <span className={styles.confirmBtnIcon}>✓</span>
              Confirmar endereco
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationModal;
