import React, { useMemo, useState } from 'react';
import { ArrowRight, Clock3, MapPin, ShoppingBag } from 'lucide-react';
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
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

const MENU_SECTIONS = [
  {
    key: 'saladas',
    title: 'Saladas',
    description: 'Combinações frescas para almoço, jantar ou uma pausa leve no dia.',
  },
  {
    key: 'molhos',
    title: 'Molhos',
    description: 'Complementos para ajustar o sabor e finalizar o pedido do seu jeito.',
  },
  {
    key: 'monte-sua-salada',
    title: 'Monte sua Salada',
    description: 'Bases, extras e acompanhamentos para montar a combinação ideal.',
  },
];

const normalizeText = (value) => (value || '')
  .toString()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const inferCatalogSection = (item) => {
  if (item.itemType === 'combo' || item.isCombo) {
    return 'monte-sua-salada';
  }

  const haystack = normalizeText([
    item.categorySlug,
    item.category,
    item.categoryLabel,
    item.productTypeName,
    ...(Array.isArray(item.tags) ? item.tags : []),
    item.name,
  ].join(' '));

  if (haystack.includes('molho')) {
    return 'molhos';
  }

  if (
    haystack.includes('monte sua salada')
    || haystack.includes('monte')
    || haystack.includes('personaliz')
    || haystack.includes('custom')
  ) {
    return 'monte-sua-salada';
  }

  return 'saladas';
};

const formatMoney = (value) => Number(value || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const ProductsSkeleton = () => (
  <div className="catalog-main">
    <div className="catalog-toolbar catalog-toolbar--skeleton">
      <Skeleton variant="rect" height={52} style={{ borderRadius: '999px' }} />
      <Skeleton variant="rect" height={52} style={{ borderRadius: '999px' }} />
    </div>

    <div className="catalog-sections">
      {MENU_SECTIONS.map((section, sectionIndex) => (
        <section key={section.key} className="catalog-section catalog-section--skeleton">
          <div className="catalog-section__header">
            <div>
              <h2 className="catalog-section__title">{section.title}</h2>
              <p className="catalog-section__description">{section.description}</p>
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
  </div>
);

const Cardapio = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [query, setQuery] = useState('');
  const { isAuthenticated } = useAuth();

  const {
    addToCart,
    addComboToCart,
    cartCount,
    cartTotal,
    hasItems,
    openCart,
  } = useCart();

  const {
    store,
    products: storeProducts,
    combos,
    featuredProducts,
    isLoading,
    error,
    refreshCatalog,
  } = useStore();

  const catalogItems = useMemo(() => {
    const transformedProducts = storeProducts.map((product) => {
      const item = {
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
        category: product.category_name || product.category,
        categorySlug: product.category_slug || product.category,
        categoryLabel: product.category_name || product.category,
        productTypeName: product.product_type_name || '',
        attributes: product.attributes || {},
        typeAttributes: product.type_attributes || {},
        tags: product.tags || [],
        variants: product.variants || [],
        is_in_stock: product.is_in_stock,
        is_low_stock: product.is_low_stock,
      };

      return {
        ...item,
        catalogSection: inferCatalogSection(item),
      };
    });

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
      category: 'Monte sua Salada',
      categorySlug: 'monte-sua-salada',
      categoryLabel: 'Monte sua Salada',
      productTypeName: 'Monte sua Salada',
      comboItems: combo.items || [],
      tags: combo.featured ? ['Mais pedido'] : [],
      is_in_stock: combo.is_in_stock ?? combo.is_active,
      is_low_stock: false,
      catalogSection: 'monte-sua-salada',
    }));

    return [...transformedProducts, ...transformedCombos];
  }, [storeProducts, combos]);

  const loading = isLoading && catalogItems.length === 0;

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return catalogItems;
    }

    return catalogItems.filter((item) => {
      const haystack = normalizeText([
        item.name,
        item.description,
        item.categoryLabel,
        item.productTypeName,
      ].join(' '));

      return haystack.includes(normalizedQuery);
    });
  }, [catalogItems, query]);

  const groupedSections = useMemo(() => (
    MENU_SECTIONS
      .map((section) => ({
        ...section,
        items: filteredItems.filter((item) => item.catalogSection === section.key),
      }))
      .filter((section) => section.items.length > 0)
  ), [filteredItems]);

  const featuredIds = useMemo(
    () => new Set((featuredProducts || []).map((product) => product.id)),
    [featuredProducts]
  );

  const featuredItems = useMemo(() => {
    const taggedHighlights = filteredItems.filter((item) => {
      const tagStack = normalizeText((item.tags || []).join(' '));
      return (
        featuredIds.has(item.id)
        || tagStack.includes('mais pedido')
        || tagStack.includes('novidade')
        || tagStack.includes('destaque')
      );
    });

    if (taggedHighlights.length > 0) {
      return taggedHighlights.slice(0, 6);
    }

    return filteredItems
      .filter((item) => item.catalogSection === 'saladas')
      .slice(0, 6);
  }, [featuredIds, filteredItems]);

  const storeLocation = useMemo(() => {
    const metadataLocation = store?.metadata?.city && store?.metadata?.state
      ? `${store.metadata.city} • ${store.metadata.state}`
      : null;

    if (metadataLocation) {
      return metadataLocation;
    }

    if (store?.city && store?.state) {
      return `${store.city} • ${store.state}`;
    }

    return store?.address || 'Retirada e entrega disponíveis';
  }, [store]);

  const storeHoursLabel = store?.metadata?.business_hours_label
    || store?.metadata?.opening_hours
    || 'Pedido simples, rápido e sem cadastro obrigatório';

  const heroDescription = store?.metadata?.catalog_pitch
    || 'Escolha sua refeição, ajuste os sabores e finalize em poucos toques.';

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

  const handleClearSearch = () => {
    setQuery('');
  };

  const handleJumpToSection = (sectionKey) => {
    const sectionElement = document.getElementById(`catalog-section-${sectionKey}`);
    if (!sectionElement) {
      return;
    }

    sectionElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="cardapio-page">
      <Navbar />

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
        <header className="cardapio-hero">
          <div className="container">
            <div className="cardapio-hero__panel">
              <span className="cardapio-hero__accent" aria-hidden="true" />

              <div className="cardapio-hero__top">
                <div className="cardapio-hero__brand">
                  <div className="cardapio-hero__logo-shell">
                    {store?.logo_url ? (
                      <img src={store.logo_url} alt={store.name} className="cardapio-hero__logo" />
                    ) : (
                      <span className="cardapio-hero__logo-placeholder">Cê</span>
                    )}
                  </div>

                  <div className="cardapio-hero__copy">
                    <span className="cardapio-hero__eyebrow">Cardápio</span>
                    <h1 className="cardapio-hero__title">{store?.name || 'Cê Saladas'}</h1>
                    <p className="cardapio-hero__intro">{heroDescription}</p>
                  </div>
                </div>

                <button type="button" className="cardapio-hero__cart-btn" onClick={openCart}>
                  <ShoppingBag size={18} />
                  <span>{hasItems ? `Sacola (${cartCount})` : 'Abrir sacola'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="cardapio-hero__meta">
                <span>
                  <MapPin size={16} />
                  {storeLocation}
                </span>
                <span>
                  <Clock3 size={16} />
                  {storeHoursLabel}
                </span>
              </div>

              <div className="cardapio-hero__search-row">
                <div className="cardapio-hero__search">
                  <Input
                    type="text"
                    placeholder="Buscar saladas, molhos ou montagens"
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

                {query && (
                  <button type="button" className="cardapio-hero__clear" onClick={handleClearSearch}>
                    Limpar busca
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
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

      {!loading && !error && catalogItems.length === 0 && (
        <PageTransition animation="fadeIn" delay={100}>
          <div className="container">
            <EmptyState.Products onAction={() => { window.location.href = '/'; }} />
          </div>
        </PageTransition>
      )}

      {!loading && !error && catalogItems.length > 0 && (
        <div className="container">
          <div className="catalog-toolbar">
            <div className="catalog-quick-nav">
              {groupedSections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  className="catalog-quick-nav__chip"
                  onClick={() => handleJumpToSection(section.key)}
                >
                  <span>{section.title}</span>
                  <strong>{section.items.length}</strong>
                </button>
              ))}
            </div>

            <button type="button" className="catalog-toolbar__cart" onClick={openCart}>
              <ShoppingBag size={18} />
              <span>{hasItems ? `${cartCount} item(ns) - ${formatMoney(cartTotal)}` : 'Sacola vazia'}</span>
            </button>
          </div>

          {filteredItems.length === 0 && query && (
            <PageTransition animation="fadeIn" delay={150}>
              <EmptyState.Search query={query} onAction={handleClearSearch} />
            </PageTransition>
          )}

          {groupedSections.length > 0 && (
            <main className="catalog-main">
              {!query && featuredItems.length > 0 && (
                <PageTransition animation="fadeUp" delay={50}>
                  <section className="catalog-featured">
                    <div className="catalog-featured__header">
                      <div>
                        <span className="catalog-featured__eyebrow">Mais pedidos</span>
                        <h2 className="catalog-featured__title">Comece pelos favoritos da casa</h2>
                      </div>
                      <p className="catalog-featured__description">
                        Uma seleção objetiva para decidir rápido, sem poluir a experiência.
                      </p>
                    </div>

                    <CarouselCard
                      items={featuredItems}
                      mobileCardsPerView={1.18}
                      tabletCardsPerView={2.2}
                      desktopCardsPerView={3.35}
                      trackClassName="catalog-featured__track"
                      renderItem={(product, index) => (
                        <ProductCard
                          product={product}
                          index={index}
                          className="catalog-product-card catalog-product-card--featured"
                          onAddToCart={handleAddToCart}
                          onOpenDetails={setSelectedItem}
                          favoriteButton={product.itemType === 'product' && isAuthenticated ? <FavoriteButton productId={product.id} size="small" /> : null}
                          stockBadge={<StockBadge quantity={product.stock_quantity} />}
                        />
                      )}
                    />
                  </section>
                </PageTransition>
              )}

              <div className="catalog-sections">
                {groupedSections.map((section, sectionIndex) => (
                  <PageTransition key={section.key} animation="fadeUp" delay={sectionIndex * 70}>
                    <section id={`catalog-section-${section.key}`} className="catalog-section">
                      <div className="catalog-section__header">
                        <div>
                          <h2 className="catalog-section__title">{section.title}</h2>
                          <p className="catalog-section__description">{section.description}</p>
                        </div>
                        <span className="catalog-section__count">
                          {section.items.length} {section.items.length === 1 ? 'item' : 'itens'}
                        </span>
                      </div>

                      <CarouselCard
                        items={section.items}
                        mobileCardsPerView={1.18}
                        tabletCardsPerView={2.2}
                        desktopCardsPerView={3.35}
                        renderItem={(product, index) => (
                          <ProductCard
                            product={product}
                            index={index}
                            className="catalog-product-card"
                            onAddToCart={handleAddToCart}
                            onOpenDetails={setSelectedItem}
                            favoriteButton={product.itemType === 'product' && isAuthenticated ? <FavoriteButton productId={product.id} size="small" /> : null}
                            stockBadge={<StockBadge quantity={product.stock_quantity} />}
                          />
                        )}
                      />
                    </section>
                  </PageTransition>
                ))}
              </div>
            </main>
          )}
        </div>
      )}
    </div>
  );
};

export default Cardapio;
