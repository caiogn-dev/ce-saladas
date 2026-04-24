import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Gift,
  MapPin,
  Search,
  ShoppingBag,
  TicketPercent,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import FavoriteButton from '../components/FavoriteButton';
import StockBadge from '../components/StockBadge';
import MenuProductRow from '../components/MenuProductRow';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import CarouselCard from '../components/ui/CarouselCard';
import ProductCard from '../components/ui/ProductCard';
import PageTransition from '../components/ui/PageTransition';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

const ProductDetailModal = dynamic(() => import('../components/ProductDetailModal'), { ssr: false });
const SaladBuilder = dynamic(() => import('../components/SaladBuilder'), { ssr: false });

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
    description: 'Monte do zero ou escolha um combo pronto, sem sair da mesma tela.',
    isBuilder: true,
  },
  {
    key: 'saladas',
    title: 'Saladas',
    description: 'Pratos frescos, diretos e prontos para almoço, jantar ou pausa rápida.',
  },
  {
    key: 'molhos',
    title: 'Molhos',
    description: 'Complementos para finalizar o pedido do seu jeito.',
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

const normalizePhone = (value = '') => value.replace(/\D/g, '');

const ProductsSkeleton = () => (
  <div className="catalog-shell catalog-shell--loading">
    <div className="catalog-content">
      <div className="catalog-toolbar catalog-toolbar--skeleton">
        <Skeleton variant="rect" height={52} style={{ borderRadius: '999px' }} />
      </div>

      <div className="catalog-main">
        {MENU_SECTIONS.filter((s) => !s.featuredOnly && !s.isBuilder).slice(0, 2).map((section, sectionIndex) => (
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

    <aside className="catalog-aside">
      <div className="catalog-aside__panel">
        <Skeleton variant="rect" height={360} style={{ borderRadius: '24px' }} />
      </div>
    </aside>
  </div>
);

const Cardapio = () => {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState(null);
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const { isAuthenticated } = useAuth();
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
        featured: Boolean(product.featured),
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
      featured: Boolean(combo.featured),
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
    () => new Set((featuredProducts || []).map((product) => product.id)),
    [featuredProducts]
  );

  const featuredItems = useMemo(() => {
    const tagged = filteredItems.filter((item) => {
      const tags = normalizeText((item.tags || []).join(' '));
      return featuredIds.has(item.id) || item.featured || tags.includes('mais pedido') || tags.includes('novidade') || tags.includes('destaque');
    });

    if (tagged.length > 0) return tagged.slice(0, 8);
    return filteredItems.filter((item) => item.catalogSection === 'saladas').slice(0, 8);
  }, [featuredIds, filteredItems]);

  const ingredientItems = useMemo(
    () => filteredItems.filter((item) => item.catalogSection === 'ingredientes'),
    [filteredItems]
  );

  const groupedSections = useMemo(() => MENU_SECTIONS.map((section) => {
    if (section.featuredOnly) {
      return { ...section, items: featuredItems };
    }

    return {
      ...section,
      items: filteredItems.filter((item) => item.catalogSection === section.key),
    };
  }).filter((section) => section.items.length > 0 || section.isBuilder), [featuredItems, filteredItems]);

  const catalogHighlights = useMemo(() => ([
    {
      value: String(filteredItems.length).padStart(2, '0'),
      label: 'opções no cardápio',
    },
    {
      value: String(featuredItems.length).padStart(2, '0'),
      label: 'em destaque',
    },
    {
      value: hasItems ? formatMoney(cartTotal) : 'Aberto',
      label: hasItems ? `${cartCount} item(ns) na sacola` : 'retirada e entrega',
    },
  ]), [cartCount, cartTotal, featuredItems.length, filteredItems.length, hasItems]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observers = [];
    const visible = new Map();

    groupedSections.forEach(({ key }) => {
      const element = sectionRefs.current[key];
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          visible.set(key, entry.intersectionRatio);
          const best = [...visible.entries()].reduce((acc, current) => (current[1] > acc[1] ? current : acc), ['', 0]);
          if (best[1] > 0) setActiveSection(best[0]);
        },
        { rootMargin: '-15% 0px -60% 0px', threshold: [0, 0.15, 0.4, 0.8] }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [groupedSections]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const elements = document.querySelectorAll('.reveal:not(.revealed)');
    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      }),
      { rootMargin: '0px 0px -70px 0px', threshold: 0.08 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  });

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
  }, [addComboToCart, addToCart]);

  const handleJumpToSection = useCallback((sectionKey) => {
    const element = sectionRefs.current[sectionKey];
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const storeLocation = useMemo(() => {
    if (store?.metadata?.city && store?.metadata?.state) return `${store.metadata.city} • ${store.metadata.state}`;
    if (store?.city && store?.state) return `${store.city} • ${store.state}`;
    return store?.address || 'Retirada e entrega disponíveis';
  }, [store]);

  const storeHoursLabel = store?.metadata?.business_hours_label || store?.metadata?.opening_hours || 'Pedido simples, rápido e sem cadastro obrigatório';
  const heroDescription = store?.metadata?.catalog_pitch || 'Escolha sua refeição, ajuste os sabores e finalize com poucos toques.';
  const heroSpotlight = featuredItems[0] || filteredItems[0] || null;
  const heroCover = store?.cover_image_url || store?.metadata?.cover_image_url || heroSpotlight?.image_url || null;
  const deliveryCta = store?.metadata?.delivery_cta || 'Calcular taxa e tempo de entrega';
  const deliveryHint = store?.metadata?.delivery_hint || 'Entrega grátis em pedidos a partir de R$ 40,00';
  const loyaltyHint = store?.metadata?.loyalty_pitch || 'A cada R$ 100 em compras você ganha crédito para o próximo pedido.';
  const asideHelpLabel = hasItems ? `${cartCount} item(ns) prontos para finalizar` : 'Sua sacola ainda está vazia';

  const whatsappNumber = useMemo(
    () => normalizePhone(store?.whatsapp_number || store?.phone || ''),
    [store?.phone, store?.whatsapp_number]
  );

  const whatsappUrl = useMemo(() => (
    whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Ola! Quero ajuda para montar meu pedido na ${store?.name || 'Ce Saladas'}.`)}`
      : '#'
  ), [store?.name, whatsappNumber]);

  const bottomNavItems = [
    { key: 'inicio', label: 'Início', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { key: 'promocoes', label: 'Promoções', onClick: () => handleJumpToSection('destaques') },
    { key: 'pedidos', label: 'Pedidos', onClick: hasItems ? openCart : () => router.push('/checkout') },
  ];

  return (
    <div className="cardapio-page">
      <Navbar />

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
        <section className="menu-topbar">
          <div className="container menu-topbar__row">
            <button type="button" className="menu-topbar__store">
              <span className="menu-topbar__store-logo">
                {store?.logo_url ? <img src={store.logo_url} alt={store?.name || 'Loja'} /> : 'Cê'}
              </span>
              <span className="menu-topbar__store-copy">
                <strong>{store?.name || 'Cê Saladas'}</strong>
                <small>{store?.category_label || 'Cardápio'}</small>
              </span>
            </button>

            <div className="menu-topbar__search">
              <Search size={17} />
              <Input
                type="text"
                placeholder="Busque por um produto"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                fullWidth
              />
            </div>

            <nav className="menu-topbar__nav" aria-label="Atalhos do cardápio">
              <button type="button" className="menu-topbar__nav-item is-active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Início</button>
              <button type="button" className="menu-topbar__nav-item" onClick={() => handleJumpToSection('destaques')}>Promoções</button>
              <button type="button" className="menu-topbar__nav-item" onClick={hasItems ? openCart : () => router.push('/checkout')}>Pedidos</button>
            </nav>
          </div>
        </section>
      </PageTransition>

      <PageTransition animation="fadeUp" delay={40}>
        <header className="cardapio-hero">
          <div className="container">
            <div className="cardapio-hero__promo">
              <TicketPercent size={16} />
              <span>Você tem 1 cupom! Aproveite o melhor do cardápio hoje.</span>
            </div>

            <div className="cardapio-hero__cover" style={heroCover ? { backgroundImage: `url(${heroCover})` } : undefined}>
              <div className="cardapio-hero__cover-shade" />
              <div className="cardapio-hero__identity">
                <div className="cardapio-hero__logo-shell">
                  {store?.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="cardapio-hero__logo" />
                  ) : (
                    <span className="cardapio-hero__logo-placeholder">Cê</span>
                  )}
                </div>

                <div className="cardapio-hero__copy">
                  <span className="cardapio-hero__eyebrow">Cardápio aberto</span>
                  <h1 className="cardapio-hero__title">{store?.name || 'Cê Saladas'}</h1>
                  <p className="cardapio-hero__intro">{heroDescription}</p>
                  <div className="cardapio-hero__meta">
                    <span><MapPin size={16} />{storeLocation}</span>
                    <span><Clock3 size={16} />{storeHoursLabel}</span>
                  </div>
                </div>

                <button
                  key={cartCount > 0 ? `hero-cart-${cartCount}` : 'hero-cart-empty'}
                  type="button"
                  className={`cardapio-hero__cart-btn${!hasItems ? ' cardapio-hero__cart-btn--empty' : ''}${cartCount > 0 ? ' is-pulsing' : ''}`}
                  onClick={openCart}
                >
                  <ShoppingBag size={18} />
                  <span>{hasItems ? `Sacola (${cartCount})` : 'Abrir sacola'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="cardapio-hero__utility-grid">
              <button type="button" className="cardapio-hero__utility cardapio-hero__utility--delivery" onClick={() => router.push('/checkout')}>
                <div>
                  <strong>{deliveryCta}</strong>
                  <span>{deliveryHint}</span>
                </div>
                <ChevronRight size={18} />
              </button>

              <div className="cardapio-hero__utility cardapio-hero__utility--loyalty">
                <Gift size={18} />
                <div>
                  <strong>Programa de fidelidade</strong>
                  <span>{loyaltyHint}</span>
                </div>
              </div>
            </div>

            <div className="cardapio-hero__controls">
              <label className="cardapio-hero__select">
                <span>Lista de categorias</span>
                <select
                  value={activeSection || ''}
                  onChange={(event) => handleJumpToSection(event.target.value)}
                >
                  <option value="" disabled>Escolha uma seção</option>
                  {groupedSections.map((section) => (
                    <option key={section.key} value={section.key}>{section.title}</option>
                  ))}
                </select>
              </label>

              {query && (
                <button type="button" className="cardapio-hero__clear" onClick={() => setQuery('')}>
                  Limpar busca
                </button>
              )}
            </div>

            <div className="cardapio-hero__stats" aria-label="Resumo do cardápio">
              {catalogHighlights.map((highlight) => (
                <div key={highlight.label} className="cardapio-hero__stat">
                  <strong>{highlight.value}</strong>
                  <span>{highlight.label}</span>
                </div>
              ))}
            </div>

            {heroSpotlight && (
              <div className="cardapio-hero__spotlight">
                <div className="cardapio-hero__spotlight-copy">
                  <span>Destaque do dia</span>
                  <strong>{heroSpotlight.name}</strong>
                  <p>{heroSpotlight.shortDescription || heroSpotlight.description || 'Escolha certeira para começar seu pedido.'}</p>
                </div>
                <button type="button" className="cardapio-hero__spotlight-action" onClick={() => setSelectedItem(heroSpotlight)}>
                  Ver detalhes
                </button>
              </div>
            )}
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
            <EmptyState.Products onAction={() => { router.push('/'); }} />
          </div>
        </PageTransition>
      )}

      {!loading && !error && catalogItems.length > 0 && (
        <div className="container">
          <div className="catalog-shell">
            <div className="catalog-content">
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

                <button
                  key={cartCount > 0 ? `toolbar-cart-${cartCount}` : 'toolbar-cart-empty'}
                  type="button"
                  className={`catalog-toolbar__cart${!hasItems ? ' catalog-toolbar__cart--empty' : ''}${cartCount > 0 ? ' is-pulsing' : ''}`}
                  onClick={openCart}
                >
                  <ShoppingBag size={18} />
                  <span>{hasItems ? `${cartCount} item(ns) — ${formatMoney(cartTotal)}` : 'Sacola vazia'}</span>
                </button>
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
                        ref={(element) => { sectionRefs.current[section.key] = element; }}
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

                        {section.featuredOnly && section.items.length > 0 && (
                          <CarouselCard
                            items={section.items}
                            mobileCardsPerView={1.08}
                            tabletCardsPerView={2.15}
                            desktopCardsPerView={2.4}
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

                        {section.isBuilder && (
                          <>
                            <SaladBuilder ingredients={ingredientItems} />
                            {section.items.length > 0 && (
                              <div className="catalog-section__subheader">
                                <span>Combos prontos</span>
                                <span>{section.items.length} {section.items.length === 1 ? 'combo' : 'combos'}</span>
                              </div>
                            )}
                          </>
                        )}

                        {!section.featuredOnly && section.items.length > 0 && (
                          <div className="catalog-row-list">
                            {section.items.map((product, index) => (
                              <div key={product.id} className="reveal" data-delay={String(Math.min(index + 1, 6))}>
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

            <aside className="catalog-aside">
              <div className="catalog-aside__panel">
                <button type="button" className="catalog-aside__delivery" onClick={() => router.push('/checkout')}>
                  <div className="catalog-aside__delivery-copy">
                    <strong>{deliveryCta}</strong>
                    <span>{deliveryHint}</span>
                  </div>
                  <ChevronRight size={18} />
                </button>

                <div className="catalog-aside__cart">
                  <div className="catalog-aside__cart-icon">
                    <ShoppingBag size={34} />
                  </div>
                  <strong>{hasItems ? formatMoney(cartTotal) : 'Sacola vazia'}</strong>
                  <p>{asideHelpLabel}</p>

                  {hasItems ? (
                    <div className="catalog-aside__cart-meta">
                      <span>{cartCount} item(ns)</span>
                      <span>Checkout rápido</span>
                    </div>
                  ) : (
                    <div className="catalog-aside__cart-meta">
                      <span>Sem cadastro obrigatório</span>
                      <span>Entrega e retirada</span>
                    </div>
                  )}
                </div>

                <div className="catalog-aside__coupon">
                  <div>
                    <strong>Que tal usar um cupom?</strong>
                    <span>1 disponível</span>
                  </div>
                  <TicketPercent size={18} />
                </div>

                <button type="button" className="catalog-aside__cta" onClick={hasItems ? openCart : () => handleJumpToSection('destaques')}>
                  {hasItems ? 'Abrir sacola' : 'Ver destaques'}
                </button>

                {!isAuthenticated && whatsappNumber && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="catalog-aside__helper">
                    Falar no WhatsApp
                  </a>
                )}

                {hasItems && (
                  <Link href="/checkout" className="catalog-aside__checkout">
                    Finalizar pedido
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      <nav className="cardapio-bottom-nav" aria-label="Navegação rápida">
        {bottomNavItems.map((item) => (
          <button key={item.key} type="button" className={`cardapio-bottom-nav__item${item.key === 'inicio' ? ' is-active' : ''}`} onClick={item.onClick}>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Cardapio;
