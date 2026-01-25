/**
 * Delivery map component with route display
 */
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Checkout.module.css';
import { STORE_LOCATION } from './utils';

// Dynamically import map to avoid SSR issues
const InteractiveMap = dynamic(() => import('../InteractiveMap'), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Carregando mapa...</div>
});

const DeliveryMap = ({
  customerLocation,
  routeInfo,
  deliveryInfo,
  deliveryZones,
  onLocationSelect,
  onAddressChange,
  showRoute = true,
  height = '300px'
}) => {
  const [mapReady, setMapReady] = useState(false);

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
    <div className={styles.deliveryMapContainer}>
      <div className={styles.mapWrapper} style={{ height }}>
        <InteractiveMap
          storeLocation={STORE_LOCATION}
          customerLocation={customerLocation}
          routePolyline={showRoute ? routeInfo?.polyline : null}
          deliveryZones={deliveryZones}
          onLocationSelect={onLocationSelect}
          onAddressChange={onAddressChange}
          enableSelection={true}
          showStoreMarker={true}
          showCustomerMarker={!!customerLocation}
        />
      </div>

      {/* Route info overlay */}
      {(routeInfo || deliveryInfo) && (
        <div className={styles.mapInfoOverlay}>
          <div className={styles.routeSummary}>
            {routeInfo && (
              <>
                <div className={styles.routeMetric}>
                  <span className={styles.metricIcon}>📏</span>
                  <span className={styles.metricValue}>{formatDistance(routeInfo.distance_km)}</span>
                  <span className={styles.metricLabel}>distância</span>
                </div>
                <div className={styles.routeMetric}>
                  <span className={styles.metricIcon}>⏱️</span>
                  <span className={styles.metricValue}>{formatDuration(routeInfo.duration_minutes)}</span>
                  <span className={styles.metricLabel}>tempo estimado</span>
                </div>
              </>
            )}
            {deliveryInfo && (
              <div className={styles.routeMetric}>
                <span className={styles.metricIcon}>💰</span>
                <span className={styles.metricValue}>
                  {deliveryInfo.fee === 0 ? 'Grátis' : `R$ ${deliveryInfo.fee.toFixed(2)}`}
                </span>
                <span className={styles.metricLabel}>taxa de entrega</span>
              </div>
            )}
          </div>
          {deliveryInfo?.zone_name && (
            <div className={styles.zoneInfo}>
              Zona: {deliveryInfo.zone_name}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;
