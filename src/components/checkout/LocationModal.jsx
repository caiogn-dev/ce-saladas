/**
 * Location Modal - Popup for GPS detection and address selection
 */
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Clock3, Hand, Hash, Home, MapPin, MapPinned, Navigation, Route, Wallet } from 'lucide-react';
import styles from '../../styles/CheckoutModal.module.css';
import { STORE_LOCATION, formatDistanceKm, formatDurationMinutes, formatMoney, isZeroAmount } from './utils';
import SavedAddressPicker from './SavedAddressPicker';
import DeliveryMapSimple from './DeliveryMapSimple';

const resolveDetectedNumber = (value) => value?.address?.number || value?.number || '';

const LocationModal = ({
  isOpen,
  onClose,
  onConfirm,
  geolocation,
  delivery,
  savedAddress = null,
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
  const [mapSelectionReady, setMapSelectionReady] = useState(false);
  // Tracks whether each field has been touched by the user — prevents GPS re-fill after manual edit
  const [touched, setTouched] = useState({ street: false, neighborhood: false, number: false, complement: false });
  const handleAddressFound = useCallback(() => {}, []);

  const currentStep = manualMode ? 'map' : (detectedAddress ? 'confirm' : 'detecting');

  // Pre-fill fields when GPS address arrives — but only for fields the user hasn't touched yet
  useEffect(() => {
    if (!detectedAddress) return;
    setAddressStreet((prev) => (touched.street ? prev : (detectedAddress.street || '')));
    setAddressNeighborhood((prev) => (touched.neighborhood ? prev : (detectedAddress.neighborhood || '')));
    setAddressNumber((prev) => (touched.number ? prev : (detectedAddress.number || '')));
    setAddressComplement((prev) => (touched.complement ? prev : (detectedAddress.complement || '')));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedAddress]);

  useEffect(() => {
    if (!isOpen || manualMode || detectedAddress || position) return undefined;

    let cancelled = false;

    detectLocation().then((result) => {
      if (cancelled) return;

      if (!result || !result.address) {
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
    setMapSelectionReady(false);
    setTouched({ street: false, neighborhood: false, number: false, complement: false });
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
      if (!result || !result.address) {
        setManualMode(true);
      }
    });
  }, [detectLocation]);

  const handleMapLocationSelect = useCallback(async (location) => {
    const lat = location?.lat || location?.latitude;
    const lng = location?.lng || location?.longitude;

    if (!lat || !lng) return;

    const addressOverride = {
      street: location?.street || '',
      number: location?.number || '',
      neighborhood: location?.neighborhood || '',
      city: location?.city || '',
      state: location?.state || '',
      zip_code: location?.zip_code || '',
      display_name: location?.display_name || location?.formatted_address || '',
      lat,
      lng,
    };

    const updatedAddress = await updateLocation(lat, lng, addressOverride);
    setMapSelectionReady(Boolean(updatedAddress));
  }, [updateLocation]);

  const handleUseSelectedPoint = useCallback(() => {
    setManualMode(false);
    setMapSelectionReady(false);
  }, []);

  // Values used for display in the inputs — state is the source of truth after GPS pre-fill
  const resolvedStreet = addressStreet;
  const resolvedNeighborhood = addressNeighborhood;
  const resolvedNumber = addressNumber;
  const resolvedComplement = addressComplement;
  // For validation: require a number only when both state and detected GPS are empty
  const requiresNumber = !addressNumber.trim() && !resolveDetectedNumber(detectedAddress);

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
      zone_name: 'Área de entrega',
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

  const isAddressReady = (
    Boolean(addressStreet.trim())
    && Boolean(addressNeighborhood.trim())
    && Boolean(addressNumber.trim() || !requiresNumber)
  );
  const hasInvalidDeliverySelection = detectedDeliveryInfo?.is_valid === false;

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>

        {/* Sticky header — always visible, even when content scrolls */}
        <div className={styles.stickyHeader}>
          <button className={styles.closeButton} onClick={handleClose}>×</button>
        </div>

        {/* Scrollable body */}
        <div className={styles.scrollBody}>

        {/* Saved address quick-select — shown before GPS detection */}
        {savedAddress && currentStep === 'detecting' && (
          <SavedAddressPicker
            savedAddress={savedAddress}
            onUse={(addr) => onConfirm({ address: addr, deliveryInfo: null })}
            onIgnore={() => {/* continue with GPS flow */}}
          />
        )}

        {currentStep === 'detecting' && (
          <div className={styles.detectingStep}>
            <div className={styles.gpsAnimation}>
              <div className={styles.pulseRing} />
              <div className={styles.gpsIcon}><MapPinned size={42} /></div>
            </div>
            <h2>Detectando sua localização...</h2>
            <p>Permita o acesso à localização para calcularmos a taxa de entrega.</p>

            {error ? (
              <div className={styles.errorBox}>
                <p>{error}</p>
                <div className={styles.errorActions}>
                  <button onClick={handleRetryGps} className={styles.retryBtn}>
                    Tentar novamente
                  </button>
                  <button onClick={handleSkipGps} className={styles.skipBtn}>
                    Inserir endereço manualmente
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleSkipGps} className={styles.skipLink}>
                Prefiro inserir o endereço manualmente
              </button>
            )}
          </div>
        )}

        {currentStep === 'map' && (
          <div className={styles.mapStep}>
            <h2>Selecione seu endereço no mapa</h2>

            <div className={styles.mapHintBanner}>
              <span className={styles.mapHintIcon}><Hand size={18} /></span>
              <span>Toque no mapa para marcar sua localização exata</span>
            </div>

            <div className={styles.mapContainer}>
              <DeliveryMapSimple
                storeLocation={STORE_LOCATION}
                customerLocation={position}
                routePolyline={null}
                onLocationSelect={handleMapLocationSelect}
                onAddressFound={handleAddressFound}
                enableSelection={true}
                showSearch={true}
                showGpsButton={true}
                height="350px"
              />
            </div>

            {loading && (
              <div className={styles.loadingOverlay}>
                <div className={styles.spinner} />
                <p>Buscando endereço...</p>
              </div>
            )}

            {detectedAddress && (
              <div className={styles.addressCardInline}>
                <div className={styles.addressMainInfo}>
                  <div className={styles.addressIcon}><MapPin size={18} /></div>
                  <div className={styles.addressText}>
                    <p className={styles.streetName}>
                      {detectedAddress.street || detectedAddress.display_name || 'Ponto selecionado'}
                      {detectedAddress.number && `, ${detectedAddress.number}`}
                    </p>
                    <p className={styles.addressSecondary}>
                      {detectedAddress.neighborhood && `${detectedAddress.neighborhood} • `}
                      {detectedAddress.city}
                      {detectedAddress.state && ` - ${detectedAddress.state}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {hasInvalidDeliverySelection && (
              <div className={styles.errorBox}>
                <p>{detectedDeliveryInfo?.message || error || 'Esse ponto está fora da área de entrega.'}</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 'confirm' && detectedAddress && (
          <div className={styles.confirmStep}>
            <div className={styles.confirmHeader}>
              <h2>Endereço de entrega</h2>
              <button
                onClick={handleSkipGps}
                className={styles.editLocationBtn}
                title="Clique para ajustar a localização no mapa"
              >
                Ajustar no mapa
              </button>
            </div>

            <div
              className={styles.mapContainerClickable}
              onClick={handleSkipGps}
              title="Clique para ajustar a localização"
            >
              <DeliveryMapSimple
                storeLocation={STORE_LOCATION}
                customerLocation={position}
                routePolyline={null}
                onAddressFound={handleAddressFound}
                enableSelection={false}
                showSearch={false}
                showGpsButton={false}
                height="200px"
              />
              <div className={styles.mapEditOverlay}>
                <span>Toque para ajustar</span>
              </div>
            </div>

            <div className={styles.addressCardInline}>
              <div className={styles.addressMainInfo}>
                <div className={styles.addressIcon}><MapPin size={18} /></div>
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
                    <span className={styles.complementIcon}><MapPinned size={16} /></span>
                    Logradouro *
                  </label>
                  <input
                    type="text"
                    className={styles.complementInput}
                    placeholder="Rua, avenida, quadra..."
                    value={resolvedStreet}
                    onChange={(event) => {
                      setTouched((t) => ({ ...t, street: true }));
                      setAddressStreet(event.target.value);
                    }}
                  />
                </div>

                <div className={styles.complementGrid}>
                  <div className={styles.complementField}>
                    <label className={styles.complementLabel}>
                      <span className={styles.complementIcon}><Hash size={16} /></span>
                      Número / Lote *
                    </label>
                    <input
                      type="text"
                      inputMode="text"
                      className={styles.complementInput}
                      placeholder="Ex: 15, Lote 7, Apto 302..."
                      value={resolvedNumber}
                      onChange={(event) => {
                        setTouched((t) => ({ ...t, number: true }));
                        setAddressNumber(event.target.value);
                      }}
                    />
                    {requiresNumber && (
                      <p className={styles.complementHint}>
                        Informe o número ou lote para confirmar o endereço.
                      </p>
                    )}
                    {/* Restore GPS number if user wants to revert after editing */}
                    {touched.number && detectedAddress?.number && addressNumber.trim() !== detectedAddress.number && (
                      <button
                        type="button"
                        className={styles.revertHint}
                        onClick={() => {
                          setAddressNumber(detectedAddress.number);
                          setTouched((t) => ({ ...t, number: false }));
                        }}
                      >
                        Usar número detectado: {detectedAddress.number}
                      </button>
                    )}
                  </div>

                  <div className={styles.complementField}>
                    <label className={styles.complementLabel}>
                      <span className={styles.complementIcon}><MapPin size={16} /></span>
                      Bairro *
                    </label>
                    <input
                      type="text"
                      className={styles.complementInput}
                      placeholder="Bairro"
                      value={resolvedNeighborhood}
                      onChange={(event) => {
                        setTouched((t) => ({ ...t, neighborhood: true }));
                        setAddressNeighborhood(event.target.value);
                      }}
                    />
                  </div>
                </div>

                <div className={styles.complementField}>
                  <label className={styles.complementLabel}>
                    <span className={styles.complementIcon}><Home size={16} /></span>
                    Complemento / referência
                  </label>
                  <input
                    type="text"
                    className={styles.complementInput}
                    placeholder="Apto, bloco, portão, referência (opcional)"
                    value={resolvedComplement}
                    onChange={(event) => {
                      setTouched((t) => ({ ...t, complement: true }));
                      setAddressComplement(event.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.deliveryStatsCompact}>
              <div className={styles.statCompact}>
                <span className={styles.statIcon}><Route size={16} /></span>
                <span>
                  {hasInvalidDeliverySelection
                    ? 'Fora da área'
                    : routeInfo?.distance_km
                    ? formatDistanceKm(routeInfo.distance_km)
                    : detectedDeliveryInfo?.distance_km
                    ? formatDistanceKm(detectedDeliveryInfo.distance_km)
                    : '—'}
                </span>
              </div>
              <div className={styles.statDivider}>•</div>
              <div className={styles.statCompact}>
                <span className={styles.statIcon}><Clock3 size={16} /></span>
                <span>
                  {hasInvalidDeliverySelection
                    ? '—'
                    : routeInfo?.duration_minutes
                    ? formatDurationMinutes(routeInfo.duration_minutes)
                    : detectedDeliveryInfo?.estimated_minutes
                    ? formatDurationMinutes(detectedDeliveryInfo.estimated_minutes)
                    : '—'}
                </span>
              </div>
              <div className={styles.statDivider}>•</div>
              <div className={`${styles.statCompact} ${styles.statFee}`}>
                <span className={styles.statIcon}><Wallet size={16} /></span>
                <span className={styles.feeValue}>
                  {hasInvalidDeliverySelection
                    ? 'Indisponível'
                    : isZeroAmount(detectedDeliveryInfo?.fee ?? delivery.deliveryInfo?.fee)
                    ? 'Grátis'
                    : `R$ ${formatMoney(detectedDeliveryInfo?.fee ?? delivery.deliveryInfo?.fee)}`}
                </span>
              </div>
            </div>

          </div>
        )}

        </div>{/* end scrollBody */}

        {/* Sticky footer — confirm button always accessible, above keyboard */}
        {currentStep === 'map' && detectedAddress && (
          <div className={styles.stickyFooter}>
            <button
              onClick={handleUseSelectedPoint}
              className={styles.confirmBtnFull}
              disabled={!mapSelectionReady || hasInvalidDeliverySelection}
            >
              <span className={styles.confirmBtnIcon}><Navigation size={16} /></span>
              Usar este ponto
            </button>
          </div>
        )}

        {currentStep === 'confirm' && detectedAddress && (
          <div className={styles.stickyFooter}>
            <button
              onClick={handleConfirmLocation}
              className={styles.confirmBtnFull}
              disabled={!isAddressReady || hasInvalidDeliverySelection}
            >
              <span className={styles.confirmBtnIcon}><Navigation size={16} /></span>
              Confirmar endereço
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default LocationModal;
