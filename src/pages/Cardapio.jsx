import React, { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useStore } from '../context/StoreContext';
import LoginModal from '../components/LoginModal';
import Navbar from '../components/Navbar';
import FavoriteButton from '../components/FavoriteButton';
import StockBadge from '../components/StockBadge';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ProductCard from '../components/ui/ProductCard';
import PageTransition, { StaggeredList, AnimatedCard } from '../components/ui/PageTransition';

const CATEGORY_PRIORITY = ['rondelli', 'rondellis', 'molho', 'molhos'];
const WEIGHTED_CATEGORIES = new Set(['rondelli', 'rondellis', 'molho', 'molhos']);

const normalizeCategory = (value) => (value || '')
  .toString()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '')
  .trim();

const getCategoryRank = (value) => {
  const normalized = normalizeCategory(value);
  const index = CATEGORY_PRIORITY.indexOf(normalized);
  return index === -1 ? CATEGORY_PRIORITY.length + 1 : index;
};

const getProductWeightLabel = (product) => {
  const normalized = normalizeCategory(product?.category);
  if (WEIGHTED_CATEGORIES.has(normalized)) {
    return '500g';
  }
  return '';
};

// Loading skeleton for products
const ProductsSkeleton = () => (
  <div className="products-grid">
    {Array.from({ length: 6 }, (_, i) => (
      <Skeleton.ProductCard key={i} index={i} />
    ))}
  </div>
);

const Cardapio = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { isFavorited } = useWishlist();
  const { products: storeProducts, combos, isLoading, error, refreshCatalog } = useStore();

  // Transform store products to match expected format
  const products = useMemo(() => {
    const transformed = storeProducts.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || p.short_description,
      price: parseFloat(p.price),
      image_url: p.main_image_url || p.main_image,
      stock_quantity: p.stock_quantity ?? 100,
      category: p.category_name?.toLowerCase().includes('rondelli') ? 'rondelli' :
                p.category_name?.toLowerCase().includes('molho') ? 'molho' :
                p.category_name?.toLowerCase().includes('carne') ? 'carne' : 'outro',
      is_in_stock: p.is_in_stock,
      is_low_stock: p.is_low_stock,
    }));
    
    // Add combos
    const transformedCombos = combos.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      price: parseFloat(c.price),
      original_price: c.original_price ? parseFloat(c.original_price) : null,
      image_url: c.image_url,
      stock_quantity: 100,
      category: 'combo',
      is_in_stock: c.is_active,
      is_low_stock: false,
    }));
    
    return [...transformed, ...transformedCombos];
  }, [storeProducts, combos]);

  const loading = isLoading && products.length === 0;

  const categories = useMemo(() => {
    const values = products
      .map((product) => (product.category || '').trim())
      .filter(Boolean);
    return Array.from(new Set(values)).sort((a, b) => {
      const rankA = getCategoryRank(a);
      const rankB = getCategoryRank(b);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return a.localeCompare(b, 'pt-BR');
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesFavorites = !showFavoritesOnly || isFavorited(product.id);
      if (!normalizedQuery) {
        return matchesCategory && matchesFavorites;
      }
      const haystack = `${product.name || ''} ${product.description || ''}`.toLowerCase();
      return matchesCategory && matchesFavorites && haystack.includes(normalizedQuery);
    });
    return filtered.slice().sort((a, b) => {
      const rankA = getCategoryRank(a.category);
      const rankB = getCategoryRank(b.category);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return (a.name || '').localeCompare(b.name || '', 'pt-BR');
    });
  }, [products, query, categoryFilter, showFavoritesOnly, isFavorited]);

  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      setPendingProduct(product);
      setShowLoginModal(true);
      return;
    }
    if (product.stock_quantity <= 0) {
      return;
    }
    addToCart(product);
  };

  const handleLoginSuccess = () => {
    if (pendingProduct) {
      addToCart(pendingProduct);
      setPendingProduct(null);
    }
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
    setPendingProduct(null);
  };

  const handleClearSearch = () => {
    setQuery('');
    setCategoryFilter('all');
    setShowFavoritesOnly(false);
  };

  const handleToggleFavorites = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setShowFavoritesOnly(!showFavoritesOnly);
  };

  return (
    <div className="cardapio-page">
      <Navbar />
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={handleCloseModal}
        onSuccess={handleLoginSuccess}
      />

      {/* Header with animation */}
      <PageTransition animation="fadeUp" delay={0}>
        <div className="cardapio-header">
          <span className="cardapio-subtitle">Artesanal</span>
          <h1 className="cardapio-title">Nosso Cardápio</h1>
          <div className="cardapio-divider"></div>
        </div>
      </PageTransition>

      {/* Loading State */}
      {loading && (
        <div className="container">
          <ProductsSkeleton />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <PageTransition animation="fadeIn" delay={100}>
          <div className="container">
            <EmptyState.Error onAction={() => refreshCatalog()} />
          </div>
        </PageTransition>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <PageTransition animation="fadeIn" delay={100}>
          <div className="container">
            <EmptyState.Products onAction={() => window.location.href = '/'} />
          </div>
        </PageTransition>
      )}

      {/* Grid de Produtos */}
      {!loading && !error && products.length > 0 && (
        <div className="container">
          <PageTransition animation="fadeUp" delay={100}>
            <div className="cardapio-filters">
              <div className="cardapio-search">
                <Input
                  type="text"
                  placeholder="Buscar por nome ou descrição"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  fullWidth
                  leftIcon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                  }
                />
              </div>
              <div className="cardapio-category-buttons" role="tablist" aria-label="Categorias">
                <button
                  type="button"
                  className={`category-chip ${categoryFilter === 'all' && !showFavoritesOnly ? 'active' : ''}`}
                  onClick={() => { setCategoryFilter('all'); setShowFavoritesOnly(false); }}
                  role="tab"
                  aria-selected={categoryFilter === 'all' && !showFavoritesOnly}
                >
                  Todas
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`category-chip ${categoryFilter === category && !showFavoritesOnly ? 'active' : ''}`}
                    onClick={() => { setCategoryFilter(category); setShowFavoritesOnly(false); }}
                    role="tab"
                    aria-selected={categoryFilter === category && !showFavoritesOnly}
                  >
                    {category}
                  </button>
                ))}
                <button
                  type="button"
                  className={`category-chip favorites-chip ${showFavoritesOnly ? 'active' : ''}`}
                  onClick={handleToggleFavorites}
                  role="tab"
                  aria-selected={showFavoritesOnly}
                >
                  ❤️ Favoritos
                </button>
              </div>
            </div>
          </PageTransition>

          {/* No results for search */}
          {filteredProducts.length === 0 && (query || categoryFilter !== 'all') && (
            <PageTransition animation="fadeIn" delay={150}>
              <EmptyState.Search query={query} onAction={handleClearSearch} />
            </PageTransition>
          )}

          {/* Products Grid with staggered animation */}
          {filteredProducts.length > 0 && (
            <div className="products-grid">
              <StaggeredList staggerDelay={50} animation="fadeUp">
                {filteredProducts.map((p, index) => (
                  <AnimatedCard key={p.id} hover={true}>
                    <ProductCard
                      product={p}
                      index={index}
                      onAddToCart={handleAddToCart}
                      weightLabel={getProductWeightLabel(p)}
                      favoriteButton={<FavoriteButton productId={p.id} size="small" />}
                      stockBadge={<StockBadge quantity={p.stock_quantity} />}
                    />
                  </AnimatedCard>
                ))}
              </StaggeredList>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Cardapio;
