import { useEffect, useState } from 'react';
import { getCookieConsent, setCookieConsent } from '../utils/cookieConsent';

export default function CookieConsentBanner({ onDecision }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(getCookieConsent() === null), []);
  if (!visible) return null;
  const decide = (value) => {
    setCookieConsent(value);
    setVisible(false);
    onDecision?.(value);
  };
  return (
    <div className="cookie-consent" role="dialog" aria-label="Consentimento de cookies">
      <p>Usamos cookies opcionais para medir resultados e melhorar sua experiência. Você pode aceitar ou recusar.</p>
      <div className="cookie-consent__actions">
        <button type="button" onClick={() => decide('rejected')}>Recusar</button>
        <button type="button" className="cookie-consent__accept" onClick={() => decide('accepted')}>Aceitar</button>
      </div>
    </div>
  );
}
