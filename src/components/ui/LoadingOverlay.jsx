/**
 * LoadingOverlay - Elegant loading state with animation
 */
import React from 'react';
import styles from './LoadingOverlay.module.css';

const LoadingOverlay = ({ 
  message = 'Carregando...', 
  fullScreen = false,
  transparent = false 
}) => {
  return (
    <div className={`${styles.overlay} ${fullScreen ? styles.fullScreen : ''} ${transparent ? styles.transparent : ''}`}>
      <div className={styles.content}>
        <div className={styles.spinner}>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
        </div>
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

export const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  const sizeClass = styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`];
  const colorClass = styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`];
  
  return (
    <div className={`${styles.spinnerInline} ${sizeClass} ${colorClass}`}>
      <svg viewBox="0 0 50 50">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
      </svg>
    </div>
  );
};

export const SkeletonLoader = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className = ''
}) => {
  return (
    <div 
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className={styles.cardSkeleton}>
      <SkeletonLoader height="200px" borderRadius="12px" />
      <div className={styles.cardSkeletonContent}>
        <SkeletonLoader width="70%" height="24px" />
        <SkeletonLoader width="40%" height="16px" />
        <SkeletonLoader width="30%" height="20px" />
      </div>
    </div>
  );
};

export default LoadingOverlay;
