import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Clock3, MapPin, ShoppingBag, Star, ChefHat, Leaf, Droplets, GlassWater } from 'lucide-react';
import Navbar from '../components/Navbar';
import FavoriteButton from '../components/FavoriteButton';
import StockBadge from '../components/StockBadge';
import MenuProductRow from '../components/MenuProductRow';
import { getSaladVisual } from '../data/saladVisuals';

// Heavy modals — loaded only when the user opens them
const ProductDetailModal = dynamic(() => import('../components/ProductDetailModal'), { ssr: false });
const SaladBuilder = dynamic(() => import('../components/SaladBuilder'), { ssr: false });
const UpsellModal = dynamic(() => import('../components/UpsellModal'), { ssr: false });
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import CarouselCard from '../components/ui/CarouselCard';
import ProductCard from '../components/ui/ProductCard';
import PageTransition from '../components/ui/PageTransition';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { buildMediaUrl } from '../utils/media';

const MENU_SECTIONS = [
  {
    key: 'destaques',
    title: 'Destaques',
    description: 'Favoritos da casa e escolhas certeiras para começar.',
    featuredOnly: true,
    icon: Star,
  },
  {
    key: 'monte-sua-salada',
    title: 'Monte sua Salada',
    description: 'Monte do zero ou escolha um combo pronto — do seu jeito.',
    isBuilder: true,
    icon: ChefHat,
  },
  {
    key: 'saladas',
    title: 'Saladas',
    description: 'Combinações frescas para almoço, jantar ou uma pausa leve no dia.',
    icon: Leaf,
  },
  {
    key: 'molhos',
    title: 'Molhos',
    description: 'Complementos para ajustar o sabor e finalizar o pedido do seu jeito.',
    icon: Droplets,
  },
  {
    key: 'bebidas',
    title: 'Bebidas',
    description: 'Para acompanhar sua salada.',
    icon: GlassWater,
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

// Fixed category slugs used by the Salad Builder. `base`, `complemento`, `proteina`
// are builder-only (is_builder_group=true, hidden from menu); `molhos` is visible
// in the menu AND used as the molho step in the builder.
const BUILDER_INGREDIENT_SLUGS = new Set(['base', 'complemento', 'proteina', 'molhos']);

const inferCatalogSection = (item) => {
  if (item.itemType === 'combo' || item.isCombo) {
    return 'monte-sua-salada';
  }

  const slug = (item.categorySlug || '').toLowerCase();

  // Builder ingredients are grouped by fixed category slug.
  if (BUILDER_INGREDIENT_SLUGS.has(slug)) {
    return slug === 'molhos' ? 'molhos' : 'ingredientes';
  }

  const haystack = normalizeText([
    item.categorySlug,
    item.category,
    item.categoryLabel,
    item.productTypeName,
    ...(Array.isArray(item.tags) ? item.tags : []),
    item.name,
  ].join(' '));

  if (
    haystack.includes('bebida')
    || haystack.includes('suco')
    || haystack.includes('refrigerante')
    || haystack.includes('agua')
  ) {
    return 'bebidas';
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
  const [upsellOpen, setUpsellOpen] = useState(false);
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
  const { isAuthenticated } = useAuth();

  const {
    store,
    products: storeProducts,
    combos,
    categories,
    featuredProducts,
    isLoading,
    error,
    refreshCatalog,
  } = useStore();

  // Builder-group categories (is_builder_group=true) must never surface as menu
  // sections — their products are only used inside the SaladBuilder.
  const builderGroupSlugs = useMemo(
    () => new Set(
      (categories || [])
        .filter((c) => c.is_builder_group === true)
        .map((c) => (c.slug || '').toLowerCase())
    ),
    [categories]
  );

  // Fixed base price of a built salad = price of the `monte-sua-salada` combo.
  const saladBasePrice = useMemo(() => {
    const base = (combos || []).find((c) => c.slug === 'monte-sua-salada');
    return base ? parseFloat(base.price) || 0 : 0;
  }, [combos]);

  const catalogItems = useMemo(() => {
    const transformedProducts = storeProducts.map((product) => {
      const saladVisual = getSaladVisual(product.slug);
      const item = {
        id: product.id,
        itemType: 'product',
        name: product.name,
        description: product.description || product.short_description,
        shortDescription: product.short_description || '',
        price: parseFloat(product.price),
        original_price: product.compare_at_price ? parseFloat(product.compare_at_price) : null,
        image_url: saladVisual?.card || saladVisual?.hero || product.main_image_url || product.main_image,
        images: saladVisual?.detail ? [saladVisual.detail, ...(product.images || [])] : (product.images || []),
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

    const transformedCombos = combos
      // The `monte-sua-salada` combo is only the fixed base price source for the
      // SaladBuilder — never render it as a regular combo card.
      .filter((combo) => combo.slug !== 'monte-sua-salada')
      .map((combo) => ({
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
    const notBuilderGroup = (item) =>
      !builderGroupSlugs.has((item.categorySlug || '').toLowerCase());
    const tagged = filteredItems.filter((item) => {
      if (!notBuilderGroup(item)) return false;
      const tags = normalizeText((item.tags || []).join(' '));
      return featuredIds.has(item.id) || tags.includes('mais pedido') || tags.includes('novidade') || tags.includes('destaque');
    });
    if (tagged.length > 0) return tagged.slice(0, 8);
    return filteredItems.filter((item) => item.catalogSection === 'saladas' && notBuilderGroup(item)).slice(0, 8);
  }, [featuredIds, filteredItems, builderGroupSlugs]);

  // SaladBuilder ingredients = products whose category slug is one of the fixed
  // builder slugs: base, complemento, proteina, molhos.
  const ingredientItems = useMemo(
    () => filteredItems
      .filter((item) =>
        item.itemType !== 'combo'
        && BUILDER_INGREDIENT_SLUGS.has((item.categorySlug || '').toLowerCase())
      )
      // Molho é 1 produto com variantes (sabores): expande cada variante numa
      // opção selecionável, pro cliente escolher 1 entre os sabores. No builder
      // o molho é incluso (1 grátis) → preço 0.
      .flatMap((item) => {
        const slug = (item.categorySlug || '').toLowerCase();
        const variants = Array.isArray(item.variants) ? item.variants : [];
        if (slug.includes('molho') && variants.length > 0) {
          return variants.map((v) => ({
            ...item,
            id: v.id,
            name: v.name,
            price: 0,
            image_url: v.image_url || item.image_url,
            variants: [],
          }));
        }
        return [item];
      }),
    [filteredItems]
  );

  // Usa storeProducts (dados crus da API) para evitar dependência de transformações.
  // Molhos: nome contém 'molho'. Bebidas: tag 'bebida'.
  const molhosItems = useMemo(
    () => (storeProducts || [])
      .filter((p) => (p.name || '').toLowerCase().includes('molho'))
      // Expande as variantes (sabores) em opções individuais para o upsell.
      .flatMap((p) => {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        if (variants.length > 0) {
          // No upsell o molho é um EXTRA → herda o preço do produto quando a
          // variante não tem preço próprio. id = PRODUTO (cart faz lookup de
          // StoreProduct) + variant_id = sabor.
          const parentPrice = parseFloat(p.price) || 0;
          return variants.map((v) => ({
            id: p.id,
            variant_id: v.id,
            variant_name: v.name,
            name: v.name,
            price: v.price != null && v.price !== '' ? parseFloat(v.price) : parentPrice,
            image_url: v.image_url || p.main_image_url || p.main_image,
            category_slug: p.category_slug,
          }));
        }
        return [{ ...p, image_url: p.main_image_url || p.main_image }];
      }),
    [storeProducts],
  );

  const drinksItems = useMemo(
    () => (storeProducts || [])
      .filter((p) => (p.tags || []).includes('bebida'))
      .map((p) => ({ ...p, image_url: p.main_image_url || p.main_image })),
    [storeProducts],
  );

  const groupedSections = useMemo(() => {
    return MENU_SECTIONS.map((section) => {
      if (section.featuredOnly) {
        return { ...section, items: featuredItems };
      }
      return {
        ...section,
        items: filteredItems.filter((item) =>
          item.catalogSection === section.key
          // Defensive: never let a builder-group category (base/complemento/
          // proteina) leak into a visible menu section. molhos stays visible.
          && !builderGroupSlugs.has((item.categorySlug || '').toLowerCase())
        ),
      };
    }).filter((section) => section.items.length > 0 || section.isBuilder);
  }, [filteredItems, featuredItems, builderGroupSlugs]);

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
      if (item.catalogSection === 'saladas') {
        setUpsellOpen(true);
      }
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
  const heroCover = buildMediaUrl(store?.metadata?.cover_image_url || featuredItems[0]?.image_url || store?.logo_url || '') || null;

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

      <UpsellModal
        isOpen={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        onViewCart={() => { setUpsellOpen(false); openCart(); }}
        sauces={molhosItems}
        drinks={drinksItems}
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
                    <span><MapPin size={12} />{storeLocation}</span>
                    <span><Clock3 size={12} />{storeHoursLabel}</span>
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
                        <div className="catalog-section__title-row">
                          {section.icon && <section.icon size={16} className="catalog-section__title-icon" />}
                          <h2 className="catalog-section__title">{section.title}</h2>
                        </div>
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
                          basePrice={saladBasePrice}
                          onAddedToCart={() => setUpsellOpen(true)}
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
