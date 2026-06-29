/**
 * Store Context - Provides store info and catalog data
 *
 * Uses the unified Store API to fetch store information and catalog.
 *
 * CRITICAL: Colors come from store API (store.primary_color, store.secondary_color, store.accent_color).
 * Template structure (borderRadius, spacing, shadows) comes from THEME_STRUCTURES.
 * This separation allows per-store color customization without changing template structure.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as storeApi from '../services/storeApi';
import { setStoreSlug } from '../services/storeApi';
import { getThemeStructure } from '../themes/storeThemeStructure';
import { getTemplatePalette } from '../themes/templatePalettes';

const StoreContext = createContext();

// Default colors for stores (fallback if API doesn't provide them)
const DEFAULT_COLORS = {
  'ce-saladas': { primary: '#2D6A4F', secondary: '#52B788', accent: '#40916C' },
  pastita: { primary: '#722F37', secondary: '#D4AF37', accent: '#F4A460' },
  'kero-kero': { primary: '#8B5A2B', secondary: '#FF8C00', accent: '#DAA520' },
};

/**
 * Convert hex color to RGB string (e.g., "#f97316" -> "249, 115, 22")
 */
const hexToRgb = (hex) => {
  if (!hex) return null;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
};

/**
 * Inject store colors and theme structure into CSS variables.
 * This is the central place where store API colors are applied to the DOM.
 *
 * @param {Object} store - Store object from API (with primary_color, secondary_color, accent_color)
 * @param {Object} storeConfig - Store config from props/API
 * @param {string} templateId - Template ID (e.g., 'modern', 'luxury')
 */
const applyStoreTheme = (store, storeConfig, templateId) => {
  if (typeof document === 'undefined') return;

  // 1. Resolve colors: API store > storeConfig > DEFAULT_COLORS
  const defaultColors = DEFAULT_COLORS[storeConfig?.slug] || DEFAULT_COLORS['ce-saladas'];
  const primaryColor = store?.primary_color || storeConfig?.primary_color || defaultColors.primary;
  const secondaryColor = store?.secondary_color || storeConfig?.secondary_color || defaultColors.secondary;
  const accentColor = store?.accent_color || storeConfig?.accent_color || defaultColors.accent;

  // 2. Inject store colors as CSS variables
  const colors = {
    'primary': primaryColor,
    'secondary': secondaryColor,
    'accent': accentColor,
  };

  Object.entries(colors).forEach(([key, hex]) => {
    if (hex) {
      document.documentElement.style.setProperty(`--color-${key}`, hex);
      const rgb = hexToRgb(hex);
      if (rgb) {
        document.documentElement.style.setProperty(`--color-${key}-rgb`, rgb);
      }
    }
  });

  // 3. Inject theme structure (borderRadius, spacing, shadows)
  const template = getThemeStructure(templateId);
  Object.entries(template.styles.borderRadius).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--radius-${key}`, value);
  });

  Object.entries(template.styles.shadow).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--shadow-${key}`, value);
  });

  Object.entries(template.styles.spacing).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--spacing-${key}`, value);
  });

  // 4. Update theme-color meta tag (for browser chrome)
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', primaryColor);
  }
};

// Cache management
const CATALOG_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const catalogCaches = new Map();

const getCatalogCacheKey = () => storeApi.STORE_SLUG || 'default';

const readCatalogCache = (cacheKey) => {
  const cached = catalogCaches.get(cacheKey);
  if (!cached?.data || !cached?.ts) return null;
  if (Date.now() - cached.ts > CATALOG_CACHE_TTL_MS) {
    catalogCaches.delete(cacheKey);
    return null;
  }
  return cached.data;
};

const writeCatalogCache = (cacheKey, data) => {
  catalogCaches.set(cacheKey, { data, ts: Date.now() });
};

const normalizeAppConfig = (appConfig, storeConfig) => ({
  ...(appConfig || {}),
  payment: appConfig?.payment || storeConfig?.payment || {},
  delivery: appConfig?.delivery || storeConfig?.delivery || {},
});

export const StoreProvider = ({ children, initialCatalog = null, storeConfig = null, appConfig = null }) => {
  // Aplicar slug antes de qualquer fetch para que os URLs de API sejam corretos
  const initialSlug = storeConfig?.slug || initialCatalog?.store?.slug;
  if (initialSlug) {
    setStoreSlug(initialSlug);
  }
  const [store, setStore] = useState(initialCatalog?.store || null);
  const [categories, setCategories] = useState(initialCatalog?.categories || []);
  const [products, setProducts] = useState(initialCatalog?.products || []);
  const [productsByCategory, setProductsByCategory] = useState(initialCatalog?.products_by_category || {});
  const [combos, setCombos] = useState(initialCatalog?.combos || []);
  const [featuredProducts, setFeaturedProducts] = useState(initialCatalog?.featured_products || []);
  const [productTypes, setProductTypes] = useState(initialCatalog?.product_types || []);
  const [isLoading, setIsLoading] = useState(!initialCatalog);
  const [error, setError] = useState(null);
  const [availability, setAvailability] = useState(null);
  const resolvedAppConfig = normalizeAppConfig(appConfig, storeConfig);
  const paymentConfig = resolvedAppConfig.payment || {};
  const deliveryConfig = resolvedAppConfig.delivery || {};
  const storeTemplate = storeConfig?.template || store?.template || 'fresh';

  // Pre-populate cache with SSR data to avoid double-fetch on client
  useEffect(() => {
    const cacheKey = getCatalogCacheKey();
    if (initialCatalog && !readCatalogCache(cacheKey)) {
      writeCatalogCache(cacheKey, initialCatalog);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch catalog from API
  const fetchCatalog = useCallback(async (force = false) => {
    const cacheKey = getCatalogCacheKey();

    // Check cache
    const catalogCache = readCatalogCache(cacheKey);
    if (!force && catalogCache) {
      setStore(catalogCache.store);
      setCategories(catalogCache.categories);
      setProducts(catalogCache.products);
      setProductsByCategory(catalogCache.products_by_category);
      setCombos(catalogCache.combos);
      setFeaturedProducts(catalogCache.featured_products);
      setProductTypes(catalogCache.product_types);
      setIsLoading(false);
      return catalogCache;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await storeApi.getCatalog();

      // Update state
      setStore(data.store);
      setCategories(data.categories || []);
      setProducts(data.products || []);
      setProductsByCategory(data.products_by_category || {});
      setCombos(data.combos || []);
      setFeaturedProducts(data.featured_products || []);
      setProductTypes(data.product_types || []);

      // Update cache
      writeCatalogCache(cacheKey, data);

      return data;
    } catch (err) {
      console.error('Error fetching catalog:', err);
      setError('Erro ao carregar catálogo. Tente novamente.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply storeConfig branding immediately (before catalog loads)
  // This provides initial colors for fast perceived load
  useEffect(() => {
    if (!storeConfig) return;
    const templateId = storeConfig.template || 'modern';
    applyStoreTheme(null, storeConfig, templateId);
  }, [storeConfig]);

  // Fetch availability
  useEffect(() => {
    storeApi.getStoreAvailability()
      .then(setAvailability)
      .catch(() => { /* availability is non-critical */ });
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Apply store theme (colors from API + template structure) when store data loads
  useEffect(() => {
    if (!store) return;
    const templateId = store.template || storeTemplate || 'modern';
    applyStoreTheme(store, storeConfig, templateId);
  }, [store, storeConfig, storeTemplate]);

  // Get products by category slug
  const getProductsByCategory = useCallback((categorySlug) => {
    const category = categories.find(c => c.slug === categorySlug);
    if (!category) return [];
    return productsByCategory[category.id] || [];
  }, [categories, productsByCategory]);

  // Get products by product type
  const getProductsByType = useCallback((typeSlug) => {
    return products.filter(p => p.attributes?.product_type === typeSlug);
  }, [products]);

  // Get product by ID
  const getProductById = useCallback((productId) => {
    return products.find(p => p.id === productId);
  }, [products]);

  // Get combo by ID
  const getComboById = useCallback((comboId) => {
    return combos.find(c => c.id === comboId);
  }, [combos]);

  // Search products
  const searchProducts = useCallback((query) => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery)
    );
  }, [products]);

  return (
    <StoreContext.Provider value={{
      // Store info
      store,
      storeSlug: storeApi.STORE_SLUG,
      storeConfig,
      appConfig: resolvedAppConfig,
      paymentConfig,
      deliveryConfig,
      storeTemplate,
      themeStructure: getThemeStructure(storeTemplate),

      // Backward compatibility: templatePalette from old TEMPLATE_PALETTES
      // This is used by CheckoutProgress, PaymentStep, PixPayment, CheckoutPage
      // Will be deprecated when those components are updated to use CSS variables
      templatePalette: getTemplatePalette(storeTemplate),

      // Catalog data
      categories,
      products,
      productsByCategory,
      combos,
      featuredProducts,
      productTypes,

      // Helper functions
      getProductsByCategory,
      getProductsByType,
      getProductById,
      getComboById,
      searchProducts,

      // Availability
      availability,
      isStoreOpen: availability?.is_open ?? true,

      // State
      isLoading,
      error,

      // Actions
      refreshCatalog: () => fetchCatalog(true),
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);

export default StoreContext;
