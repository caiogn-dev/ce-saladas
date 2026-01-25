/**
 * Wishlist Context - Uses unified Store API
 * 
 * Manages user wishlist using the /api/v1/stores/s/{store_slug}/wishlist/ endpoints.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as storeApi from '../services/storeApi';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }

    try {
      setLoading(true);
      const data = await storeApi.getWishlist();
      if (isMountedRef.current) {
        setWishlist(data.products || []);
      }
    } catch {
      // Silently fail - wishlist will be empty
      if (isMountedRef.current) {
        setWishlist([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchWishlist();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchWishlist]);

  const toggleFavorite = async (productId) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Login required' };
    }

    try {
      const data = await storeApi.toggleWishlist(productId);
      
      if (data.in_wishlist) {
        // Add to local state
        setWishlist(prev => {
          const exists = prev.some(p => p.id === productId);
          if (!exists) {
            return [...prev, { id: productId }];
          }
          return prev;
        });
      } else {
        // Remove from local state
        setWishlist(prev => prev.filter(p => p.id !== productId));
      }
      
      return { success: true, added: data.in_wishlist };
    } catch (error) {
      // Return error to caller for handling
      return { success: false, error: error.message };
    }
  };

  const addToWishlist = async (productId) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Login required' };
    }

    try {
      await storeApi.addToWishlist(productId);
      setWishlist(prev => {
        const exists = prev.some(p => p.id === productId);
        if (!exists) {
          return [...prev, { id: productId }];
        }
        return prev;
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Login required' };
    }

    try {
      await storeApi.removeFromWishlist(productId);
      setWishlist(prev => prev.filter(p => p.id !== productId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const isFavorited = (productId) => {
    return wishlist.some(p => p.id === productId);
  };

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider value={{
      wishlist,
      loading,
      toggleFavorite,
      addToWishlist,
      removeFromWishlist,
      isFavorited,
      wishlistCount,
      refreshWishlist: fetchWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;
