/**
 * Unified Store API Service
 * 
 * This is the PRIMARY API service for the Cê Saladas frontend.
 * All API calls should go through this service.
 * Uses the unified /api/v1/stores/{store_slug}/ endpoints.
 */
import axios from 'axios';
import logger from './logger';

// Helper to get store slug from hostname or env
export const getStoreSlug = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Specific domain mapping
    if (hostname.includes('ce-saladas')) return 'ce-saladas';
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

// API base URL
// Priority: Environment Variable > Local Development > Production Fallback
const DEFAULT_API_URL = 'https://web-production-3e83a.up.railway.app/api/v1';
const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
const STORES_API_URL = `${API_ROOT}/stores`;
const STORE_API_URL = `${STORES_API_URL}/${STORE_SLUG}`;
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

// Create axios instance for auth endpoints
const authApi = axios.create({
  baseURL: AUTH_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Auth token management
let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (typeof window !== 'undefined' && token) {
    localStorage.setItem('access_token', token);
  }
};

export const getAuthToken = () => {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

export const clearAuthToken = () => {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
};

// Get CSRF token from cookie
const getCsrfToken = () => {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === 'csrftoken') return value;
  }
  return null;
};

// Request interceptor for store API
storeApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    // Add CSRF token for non-GET requests
    if (config.method !== 'get') {
      const csrfToken = getCsrfToken();
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
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    if (config.method !== 'get') {
      const csrfToken = getCsrfToken();
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

// =============================================================================
// CSRF TOKEN
// =============================================================================

/**
 * Fetch CSRF token from server
 */
export const fetchCsrfToken = async () => {
  try {
    const response = await authApi.get('/csrf/');
    return response.data.csrfToken;
  } catch (error) {
    logger.error('Failed to fetch CSRF token', error);
    return null;
  }
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
  const response = await storeApi.get(`/route/?dest_lat=${destLat}&dest_lng=${destLng}`);
  return response.data;
};

/**
 * Validate delivery address
 */
export const validateDeliveryAddress = async (lat, lng) => {
  const response = await storeApi.post('/validate-delivery/', { lat, lng });
  return response.data;
};

/**
 * Validate delivery address by address string
 */
export const validateDeliveryByAddress = async (address) => {
  const response = await storeApi.post('/validate-delivery/', { address });
  return response.data;
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
  return response.data.suggestions;
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
  const response = await axios.get(`${STORES_API_URL}/maps/geocode/?address=${encodeURIComponent(address)}`);
  return response.data;
};

/**
 * Reverse geocode coordinates
 */
export const reverseGeocode = async (lat, lng) => {
  const response = await axios.get(`${STORES_API_URL}/maps/reverse-geocode/?lat=${lat}&lng=${lng}`);
  return response.data;
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
  const authToken = getAuthToken();
  const headers = authToken ? { Authorization: `Token ${authToken}` } : {};

  const response = await axios.get(`${STORES_API_URL}/orders/${orderIdOrNumber}/payment-status/`, {
    params,
    headers,
  });
  return response.data;
};

/**
 * Get user orders (requires auth)
 */
export const getUserOrders = async () => {
  const token = getAuthToken();
  const response = await axios.get(`${STORES_API_URL}/orders/`, {
    headers: token ? { Authorization: `Token ${token}` } : {},
    params: { store: STORE_SLUG },
  });
  return response.data;
};

/**
 * Get single order by ID
 */
export const getOrder = async (orderId) => {
  const token = getAuthToken();
  const response = await axios.get(`${STORES_API_URL}/orders/${orderId}/`, {
    headers: token ? { Authorization: `Token ${token}` } : {},
  });
  return response.data;
};

/**
 * Get WhatsApp confirmation URL for order
 */
export const getOrderWhatsApp = async (orderId) => {
  const token = getAuthToken();
  const response = await axios.get(`${STORES_API_URL}/orders/${orderId}/whatsapp/`, {
    headers: token ? { Authorization: `Token ${token}` } : {},
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
  if (response.data.token) {
    setAuthToken(response.data.token);
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
