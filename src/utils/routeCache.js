/**
 * Route Cache Utility
 * Caches route calculations in localStorage to avoid repeated API calls
 * 
 * Cache Strategy:
 * - Routes are cached for 24 hours
 * - Cache key is based on rounded coordinates (4 decimal places)
 * - Maximum 100 cached routes to prevent storage overflow
 */

const CACHE_KEY = 'pastita_route_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 100;

/**
 * Round coordinates to reduce cache key variations
 */
const roundCoord = (coord, precision = 4) => {
  return Number(coord.toFixed(precision));
};

/**
 * Generate cache key from coordinates
 */
const makeCacheKey = (originLat, originLng, destLat, destLng) => {
  const o1 = roundCoord(originLat);
  const o2 = roundCoord(originLng);
  const d1 = roundCoord(destLat);
  const d2 = roundCoord(destLng);
  return `${o1},${o2}->${d1},${d2}`;
};

/**
 * Get cache from localStorage
 */
const getCache = () => {
  if (typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

/**
 * Save cache to localStorage
 */
const saveCache = (cache) => {
  if (typeof window === 'undefined') return;
  try {
    // Limit cache size
    const entries = Object.entries(cache);
    if (entries.length > MAX_CACHE_ENTRIES) {
      // Remove oldest entries
      const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toKeep = sorted.slice(-MAX_CACHE_ENTRIES);
      cache = Object.fromEntries(toKeep);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or unavailable
  }
};

/**
 * Get cached route
 * @param {number} originLat 
 * @param {number} originLng 
 * @param {number} destLat 
 * @param {number} destLng 
 * @returns {Object|null} Cached route data or null
 */
export const getCachedRoute = (originLat, originLng, destLat, destLng) => {
  const cache = getCache();
  const key = makeCacheKey(originLat, originLng, destLat, destLng);
  const entry = cache[key];
  
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    delete cache[key];
    saveCache(cache);
    return null;
  }
  
  return entry.data;
};

/**
 * Cache a route
 * @param {number} originLat 
 * @param {number} originLng 
 * @param {number} destLat 
 * @param {number} destLng 
 * @param {Object} routeData 
 */
export const cacheRoute = (originLat, originLng, destLat, destLng, routeData) => {
  const cache = getCache();
  const key = makeCacheKey(originLat, originLng, destLat, destLng);
  
  cache[key] = {
    data: routeData,
    timestamp: Date.now()
  };
  
  saveCache(cache);
};

/**
 * Clear all cached routes
 */
export const clearRouteCache = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore
  }
};

/**
 * Get cache statistics
 */
export const getRouteCacheStats = () => {
  const cache = getCache();
  const entries = Object.entries(cache);
  const now = Date.now();
  
  let validCount = 0;
  let expiredCount = 0;
  
  entries.forEach(([, entry]) => {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      expiredCount++;
    } else {
      validCount++;
    }
  });
  
  return {
    total: entries.length,
    valid: validCount,
    expired: expiredCount
  };
};

export default {
  getCachedRoute,
  cacheRoute,
  clearRouteCache,
  getRouteCacheStats
};
