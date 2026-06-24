/**
 * Scheduling section component
 */
import React, { useEffect } from 'react';
import styles from '../../styles/Checkout.module.css';
import { getAvailableDates, getAvailableTimeSlots } from './utils';

const SchedulingSection = ({
  enableScheduling,
  scheduledDate,
  scheduledTimeSlot,
  onEnableChange,
  onDateChange,
  onTimeSlotChange,
  disabled = false
}) => {
  const availableDates = getAvailableDates();
  const slotOptions = getAvailableTimeSlots(scheduledDate);

  useEffect(() => {
    if (scheduledTimeSlot && !slotOptions.some((s) => s.value === scheduledTimeSlot)) {
      onTimeSlotChange('');
    }
  }, [scheduledDate]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.schedulingSection}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={enableScheduling}
          onChange={(e) => onEnableChange(e.target.checked)}
          disabled={disabled}
        />
        <span className={styles.checkboxText}>
          <span className={styles.scheduleIcon}>📅</span>
          Agendar entrega
        </span>
      </label>

      {enableScheduling && (
        <div className={styles.schedulingOptions}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Data</label>
            <select
              value={scheduledDate}
              onChange={(e) => onDateChange(e.target.value)}
              className={styles.select}
              disabled={disabled}
            >
              <option value="">Selecione uma data</option>
              {availableDates.map((date) => (
                <option key={date.value} value={date.value}>
                  {date.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Horário</label>
            <select
              value={scheduledTimeSlot}
              onChange={(e) => onTimeSlotChange(e.target.value)}
              className={styles.select}
              disabled={disabled || !scheduledDate}
            >
              <option value="">Selecione um horário</option>
              {slotOptions.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingSection;
