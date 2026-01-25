/**
 * Location Modal - Popup for GPS detection and address selection
 * 
 * Features:
 * - GPS auto-detection
 * - Manual map selection
 * - Address complement field (house number, apartment, etc.)
 * - Inline confirmation with edit hint
 */
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../styles/CheckoutModal.module.css';
import { STORE_LOCATION } from './utils';

// Import InteractiveMap directly - it already has 'use client' directive
import InteractiveMap from '../InteractiveMap';

const LocationModal = ({
  isOpen,
  onClose,
  onConfirm,
  geolocation,
  delivery
}) => {
  const [step, setStep] = useState('detecting'); // 'detecting' | 'map' | 'confirm'
  const [manualMode, setManualMode] = useState(false);
  const [complement, setComplement] = useState('');
  const [showComplementHint, setShowComplementHint] = useState(false);

  // Start GPS detection when modal opens
  useEffect(() => {
    if (isOpen && !geolocation.position && !manualMode) {
      setStep('detecting');
      geolocation.detectLocation().then((result) => {
        if (result) {
          setStep('confirm');
          // Show complement hint if no house number detected
          if (!result.address?.number) {
            setShowComplementHint(true);
          }
        } else {
          setStep('map');
          setManualMode(true);
        }
      });
    } else if (isOpen && geolocation.position) {
      setStep('confirm');
      // Show complement hint if no house number
      if (!geolocation.detectedAddress?.number) {
        setShowComplementHint(true);
      }
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setComplement('');
      setShowComplementHint(false);
    }
  }, [isOpen]);

  const handleSkipGps = useCallback(() => {
    setManualMode(true);
    setStep('map');
  }, []);

  const handleRetryGps = useCallback(() => {
    setManualMode(false);
    setStep('detecting');
    geolocation.detectLocation().then((result) => {
      if (result) {
        setStep('confirm');
        if (!result.address?.number) {
          setShowComplementHint(true);
        }
      } else {
        setStep('map');
        setManualMode(true);
      }
    });
  }, [geolocation]);

  const handleMapLocationSelect = useCallback(async (location) => {
    const lat = location?.lat || location?.latitude;
    const lng = location?.lng || location?.longitude;
    
    if (lat && lng) {
      const result = await geolocation.updateLocation(lat, lng);
      setStep('confirm');
      // Show complement hint if no house number
      if (!result?.number && !geolocation.detectedAddress?.number) {
        setShowComplementHint(true);
      }
    }
  }, [geolocation]);

  const handleConfirmLocation = useCallback(() => {
    if (geolocation.detectedAddress) {
      // Merge complement into address
      const addressWithComplement = {
        ...geolocation.detectedAddress,
        complement: complement.trim() || geolocation.detectedAddress.complement || ''
      };
      
      // Prefer geolocation.deliveryInfo as it's the most recent from the API
      const deliveryData = geolocation.deliveryInfo || delivery.deliveryInfo || { fee: 0, zone_name: 'Área de entrega' };
      onConfirm({
        address: addressWithComplement,
        position: geolocation.position,
        deliveryInfo: deliveryData,
        routeInfo: geolocation.routeInfo
      });
    }
  }, [geolocation, delivery, onConfirm, complement]);

  const handleEditLocation = useCallback(() => {
    setStep('map');
  }, []);

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

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        {/* Step 1: Detecting GPS */}
        {step === 'detecting' && (
          <div className={styles.detectingStep}>
            <div className={styles.gpsAnimation}>
              <div className={styles.pulseRing}></div>
              <div className={styles.gpsIcon}>📍</div>
            </div>
            <h2>Detectando sua localização...</h2>
            <p>Permita o acesso à localização para calcularmos a taxa de entrega</p>
            
            {geolocation.error && (
              <div className={styles.errorBox}>
                <p>{geolocation.error}</p>
                <div className={styles.errorActions}>
                  <button onClick={handleRetryGps} className={styles.retryBtn}>
                    🔄 Tentar novamente
                  </button>
                  <button onClick={handleSkipGps} className={styles.skipBtn}>
                    Inserir endereço manualmente
                  </button>
                </div>
              </div>
            )}

            {!geolocation.error && (
              <button onClick={handleSkipGps} className={styles.skipLink}>
                Prefiro inserir o endereço manualmente
              </button>
            )}
          </div>
        )}

        {/* Step 2: Map Selection */}
        {step === 'map' && (
          <div className={styles.mapStep}>
            <h2>Selecione seu endereço no mapa</h2>
            
            {/* Interactive hint banner */}
            <div className={styles.mapHintBanner}>
              <span className={styles.mapHintIcon}>👆</span>
              <span>Toque no mapa para marcar sua localização exata</span>
            </div>

            <div className={styles.mapContainer}>
              <InteractiveMap
                storeLocation={STORE_LOCATION}
                customerLocation={geolocation.position}
                routePolyline={geolocation.routeInfo?.polyline}
                onLocationSelect={handleMapLocationSelect}
                enableSelection={true}
                showStoreMarker={true}
                showCustomerMarker={!!geolocation.position}
                height="350px"
              />
            </div>

            {geolocation.loading && (
              <div className={styles.loadingOverlay}>
                <div className={styles.spinner}></div>
                <p>Buscando endereço...</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm Location */}
        {step === 'confirm' && geolocation.detectedAddress && (
          <div className={styles.confirmStep}>
            {/* Compact header with edit hint */}
            <div className={styles.confirmHeader}>
              <h2>📍 Endereço de entrega</h2>
              <button 
                onClick={handleEditLocation} 
                className={styles.editLocationBtn}
                title="Clique para ajustar a localização no mapa"
              >
                Ajustar no mapa
              </button>
            </div>

            {/* Map with route - clickable to edit */}
            <div 
              className={styles.mapContainerClickable}
              onClick={handleEditLocation}
              title="Clique para ajustar a localização"
            >
              <InteractiveMap
                storeLocation={STORE_LOCATION}
                customerLocation={geolocation.position}
                routePolyline={geolocation.routeInfo?.polyline}
                enableSelection={false}
                showStoreMarker={true}
                showCustomerMarker={true}
                height="200px"
              />
              <div className={styles.mapEditOverlay}>
                <span>Toque para ajustar</span>
              </div>
            </div>

            {/* Inline Address Card with Edit */}
            <div className={styles.addressCardInline}>
              <div className={styles.addressMainInfo}>
                <div className={styles.addressIcon}>📍</div>
                <div className={styles.addressText}>
                  <p className={styles.streetName}>
                    {geolocation.detectedAddress.street}
                    {geolocation.detectedAddress.number && `, ${geolocation.detectedAddress.number}`}
                  </p>
                  <p className={styles.addressSecondary}>
                    {geolocation.detectedAddress.neighborhood && `${geolocation.detectedAddress.neighborhood} • `}
                    {geolocation.detectedAddress.city}
                    {geolocation.detectedAddress.state && ` - ${geolocation.detectedAddress.state}`}
                  </p>
                </div>
              </div>
              
              {/* Complement/Details Field */}
              <div className={styles.complementSection}>
                <label className={styles.complementLabel}>
                  <span className={styles.complementIcon}>🏠</span>
                  Complemento / Detalhes de entrega
                  {showComplementHint && !geolocation.detectedAddress.number && (
                    <span className={styles.complementRequired}>*</span>
                  )}
                </label>
                <input
                  type="text"
                  className={styles.complementInput}
                  placeholder="Ex: Nº 123, Apto 45, Bloco B, Portaria, Interfone 102..."
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  autoFocus={showComplementHint}
                />
                {showComplementHint && !geolocation.detectedAddress.number && (
                  <p className={styles.complementHint}>
                    💡 Não detectamos o número. Por favor, informe para facilitar a entrega.
                  </p>
                )}
              </div>
            </div>

            {/* Delivery Stats - Compact */}
            <div className={styles.deliveryStatsCompact}>
              <div className={styles.statCompact}>
                <span className={styles.statIcon}>📏</span>
                <span>
                  {geolocation.routeInfo?.distance_km 
                    ? formatDistance(geolocation.routeInfo.distance_km)
                    : geolocation.deliveryInfo?.distance_km
                    ? formatDistance(geolocation.deliveryInfo.distance_km)
                    : '—'}
                </span>
              </div>
              <div className={styles.statDivider}>•</div>
              <div className={styles.statCompact}>
                <span className={styles.statIcon}>⏱️</span>
                <span>
                  {geolocation.routeInfo?.duration_minutes 
                    ? formatDuration(geolocation.routeInfo.duration_minutes)
                    : geolocation.deliveryInfo?.estimated_minutes
                    ? formatDuration(geolocation.deliveryInfo.estimated_minutes)
                    : '—'}
                </span>
              </div>
              <div className={styles.statDivider}>•</div>
              <div className={`${styles.statCompact} ${styles.statFee}`}>
                <span className={styles.statIcon}>💰</span>
                <span className={styles.feeValue}>
                  {(geolocation.deliveryInfo?.fee ?? delivery.deliveryInfo?.fee) === 0 
                    ? 'Grátis!' 
                    : `R$ ${(geolocation.deliveryInfo?.fee ?? delivery.deliveryInfo?.fee ?? 0).toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Confirm Button - Full Width */}
            <button 
              onClick={handleConfirmLocation} 
              className={styles.confirmBtnFull}
              disabled={showComplementHint && !geolocation.detectedAddress.number && !complement.trim()}
            >
              <span className={styles.confirmBtnIcon}>✓</span>
              Confirmar endereço
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationModal;
