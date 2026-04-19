/**
 * Unified Store API Service
 *
 * This is the PRIMARY API service for the Cê Saladas frontend.
 * All API calls should go through this service.
 * Uses the unified /api/v1/stores/{store_slug}/ endpoints.
 *
 * IMPORTANT: Token synchronization
 * This module uses the same token storage as auth.js to ensure
 * that tokens set during WhatsApp login are immediately available.
 */
import axios from 'axios';
import logger from './logger';
import { getAccessToken as getStoredAccessToken, setTokens, clearTokens as clearStoredTokens } from './tokenStorage';

const GUEST_CART_KEY_STORAGE = 'guest_cart_key';

const generateGuestCartKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `cart_${crypto.randomUUID()}`;
  }

  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const getGuestCartKey = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  let cartKey = localStorage.getItem(GUEST_CART_KEY_STORAGE);
  if (!cartKey) {
    cartKey = generateGuestCartKey();
    localStorage.setItem(GUEST_CART_KEY_STORAGE, cartKey);
  }

  return cartKey;
};

const attachGuestCartKey = (config) => {
  const cartKey = getGuestCartKey();
  if (!cartKey) {
    return config;
  }

  config.headers = config.headers || {};
  config.headers['X-Cart-Key'] = cartKey;
  config.params = {
    ...(config.params || {}),
    cart_key: cartKey,
  };

  if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
    config.data = {
      ...config.data,
      cart_key: cartKey,
    };
  }

  return config;
};

// Helper to get store slug from hostname or env
export const getStoreSlug = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Specific domain mapping
    if (hostname.includes('cesaladas')) return 'ce-saladas';
    if (hostname.includes('pastita')) return 'pastita';

    // Subdomain check (e.g. pastita.mysaas.com)
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      return parts[0];
    }

    // Path check (e.g. mysaas.com/s/pastita)
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 's' && pathParts[2]) {
      return pathParts[2];
    }
  }
  return process.env.NEXT_PUBLIC_STORE_SLUG || 'ce-saladas';
};

const STORE_SLUG = getStoreSlug();

const isLikelyJwt = (token) => (
  typeof token === 'string'
  && token.split('.').length === 3
);

const buildAuthHeader = (token) => {
  if (!token) return null;
  return isLikelyJwt(token) ? `Bearer ${token}` : `Token ${token}`;
};

// API base URL
// Priority: Environment Variable > Local Development
const DEFAULT_API_URL = 'http://localhost:8000/api/v1';
const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
const STORES_API_URL = `${API_ROOT}/stores`;
const STORE_API_URL = `${STORES_API_URL}/${STORE_SLUG}`;
const PUBLIC_STORE_API_URL = `${API_ROOT}/public/${STORE_SLUG}`;
const AUTH_API_URL = `${API_ROOT}`;

// WebSocket URL
const DEFAULT_WS_URL = DEFAULT_API_URL.replace(/^http/, 'ws').replace('/api/v1', '/ws');
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || DEFAULT_WS_URL;

const shouldLogApiError = (error) => {
  const status = error?.response?.status;
  const endpoint = error?.config?.url || '';

  // Expected during bootstrap when user is not authenticated yet.
  if (status === 401 && endpoint.includes('/users/profile/')) {
    return false;
  }

  // Request cancellations (route change/unmount) are not actionable errors.
  if (error?.code === 'ERR_CANCELED') {
    return false;
  }

  return true;
};

// Create axios instance for store-specific endpoints
const storeApi = axios.create({
  baseURL: STORE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Create axios instance for unauthenticated public endpoints
const publicApi = axios.create({
  baseURL: PUBLIC_STORE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Create axios instance for auth endpoints
const authApi = axios.create({
  baseURL: AUTH_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const toFiniteNumber = (value) => {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeGeoResponse = (data) => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const latitude = toFiniteNumber(data.latitude ?? data.lat);
  const longitude = toFiniteNumber(data.longitude ?? data.lng);
  const displayName = data.display_name || data.formatted_address || '';

  return {
    ...data,
    lat: latitude ?? data.lat ?? null,
    lng: longitude ?? data.lng ?? null,
    latitude: latitude ?? data.latitude ?? null,
    longitude: longitude ?? data.longitude ?? null,
    display_name: displayName,
    formatted_address: data.formatted_address || displayName,
    street: data.street || data.address?.street || data.address_components?.street || '',
    number: data.number || data.house_number || data.address?.house_number || '',
    neighborhood: data.neighborhood || data.address?.neighborhood || data.address_components?.neighborhood || '',
    city: data.city || data.address?.city || data.address_components?.city || '',
    state: data.state_code || data.state || data.address?.stateCode || data.address?.state || data.address_components?.state_code || data.address_components?.state || '',
    zip_code: data.zip_code || data.address?.zip_code || data.address?.postalCode || data.address_components?.zip_code || '',
  };
};

const normalizeSuggestion = (suggestion) => {
  if (!suggestion || typeof suggestion !== 'object') {
    return null;
  }

  const latitude = toFiniteNumber(suggestion.latitude ?? suggestion.lat);
  const longitude = toFiniteNumber(suggestion.longitude ?? suggestion.lng);
  const displayName = suggestion.display_name
    || suggestion.title
    || [suggestion.main_text, suggestion.secondary_text || suggestion.subtitle].filter(Boolean).join(', ');

  return {
    ...suggestion,
    display_name: displayName,
    title: suggestion.title || displayName,
    subtitle: suggestion.subtitle || suggestion.secondary_text || '',
    main_text: suggestion.main_text || suggestion.title || displayName,
    secondary_text: suggestion.secondary_text || suggestion.subtitle || '',
    lat: latitude,
    lng: longitude,
    latitude,
    longitude,
  };
};

// Use central tokenStorage to read access token (keeps names consistent)
// CRITICAL: Always read fresh from storage to capture tokens set by WhatsApp login
export const getAuthToken = () => {
  try {
    return getStoredAccessToken();
  } catch (e) {
    return null;
  }
};

export const setAuthToken = (token) => {
  // Delegate to tokenStorage so the single source of truth is maintained
  if (token) {
    setTokens(token, null);
  }
};

export const clearAuthToken = () => {
  clearStoredTokens();
};

/**
 * Force refresh of auth header on both API instances.
 * Call this after login to ensure token is applied immediately.
 */
export const refreshAuthHeaders = () => {
  const token = getAuthToken();
  const authHeader = buildAuthHeader(token);

  if (authHeader) {
    storeApi.defaults.headers.common['Authorization'] = authHeader;
    authApi.defaults.headers.common['Authorization'] = authHeader;
  } else {
    delete storeApi.defaults.headers.common['Authorization'];
    delete authApi.defaults.headers.common['Authorization'];
  }

  return !!authHeader;
};

// In-memory CSRF token cache (cross-domain: document.cookie won't have the backend cookie)
let _csrfTokenMemory = null;
let _csrfTokenFetchPromise = null;

// Get CSRF token — first tries the cookie (same-domain), then falls back to in-memory cache
const getCsrfToken = () => {
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const eqIdx = cookie.indexOf('=');
      if (eqIdx === -1) continue;
      const key = cookie.slice(0, eqIdx).trim();
      if (key === 'csrftoken') {
        return decodeURIComponent(cookie.slice(eqIdx + 1).trim());
      }
    }
  }
  return _csrfTokenMemory || null;
};

// Fetch CSRF token from backend and cache in memory (used for cross-domain setups)
const ensureCsrfToken = async () => {
  if (_csrfTokenMemory) return _csrfTokenMemory;
  if (_csrfTokenFetchPromise) return _csrfTokenFetchPromise;

  _csrfTokenFetchPromise = (async () => {
    try {
      const response = await axios.get(`${AUTH_API_URL}/core/csrf/`, { withCredentials: true });
      const token = response.data?.csrfToken || response.data?.csrf_token;
      if (token) {
        _csrfTokenMemory = token;
      }
      return _csrfTokenMemory;
    } catch (e) {
      return null;
    } finally {
      _csrfTokenFetchPromise = null;
    }
  })();

  return _csrfTokenFetchPromise;
};

// Request interceptor for store API
storeApi.interceptors.request.use(
  async (config) => {
    const token = getAuthToken();
    const authHeader = buildAuthHeader(token);
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }

    attachGuestCartKey(config);

    // Add CSRF token for non-GET requests
    if (config.method !== 'get') {
      const csrfToken = getCsrfToken() || await ensureCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Request interceptor for auth API
authApi.interceptors.request.use(
  async (config) => {
    const token = getAuthToken();
    const authHeader = buildAuthHeader(token);
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }
    if (config.method !== 'get') {
      const csrfToken = getCsrfToken() || await ensureCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
storeApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (shouldLogApiError(error)) {
      logger.apiError(error.config?.url, error);
    }
    return Promise.reject(error);
  }
);

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (shouldLogApiError(error)) {
      logger.apiError(error.config?.url, error);
    }
    return Promise.reject(error);
  }
);

// Listen for auth events to sync token across all API instances
// Guard prevents duplicate listeners on HMR re-execution in development
if (typeof window !== 'undefined' && !window.__ceStoreApiInitialized) {
  window.__ceStoreApiInitialized = true;

  window.addEventListener('auth:login', () => {
    refreshAuthHeaders();
  });

  window.addEventListener('auth:logout', () => {
    delete storeApi.defaults.headers.common['Authorization'];
    delete authApi.defaults.headers.common['Authorization'];
  });

  refreshAuthHeaders();
}

// =============================================================================
// CSRF TOKEN
// =============================================================================

/**
 * Fetch CSRF token from server and cache in memory
 */
export const fetchCsrfToken = async () => {
  const token = await ensureCsrfToken();
  if (!token) logger.error('Failed to fetch CSRF token');
  return token;
};

// =============================================================================
// STORE INFO
// =============================================================================

/**
 * Get store information
 */
export const getStoreInfo = async () => {
  const response = await storeApi.get('/');
  return response.data;
};

/**
 * Get store availability (open/closed status + today's hours)
 * Uses public endpoint — no auth required.
 * Returns: { is_open, today, hours: { open, close } | null, operating_hours }
 */
export const getStoreAvailability = async () => {
  const response = await publicApi.get('/availability/');
  return response.data;
};

// =============================================================================
// CATALOG
// =============================================================================

/**
 * Get full store catalog
 * Returns: { store, categories, products, combos, featured_products, products_by_category }
 */
export const getCatalog = async () => {
  const response = await storeApi.get('/catalog/');
  return response.data;
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (categorySlug) => {
  const catalog = await getCatalog();
  const category = catalog.categories.find(c => c.slug === categorySlug);
  if (!category) return [];
  return catalog.products_by_category[category.id] || [];
};

/**
 * Get product by ID
 */
export const getProduct = async (productId) => {
  const response = await axios.get(`${STORES_API_URL}/products/${productId}/`);
  return response.data;
};

// =============================================================================
// CART
// =============================================================================

/**
 * Get current cart
 */
export const getCart = async () => {
  const response = await storeApi.get('/cart/');
  return response.data;
};

/**
 * Add product to cart
 */
export const addToCart = async (productId, quantity = 1, options = {}, notes = '') => {
  const response = await storeApi.post('/cart/add/', {
    product_id: productId,
    quantity,
    options,
    notes,
  });
  return response.data;
};

/**
 * Add combo to cart
 */
export const addComboToCart = async (comboId, quantity = 1, customizations = {}, notes = '') => {
  const response = await storeApi.post('/cart/add/', {
    combo_id: comboId,
    quantity,
    customizations,
    notes,
  });
  return response.data;
};

/**
 * Add a salad builder item to cart as a single virtual combo.
 * @param {object} params
 * @param {string} params.comboName    Display name, e.g. "Monte sua Salada"
 * @param {number} params.unitPrice    Sum of all selected ingredient prices
 * @param {object} params.customizations  Structured ingredient data
 * @param {string} params.notes        Human-readable ingredient list for print/display
 */
export const addSaladToCart = async ({ comboName, unitPrice, customizations = {}, notes = '' }) => {
  const response = await storeApi.post('/cart/add/', {
    combo_name: comboName,
    unit_price: unitPrice,
    quantity: 1,
    customizations,
    notes,
  });
  return response.data;
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (itemId, quantity) => {
  const response = await storeApi.patch(`/cart/item/${itemId}/`, {
    quantity,
  });
  return response.data;
};

/**
 * Remove item from cart
 */
export const removeCartItem = async (itemId) => {
  const response = await storeApi.delete(`/cart/item/${itemId}/`);
  return response.data;
};

/**
 * Clear cart
 */
export const clearCart = async () => {
  const response = await storeApi.delete('/cart/clear/');
  return response.data;
};

// =============================================================================
// CHECKOUT
// =============================================================================

/**
 * Process checkout
 */
export const checkout = async (checkoutData) => {
  const response = await storeApi.post('/checkout/', checkoutData);
  return response.data;
};

/**
 * Calculate delivery fee
 */
export const calculateDeliveryFee = async (distanceKm = null, zipCode = null) => {
  const params = new URLSearchParams();
  if (distanceKm) params.append('distance_km', distanceKm);
  if (zipCode) params.append('zip_code', zipCode);

  const response = await storeApi.get(`/delivery-fee/?${params.toString()}`);
  return response.data;
};

/**
 * Validate coupon
 */
export const validateCoupon = async (code, subtotal) => {
  const response = await storeApi.post('/validate-coupon/', {
    code,
    subtotal,
  });
  return response.data;
};

// =============================================================================
// MAPS & DELIVERY
// =============================================================================

/**
 * Calculate route from store to destination
 */
export const calculateRoute = async (destLat, destLng) => {
  const response = await storeApi.get('/route/', { params: { dest_lat: destLat, dest_lng: destLng } });
  const data = response.data || {};
  return {
    ...data,
    distance_km: toFiniteNumber(data.distance_km) ?? 0,
    duration_minutes: toFiniteNumber(data.duration_minutes) ?? 0,
  };
};

/**
 * Validate delivery address
 */
export const validateDeliveryAddress = async (lat, lng) => {
  const response = await storeApi.post('/validate-delivery/', { lat, lng });
  const data = response.data || {};
  return {
    ...data,
    distance_km: toFiniteNumber(data.distance_km) ?? 0,
    duration_minutes: toFiniteNumber(data.duration_minutes) ?? 0,
    estimated_minutes: toFiniteNumber(data.estimated_minutes ?? data.duration_minutes) ?? 0,
    delivery_fee: toFiniteNumber(data.delivery_fee),
    fee: toFiniteNumber(data.fee),
  };
};

/**
 * Validate delivery address by address string
 */
export const validateDeliveryByAddress = async (address) => {
  const response = await storeApi.post('/validate-delivery/', { address });
  const data = response.data || {};
  return {
    ...data,
    distance_km: toFiniteNumber(data.distance_km) ?? 0,
    duration_minutes: toFiniteNumber(data.duration_minutes) ?? 0,
    estimated_minutes: toFiniteNumber(data.estimated_minutes ?? data.duration_minutes) ?? 0,
    delivery_fee: toFiniteNumber(data.delivery_fee),
    fee: toFiniteNumber(data.fee),
  };
};

/**
 * Get delivery zones (isolines)
 */
export const getDeliveryZones = async (timeRanges = null) => {
  let url = '/delivery-zones/';
  if (timeRanges) {
    url += `?time_ranges=${timeRanges.join(',')}`;
  }
  const response = await storeApi.get(url);
  return response.data;
};

/**
 * Address autocomplete
 */
export const autosuggestAddress = async (query, limit = 5) => {
  const response = await storeApi.get(`/autosuggest/?q=${encodeURIComponent(query)}&limit=${limit}`);
  return (response.data.suggestions || []).map(normalizeSuggestion).filter(Boolean);
};

// =============================================================================
// WISHLIST
// =============================================================================

/**
 * Get user's wishlist
 */
export const getWishlist = async () => {
  const response = await storeApi.get('/wishlist/');
  return response.data;
};

/**
 * Add product to wishlist
 */
export const addToWishlist = async (productId) => {
  const response = await storeApi.post('/wishlist/add/', { product_id: productId });
  return response.data;
};

/**
 * Remove product from wishlist
 */
export const removeFromWishlist = async (productId) => {
  const response = await storeApi.post('/wishlist/remove/', { product_id: productId });
  return response.data;
};

/**
 * Toggle product in wishlist
 */
export const toggleWishlist = async (productId) => {
  const response = await storeApi.post('/wishlist/toggle/', { product_id: productId });
  return response.data;
};

// =============================================================================
// GLOBAL MAPS (not store-specific)
// =============================================================================

/**
 * Geocode address
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await axios.get(`${STORES_API_URL}/maps/geocode/?address=${encodeURIComponent(address)}`);
    return normalizeGeoResponse(response.data);
  } catch (error) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Reverse geocode coordinates
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await axios.get(`${STORES_API_URL}/maps/reverse-geocode/?lat=${lat}&lng=${lng}`);
    return normalizeGeoResponse(response.data);
  } catch (error) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// =============================================================================
// ORDERS
// =============================================================================

/**
 * Get order status by access token (SECURE - public endpoint)
 * This is the preferred method for payment status pages
 * @param {string} accessToken - The secure access token for the order
 */
export const getOrderByToken = async (accessToken) => {
  const response = await axios.get(`${STORES_API_URL}/orders/by-token/${accessToken}/`);
  return response.data;
};

/**
 * Get order status (requires token for security)
 * @param {string} orderIdOrNumber - Order ID or order number
 * @param {string} token - Access token for the order (required for public access)
 */
export const getOrderStatus = async (orderIdOrNumber, token = null) => {
  const params = token ? { token } : {};
  const currentToken = getAuthToken();
  const authHeader = buildAuthHeader(currentToken);

  const response = await axios.get(`${STORES_API_URL}/orders/${orderIdOrNumber}/payment-status/`, {
    params,
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  return response.data;
};

/**
 * Get user orders (requires auth)
 */
export const getUserOrders = async () => {
  const token = getAuthToken();
  const authHeader = buildAuthHeader(token);
  const response = await axios.get(`${STORES_API_URL}/orders/`, {
    headers: authHeader ? { Authorization: authHeader } : {},
    params: { store: STORE_SLUG },
  });
  return response.data;
};

/**
 * Get single order by ID
 */
export const getOrder = async (orderId) => {
  const token = getAuthToken();
  const authHeader = buildAuthHeader(token);
  const response = await axios.get(`${STORES_API_URL}/orders/${orderId}/`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  return response.data;
};

/**
 * Get WhatsApp confirmation URL for order
 */
export const getOrderWhatsApp = async (orderId) => {
  const token = getAuthToken();
  const authHeader = buildAuthHeader(token);
  const response = await axios.get(`${STORES_API_URL}/orders/${orderId}/whatsapp/`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  return response.data;
};

// =============================================================================
// AUTH
// =============================================================================

/**
 * Register new user
 */
export const registerUser = async (data) => {
  const response = await authApi.post('/auth/register/', data);
  return response.data;
};

/**
 * Login user
 */
export const loginUser = async (email, password) => {
  const response = await authApi.post('/auth/login/', { email, password });
  const token = response.data?.token || response.data?.access || response.data?.tokens?.access;
  const refresh = response.data?.refresh || response.data?.tokens?.refresh || null;

  if (token) {
    setTokens(token, refresh);
    refreshAuthHeaders();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:login', { detail: { token } }));
    }
  }
  return response.data;
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    await authApi.post('/auth/logout/');
  } finally {
    clearAuthToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }
};

/**
 * Get user profile
 */
export const getProfile = async () => {
  const response = await authApi.get('/users/profile/');
  return response.data;
};

/**
 * Update user profile
 */
export const updateProfile = async (data) => {
  const response = await authApi.patch('/users/profile/', data);
  return response.data;
};

// =============================================================================
// WEBSOCKET
// =============================================================================

/**
 * Create WebSocket connection for order tracking
 */
export const createOrderWebSocket = (orderId, onMessage, onError = null) => {
  const wsUrl = `${WS_BASE_URL}/orders/${orderId}/`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      logger.error('WebSocket parse error', e);
    }
  };

  ws.onerror = (error) => {
    logger.error('WebSocket error', error);
    if (onError) onError(error);
  };

  ws.onclose = () => {
    logger.info('WebSocket closed');
  };

  return ws;
};

/**
 * Create WebSocket connection for store orders (dashboard)
 */
export const createStoreOrdersWebSocket = (onMessage, onError = null) => {
  const wsUrl = `${WS_BASE_URL}/stores/${STORE_SLUG}/orders/`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      logger.error('WebSocket parse error', e);
    }
  };

  ws.onerror = (error) => {
    logger.error('WebSocket error', error);
    if (onError) onError(error);
  };

  return ws;
};

// =============================================================================
// EXPORTS
// =============================================================================

export default storeApi;
export {
  STORE_SLUG,
  STORE_API_URL,
  STORES_API_URL,
  AUTH_API_URL,
  WS_BASE_URL,
  authApi,
};
