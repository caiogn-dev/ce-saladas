/**
 * useGuestInfo
 * Manages ce_guest_info in localStorage.
 * Stores { name, phone, email } for returning guests (90-day expiry).
 * Never stores CPF, payment data, or tokens.
 */

const KEY = 'ce_guest_info';
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function read() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.expires_at || Date.now() > parsed.expires_at) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function save(data) {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      v: 1,
      expires_at: Date.now() + TTL_MS,
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable
  }
}

function clear() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/**
 * Build a safe profile update payload from guest info.
 * Only fills blank profile fields — never overwrites existing data.
 */
function buildMergePayload(profile, guestInfo) {
  if (!guestInfo) return {};
  const payload = {};

  // Name: only fill if profile has no first_name
  if (!profile?.first_name && guestInfo.name) {
    const parts = guestInfo.name.trim().split(' ');
    payload.first_name = parts[0] || '';
    payload.last_name = parts.slice(1).join(' ') || '';
  }

  // Email: only fill if profile has no email (or it's a @pastita.local generated one)
  const profileEmail = profile?.email || '';
  const isGeneratedEmail = profileEmail.endsWith('@pastita.local');
  if ((!profileEmail || isGeneratedEmail) && guestInfo.email) {
    payload.email = guestInfo.email;
  }

  // Phone is excluded: already verified by OTP on the backend

  return payload;
}

// Static helper for use outside of React components (e.g. hooks)
export function readGuestInfoStatic() { return read(); }

export default function useGuestInfo() {
  const readGuestInfo = () => read();
  const saveGuestInfo = (data) => save(data);
  const clearGuestInfo = () => clear();
  const buildMergePayloadFn = (profile) => buildMergePayload(profile, read());

  return { readGuestInfo, saveGuestInfo, clearGuestInfo, buildMergePayload: buildMergePayloadFn };
}
