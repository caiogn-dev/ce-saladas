import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Clock3, MapPin, ShoppingBag } from 'lucide-react';
import Navbar from '../components/Navbar';
import FavoriteButton from '../components/FavoriteButton';
import StockBadge from '../components/StockBadge';
import MenuProductRow from '../components/MenuProductRow';

// Heavy modals — loaded only when the user opens them
const ProductDetailModal = dynamic(() => import('../components/ProductDetailModal'), { ssr: false });
const SaladBuilder = dynamic(() => import('../components/SaladBuilder'), { ssr: false });
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import CarouselCard from '../components/ui/CarouselCard';
import ProductCard from '../components/ui/ProductCard';
import PageTransition from '../components/ui/PageTransition';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';

const MENU_SECTIONS = [
  {
    key: 'destaques',
    title: 'Destaques',
    description: 'Favoritos da casa e escolhas certeiras para começar.',
    featuredOnly: true,
  },
  {
    key: 'monte-sua-salada',
    title: 'Monte sua Salada',
    description: 'Monte do zero ou escolha um combo pronto — do seu jeito.',
    isBuilder: true,
  },
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
  // 'ingredientes' is intentionally omitted: those products feed the SaladBuilder
  // internally (see ingredientItems below) but are NOT displayed as a standalone
  // section in the cardápio. Only Saladas and Molhos are shown as product lists.
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

  // Ingredient-builder products first — a product tagged "ingrediente" goes to the
  // builder section even when its name also contains "molho" (e.g. "Molho Caesar").
  // Standalone molho products (only tagged "molho") go to the separate molhos section.
  if (
    haystack.includes('ingrediente')
    || haystack.includes('base')
    || haystack.includes('complemento')
    || haystack.includes('proteina')
  ) {
    return 'ingredientes';
  }

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
    </div>

    <div className="catalog-sections">
      {MENU_SECTIONS.filter((s) => !s.featuredOnly && !s.isBuilder).slice(0, 3).map((section, sectionIndex) => (
        <section key={section.key} className="catalog-section catalog-section--skeleton">
          <div className="catalog-section__header">
            <div>
              <h2 className="catalog-section__title">{section.title}</h2>
              <p className="catalog-section__description">{section.description}</p>
            </div>
          </div>
          <div className="catalog-skeleton-rows">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton.ProductCard key={`${sectionIndex}-${index}`} index={index} />
            ))}
          </div>
        </section>
      ))}
    </div>
  </div>
);

const Cardapio = () => {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState(null);
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const sectionRefs = useRef({});
  const navRef = useRef(null);

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
    if (!normalizedQuery) return catalogItems;
    return catalogItems.filter((item) => {
      const haystack = normalizeText([item.name, item.description, item.categoryLabel, item.productTypeName].join(' '));
      return haystack.includes(normalizedQuery);
    });
  }, [catalogItems, query]);

  const featuredIds = useMemo(
    () => new Set((featuredProducts || []).map((p) => p.id)),
    [featuredProducts]
  );

  const featuredItems = useMemo(() => {
    const tagged = filteredItems.filter((item) => {
      const tags = normalizeText((item.tags || []).join(' '));
      return featuredIds.has(item.id) || tags.includes('mais pedido') || tags.includes('novidade') || tags.includes('destaque');
    });
    if (tagged.length > 0) return tagged.slice(0, 8);
    return filteredItems.filter((item) => item.catalogSection === 'saladas').slice(0, 8);
  }, [featuredIds, filteredItems]);

  const ingredientItems = useMemo(
    () => filteredItems.filter((item) => item.catalogSection === 'ingredientes'),
    [filteredItems]
  );

  const groupedSections = useMemo(() => {
    return MENU_SECTIONS.map((section) => {
      if (section.featuredOnly) {
        return { ...section, items: featuredItems };
      }
      return {
        ...section,
        items: filteredItems.filter((item) => item.catalogSection === section.key),
      };
    }).filter((section) => section.items.length > 0 || section.isBuilder);
  }, [filteredItems, featuredItems]);

  const catalogHighlights = useMemo(() => ([
    {
      value: String(filteredItems.length).padStart(2, '0'),
      label: 'opções no cardápio',
    },
    {
      value: String(featuredItems.length).padStart(2, '0'),
      label: 'mais pedidos',
    },
    {
      value: hasItems ? formatMoney(cartTotal) : 'Pronta',
      label: hasItems ? `${cartCount} item(ns) na sacola` : 'sua sacola para montar',
    },
  ]), [filteredItems.length, featuredItems.length, hasItems, cartCount, cartTotal]);

  // Intersection observer for active nav tab
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observers = [];
    const visible = new Map();

    groupedSections.forEach(({ key }) => {
      const el = sectionRefs.current[key];
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          visible.set(key, entry.intersectionRatio);
          const best = [...visible.entries()].reduce((a, b) => (b[1] > a[1] ? b : a), ['', 0]);
          if (best[1] > 0) setActiveSection(best[0]);
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.1, 0.5, 1] }
      );

      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [groupedSections]);

  // Scroll-reveal: ativa .revealed nos elementos com classe .reveal quando entram na tela
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const els = document.querySelectorAll('.reveal:not(.revealed)');
    if (!els.length) return undefined;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } }),
      { rootMargin: '0px 0px -60px 0px', threshold: 0.08 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  });

  // Scroll active nav chip into view — horizontal only.
  // NEVER use chip.scrollIntoView(): elements inside position:sticky containers
  // cause the browser to scroll the page to the element's natural (pre-sticky)
  // position, yanking the page back to the top on every section change.
  useEffect(() => {
    if (!activeSection || !navRef.current) return;
    const nav = navRef.current.querySelector('.catalog-quick-nav');
    const chip = navRef.current.querySelector(`[data-section="${activeSection}"]`);
    if (!nav || !chip) return;
    const scrollTarget = chip.offsetLeft - nav.offsetWidth / 2 + chip.offsetWidth / 2;
    nav.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' });
  }, [activeSection]);

  const handleAddToCart = useCallback((item) => {
    if ((item.stock_quantity ?? 0) <= 0) return;
    if (item.itemType === 'combo' || item.isCombo) {
      addComboToCart(item);
    } else {
      addToCart(item);
    }
  }, [addToCart, addComboToCart]);

  const handleJumpToSection = (sectionKey) => {
    const el = sectionRefs.current[sectionKey];
    if (!el) return;
    // scroll-margin-top on .catalog-section already accounts for the sticky nav height.
    // scrollIntoView uses it natively — getBoundingClientRect() would be affected by
    // the PageTransition translateY transform and produce the wrong offset.
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const storeLocation = useMemo(() => {
    if (store?.metadata?.city && store?.metadata?.state) return `${store.metadata.city} • ${store.metadata.state}`;
    if (store?.city && store?.state) return `${store.city} • ${store.state}`;
    return store?.address || 'Retirada e entrega disponíveis';
  }, [store]);

  const storeHoursLabel = store?.metadata?.business_hours_label || store?.metadata?.opening_hours || 'entrega e retirada disponíveis';
  const heroDescription = store?.metadata?.catalog_pitch || 'bowls autorais e montados por você. entrega sob refrigeração em poucos minutos.';
  const heroCover = store?.metadata?.cover_image_url || featuredItems[0]?.image_url || store?.logo_url || null;

  return (
    <div className="cardapio-page">
      <Navbar />

      {/* Floating cart button — always visible while scrolling */}
      {hasItems && (
        <button key={`cart-fab-${cartCount}`} type="button" className="cart-fab is-pulsing" onClick={openCart} aria-label="Abrir sacola">
          <ShoppingBag size={20} />
          <span className="cart-fab__count">{cartCount}</span>
          <span className="cart-fab__total">{formatMoney(cartTotal)}</span>
        </button>
      )}

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
            <div className="cardapio-hero__cover" style={heroCover ? { backgroundImage: `url(${heroCover})` } : undefined} />

            <div className="cardapio-hero__panel">
              <div className="cardapio-hero__brand">
                <div className="cardapio-hero__logo-shell">
                  {store?.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="cardapio-hero__logo" />
                  ) : (
                    <span className="cardapio-hero__logo-placeholder">Cê</span>
                  )}
                </div>
                <div className="cardapio-hero__copy">
                  <h1 className="cardapio-hero__title">{store?.name || 'Cê Saladas'}</h1>
                  <p className="cardapio-hero__intro">{heroDescription}</p>
                  <div className="cardapio-hero__meta">
                    <span><MapPin size={16} />{storeLocation}</span>
                    <span><Clock3 size={16} />{storeHoursLabel}</span>
                  </div>
                </div>
              </div>

              <div className="cardapio-hero__search-row">
                <div className="cardapio-hero__search">
                  <Input
                    type="text"
                    placeholder="Buscar saladas, molhos ou montagens"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
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
                  <button type="button" className="cardapio-hero__clear" onClick={() => setQuery('')}>
                    limpar busca
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
      </PageTransition>

      {loading && (
        <div className="container"><ProductsSkeleton /></div>
      )}

      {error && !loading && (
        <PageTransition animation="fadeIn" delay={100}>
          <div className="container"><EmptyState.Error onAction={() => refreshCatalog()} /></div>
        </PageTransition>
      )}

      {!loading && !error && catalogItems.length === 0 && (
        <PageTransition animation="fadeIn" delay={100}>
          <div className="container">
            <EmptyState.Products onAction={() => { router.push('/'); }} />
          </div>
        </PageTransition>
      )}

      {!loading && !error && catalogItems.length > 0 && (
        <div className="container">
          {/* Sticky category nav */}
          <div className="catalog-toolbar" ref={navRef}>
            <div className="catalog-quick-nav">
              {groupedSections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  data-section={section.key}
                  className={`catalog-quick-nav__chip ${activeSection === section.key ? 'catalog-quick-nav__chip--active' : ''}`}
                  onClick={() => handleJumpToSection(section.key)}
                >
                  <span>{section.title}</span>
                  {!section.featuredOnly && !section.isBuilder && (
                    <strong>{section.items.length}</strong>
                  )}
                </button>
              ))}
            </div>

            <div className="catalog-toolbar__actions">
              {hasItems && (
                <button key={`toolbar-cart-${cartCount}`} type="button" className="catalog-toolbar__cart is-pulsing" onClick={openCart}>
                  <ShoppingBag size={18} />
                  <span>{`${cartCount} item(ns) — ${formatMoney(cartTotal)}`}</span>
                </button>
              )}
            </div>
          </div>

          {filteredItems.length === 0 && query && (
            <PageTransition animation="fadeIn" delay={150}>
              <EmptyState.Search query={query} onAction={() => setQuery('')} />
            </PageTransition>
          )}

          {groupedSections.length > 0 && (
            <main className="catalog-main">
              {groupedSections.map((section, sectionIndex) => (
                <PageTransition key={section.key} animation="fadeUp" delay={sectionIndex * 55}>
                  <section
                    id={`catalog-section-${section.key}`}
                    ref={(el) => { sectionRefs.current[section.key] = el; }}
                    className={`catalog-section ${section.featuredOnly ? 'catalog-section--featured' : ''}`}
                  >
                    <div className="catalog-section__header">
                      <div>
                        <h2 className="catalog-section__title">{section.title}</h2>
                        <p className="catalog-section__description">{section.description}</p>
                      </div>
                      {!section.featuredOnly && !section.isBuilder && section.items.length > 0 && (
                        <span className="catalog-section__count">
                          {section.items.length} {section.items.length === 1 ? 'item' : 'itens'}
                        </span>
                      )}
                    </div>

                    {/* Featured section — keep carousel, but smaller on mobile */}
                    {section.featuredOnly && section.items.length > 0 && (
                      <CarouselCard
                        items={section.items}
                        mobileCardsPerView={2.35}
                        tabletCardsPerView={2.15}
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
                    )}

                    {/* Builder section (Monte sua Salada) */}
                    {section.isBuilder && (
                      <>
                        <SaladBuilder
                          ingredients={ingredientItems}
                        />
                        {section.items.length > 0 && (
                          <div className="catalog-section__subheader">
                            <span>Combos prontos</span>
                            <span>{section.items.length} {section.items.length === 1 ? 'combo' : 'combos'}</span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Regular vertical list */}
                    {!section.featuredOnly && section.items.length > 0 && (
                      <div className="catalog-row-list">
                        {section.items.map((product, idx) => (
                          <div key={product.id} className="reveal" data-delay={String(Math.min(idx + 1, 6))}>
                            <MenuProductRow
                              product={product}
                              onOpenDetails={setSelectedItem}
                              favoriteButton={product.itemType === 'product' && isAuthenticated ? <FavoriteButton productId={product.id} size="small" /> : null}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </PageTransition>
              ))}
            </main>
          )}
        </div>
      )}
    </div>
  );
};

export default Cardapio;
