// tokenStorage.js — Cê Saladas
// Centralized token/user persistence. Wraps localStorage safely.
// Keys are kept consistent with the existing storeApi.js ('access_token').

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'ce_saladas_refresh_token';
const USER_KEY = 'ce_saladas_user';

export function setTokens(access, refresh) {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  } catch (e) {
    // localStorage may be unavailable in some environments
  }
}

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch (e) {
    // ignore
  }
}

export function setUser(user) {
  try {
    if (user === null || user === undefined) {
      localStorage.removeItem(USER_KEY);
    } else {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch (e) {
    // ignore
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export default {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  setUser,
  getUser,
};
