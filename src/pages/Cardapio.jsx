import React, { useMemo, useState } from 'react';
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
    description: 'As combinações principais da casa em uma navegação horizontal limpa e direta.',
  },
  {
    key: 'molhos',
    title: 'Molhos',
    description: 'Complementos organizados em uma faixa própria para escolha rápida.',
  },
  {
    key: 'monte-sua-salada',
    title: 'Monte sua Salada',
    description: 'Itens e combinações para personalizar o pedido do seu jeito.',
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

const ProductsSkeleton = () => (
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
);

const Cardapio = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [query, setQuery] = useState('');

  const { addToCart, addComboToCart } = useCart();
  const { store, products: storeProducts, combos, isLoading, error, refreshCatalog } = useStore();

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
        <header className="cardapio-header">
          <div className="container">
            <span className="cardapio-subtitle">{store?.name || 'Cê Saladas'}</span>
            <h1 className="cardapio-title">Cardápio da casa</h1>
            <p className="cardapio-intro">
              Saladas, molhos e opções para montar seu pedido em uma navegação horizontal mais limpa, rápida e natural.
            </p>
            <div className="cardapio-toolbar">
              <div className="cardapio-search">
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
            </div>
            <div className="cardapio-divider"></div>
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
          {filteredItems.length === 0 && query && (
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
                        <h2 className="catalog-section__title">{section.title}</h2>
                        <p className="catalog-section__description">{section.description}</p>
                      </div>
                      <span className="catalog-section__count">
                        {section.items.length} {section.items.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>

                    <CarouselCard
                      items={section.items}
                      mobileCardsPerView={1.32}
                      tabletCardsPerView={2.45}
                      desktopCardsPerView={4.4}
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
          )}
        </div>
      )}
    </div>
  );
};

export default Cardapio;


