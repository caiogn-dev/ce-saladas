/**
 * auth.js — Cê Saladas
 * Thin auth facade: delegates token storage to tokenStorage.js
 * and API calls to storeApi.js to avoid duplication.
 */
import {
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  loginUser,
  logoutUser,
  registerUser,
  getProfile,
  updateProfile,
} from './storeApi';
import { setTokens, getAccessToken, getRefreshToken, clearTokens, setUser, getUser } from './tokenStorage';

// Re-export storage helpers
export { getAccessToken, getRefreshToken, getUser, setUser, clearTokens };

export const isAuthenticated = () => Boolean(getAuthToken() || getAccessToken());

// ── Traditional auth ──────────────────────────────────────

export const login = async (email, password) => {
  const data = await loginUser(email, password);
  if (data.token) {
    setTokens(data.token, null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:login', { detail: { token: data.token } }));
    }
  }
  return data;
};

export const register = async (userData) => registerUser(userData);

export const logout = async () => {
  await logoutUser();
  clearTokens();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
};

// ── WhatsApp OTP authentication ───────────────────────────
// These endpoints mirror what pastita-3d uses for WhatsApp OTP login.

import axios from 'axios';

const AUTH_BASE = (process.env.NEXT_PUBLIC_API_URL || '') + '/auth';

export const sendWhatsAppCode = async (phoneNumber, whatsappAccountId) => {
  const response = await axios.post(`${AUTH_BASE}/whatsapp/send/`, {
    phone_number: phoneNumber,
    whatsapp_account_id: whatsappAccountId,
  });
  return response.data;
};

export const verifyWhatsAppCode = async (phoneNumber, code) => {
  const response = await axios.post(`${AUTH_BASE}/whatsapp/verify/`, {
    phone_number: phoneNumber,
    code,
  });

  if (response.data.valid) {
    const jwtAccess = response.data?.tokens?.access;
    const jwtRefresh = response.data?.tokens?.refresh || null;
    const drfToken = response.data?.token || response.data?.auth_token;
    const accessToken = jwtAccess || drfToken;

    if (accessToken) {
      setTokens(accessToken, jwtRefresh);
      setAuthToken(accessToken);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:login', { detail: { token: accessToken } }));
      }
    }

    if (response.data.user) {
      setUser(response.data.user);
    }
  }

  return response.data;
};

export const resendWhatsAppCode = async (phoneNumber, whatsappAccountId) => {
  const response = await axios.post(`${AUTH_BASE}/whatsapp/resend/`, {
    phone_number: phoneNumber,
    whatsapp_account_id: whatsappAccountId,
  });
  return response.data;
};

// ── Profile ───────────────────────────────────────────────
export { getProfile, updateProfile };
