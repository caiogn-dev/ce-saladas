import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Clock, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import Navbar from '../Navbar';
import { buildMediaUrl } from '../../utils/media';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function groupByCategory(categories = [], products = []) {
  const map = {};
  categories.forEach(c => { map[c.id] = { ...c, items: [] }; });
  products.forEach(p => {
    if (map[p.category]) map[p.category].items.push(p);
  });
  return categories.map(c => map[c.id]).filter(c => c?.items?.length > 0);
}

function ProductRow({ product, onAdd }) {
  const price = fmt.format(Number(product.price || 0));
  const imgSrc = buildMediaUrl(product.main_image_url || product.image_url || '');
  const inStock = product.is_in_stock !== false;

  return (
    <div className="gs-product">
      <div className="gs-product__info">
        <h3 className="gs-product__name">{product.name}</h3>
        {product.description && (
          <p className="gs-product__desc">{product.description}</p>
        )}
        <span className="gs-product__price">{price}</span>
      </div>
      <div className="gs-product__side">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="gs-product__img"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="gs-product__img-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        <button
          className="gs-product__add"
          onClick={() => inStock && onAdd(product)}
          disabled={!inStock}
          aria-label={`Adicionar ${product.name}`}
        >
          {inStock ? '+' : '—'}
        </button>
      </div>
    </div>
  );
}

export default function GenericStorefront({ catalog, previewLabel }) {
  const { addToCart } = useCart();
  const { storeTemplate, store: ctxStore } = useStore();

  const [activeCategory, setActiveCategory] = useState(null);
  const sectionRefs = useRef({});

  const categories = catalog?.categories || [];
  const products   = catalog?.products   || [];
  const storeData  = ctxStore || catalog?.store || {};
  const template   = storeTemplate || 'fresh';
  const groups     = groupByCategory(categories, products);

  useEffect(() => {
    if (groups.length > 0 && !activeCategory) {
      setActiveCategory(groups[0].id);
    }
  }, [groups.length]);

  useEffect(() => {
    if (groups.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveCategory(e.target.dataset.categoryId);
        });
      },
      { rootMargin: '-90px 0px -60% 0px', threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [groups.length]);

  const scrollTo = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveCategory(id);
  };

  const logo   = buildMediaUrl(storeData.logo_url   || '');
  const banner = buildMediaUrl(storeData.banner_url || '');

  return (
    <div className={`gs gs--${template}`} data-template={template}>
      {previewLabel && (
        <div className="gs-preview-banner">
          Modo preview — {previewLabel}
        </div>
      )}

      <Navbar />

      {/* Hero */}
      <header
        className="gs-hero"
        style={banner ? { backgroundImage: `url(${banner})` } : undefined}
      >
        <div className="gs-hero__overlay">
          <div className="gs-hero__content">
            {logo && (
              <img src={logo} alt={storeData.name} className="gs-hero__logo" />
            )}
            <h1 className="gs-hero__name">{storeData.name || 'Cardápio'}</h1>
            {storeData.tagline && (
              <p className="gs-hero__tagline">{storeData.tagline}</p>
            )}
            <div className="gs-hero__badges">
              {storeData.city && (
                <span className="gs-badge">
                  <MapPin size={13} />
                  {storeData.city}, {storeData.state}
                </span>
              )}
              <span className={`gs-badge ${storeData.is_open !== false ? 'gs-badge--open' : 'gs-badge--closed'}`}>
                <Clock size={13} />
                {storeData.is_open !== false ? 'Aberto agora' : 'Fechado'}
              </span>
              {storeData.delivery_enabled && (
                <span className="gs-badge">
                  <ShoppingBag size={13} />
                  {Number(storeData.default_delivery_fee) === 0
                    ? 'Entrega grátis'
                    : `Entrega ${fmt.format(Number(storeData.default_delivery_fee || 0))}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Category nav */}
      {groups.length > 1 && (
        <nav className="gs-nav">
          <div className="gs-nav__inner">
            {groups.map(g => (
              <button
                key={g.id}
                className={`gs-nav__item ${activeCategory === g.id ? 'gs-nav__item--active' : ''}`}
                onClick={() => scrollTo(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Products */}
      <main className="gs-main">
        <div className="gs-container">
          {groups.length === 0 && (
            <p className="gs-empty">Nenhum produto disponível no momento.</p>
          )}
          {groups.map(group => (
            <section
              key={group.id}
              ref={el => sectionRefs.current[group.id] = el}
              data-category-id={group.id}
              className="gs-section"
            >
              <div className="gs-section__header">
                <h2 className="gs-section__title">{group.name}</h2>
                {group.description && (
                  <p className="gs-section__desc">{group.description}</p>
                )}
              </div>
              <div className="gs-products">
                {group.items.map(product => (
                  <ProductRow key={product.id} product={product} onAdd={addToCart} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
