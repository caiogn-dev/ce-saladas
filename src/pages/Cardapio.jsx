import React, { useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useStore } from '../context/StoreContext';
import LoginModal from '../components/LoginModal';
import Navbar from '../components/Navbar';
import FavoriteButton from '../components/FavoriteButton';
import StockBadge from '../components/StockBadge';
import ProductDetailModal from '../components/ProductDetailModal';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ProductCard from '../components/ui/ProductCard';
import PageTransition, { StaggeredList, AnimatedCard } from '../components/ui/PageTransition';

const CATEGORY_PRIORITY = ['rondelli', 'rondellis', 'molho', 'molhos', 'combo'];
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

const resolveCategorySlug = (categoryName = '') => {
  const normalized = categoryName.toLowerCase();

  if (normalized.includes('rondelli')) return 'rondelli';
  if (normalized.includes('molho')) return 'molho';
  if (normalized.includes('carne')) return 'carne';
  return 'outro';
};

const ProductsSkeleton = () => (
  <div className="products-grid">
    {Array.from({ length: 6 }, (_, i) => (
      <Skeleton.ProductCard key={i} index={i} />
    ))}
  </div>
);

const Cardapio = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { addToCart, addComboToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { isFavorited } = useWishlist();
  const { store, products: storeProducts, combos, isLoading, error, refreshCatalog } = useStore();

  const products = useMemo(() => {
    const transformedProducts = storeProducts.map((product) => ({
      id: product.id,
      itemType: 'product',
      name: product.name,
      description: product.description || product.short_description,
      shortDescription: product.short_description || '',
      price: parseFloat(product.price),
      original_price: product.compare_at_price ? parseFloat(product.compare_at_price) : null,
      image_url: product.main_image_url || product.main_image,
      images: product.images || [],
      stock_quantity: product.stock_quantity ?? 100,
      category: resolveCategorySlug(product.category_name),
      categoryLabel: product.category_name || 'Produto',
      productTypeName: product.product_type_name || '',
      attributes: product.attributes || {},
      typeAttributes: product.type_attributes || {},
      tags: product.tags || [],
      variants: product.variants || [],
      is_in_stock: product.is_in_stock,
      is_low_stock: product.is_low_stock,
    }));

    const transformedCombos = combos.map((combo) => ({
      id: combo.id,
      itemType: 'combo',
      isCombo: true,
      name: combo.name,
      description: combo.description,
      shortDescription: combo.description || '',
      price: parseFloat(combo.price),
      original_price: combo.compare_at_price ? parseFloat(combo.compare_at_price) : null,
      savings: combo.savings ? parseFloat(combo.savings) : 0,
      image_url: combo.image_url,
      images: [],
      stock_quantity: combo.stock_quantity ?? 100,
      category: 'combo',
      categoryLabel: 'Combo',
      productTypeName: 'Selecao da casa',
      comboItems: combo.items || [],
      tags: combo.featured ? ['Mais pedido'] : [],
      is_in_stock: combo.is_in_stock ?? combo.is_active,
      is_low_stock: false,
    }));

    return [...transformedProducts, ...transformedCombos];
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

      const haystack = `${product.name || ''} ${product.description || ''} ${product.categoryLabel || ''}`.toLowerCase();
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

  const handleAddToCart = (item) => {
    if ((item.stock_quantity ?? 0) <= 0) {
      return;
    }

    if (item.itemType === 'combo' || item.isCombo) {
      addComboToCart(item);
      return;
    }

    addToCart(item);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
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
      />

      <ProductDetailModal
        isOpen={Boolean(selectedItem)}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={(item) => {
          handleAddToCart(item);
          setSelectedItem(null);
        }}
      />

      <PageTransition animation="fadeUp" delay={0}>
        <div className="cardapio-header">
          <span className="cardapio-subtitle">{store?.name || 'Artesanal'}</span>
          <h1 className="cardapio-title">Nosso Cardapio</h1>
          <p className="cardapio-intro">
            Veja os detalhes de cada item antes de pedir e monte seu pedido com menos atrito.
          </p>
          <div className="cardapio-divider"></div>
        </div>
      </PageTransition>

      {loading && (
        <div className="container">
          <ProductsSkeleton />
        </div>
      )}

      {error && !loading && (
        <PageTransition animation="fadeIn" delay={100}>
          <div className="container">
            <EmptyState.Error onAction={() => refreshCatalog()} />
          </div>
        </PageTransition>
      )}

      {!loading && !error && products.length === 0 && (
        <PageTransition animation="fadeIn" delay={100}>
          <div className="container">
            <EmptyState.Products onAction={() => window.location.href = '/'} />
          </div>
        </PageTransition>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="container">
          <PageTransition animation="fadeUp" delay={100}>
            <div className="cardapio-filters">
              <div className="cardapio-search">
                <Input
                  type="text"
                  placeholder="Buscar por nome, categoria ou descricao"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  fullWidth
                  leftIcon={(
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                  )}
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
                  Favoritos
                </button>
              </div>
            </div>
          </PageTransition>

          <PageTransition animation="fadeUp" delay={130}>
            <div className="cardapio-overview">
              <div className="cardapio-overview__stat">
                <strong>{filteredProducts.length}</strong>
                <span>itens visiveis</span>
              </div>
              <div className="cardapio-overview__stat">
                <strong>{categories.length}</strong>
                <span>categorias ativas</span>
              </div>
              <div className="cardapio-overview__note">
                Clique em um item para ver mais detalhes antes de adicionar ao carrinho.
              </div>
            </div>
          </PageTransition>

          {filteredProducts.length === 0 && (query || categoryFilter !== 'all' || showFavoritesOnly) && (
            <PageTransition animation="fadeIn" delay={150}>
              <EmptyState.Search query={query} onAction={handleClearSearch} />
            </PageTransition>
          )}

          {filteredProducts.length > 0 && (
            <div className="products-grid">
              <StaggeredList staggerDelay={50} animation="fadeUp">
                {filteredProducts.map((product, index) => (
                  <AnimatedCard key={`${product.itemType}-${product.id}`} hover={true}>
                    <ProductCard
                      product={product}
                      index={index}
                      onAddToCart={handleAddToCart}
                      onOpenDetails={setSelectedItem}
                      weightLabel={getProductWeightLabel(product)}
                      favoriteButton={product.itemType === 'product' ? <FavoriteButton productId={product.id} size="small" /> : null}
                      stockBadge={<StockBadge quantity={product.stock_quantity} />}
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
