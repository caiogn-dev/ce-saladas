import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Clock3,
  Leaf,
  MapPin,
  ReceiptText,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
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
import { useStore } from '../context/StoreContext';

const MENU_SECTIONS = [
  {
    key: 'saladas',
    title: 'Saladas',
    description: 'Combinações prontas, frescas e pensadas para resolver a refeição com leveza e rapidez.',
  },
  {
    key: 'molhos',
    title: 'Molhos',
    description: 'Complementos pensados para equilibrar sabor, textura e personalidade em cada pedido.',
  },
  {
    key: 'monte-sua-salada',
    title: 'Monte sua Salada',
    description: 'Escolha sua base, complemente com toppings e deixe o pedido com a sua cara.',
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
    haystack.includes('monte sua salada') ||
    haystack.includes('monte') ||
    haystack.includes('personaliz') ||
    haystack.includes('custom')
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
  <div className="catalog-layout">
    <div className="catalog-main">
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
    <aside className="catalog-aside catalog-aside--skeleton">
      <Skeleton variant="rect" height={200} style={{ borderRadius: '26px' }} />
      <Skeleton variant="rect" height={200} style={{ borderRadius: '26px' }} />
    </aside>
  </div>
);

const Cardapio = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [query, setQuery] = useState('');

  const {
    addToCart,
    addComboToCart,
    cartCount,
    cartTotal,
    hasItems,
    toggleCart,
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
        featuredIds.has(item.id) ||
        tagStack.includes('mais pedido') ||
        tagStack.includes('novidade') ||
        tagStack.includes('destaque')
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

    return (
      metadataLocation
      || store?.city && store?.state ? `${store.city} • ${store.state}` : null
      || store?.address
      || 'Pedido online para retirada ou entrega'
    );
  }, [store]);

  const storeHoursLabel = store?.metadata?.business_hours_label
    || store?.metadata?.opening_hours
    || 'Montado com ingredientes frescos e preparo rápido';

  const heroHighlights = [
    {
      icon: Leaf,
      label: 'Ingredientes frescos',
      value: `${catalogItems.length} itens no catálogo`,
    },
    {
      icon: Clock3,
      label: 'Fluxo direto',
      value: 'Escolha, adicione e finalize sem etapas desnecessárias',
    },
    {
      icon: ReceiptText,
      label: 'Checkout organizado',
      value: 'Entrega, retirada e pagamento em uma sequência clara',
    },
  ];

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
            <div className="cardapio-hero__banner">
              {store?.banner_url ? (
                <img src={store.banner_url} alt={store.name} className="cardapio-hero__banner-image" />
              ) : (
                <div className="cardapio-hero__banner-fallback" aria-hidden="true" />
              )}
            </div>

            <div className="cardapio-hero__panel">
              <div className="cardapio-hero__store-card">
                <div className="cardapio-hero__brand">
                  <div className="cardapio-hero__logo-shell">
                    {store?.logo_url ? (
                      <img src={store.logo_url} alt={store.name} className="cardapio-hero__logo" />
                    ) : (
                      <span className="cardapio-hero__logo-placeholder">Cê</span>
                    )}
                  </div>

                  <div className="cardapio-hero__copy">
                    <span className="cardapio-hero__eyebrow">Cardápio digital</span>
                    <h1 className="cardapio-hero__title">{store?.name || 'Cê Saladas'}</h1>
                    <p className="cardapio-hero__intro">
                      Saladas, molhos e montagens em uma vitrine clara, atraente e pronta para vender melhor no desktop e no mobile.
                    </p>

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
                  </div>
                </div>

                <div className="cardapio-hero__actions">
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

                  <button type="button" className="cardapio-hero__cart-btn" onClick={toggleCart}>
                    <ShoppingBag size={18} />
                    {hasItems ? `Abrir sacola • ${cartCount}` : 'Abrir sacola'}
                  </button>
                </div>
              </div>

              <div className="cardapio-hero__highlights">
                {heroHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="cardapio-highlight-card">
                      <span className="cardapio-highlight-card__icon">
                        <Icon size={18} />
                      </span>
                      <div>
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </div>
                    </div>
                  );
                })}
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

          {filteredItems.length === 0 && query && (
            <PageTransition animation="fadeIn" delay={150}>
              <EmptyState.Search query={query} onAction={handleClearSearch} />
            </PageTransition>
          )}

          {groupedSections.length > 0 && (
            <div className="catalog-layout">
              <main className="catalog-main">
                {!query && featuredItems.length > 0 && (
                  <PageTransition animation="fadeUp" delay={50}>
                    <section className="catalog-featured">
                      <div className="catalog-featured__header">
                        <div>
                          <span className="catalog-featured__eyebrow">Destaques da casa</span>
                          <h2 className="catalog-featured__title">Seleções para começar rápido</h2>
                        </div>
                        <p className="catalog-featured__description">
                          Produtos com mais apelo visual e compra recorrente para deixar a decisão mais simples logo no começo da navegação.
                        </p>
                      </div>

                      <CarouselCard
                        items={featuredItems}
                        mobileCardsPerView={1.12}
                        tabletCardsPerView={2.05}
                        desktopCardsPerView={2.85}
                        trackClassName="catalog-featured__track"
                        renderItem={(product, index) => (
                          <ProductCard
                            product={product}
                            index={index}
                            className="catalog-product-card catalog-product-card--featured"
                            onAddToCart={handleAddToCart}
                            onOpenDetails={setSelectedItem}
                            favoriteButton={product.itemType === 'product' ? <FavoriteButton productId={product.id} size="small" /> : null}
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
                            <span className="catalog-section__eyebrow">Categoria</span>
                            <h2 className="catalog-section__title">{section.title}</h2>
                            <p className="catalog-section__description">{section.description}</p>
                          </div>
                          <span className="catalog-section__count">
                            {section.items.length} {section.items.length === 1 ? 'item' : 'itens'}
                          </span>
                        </div>

                        <CarouselCard
                          items={section.items}
                          mobileCardsPerView={1.12}
                          tabletCardsPerView={2.1}
                          desktopCardsPerView={3.1}
                          renderItem={(product, index) => (
                            <ProductCard
                              product={product}
                              index={index}
                              className="catalog-product-card"
                              onAddToCart={handleAddToCart}
                              onOpenDetails={setSelectedItem}
                              favoriteButton={product.itemType === 'product' ? <FavoriteButton productId={product.id} size="small" /> : null}
                              stockBadge={<StockBadge quantity={product.stock_quantity} />}
                            />
                          )}
                        />
                      </section>
                    </PageTransition>
                  ))}
                </div>
              </main>

              <aside className="catalog-aside">
                <div className="catalog-aside__card catalog-aside__card--cart">
                  <div className="catalog-aside__icon">
                    <ShoppingBag size={18} />
                  </div>
                  <div className="catalog-aside__content">
                    <h3>Sacola</h3>
                    <p>
                      {hasItems
                        ? `${cartCount} ${cartCount === 1 ? 'item' : 'itens'} adicionados.`
                        : 'Adicione seus itens e acompanhe o total sem sair do cardápio.'}
                    </p>
                  </div>
                  <div className="catalog-aside__price">
                    <span>Total atual</span>
                    <strong>{formatMoney(cartTotal)}</strong>
                  </div>
                  <button type="button" className="catalog-aside__action" onClick={toggleCart}>
                    {hasItems ? 'Ver sacola e finalizar' : 'Abrir sacola'}
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="catalog-aside__card">
                  <div className="catalog-aside__icon catalog-aside__icon--muted">
                    <Sparkles size={18} />
                  </div>
                  <div className="catalog-aside__content">
                    <h3>Navegação mais clara</h3>
                    <p>
                      O cardápio foi reorganizado para leitura rápida: banner, destaques, categorias horizontais e detalhe de produto mais útil.
                    </p>
                  </div>
                </div>

                <div className="catalog-aside__card">
                  <div className="catalog-aside__icon catalog-aside__icon--muted">
                    <ReceiptText size={18} />
                  </div>
                  <div className="catalog-aside__content">
                    <h3>Fluxo de compra</h3>
                    <ul className="catalog-aside__list">
                      <li>Escolha os itens direto no catálogo.</li>
                      <li>Abra o detalhe quando quiser mais contexto.</li>
                      <li>Finalize pelo checkout com identificação leve.</li>
                    </ul>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Cardapio;
