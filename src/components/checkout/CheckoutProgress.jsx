/**
 * CheckoutProgress - Visual progress indicator for checkout steps
 * Modern, animated progress bar with step indicators
 */
import React from 'react';
import styles from './CheckoutProgress.module.css';

const CheckoutProgress = ({ 
  steps = ['Dados', 'Entrega', 'Pagamento', 'Confirmação'],
  currentStep = 0,
  completedSteps = []
}) => {
  const getStepStatus = (index) => {
    if (completedSteps.includes(index)) return 'completed';
    if (index === currentStep) return 'active';
    if (index < currentStep) return 'completed';
    return 'pending';
  };

  const progressPercentage = Math.min(
    ((currentStep) / (steps.length - 1)) * 100,
    100
  );

  return (
    <div className={styles.container}>
      {/* Progress bar background */}
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className={styles.steps}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          return (
            <div 
              key={step}
              className={`${styles.step} ${styles[status]}`}
            >
              <div className={styles.stepIndicator}>
                {status === 'completed' ? (
                  <svg 
                    className={styles.checkIcon} 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className={styles.stepNumber}>{index + 1}</span>
                )}
              </div>
              <span className={styles.stepLabel}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CheckoutProgress;
