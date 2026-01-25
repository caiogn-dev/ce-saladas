/**
 * Store Context - Provides store info and catalog data
 * 
 * Uses the unified Store API to fetch store information and catalog.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as storeApi from '../services/storeApi';

const StoreContext = createContext();

// Cache management
const CATALOG_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let catalogCache = null;
let catalogCacheTs = 0;

export const StoreProvider = ({ children }) => {
  const [store, setStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [combos, setCombos] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch catalog from API
  const fetchCatalog = useCallback(async (force = false) => {
    // Check cache
    if (!force && catalogCache && (Date.now() - catalogCacheTs < CATALOG_CACHE_TTL_MS)) {
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
      catalogCache = data;
      catalogCacheTs = Date.now();
      
      return data;
    } catch (err) {
      console.error('Error fetching catalog:', err);
      setError('Erro ao carregar catálogo. Tente novamente.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

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

  // Grouped products for Pastita-style display
  const molhos = products.filter(p => p.attributes?.product_type === 'molho');
  const carnes = products.filter(p => p.attributes?.product_type === 'carne');
  const rondellis = products.filter(p => p.attributes?.product_type === 'rondelli');

  return (
    <StoreContext.Provider value={{
      // Store info
      store,
      storeSlug: storeApi.STORE_SLUG,
      
      // Catalog data
      categories,
      products,
      productsByCategory,
      combos,
      featuredProducts,
      productTypes,
      
      // Pastita-specific groupings
      molhos,
      carnes,
      rondellis,
      
      // Helper functions
      getProductsByCategory,
      getProductsByType,
      getProductById,
      getComboById,
      searchProducts,
      
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
