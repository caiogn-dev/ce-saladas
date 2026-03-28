import React, { useEffect, useRef, useSyncExternalStore, useState } from 'react';
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
  Star,
  Zap,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useStore } from '../context/StoreContext';

/* ─────────────────────────────────────────────────────────────
   Promo store sync
───────────────────────────────────────────────────────────── */
const PROMO_STORAGE_KEY = 'storefrontPromoSeen';
const PROMO_EVENT = 'storefront-promo';
function subscribePromo(cb) {
  window.addEventListener(PROMO_EVENT, cb);
  return () => window.removeEventListener(PROMO_EVENT, cb);
}
function getPromoSnapshot() { return sessionStorage.getItem(PROMO_STORAGE_KEY); }
function getPromoServerSnapshot() { return null; }

/* ─────────────────────────────────────────────────────────────
   Blob SVG de fundo do hero — orgânico, verde
───────────────────────────────────────────────────────────── */
const HeroBlob = () => (
  <svg
    className="hero-blob"
    viewBox="0 0 560 560"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M470,285 C480,370 420,460 335,490 C250,520 145,495 88,425 C31,355 28,245 72,165 C116,85 218,35 315,45 C412,55 460,200 470,285 Z"
      fill="var(--clr-leaf-500)"
    />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Título com última palavra em cor accent (terra)
───────────────────────────────────────────────────────────── */
const AccentTitle = ({ text, className }) => {
  const words = text.trim().split(/\s+/);
  // Colore a última palavra
  const accent = words.pop();
  const rest = words.join(' ');
  return (
    <h1 className={className}>
      {rest && <>{rest}{' '}</>}
      <em className="hero-accent">{accent}</em>
    </h1>
  );
};

/* ─────────────────────────────────────────────────────────────
   Mini thumbnails flutuantes — sem imagens reais, usa SVG
───────────────────────────────────────────────────────────── */
const MiniCircle = ({ className, children }) => (
  <div className={`hero-mini ${className}`}>{children}</div>
);

/* ══════════════════════════════════════════════════════════════
   LandingPage
══════════════════════════════════════════════════════════════ */
const LandingPage = () => {
  const { store, isLoading } = useStore();
  const hasSeenPromo = useSyncExternalStore(subscribePromo, getPromoSnapshot, getPromoServerSnapshot);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const pageRef = useRef(null);

  const showPromo = !hasSeenPromo && !promoDismissed;

  const handleClosePromo = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(PROMO_STORAGE_KEY, '1');
      window.dispatchEvent(new Event(PROMO_EVENT));
    }
    setPromoDismissed(true);
  };

  /* ── GSAP ────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined' || !store) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let cleanup = null;

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
          /* Hero — entra da esquerda em cascata */
          gsap.from('.hero-tag', { opacity: 0, x: -24, duration: 0.5, ease: 'power2.out', delay: 0.1 });
          gsap.from('.hero-title', { opacity: 0, y: 40, duration: 0.75, ease: 'power3.out', delay: 0.25 });
          gsap.from('.hero-description', { opacity: 0, y: 24, duration: 0.6, ease: 'power2.out', delay: 0.55 });
          gsap.from('.hero-actions', { opacity: 0, y: 18, duration: 0.5, ease: 'power2.out', delay: 0.75 });
          gsap.from('.hero-stats', { opacity: 0, y: 16, duration: 0.5, ease: 'power2.out', delay: 0.95 });

          /* Blob entra da direita */
          gsap.from('.hero-visual-col', { opacity: 0, x: 60, scale: 0.92, duration: 1.0, ease: 'power3.out', delay: 0.15 });

          /* Blob morph contínuo */
          gsap.to('.hero-blob path', {
            attr: {
              d: 'M450,270 C465,360 400,465 310,492 C220,519 118,488 72,412 C26,336 40,228 90,155 C140,82 240,42 330,55 C420,68 435,180 450,270 Z',
            },
            duration: 10,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });

          /* Mini circles flutuam */
          gsap.to('.hero-mini', {
            y: -14,
            duration: 3.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            stagger: { each: 0.8 },
          });

          /* Brand strip */
          gsap.from('.brand-pill', {
            opacity: 0, y: 30, stagger: 0.12, duration: 0.6, ease: 'power2.out',
            scrollTrigger: { trigger: '.brand-strip', start: 'top 88%' },
          });

          /* Steps */
          gsap.from('.step-card', {
            opacity: 0, y: 60, scale: 0.94,
            stagger: { each: 0.14 }, duration: 0.8, ease: 'back.out(1.3)',
            scrollTrigger: { trigger: '.steps-grid', start: 'top 82%' },
          });

          /* Features */
          gsap.from('.feature-card', {
            opacity: 0, y: 50, scale: 0.95,
            stagger: { each: 0.1 }, duration: 0.7, ease: 'back.out(1.2)',
            scrollTrigger: { trigger: '.features-grid', start: 'top 84%' },
          });

          /* Section titles */
          gsap.utils.toArray('.section-accent-title').forEach((el) => {
            gsap.from(el, {
              opacity: 0, y: 28, duration: 0.65, ease: 'power2.out',
              scrollTrigger: { trigger: el, start: 'top 87%' },
            });
          });

          /* CTA */
          gsap.from('.cta-copy > *', {
            opacity: 0, x: -40, stagger: 0.1, duration: 0.75, ease: 'power3.out',
            scrollTrigger: { trigger: '.cta-section', start: 'top 78%' },
          });
          gsap.from('.cta-btn-wrap', {
            opacity: 0, scale: 0.6, duration: 0.8, ease: 'back.out(2)',
            scrollTrigger: { trigger: '.cta-section', start: 'top 75%' },
          });

          /* Parallax hero visual */
          gsap.to('.hero-visual-col', {
            y: -40, ease: 'none',
            scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1.8 },
          });
        }, pageRef);

        cleanup = () => ctx.revert();
      }
    );

    return () => cleanup?.();
  }, [store]);

  if (isLoading || !store) return <div className="loading-screen">Carregando...</div>;

  const whatsappNumber = store.whatsapp_number || store.phone || '';
  const whatsappUrl = whatsappNumber ? `https://api.whatsapp.com/send?phone=${whatsappNumber}` : '#';
  const instagramUrl = store.metadata?.instagram_url || '#';
  const heroTitle = store.metadata?.hero_title || 'Saladas frescas entregues para você';
  const heroDescription = store.description || 'Saladas, pratos leves e combinações frescas para quem quer comer bem sem complicação.';

  return (
    <div className="landing-page" ref={pageRef}>
      <Navbar />

      {/* ── Promo ─────────────────────────────────────────────── */}
      {showPromo && (
        <div className="promo-modal-overlay" onClick={handleClosePromo} role="presentation">
          <div className="promo-modal" role="dialog" aria-modal="true" aria-label="Fluxo de checkout" onClick={(e) => e.stopPropagation()}>
            <button className="promo-close" onClick={handleClosePromo} aria-label="Fechar">×</button>
            <div className="promo-badge">Novo fluxo</div>
            <h3>Agora o pedido termina com menos atrito</h3>
            <p>Adicione itens, informe e-mail e celular, e siga para um checkout direto com entrega e pagamento organizados.</p>
            <div className="promo-actions">
              <Link href="/cardapio" className="btn-primary">Explorar o cardápio</Link>
              <button type="button" className="btn-secondary" onClick={handleClosePromo}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          HERO — blob + circular image
      ══════════════════════════════════════════════════════ */}
      <header className="hero-section">
        <div className="container hero-container">

          {/* Copy */}
          <div className="hero-copy-col">
            <p className="hero-tag">
              <span className="hero-tag-line" aria-hidden="true" />
              {store.name || 'Cê Saladas'}
            </p>

            <AccentTitle text={heroTitle} className="hero-title" />

            <p className="hero-description">{heroDescription}</p>

            <div className="hero-actions">
              <Link href="/cardapio" className="btn-primary btn-hero-main">
                Ver cardápio <ArrowRight size={18} />
              </Link>
              <a href="#como-funciona" className="btn-hero-ghost">Como funciona</a>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>100+</strong>
                <span>Pedidos por semana</span>
              </div>
              <div className="hero-stat-sep" aria-hidden="true" />
              <div className="hero-stat">
                <strong>4.9</strong>
                <span className="hero-stat-stars">
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                </span>
              </div>
              <div className="hero-stat-sep" aria-hidden="true" />
              <div className="hero-stat">
                <strong>Fresh</strong>
                <span>Todo dia</span>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="hero-visual-col">
            <div className="hero-visual-inner">
              {/* Blob verde de fundo */}
              <HeroBlob />

              {/* Imagem circular principal */}
              <div className="hero-food-ring">
                {store.banner_url ? (
                  <img src={store.banner_url} alt={store.name} className="hero-food-img" />
                ) : (
                  <div className="hero-food-placeholder">
                    <Leaf size={48} />
                    <span>Cê Saladas</span>
                  </div>
                )}
              </div>

              {/* Badge flutuante — canto superior */}
              <MiniCircle className="hero-mini--badge">
                <Leaf size={14} />
                <span>Fresco</span>
              </MiniCircle>

              {/* Pill inferior — entrega */}
              <MiniCircle className="hero-mini--delivery">
                <Clock3 size={14} />
                <span>Delivery disponível</span>
              </MiniCircle>
            </div>
          </div>

        </div>
      </header>

      {/* ── Brand pills ────────────────────────────────────────── */}
      <section className="brand-strip">
        <div className="container brand-strip__inner">
          <div className="brand-pill"><Leaf size={16} /> Ingredientes frescos todo dia</div>
          <div className="brand-pill"><Clock3 size={16} /> Entrega e retirada</div>
          <div className="brand-pill"><Zap size={16} /> Monte sua salada</div>
          <div className="brand-pill"><ShieldCheck size={16} /> Sem conservantes</div>
        </div>
      </section>

      {/* ── Como funciona ──────────────────────────────────────── */}
      <section id="como-funciona" className="how-it-works">
        <div className="container">
          <div className="section-header">
            <p className="section-eyebrow">Como pedir</p>
            <h2 className="section-accent-title">
              Salada fresca em <em>poucos passos</em>
            </h2>
          </div>
          <div className="steps-grid">
            {[
              { n: '01', title: 'Escolha sua salada', body: 'Navegue pelo cardápio de saladas, bowls e pratos fit. Veja ingredientes e preço antes de decidir.' },
              { n: '02', title: 'Monte do seu jeito', body: 'Personalize com ingredientes frescos, proteínas, toppings e molhos saudáveis — tudo feito para você.' },
              { n: '03', title: 'Receba em casa', body: 'Sem cadastro obrigatório. Pague com PIX, cartão ou dinheiro e aguarde a entrega da sua salada.' },
            ].map(({ n, title, body }) => (
              <div key={n} className="step-card">
                <div className="step-number">{n}</div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Por que Cê Saladas ─────────────────────────────────── */}
      <section className="why-section">
        <div className="container">
          <div className="section-header">
            <p className="section-eyebrow">Por que escolher</p>
            <h2 className="section-accent-title">
              Por que o <em>Cê Saladas</em>
            </h2>
          </div>
          <div className="features-grid">
            {[
              { icon: <Leaf size={24} />, title: 'Ingredientes frescos', body: 'Selecionados diariamente para garantir sabor e qualidade em cada salada.' },
              { icon: <Sparkles size={24} />, title: 'Comida fit e saudável', body: 'Do low carb ao proteico: opções balanceadas sem abrir mão do sabor.' },
              { icon: <Zap size={24} />, title: 'Monte sua salada', body: 'Escolha base, proteína, toppings e molho. A salada perfeita para você.' },
              { icon: <ShieldCheck size={24} />, title: 'Delivery e retirada', body: 'Peça pelo cardápio e receba em casa ou retire na loja — rápido e fácil.' },
            ].map(({ icon, title, body }) => (
              <article key={title} className="feature-card">
                <span className="feature-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="cta-section">
        {/* Blob decorativo esquerdo */}
        <svg className="cta-blob" viewBox="0 0 400 400" aria-hidden="true">
          <path d="M340,200 C350,270 300,350 225,365 C150,380 70,330 45,255 C20,180 60,90 135,60 C210,30 290,70 325,140 C335,160 338,180 340,200 Z" fill="rgba(255,255,255,0.08)" />
        </svg>
        <div className="container cta-shell">
          <div className="cta-copy">
            <p className="section-eyebrow section-eyebrow--light">Peça agora</p>
            <h2>Monte sua salada <em>agora mesmo.</em></h2>
            <p>Saladas frescas, bowls proteicos e opções fit. Em poucos toques, receba em casa ou retire na loja.</p>
          </div>
          <div className="cta-btn-wrap">
            <Link href="/cardapio" className="btn-cta-primary">
              Ir para o cardápio
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
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
          <p className="footer-made">Saladas frescas, comida fit e confeitaria artesanal.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
