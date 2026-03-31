/**
 * SavedAddressPicker
 * Shows the previously confirmed address as a quick-select banner
 * at the top of the location selection flow.
 */
import styles from '../../styles/Checkout.module.css';

function MapPinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function formatAddress(addr) {
  if (!addr) return '';
  const parts = [
    addr.street && addr.number ? `${addr.street}, ${addr.number}` : addr.street,
    addr.complement,
    addr.neighborhood,
    addr.city && addr.state ? `${addr.city} - ${addr.state}` : addr.city,
  ].filter(Boolean);
  return parts.join(', ');
}

export default function SavedAddressPicker({ savedAddress, onUse, onIgnore }) {
  if (!savedAddress) return null;

  return (
    <div className={styles.savedAddressBanner}>
      <div className={styles.savedAddressIcon}>
        <MapPinIcon />
      </div>
      <div className={styles.savedAddressInfo}>
        <span className={styles.savedAddressLabel}>Entregar no endereço salvo</span>
        <span className={styles.savedAddressText}>{formatAddress(savedAddress)}</span>
      </div>
      <div className={styles.savedAddressActions}>
        <button
          type="button"
          className={styles.savedAddressUseBtn}
          onClick={() => onUse(savedAddress)}
        >
          Usar
        </button>
        <button
          type="button"
          className={styles.savedAddressChangeBtn}
          onClick={onIgnore}
        >
          Alterar
        </button>
      </div>
    </div>
  );
}
