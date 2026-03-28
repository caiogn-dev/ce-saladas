import { useEffect, useRef, useSyncExternalStore, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock3,
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
   Fotos dos pratos — mix-blend-mode: multiply elimina o fundo branco
   Salve as imagens em /public/dishes/ com esses nomes exatos.
───────────────────────────────────────────────────────────── */
const DISHES = {
  shrimp: '/dishes/bowl-shrimp.webp',  // camarão com molho laranja
  salmon: '/dishes/bowl-salmon.webp',  // salmão com vinagrete
  pork:   '/dishes/bowl-pork.png',     // frango/porco no bowl transparente
};

/* ─────────────────────────────────────────────────────────────
   Blob SVG de fundo — orgânico, verde vibrante
───────────────────────────────────────────────────────────── */
const HeroBlob = () => (
  <svg className="hero-blob" viewBox="0 0 600 600" aria-hidden="true">
    <path
      className="hero-blob-path"
      d="M480,300 C492,396 426,486 336,510 C246,534 138,504 84,426 C30,348 36,234 84,156 C132,78 234,36 330,48 C426,60 468,204 480,300 Z"
      fill="var(--clr-leaf-500)"
    />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Orbe terra de calor — emana de baixo do prato como luz quente
   Emotion: apetite, calor, desejo imediato
───────────────────────────────────────────────────────────── */
const HeatGlow = () => (
  <div className="dish-heat-glow" aria-hidden="true" />
);

/* ─────────────────────────────────────────────────────────────
   Gota SVG decorativa (molho pingando) — cor terra
───────────────────────────────────────────────────────────── */
const DrizzleDrop = ({ className }) => (
  <svg className={`drizzle-drop ${className || ''}`} viewBox="0 0 24 36" aria-hidden="true">
    <path d="M12 2 C12 2 2 16 2 22 C2 28.627 6.477 34 12 34 C17.523 34 22 28.627 22 22 C22 16 12 2 12 2 Z" fill="currentColor" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Título com última palavra em cor accent (terra + itálico)
───────────────────────────────────────────────────────────── */
const AccentTitle = ({ text, className }) => {
  const words = text.trim().split(/\s+/);
  const accent = words.pop();
  const rest = words.join(' ');
  return (
    <h1 className={className}>
      {rest && <>{rest}{' '}</>}
      <em className="hero-accent">{accent}</em>
    </h1>
  );
};

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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ctx;

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {

          /* ────────────────────────────────────────────────────
             HERO — Timeline coordenado, evita conflitos de delay
          ──────────────────────────────────────────────────── */
          const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });

          /* Visual primeiro (mesma TL) — prato entra com opacity+scale */
          heroTL.from('.dish-hero-main', {
            opacity: 0, scale: 0.82, y: 40, duration: 0.9, ease: 'back.out(1.4)',
          }, 0)
          .from('.dish-hero-secondary', {
            opacity: 0, x: 30, y: 20, rotation: 6, duration: 0.75, ease: 'back.out(1.3)',
          }, 0.3)

          /* Copy em cascata */
          .from('.hero-tag',         { opacity: 0, x: -24, duration: 0.5 }, 0.15)
          .from('.hero-title',       { opacity: 0, y: 36,  duration: 0.75 }, 0.3)
          .from('.hero-description', { opacity: 0, y: 22,  duration: 0.6  }, 0.55)
          .from('.hero-actions',     { opacity: 0, y: 18,  duration: 0.5  }, 0.72)
          .from('.hero-stats',       { opacity: 0, y: 16,  duration: 0.45 }, 0.88);

          /* ── Heat glow — aparece depois do prato chegar ────── */
          gsap.fromTo('.dish-heat-glow',
            { opacity: 0, scale: 0.8 },
            {
              opacity: 0.65, scale: 1,
              duration: 1.2, ease: 'power2.out',
              delay: 0.7,
              /* Pulso contínuo após entrar */
              onComplete() {
                gsap.to(this.targets()[0], {
                  opacity: 0.35, scale: 0.88,
                  duration: 2.4, ease: 'sine.inOut',
                  repeat: -1, yoyo: true,
                });
              },
            }
          );

          /* ── Blob morph contínuo ─────────────────────────── */
          gsap.to('.hero-blob-path', {
            attr: {
              d: 'M460,285 C478,385 408,478 312,502 C216,526 112,490 66,406 C20,322 46,210 100,140 C154,70 252,32 346,52 C440,72 442,185 460,285 Z',
            },
            duration: 14, repeat: -1, yoyo: true, ease: 'sine.inOut',
          });

          /* ── Gotas de molho — oscilam ────────────────────── */
          gsap.to('.drizzle-drop', {
            y: 10, duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut',
            stagger: { each: 0.5 },
          });

          /* ── Float suave — herança para todos os pratos ───── */
          gsap.to('.dish-float', {
            y: '-=14', rotation: '+=1.5',
            duration: 4.5, repeat: -1, yoyo: true, ease: 'sine.inOut',
            stagger: { each: 1.4, from: 'random' },
          });

          /* ── Count-up nos stats ───────────────────────────── */
          gsap.utils.toArray('.stat-count').forEach((el) => {
            const target = parseFloat(el.dataset.target);
            const suffix = el.dataset.suffix || '';
            const decimals = parseInt(el.dataset.decimal || '0', 10);
            const obj = { val: 0 };
            gsap.to(obj, {
              val: target, duration: 1.8, ease: 'power2.out', delay: 1.1,
              onUpdate() { el.textContent = obj.val.toFixed(decimals) + suffix; },
              onComplete() { el.textContent = target.toFixed(decimals) + suffix; },
            });
          });

          /* ────────────────────────────────────────────────────
             SCROLL — ScrollTrigger em todos os elementos
          ──────────────────────────────────────────────────── */

          gsap.from('.brand-pill', {
            opacity: 0, y: 24, stagger: 0.09, duration: 0.55, ease: 'power2.out',
            scrollTrigger: { trigger: '.brand-strip', start: 'top 92%' },
          });

          gsap.from('.step-card', {
            opacity: 0, y: 56, scale: 0.95, stagger: 0.12, duration: 0.8, ease: 'back.out(1.3)',
            scrollTrigger: { trigger: '.steps-grid', start: 'top 84%' },
          });

          gsap.from('.dish-section-salmon', {
            opacity: 0, x: 60, rotation: -5, scale: 0.92, duration: 1.0, ease: 'back.out(1.2)',
            scrollTrigger: { trigger: '.how-it-works', start: 'top 74%' },
          });

          gsap.from('.feature-card', {
            opacity: 0, y: 44, scale: 0.96, stagger: 0.09, duration: 0.65, ease: 'back.out(1.2)',
            scrollTrigger: { trigger: '.features-grid', start: 'top 86%' },
          });

          gsap.from('.dish-section-pork', {
            opacity: 0, x: -60, rotation: 5, scale: 0.92, duration: 1.0, ease: 'back.out(1.2)',
            scrollTrigger: { trigger: '.why-section', start: 'top 74%' },
          });

          gsap.utils.toArray('.section-accent-title').forEach((el) => {
            gsap.from(el, {
              opacity: 0, y: 26, duration: 0.6, ease: 'power2.out',
              scrollTrigger: { trigger: el, start: 'top 90%' },
            });
          });

          gsap.from('.cta-copy > *', {
            opacity: 0, x: -36, stagger: 0.09, duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: '.cta-section', start: 'top 80%' },
          });
          gsap.from('.cta-btn-wrap', {
            opacity: 0, scale: 0.65, duration: 0.8, ease: 'back.out(2)',
            scrollTrigger: { trigger: '.cta-section', start: 'top 76%' },
          });

          /* ── Parallax suave ──────────────────────────────── */
          gsap.to('.hero-visual-col', {
            y: -40, ease: 'none',
            scrollTrigger: {
              trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 2.5,
            },
          });

          gsap.to('.dish-section-salmon', {
            y: -28, ease: 'none',
            scrollTrigger: {
              trigger: '.how-it-works', start: 'top bottom', end: 'bottom top', scrub: 1.8,
            },
          });

          gsap.to('.dish-section-pork', {
            y: -36, ease: 'none',
            scrollTrigger: {
              trigger: '.why-section', start: 'top bottom', end: 'bottom top', scrub: 1.8,
            },
          });

          /* Refresh APÓS setup — corrige medidas de layout do React */
          ScrollTrigger.refresh();

        }, pageRef);
      }
    );

    return () => ctx?.revert();
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
          HERO — Food Theater
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
              <Link href="/cardapio" className="btn-hero-main">
                Ver cardápio <ArrowRight size={18} />
              </Link>
              <a href="#como-funciona" className="btn-hero-ghost">Como funciona</a>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong className="stat-count" data-target="100" data-suffix="+">100+</strong>
                <span>Pedidos por semana</span>
              </div>
              <div className="hero-stat-sep" aria-hidden="true" />
              <div className="hero-stat">
                <strong className="stat-count" data-target="4.9" data-decimal="1">4.9</strong>
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

          {/* Visual — Food Stage */}
          <div className="hero-visual-col">
            <div className="hero-stage">
              {/* Blob orgânico de fundo */}
              <HeroBlob />

              {/* Orbe de calor — emana de baixo do prato (apetite) */}
              <HeatGlow />

              {/* Gotas decorativas de molho */}
              <DrizzleDrop className="drizzle-drop--1" />
              <DrizzleDrop className="drizzle-drop--2" />

              {/* Prato principal — camarão */}
              <img
                src={DISHES.shrimp}
                alt="Bowl de camarão temperado"
                className="dish-img dish-hero-main dish-float"
                draggable="false"
              />

              {/* Prato secundário — salmão, aparece por baixo */}
              <img
                src={DISHES.salmon}
                alt="Bowl de salmão"
                className="dish-img dish-hero-secondary dish-float"
                draggable="false"
              />

              {/* Badge flutuante — frescor */}
              <div className="hero-badge-pill hero-badge-pill--top">
                <Leaf size={14} />
                <span>100% fresco</span>
              </div>

              {/* Pill inferior — entrega */}
              <div className="hero-badge-pill hero-badge-pill--bottom">
                <Clock3 size={14} />
                <span>Entrega hoje</span>
              </div>
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
        <div className="container how-it-works__inner">

          {/* Prato de salmão decorativo — direita */}
          <img
            src={DISHES.salmon}
            alt=""
            aria-hidden="true"
            className="dish-img dish-section-salmon dish-float"
            draggable="false"
          />

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
        <div className="container why-section__inner">

          {/* Prato de porco/legumes decorativo — esquerda */}
          <img
            src={DISHES.pork}
            alt=""
            aria-hidden="true"
            className="dish-img dish-section-pork dish-float"
            draggable="false"
          />

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
        <svg className="cta-blob" viewBox="0 0 400 400" aria-hidden="true">
          <path d="M340,200 C350,270 300,350 225,365 C150,380 70,330 45,255 C20,180 60,90 135,60 C210,30 290,70 325,140 C335,160 338,180 340,200 Z" fill="rgba(255,255,255,0.06)" />
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
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
