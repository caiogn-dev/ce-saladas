/**
 * Cart Context - Uses unified Store API
 * 
 * Manages shopping cart state using the new /api/v1/stores/s/{store_slug}/cart/ endpoints.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as storeApi from '../services/storeApi';
import { buildMediaUrl } from '../utils/media';

const CartContext = createContext();

// Cache management
const CART_CACHE_TTL_MS = 5 * 60 * 1000;
let cartFetchPromise = null;
let cartCache = null;
let cartCacheTs = 0;

const readCartCache = () => {
  if (!cartCache || !cartCacheTs) return null;
  if (Date.now() - cartCacheTs > CART_CACHE_TTL_MS) {
    cartCache = null;
    cartCacheTs = 0;
    return null;
  }
  return cartCache;
};

const writeCartCache = (data) => {
  cartCache = data;
  cartCacheTs = Date.now();
};

const clearCartCacheInternal = () => {
  cartCache = null;
  cartCacheTs = 0;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [combos, setCombos] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const cartRef = useRef({ products: [], combos: [] });

  useEffect(() => {
    cartRef.current = { products: cart, combos };
  }, [cart, combos]);

  // Normalize cart item from unified Store API response
  const normalizeCartItem = (item) => ({
    id: item.product,
    cart_item_id: item.id,
    name: item.product_name,
    price: item.unit_price,
    image: buildMediaUrl(item.product_image),
    quantity: item.quantity,
    options: item.options || {},
    notes: item.notes || '',
  });

  // Normalize combo item from unified Store API response
  const normalizeComboItem = (item) => ({
    id: item.combo,
    cart_item_id: item.id,
    name: item.combo_name,
    price: item.unit_price,
    image: buildMediaUrl(item.combo_image),
    quantity: item.quantity,
    customizations: item.customizations || {},
    notes: item.notes || '',
    isCombo: true,
  });

  const buildOptimisticItem = (product, quantity) => ({
    id: product.id,
    cart_item_id: `temp_${product.id}`,
    name: product.name || product.nome,
    price: product.price || product.preco,
    image: buildMediaUrl(product.main_image_url || product.image || product.imagem_url),
    quantity,
  });

  const buildOptimisticCombo = (combo, quantity) => ({
    id: combo.id,
    cart_item_id: `temp_combo_${combo.id}`,
    name: combo.name || combo.nome,
    price: combo.price || combo.preco,
    image: buildMediaUrl(combo.image_url || combo.image || combo.imagem_url),
    quantity,
    isCombo: true,
  });

  // Fetch cart from unified API
  const fetchCart = useCallback(async ({ force = false } = {}) => {
    const cached = readCartCache();
    if (!force && cached) {
      setCart(cached.products || []);
      setCombos(cached.combos || []);
      return cached;
    }

    if (cartFetchPromise) return cartFetchPromise;

    cartFetchPromise = (async () => {
      try {
        const data = await storeApi.getCart();
        
        // Normalize items from unified API
        const formattedProducts = (data.items || []).map(normalizeCartItem);
        const formattedCombos = (data.combo_items || []).map(normalizeComboItem);
        
        setCart(formattedProducts);
        setCombos(formattedCombos);
        writeCartCache({ products: formattedProducts, combos: formattedCombos });
        return { products: formattedProducts, combos: formattedCombos };
      } catch (error) {
        console.error('Error fetching cart:', error);
        return null;
      } finally {
        cartFetchPromise = null;
      }
    })();

    return cartFetchPromise;
  }, []);

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // Add product to cart
  const addToCart = async (product) => {
    setIsLoading(true);
    const previousCart = cartRef.current.products;
    
    // Optimistic update
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      }
      return [...prevCart, buildOptimisticItem(product, 1)];
    });
    setIsCartOpen(true);

    try {
      await storeApi.addToCart(product.id, 1, {}, '');
      await fetchCart({ force: true });
    } catch (error) {
      console.error('Error adding to cart:', error);
      setCart(previousCart);
      alert('Erro ao adicionar ao carrinho.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add combo to cart
  const addComboToCart = async (combo) => {
    setIsLoading(true);
    const previousCombos = cartRef.current.combos;
    
    // Optimistic update
    setCombos((prevCombos) => {
      const existingIndex = prevCombos.findIndex((item) => item.id === combo.id);
      if (existingIndex >= 0) {
        const updated = [...prevCombos];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      }
      return [...prevCombos, buildOptimisticCombo(combo, 1)];
    });
    setIsCartOpen(true);

    try {
      await storeApi.addComboToCart(combo.id, 1, {}, '');
      await fetchCart({ force: true });
    } catch (error) {
      console.error('Error adding combo to cart:', error);
      setCombos(previousCombos);
      alert('Erro ao adicionar combo ao carrinho.');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove product from cart
  const removeFromCart = async (productId) => {
    const previousCart = cartRef.current.products;
    const item = cart.find((i) => i.id === productId);
    
    setCart((prevCart) => prevCart.filter((i) => i.id !== productId));
    
    try {
      if (item?.cart_item_id && !item.cart_item_id.startsWith('temp_')) {
        await storeApi.removeCartItem(item.cart_item_id);
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      setCart(previousCart);
    }
  };

  // Remove combo from cart
  const removeComboFromCart = async (comboId) => {
    const previousCombos = cartRef.current.combos;
    const item = combos.find((i) => i.id === comboId);
    
    setCombos((prevCombos) => prevCombos.filter((i) => i.id !== comboId));
    
    try {
      if (item?.cart_item_id && !item.cart_item_id.startsWith('temp_')) {
        await storeApi.removeCartItem(item.cart_item_id);
      }
    } catch (error) {
      console.error('Error removing combo from cart:', error);
      setCombos(previousCombos);
    }
  };

  // Update product quantity
  const updateQuantity = async (productId, amount) => {
    const currentItem = cart.find((item) => item.id === productId);
    if (!currentItem) return;

    const newQuantity = currentItem.quantity + amount;
    if (newQuantity < 1) {
      return removeFromCart(productId);
    }

    const previousCart = cartRef.current.products;
    setCart((prevCart) => prevCart.map((item) =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));

    try {
      if (currentItem.cart_item_id && !currentItem.cart_item_id.startsWith('temp_')) {
        await storeApi.updateCartItem(currentItem.cart_item_id, newQuantity);
      }
      await fetchCart({ force: true });
    } catch (error) {
      console.error('Error updating quantity:', error);
      setCart(previousCart);
    }
  };

  // Update combo quantity
  const updateComboQuantity = async (comboId, amount) => {
    const currentItem = combos.find((item) => item.id === comboId);
    if (!currentItem) return;

    const newQuantity = currentItem.quantity + amount;
    if (newQuantity < 1) {
      return removeComboFromCart(comboId);
    }

    const previousCombos = cartRef.current.combos;
    setCombos((prevCombos) => prevCombos.map((item) =>
      item.id === comboId ? { ...item, quantity: newQuantity } : item
    ));

    try {
      if (currentItem.cart_item_id && !currentItem.cart_item_id.startsWith('temp_')) {
        await storeApi.updateCartItem(currentItem.cart_item_id, newQuantity);
      }
      await fetchCart({ force: true });
    } catch (error) {
      console.error('Error updating combo quantity:', error);
      setCombos(previousCombos);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      await storeApi.clearCart();
      setCart([]);
      setCombos([]);
      clearCartCacheInternal();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  // Calculate totals
  const productTotal = cart.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
  const comboTotal = combos.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
  const cartTotal = productTotal + comboTotal;
  
  const productCount = cart.reduce((count, item) => count + item.quantity, 0);
  const comboCount = combos.reduce((count, item) => count + item.quantity, 0);
  const cartCount = productCount + comboCount;

  const hasItems = cart.length > 0 || combos.length > 0;

  return (
    <CartContext.Provider value={{
      // Products
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      
      // Combos
      combos,
      addComboToCart,
      removeComboFromCart,
      updateComboQuantity,
      
      // Totals
      cartCount,
      cartTotal,
      productTotal,
      comboTotal,
      hasItems,
      
      // UI State
      isCartOpen,
      isLoading,
      toggleCart,
      clearCart,
      fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
