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
import CarouselCard from '../components/ui/CarouselCard';
import PageTransition from '../components/ui/PageTransition';

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

const buildCategoryLabel = (slug) => {
  const normalized = String(slug || '').trim();
  if (!normalized) return 'Categoria';

  return normalized
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getProductWeightLabel = (product) => {
  const normalized = normalizeCategory(product?.category);
  if (WEIGHTED_CATEGORIES.has(normalized)) {
    return '500 g';
  }
  return '';
};

const resolveCategorySlug = (categoryName = '') => {
  const normalized = normalizeCategory(categoryName);

  if (!normalized) return 'outro';
  if (normalized.includes('rondelli')) return 'rondelli';
  if (normalized.includes('molho')) return 'molhos';
  if (normalized.includes('combo')) return 'combo';
  return normalized;
};

const ProductsSkeleton = () => (
  <div className="catalog-sections">
    {Array.from({ length: 2 }, (_, sectionIndex) => (
      <section key={sectionIndex} className="catalog-section catalog-section--skeleton">
        <div className="catalog-section__header">
          <div>
            <div className="catalog-section__eyebrow">Categoria</div>
            <h2 className="catalog-section__title">Carregando itens</h2>
          </div>
        </div>
        <div className="catalog-skeleton-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton.ProductCard key={`${sectionIndex}-${index}`} index={index} />
          ))}
        </div>
      </section>
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
      category: resolveCategorySlug(product.category_name || product.category),
      categoryLabel: product.category_name || buildCategoryLabel(product.category),
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
      categoryLabel: 'Combos',
      productTypeName: 'Seleção da casa',
      comboItems: combo.items || [],
      tags: combo.featured ? ['Mais pedido'] : [],
      is_in_stock: combo.is_in_stock ?? combo.is_active,
      is_low_stock: false,
    }));

    return [...transformedProducts, ...transformedCombos];
  }, [storeProducts, combos]);

  const loading = isLoading && products.length === 0;

  const categories = useMemo(() => {
    const categoryMap = new Map();

    products.forEach((product) => {
      const value = (product.category || '').trim();
      if (!value) return;

      if (!categoryMap.has(value)) {
        categoryMap.set(value, {
          value,
          label: product.categoryLabel || buildCategoryLabel(value),
        });
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => {
      const rankA = getCategoryRank(a.value);
      const rankB = getCategoryRank(b.value);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return a.label.localeCompare(b.label, 'pt-BR');
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

  const groupedSections = useMemo(() => {
    const groups = new Map();

    filteredProducts.forEach((product) => {
      const key = product.category || 'outro';
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: product.categoryLabel || buildCategoryLabel(key),
          items: [],
        });
      }

      groups.get(key).items.push(product);
    });

    return Array.from(groups.values()).sort((a, b) => {
      const rankA = getCategoryRank(a.key);
      const rankB = getCategoryRank(b.key);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return a.label.localeCompare(b.label, 'pt-BR');
    });
  }, [filteredProducts]);

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

      <LoginModal isOpen={showLoginModal} onClose={handleCloseModal} />

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
          <span className="cardapio-subtitle">{store?.name || 'Cê Saladas'}</span>
          <h1 className="cardapio-title">Cardápio organizado por categoria</h1>
          <p className="cardapio-intro">
            Explore cada linha do cardápio com mais contexto visual, abra o detalhe do produto e adicione ao carrinho sem atrito.
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
            <EmptyState.Products onAction={() => { window.location.href = '/'; }} />
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
                  placeholder="Buscar por nome, categoria ou descrição"
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
                    key={category.value}
                    type="button"
                    className={`category-chip ${categoryFilter === category.value && !showFavoritesOnly ? 'active' : ''}`}
                    onClick={() => { setCategoryFilter(category.value); setShowFavoritesOnly(false); }}
                    role="tab"
                    aria-selected={categoryFilter === category.value && !showFavoritesOnly}
                  >
                    {category.label}
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
                <span>itens visíveis</span>
              </div>
              <div className="cardapio-overview__stat">
                <strong>{groupedSections.length}</strong>
                <span>faixas por categoria</span>
              </div>
              <div className="cardapio-overview__note">
                Clique em um item para abrir o modal com mais detalhes antes de adicionar ao carrinho.
              </div>
            </div>
          </PageTransition>

          {filteredProducts.length === 0 && (query || categoryFilter !== 'all' || showFavoritesOnly) && (
            <PageTransition animation="fadeIn" delay={150}>
              <EmptyState.Search query={query} onAction={handleClearSearch} />
            </PageTransition>
          )}

          {groupedSections.length > 0 && (
            <div className="catalog-sections">
              {groupedSections.map((section, sectionIndex) => (
                <PageTransition key={section.key} animation="fadeUp" delay={sectionIndex * 70}>
                  <section className="catalog-section">
                    <div className="catalog-section__header">
                      <div>
                        <span className="catalog-section__eyebrow">Categoria</span>
                        <h2 className="catalog-section__title">{section.label}</h2>
                        <p className="catalog-section__description">
                          {section.items.length} {section.items.length === 1 ? 'item disponível' : 'itens disponíveis'} nesta faixa.
                        </p>
                      </div>
                    </div>

                    <CarouselCard
                      items={section.items}
                      mobileCardsPerView={1}
                      tabletCardsPerView={2}
                      desktopCardsPerView={3}
                      renderItem={(product, index) => (
                        <ProductCard
                          product={product}
                          index={index}
                          className="catalog-product-card"
                          onAddToCart={handleAddToCart}
                          onOpenDetails={setSelectedItem}
                          weightLabel={getProductWeightLabel(product)}
                          favoriteButton={product.itemType === 'product' ? <FavoriteButton productId={product.id} size="small" /> : null}
                          stockBadge={<StockBadge quantity={product.stock_quantity} />}
                        />
                      )}
                    />
                  </section>
                </PageTransition>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Cardapio;
