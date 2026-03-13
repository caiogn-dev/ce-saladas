import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock3,
  Instagram,
  Leaf,
  MapPinned,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import ShaderBackground from '../components/ui/ShaderBackground';
import { useStore } from '../context/StoreContext';

const PROMO_STORAGE_KEY = 'storefrontPromoSeen';
const PROMO_EVENT = 'storefront-promo';

function subscribePromo(callback) {
  window.addEventListener(PROMO_EVENT, callback);
  return () => {
    window.removeEventListener(PROMO_EVENT, callback);
  };
}

function getPromoSnapshot() {
  return sessionStorage.getItem(PROMO_STORAGE_KEY);
}

function getPromoServerSnapshot() {
  return null;
}

const LandingPage = () => {
  const { store, products = [], combos = [], isLoading } = useStore();
  const hasSeenPromo = useSyncExternalStore(
    subscribePromo,
    getPromoSnapshot,
    getPromoServerSnapshot,
  );
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const heroStats = useMemo(() => {
    const totalItems = (products?.length || 0) + (combos?.length || 0);

    return [
      {
        value: totalItems > 0 ? `${totalItems}+` : 'Sob medida',
        label: 'opções no catálogo',
      },
      {
        value: 'Checkout leve',
        label: 'pedido sem cadastro obrigatório',
      },
      {
        value: 'Entrega clara',
        label: 'etapas objetivas até o pagamento',
      },
    ];
  }, [combos?.length, products?.length]);

  if (isLoading || !store) {
    return <div className="loading-screen">Carregando...</div>;
  }

  const showPromo = !hasSeenPromo && !promoDismissed;
  const whatsappNumber = store.whatsapp_number || store.phone || '';
  const whatsappUrl = whatsappNumber
    ? `https://api.whatsapp.com/send?phone=${whatsappNumber}`
    : '#';
  const instagramUrl = store.metadata?.instagram_url || '#';
  const heroTitle = store.metadata?.hero_title || 'Seu pedido saudável, bonito e rápido.';
  const heroDescription = store.description || 'Saladas, pratos leves e combinações frescas para quem quer comer bem sem complicação.';

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
            aria-label={`Fluxo de checkout em ${store.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="promo-close" onClick={handleClosePromo} aria-label="Fechar aviso">
              ×
            </button>
            <div className="promo-badge">Novo fluxo</div>
            <h3>Agora o pedido termina com menos atrito</h3>
            <p>
              O cliente adiciona os itens ao carrinho, informa apenas e-mail e celular e segue para
              um checkout mais direto, com entrega e pagamento organizados.
            </p>
            <div className="promo-actions">
              <Link href="/cardapio" className="btn-primary">Explorar o cardápio</Link>
              <button type="button" className="btn-secondary" onClick={handleClosePromo}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="hero-section">
        <div className="hero-shader-shell" aria-hidden="true">
          <ShaderBackground className="hero-shader-canvas" />
          <div className="hero-shader-overlay" />
        </div>

        <div className="container hero-container">
          <div className={`hero-copy ${isVisible ? 'is-visible' : ''}`}>
            <div className="hero-kicker-row">
              <span className="hero-kicker">Cê Saladas</span>
              <span className="hero-chip">Leve, fresco e objetivo</span>
            </div>

            <h1 className="hero-title">{heroTitle}</h1>
            <p className="hero-description">{heroDescription}</p>

            <div className="hero-actions">
              <Link href="/cardapio" className="btn-primary btn-glow">
                Ver cardápio
                <ArrowRight size={18} />
              </Link>
              <a href="#como-funciona" className="btn-secondary">Entender o fluxo</a>
            </div>

            <div className="hero-stats-grid">
              {heroStats.map((stat) => (
                <div key={stat.label} className="hero-stat-card">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`hero-visual ${isVisible ? 'is-visible' : ''}`}>
            <div className="hero-brand-panel">
              <div className="hero-brand-badge">
                <Leaf size={16} />
                Ingredientes frescos todos os dias
              </div>

              <div className="hero-brand-surface">
                {store.banner_url ? (
                  <img src={store.banner_url} alt={store.name} className="hero-image" />
                ) : (
                  <div className="hero-placeholder">
                    <span>Cê</span>
                    <small>Saladas</small>
                  </div>
                )}
              </div>

              <div className="hero-floating-card hero-floating-card--top">
                <Sparkles size={18} />
                <div>
                  <strong>Cardápio organizado</strong>
                  <span>Mais clareza para decidir rápido.</span>
                </div>
              </div>

              <div className="hero-floating-card hero-floating-card--bottom">
                <ShieldCheck size={18} />
                <div>
                  <strong>Pagamento confiável</strong>
                  <span>PIX, cartão e dinheiro no mesmo fluxo.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="brand-strip">
        <div className="container brand-strip__inner">
          <div className="brand-strip__item"><Leaf size={18} /> Preparação cuidadosa</div>
          <div className="brand-strip__item"><Clock3 size={18} /> Pedido com menos burocracia</div>
          <div className="brand-strip__item"><Zap size={18} /> Checkout rápido e objetivo</div>
        </div>
      </section>

      <section id="como-funciona" className="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Fluxo de compra</span>
            <h2 className="section-title">Como o pedido funciona</h2>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Escolha com contexto</h3>
              <p>O cliente navega por categoria, abre o detalhe do produto e decide com mais segurança.</p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Identifique sem excesso</h3>
              <p>Na finalização, basta informar e-mail e celular para liberar o restante do checkout.</p>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Confirme entrega e pagamento</h3>
              <p>Entrega, retirada, cupom e forma de pagamento aparecem em uma sequência clara.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="why-ce-saladas">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Diferenciais</span>
            <h2 className="section-title">Uma vitrine pensada para vender melhor</h2>
          </div>

          <div className="features-grid">
            <article className="feature-card">
              <span className="feature-icon"><Leaf size={22} /></span>
              <h3>Visual coerente com a marca</h3>
              <p>O laranja e o verde agora conduzem a experiência inteira, sem ruído de identidade.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon"><Sparkles size={22} /></span>
              <h3>Produtos com mais contexto</h3>
              <p>O detalhe do item mostra preço, descrição, composição e sinais visuais mais úteis.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon"><Zap size={22} /></span>
              <h3>Catálogo mais escaneável</h3>
              <p>Cada categoria ocupa sua própria faixa horizontal, o que melhora leitura e navegação.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon"><ShieldCheck size={22} /></span>
              <h3>Checkout mais direto</h3>
              <p>O pedido continua sem cadastro obrigatório e o pagamento se encaixa melhor no fluxo.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-shell">
          <div className="cta-copy">
            <span className="section-eyebrow section-eyebrow--light">Pronto para testar</span>
            <h2>Explore o cardápio e valide o novo checkout.</h2>
            <p>
              O próximo passo natural agora é testar navegação por categoria, detalhe do produto,
              carrinho e finalização com PIX, cartão ou dinheiro.
            </p>
          </div>
          <div className="cta-actions">
            <Link href="/cardapio" className="btn-primary btn-large">
              Ir para o cardápio
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <h3>{store.name}</h3>
            <p>{heroDescription}</p>
          </div>

          <div className="footer-links">
            <h4>Navegação</h4>
            <Link href="/">Início</Link>
            <Link href="/cardapio">Cardápio</Link>
            <Link href="/checkout">Checkout</Link>
          </div>

          <div className="footer-contact">
            <h4>Contato</h4>
            {store.email && <p>{store.email}</p>}
            <div className="footer-social">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="WhatsApp">
                <MessageCircle size={18} />
              </a>
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                <Instagram size={18} />
              </a>
            </div>
            <p className="footer-address">
              <MapPinned size={16} />
              <span>{store.address || 'Consulte o endereço pelo WhatsApp'}</span>
            </p>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>© {new Date().getFullYear()} {store.name}. Todos os direitos reservados.</p>
          <p className="footer-made">Experiência digital alinhada à marca.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
