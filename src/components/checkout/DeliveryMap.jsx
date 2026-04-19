/**
 * Delivery map component with route display
 */
import React from 'react';
import styles from '../../styles/Checkout.module.css';
import { STORE_LOCATION, formatDistanceKm, formatDurationMinutes, formatMoney, isZeroAmount } from './utils';
import DeliveryMapSimple from './DeliveryMapSimple';

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
  return (
    <div className={styles.deliveryMapContainer}>
      <div className={styles.mapWrapper} style={{ height }}>
        <DeliveryMapSimple
          storeLocation={STORE_LOCATION}
          customerLocation={customerLocation}
          routePolyline={showRoute ? routeInfo?.polyline : null}
          deliveryZones={deliveryZones}
          onLocationSelect={onLocationSelect}
          onAddressFound={onAddressChange}
          enableSelection={true}
          showSearch={false}
          showGpsButton={false}
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
                  <span className={styles.metricValue}>{formatDistanceKm(routeInfo.distance_km)}</span>
                  <span className={styles.metricLabel}>distância</span>
                </div>
                <div className={styles.routeMetric}>
                  <span className={styles.metricIcon}>⏱️</span>
                  <span className={styles.metricValue}>{formatDurationMinutes(routeInfo.duration_minutes)}</span>
                  <span className={styles.metricLabel}>tempo estimado</span>
                </div>
              </>
            )}
            {deliveryInfo && (
              <div className={styles.routeMetric}>
                <span className={styles.metricIcon}>💰</span>
                <span className={styles.metricValue}>
                  {isZeroAmount(deliveryInfo.fee) ? 'Grátis' : `R$ ${formatMoney(deliveryInfo.fee)}`}
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
