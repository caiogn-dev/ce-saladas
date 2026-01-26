import React, { useState, useSyncExternalStore, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

import { useStore } from '../context/StoreContext';

const PROMO_STORAGE_KEY = 'storefrontPromoSeen';
const PROMO_EVENT = 'storefront-promo';

const LandingPage = () => {
  const { store, isLoading } = useStore();
  const hasSeenPromo = useSyncExternalStore(
    subscribePromo,
    getPromoSnapshot,
    getPromoServerSnapshot
  );
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger animations on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (isLoading || !store) {
    return <div className="loading-screen">Carregando...</div>;
  }

  const showPromo = !hasSeenPromo && !promoDismissed;
  const WHATSAPP_URL = `https://api.whatsapp.com/send?phone=${store.whatsapp_number || store.phone}`;
  const INSTAGRAM_URL = store.metadata?.instagram_url || '#';

  const handleClosePromo = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(PROMO_STORAGE_KEY, '1');
      window.dispatchEvent(new Event(PROMO_EVENT));
    }
    setPromoDismissed(true);
  };

  return (
    <div className="landing-page">
      <Navbar />

      {showPromo && (
        <div className="promo-modal-overlay" onClick={handleClosePromo} role="presentation">
          <div
            className="promo-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Promoção ${store.name} 10% OFF`}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="promo-close" onClick={handleClosePromo} aria-label="Fechar promoção">
              ×
            </button>
            <div className="promo-badge">🎉 Novidade</div>
            <h3>Ganhe 10% OFF no primeiro pedido</h3>
            <p>
              Crie sua conta agora e receba um cupom exclusivo para usar na primeira compra.
              Válido para pedidos feitos pelo site de {store.name}.
            </p>
            <div className="promo-actions">
              <Link href="/registro" className="btn-primary">Criar conta e ganhar 10%</Link>
              <button type="button" className="btn-secondary" onClick={handleClosePromo}>
                Ver cardápio primeiro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="hero-section">
        <div className="container hero-container">

          {/* Lado Esquerdo: Texto */}
          <div className={`hero-text ${isVisible ? 'animate-in' : ''}`}>
            <span className="hero-eyebrow">
              ✨ {store.metadata?.eyebrow || 'Artesanal & Prático'}
            </span>
            <h1 className="hero-title">
              {store.metadata?.hero_title || 'O verdadeiro sabor artesanal em minutos.'}
            </h1>
            <p className="hero-description">
              {store.description || 'Sabor que cuida de você. Produtos feitos com ingredientes selecionados.'}
            </p>
            <div className="hero-buttons">
              <Link href="/cardapio" className="btn-primary btn-glow">
                <span>Ver cardápio</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <a href="#como-funciona" className="btn-secondary">Como funciona</a>
            </div>

            {/* Social Proof */}
            <div className="hero-social-proof">
              <div className="social-proof-avatars">
                <span className="avatar">👨‍🍳</span>
                <span className="avatar">👩‍🍳</span>
                <span className="avatar">🧑‍🍳</span>
              </div>
              <p><strong>+500</strong> clientes satisfeitos</p>
            </div>
          </div>

          <div className={`hero-media ${isVisible ? 'animate-in-delay' : ''}`}>
            <div className="hero-image-frame">
              {store.banner_url ? (
                <img src={store.banner_url} alt={store.name} className="hero-image" />
              ) : (
                <div className="hero-placeholder" style={{
                  width: '100%',
                  height: '400px',
                  background: `linear-gradient(135deg, ${store.primary_color} 0%, ${store.primary_color}dd 100%)`,
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '5rem',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                }}>
                  🥘
                </div>
              )}
              {/* Floating badge */}
              <div className="hero-badge-float">
                <span className="badge-icon">🌿</span>
                <span className="badge-text">100% Fresco</span>
              </div>
            </div>
          </div>

        </div>

        {/* Background Decorativo */}
        <div className="hero-bg-decoration"></div>
      </header>

      {/* Como Funciona Section */}
      <section id="como-funciona" className="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Simples assim</span>
            <h2 className="section-title">Como funciona</h2>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Escolha</h3>
              <p>Navegue pelo cardápio e escolha seus produtos favoritos.</p>
            </div>
            <div className="step-arrow" aria-hidden="true">
              <svg viewBox="0 0 40 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 8h30" />
                <path d="M26 3l6 5-6 5" />
              </svg>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Peça</h3>
              <p>Faça seu pedido online de forma rápida e segura.</p>
            </div>
            <div className="step-arrow" aria-hidden="true">
              <svg viewBox="0 0 40 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 8h30" />
                <path d="M26 3l6 5-6 5" />
              </svg>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Receba</h3>
              <p>Receba em casa fresquinho e pronto para saborear.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Por que Section */}
      <section className="why-ce-saladas">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Diferenciais</span>
            <h2 className="section-title">Por que escolher {store.name}?</h2>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">✨</span>
              <h3>Ingredientes frescos</h3>
              <p>Produtos preparados com ingredientes selecionados diariamente.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">👩‍🍳</span>
              <h3>Feito com amor</h3>
              <p>Cada item é preparado com cuidado e carinho artesanal.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💚</span>
              <h3>Sabor Incomparável</h3>
              <p>Receitas exclusivas que garantem o melhor paladar.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🚀</span>
              <h3>Entrega rápida</h3>
              <p>Receba seu pedido fresquinho onde você estiver.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Pronto para experimentar?</h2>
            <p>Descubra o sabor autêntico de {store.name}.</p>
            <Link href="/cardapio" className="btn-primary btn-large">
              Ver cardápio completo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>{store.name}</h3>
              <p>{store.description || 'Sabor artesanal de verdade.'}</p>
              {/* Social Links */}
              <div className="footer-social">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="WhatsApp">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="footer-links">
              <h4>Links</h4>
              <Link href="/">Início</Link>
              <Link href="/cardapio">Cardápio</Link>
              <Link href="/login">Minha Conta</Link>
            </div>
            <div className="footer-contact">
              <h4>Contato</h4>
              <p>{store.email}</p>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                📱 WhatsApp
              </a>
              <p className="footer-address">
                📍 {store.address || 'Consultar endereço'}<br />
                {store.city} - {store.state}
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} {store.name}. Todos os direitos reservados.</p>
            <p className="footer-made">Feito com ❤️ por Antigravity</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
