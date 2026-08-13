const KEY = 'ce_saladas_cookie_consent';
const VALID = new Set(['accepted', 'rejected']);

export const getCookieConsent = () => {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    return VALID.has(parsed?.value) ? parsed.value : null;
  } catch { return null; }
};

export const setCookieConsent = (value) => {
  if (typeof window === 'undefined' || !VALID.has(value)) return;
  localStorage.setItem(KEY, JSON.stringify({ value, ts: new Date().toISOString(), version: '2026-07-17' }));
};

export const hasTrackingConsent = () => getCookieConsent() === 'accepted';
