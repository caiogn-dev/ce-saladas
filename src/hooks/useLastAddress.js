/**
 * useLastAddress
 * Manages ce_last_address in localStorage.
 * Persists the last confirmed delivery address indefinitely
 * (overwritten on each new confirmed address).
 */

import { isSafeStoreCoordinateInput } from '../utils/storeRegion';

const KEY = 'ce_last_address';

function read() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.v !== 1) return null;

    const address = parsed?.address;
    if (address?.lat != null && address?.lng != null && !isSafeStoreCoordinateInput(address, address)) {
      localStorage.removeItem(KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function save(address) {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      v: 1,
      saved_at: Date.now(),
      address: {
        street: address.street || address.shipping_address || '',
        number: address.number || '',
        complement: address.complement || '',
        neighborhood: address.neighborhood || '',
        city: address.city || address.shipping_city || '',
        state: address.state || address.shipping_state || '',
        zip_code: address.zip_code || address.shipping_zip_code || '',
        lat: address.lat ?? address.latitude ?? null,
        lng: address.lng ?? address.longitude ?? null,
      },
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

export default function useLastAddress() {
  return {
    readLastAddress: () => read(),
    saveLastAddress: (address) => save(address),
    clearLastAddress: () => clear(),
  };
}
