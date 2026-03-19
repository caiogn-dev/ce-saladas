/**
 * auth.js — Cê Saladas
 * Thin auth facade: delegates token storage to tokenStorage.js
 * and API calls to storeApi.js to avoid duplication.
 */
import {
  setAuthToken,
  getAuthToken,
  refreshAuthHeaders,
  loginUser,
  logoutUser,
  registerUser,
  getProfile,
  updateProfile,
  authApi,
} from './storeApi';
import { setTokens, getAccessToken, getRefreshToken, clearTokens, setUser, getUser } from './tokenStorage';

// Re-export storage helpers
export { getAccessToken, getRefreshToken, getUser, setUser, clearTokens };

export const isAuthenticated = () => Boolean(getAuthToken() || getAccessToken());

// ── Traditional auth ──────────────────────────────────────

export const login = async (email, password) => {
  // loginUser already handles setTokens, refreshAuthHeaders, and auth:login dispatch
  return loginUser(email, password);
};

export const register = async (userData) => registerUser(userData);

export const logout = async () => {
  // logoutUser already handles clearAuthToken and auth:logout dispatch
  return logoutUser();
};

// ── WhatsApp OTP authentication ───────────────────────────
// These endpoints mirror what pastita-3d uses for WhatsApp OTP login.
// Uses authApi (configured axios instance) for proper CSRF and credential handling.

export const sendWhatsAppCode = async (phoneNumber, whatsappAccountId) => {
  const response = await authApi.post('/auth/whatsapp/send/', {
    phone_number: phoneNumber,
    whatsapp_account_id: whatsappAccountId,
  });
  return response.data;
};

export const verifyWhatsAppCode = async (phoneNumber, code) => {
  const response = await authApi.post('/auth/whatsapp/verify/', {
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
      refreshAuthHeaders();

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
  const response = await authApi.post('/auth/whatsapp/resend/', {
    phone_number: phoneNumber,
    whatsapp_account_id: whatsappAccountId,
  });
  return response.data;
};

// ── Profile ───────────────────────────────────────────────
export { getProfile, updateProfile };

export const changePassword = async (oldPassword, newPassword) => {
  const response = await authApi.post('/auth/change-password/', {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return response.data;
};
