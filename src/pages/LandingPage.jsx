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
  Zap,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import ShaderBackground from '../components/ui/ShaderBackground';
import { useStore } from '../context/StoreContext';

const PROMO_STORAGE_KEY = 'storefrontPromoSeen';
const PROMO_EVENT = 'storefront-promo';

function subscribePromo(callback) {
  window.addEventListener(PROMO_EVENT, callback);
  return () => { window.removeEventListener(PROMO_EVENT, callback); };
}
function getPromoSnapshot() { return sessionStorage.getItem(PROMO_STORAGE_KEY); }
function getPromoServerSnapshot() { return null; }

/* ── Character split para o título animado ─────────────── */
const SplitTitle = ({ text, className }) => (
  <h1 className={className} aria-label={text}>
    {[...text].map((char, i) => (
      <span
        key={i}
        className="hero-char"
        aria-hidden="true"
        style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : undefined }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))}
  </h1>
);

/* ── SVG orgânicos flutuantes ─────────────────────────── */
const FloatingElements = () => (
  <div className="hero-floaters" aria-hidden="true">
    {/* Folha grande — canto superior direito */}
    <svg className="floater floater--leaf-1" viewBox="0 0 48 68" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 3C24 3 45 17 45 36C45 52 36 65 24 65C12 65 3 52 3 36C3 17 24 3 24 3Z" fill="rgba(100,158,32,0.18)" />
      <path d="M24 3 L24 65" stroke="rgba(100,158,32,0.28)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24 20 Q34 28 30 40" stroke="rgba(100,158,32,0.20)" strokeWidth="1" strokeLinecap="round" />
      <path d="M24 20 Q14 28 18 40" stroke="rgba(100,158,32,0.20)" strokeWidth="1" strokeLinecap="round" />
    </svg>

    {/* Tomate/círculo — centro-alto */}
    <svg className="floater floater--tomato" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="rgba(222,107,54,0.14)" />
      <circle cx="20" cy="20" r="11" fill="rgba(222,107,54,0.10)" />
      <circle cx="20" cy="20" r="5"  fill="rgba(222,107,54,0.16)" />
    </svg>

    {/* Folha menor — esquerda */}
    <svg className="floater floater--leaf-2" viewBox="0 0 34 50" fill="none">
      <path d="M17 2C17 2 32 14 32 28C32 41 25 48 17 48C9 48 2 41 2 28C2 14 17 2 17 2Z" fill="rgba(74,93,18,0.15)" />
      <path d="M17 2 L17 48" stroke="rgba(74,93,18,0.22)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>

    {/* Ponto verde — flutuante livre */}
    <svg className="floater floater--dot-1" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="rgba(150,190,60,0.20)" />
    </svg>

    {/* Semente/grão — quinoa */}
    <svg className="floater floater--seed" viewBox="0 0 18 28" fill="none">
      <ellipse cx="9" cy="14" rx="7" ry="12" fill="rgba(140,110,60,0.16)" />
      <ellipse cx="9" cy="14" rx="3" ry="6"  fill="rgba(140,110,60,0.12)" />
    </svg>

    {/* Ponto pequeno — decoração */}
    <svg className="floater floater--dot-2" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="rgba(100,158,32,0.22)" />
    </svg>
  </div>
);

/* ══════════════════════════════════════════════════════════════ */

const LandingPage = () => {
  const { store, isLoading } = useStore();
  const hasSeenPromo = useSyncExternalStore(subscribePromo, getPromoSnapshot, getPromoServerSnapshot);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const heroRef = useRef(null);
  const gsapCtxRef = useRef(null);

  const showPromo = !hasSeenPromo && !promoDismissed;

  const handleClosePromo = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(PROMO_STORAGE_KEY, '1');
      window.dispatchEvent(new Event(PROMO_EVENT));
    }
    setPromoDismissed(true);
  };

  /* ── GSAP animations ───────────────────────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined' || !store) return;

    // Prefere movimentos reduzidos — respeitar o sistema
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Garante visibilidade sem animação
      document.querySelectorAll('.hero-char, .hero-description, .hero-actions, .hero-kicker-row').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.filter = 'none';
      });
      return;
    }

    let cleanup = null;

    // Dynamic import — evita quebrar SSR no Next.js
    Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]).then(([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {

        /* ── 1. Hero: kicker badge ──────────────────────────── */
        gsap.from('.hero-kicker-row', {
          opacity: 0,
          y: -16,
          duration: 0.6,
          ease: 'power2.out',
          delay: 0.15,
        });

        /* ── 2. Título caracter a caracter ──────────────────── */
        const chars = document.querySelectorAll('.hero-char');
        if (chars.length) {
          gsap.from(chars, {
            opacity: 0,
            y: 70,
            rotationX: -50,
            filter: 'blur(6px)',
            stagger: { each: 0.028, from: 'start' },
            duration: 0.85,
            ease: 'back.out(1.4)',
            delay: 0.3,
          });
        }

        /* ── 3. Descrição ────────────────────────────────────── */
        gsap.from('.hero-description', {
          opacity: 0,
          y: 28,
          duration: 0.75,
          ease: 'power2.out',
          delay: 0.9,
        });

        /* ── 4. Botões CTA do hero ───────────────────────────── */
        gsap.from('.hero-actions', {
          opacity: 0,
          y: 18,
          duration: 0.6,
          ease: 'power2.out',
          delay: 1.1,
        });

        /* ── 5. Hero visual entra da direita ─────────────────── */
        gsap.from('.hero-brand-panel', {
          opacity: 0,
          x: 50,
          scale: 0.94,
          duration: 1.0,
          ease: 'power3.out',
          delay: 0.2,
        });

        /* ── 6. Blob morph na surface da imagem ──────────────── */
        // Sem MorphSVG — usamos border-radius CSS animation
        gsap.to('.hero-brand-surface', {
          borderRadius: '62% 38% 72% 28% / 38% 64% 36% 62%',
          duration: 9,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        /* ── 7. Floaters — cada um com easing único ──────────── */
        const floaterConfigs = [
          { sel: '.floater--leaf-1', y: -28, rot: 14, dur: 7.2 },
          { sel: '.floater--tomato',  y: -18, rot: -8, dur: 5.8 },
          { sel: '.floater--leaf-2',  y: -22, rot: 10, dur: 8.5 },
          { sel: '.floater--dot-1',   y: -35, rot: 0,  dur: 6.1 },
          { sel: '.floater--seed',    y: -20, rot: -12, dur: 9.0 },
          { sel: '.floater--dot-2',   y: -14, rot: 5,  dur: 4.8 },
        ];
        floaterConfigs.forEach(({ sel, y, rot, dur }, i) => {
          const el = document.querySelector(sel);
          if (!el) return;
          gsap.to(el, {
            y,
            rotation: rot,
            duration: dur,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.38,
          });
        });

        /* ── 8. Parallax scroll na imagem do hero ─────────────── */
        gsap.to('.hero-brand-panel', {
          y: -50,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        });

        /* ── 9. Brand strip ──────────────────────────────────── */
        gsap.from('.brand-strip__item', {
          opacity: 0,
          y: 36,
          stagger: 0.14,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: { trigger: '.brand-strip', start: 'top 88%' },
        });

        /* ── 10. Section headers ─────────────────────────────── */
        gsap.utils.toArray('.section-header').forEach((header) => {
          gsap.from(header, {
            opacity: 0,
            y: 30,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: { trigger: header, start: 'top 85%' },
          });
        });

        /* ── 11. Steps: brotam do fundo com stagger ──────────── */
        gsap.from('.step-card', {
          opacity: 0,
          y: 70,
          scale: 0.92,
          stagger: { each: 0.15, from: 'start' },
          duration: 0.85,
          ease: 'back.out(1.3)',
          scrollTrigger: { trigger: '.steps-grid', start: 'top 82%' },
        });

        /* ── 12. Features grid ───────────────────────────────── */
        gsap.from('.feature-card', {
          opacity: 0,
          y: 55,
          scale: 0.94,
          stagger: { each: 0.10, from: 'start' },
          duration: 0.75,
          ease: 'back.out(1.2)',
          scrollTrigger: { trigger: '.features-grid', start: 'top 84%' },
        });

        /* ── 13. CTA section: entra com dramatismo ─────────────
           Texto vem da esquerda, botão "brota" do zero         */
        gsap.from('.cta-copy > *', {
          opacity: 0,
          x: -50,
          stagger: 0.12,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.cta-section', start: 'top 75%' },
        });

        gsap.from('.cta-actions .btn-primary', {
          opacity: 0,
          scale: 0.5,
          rotation: -8,
          duration: 0.85,
          ease: 'back.out(2)',
          scrollTrigger: { trigger: '.cta-section', start: 'top 72%' },
        });

        // CTA blob-pulse no botão (breathe)
        const ctaBtn = document.querySelector('.cta-actions .btn-primary');
        if (ctaBtn) {
          gsap.to(ctaBtn, {
            scale: 1.04,
            duration: 2.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 2,
          });
        }

      }, heroRef);

      gsapCtxRef.current = ctx;
      cleanup = () => ctx.revert();
    });

    return () => { cleanup?.(); };
  }, [store]);

  if (isLoading || !store) {
    return <div className="loading-screen">Carregando...</div>;
  }

  const whatsappNumber = store.whatsapp_number || store.phone || '';
  const whatsappUrl = whatsappNumber ? `https://api.whatsapp.com/send?phone=${whatsappNumber}` : '#';
  const instagramUrl = store.metadata?.instagram_url || '#';
  const heroTitle = store.metadata?.hero_title || 'Saladas frescas e comida saudável entregues para você.';
  const heroDescription = store.description || 'Saladas, pratos leves e combinações frescas para quem quer comer bem sem complicação.';

  return (
    <div className="landing-page" ref={heroRef}>
      <Navbar />

      {/* ── Promo modal ────────────────────────────────────── */}
      {showPromo && (
        <div className="promo-modal-overlay" onClick={handleClosePromo} role="presentation">
          <div
            className="promo-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Fluxo de checkout em ${store.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="promo-close" onClick={handleClosePromo} aria-label="Fechar aviso">×</button>
            <div className="promo-badge">Novo fluxo</div>
            <h3>Agora o pedido termina com menos atrito</h3>
            <p>
              O cliente adiciona os itens à sacola, informa apenas e-mail e celular e segue para
              um checkout mais direto, com entrega e pagamento organizados.
            </p>
            <div className="promo-actions">
              <Link href="/cardapio" className="btn-primary">Explorar o cardápio</Link>
              <button type="button" className="btn-secondary" onClick={handleClosePromo}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ───────────────────────────────────────────── */}
      <header className="hero-section">
        <div className="hero-shader-shell" aria-hidden="true">
          <ShaderBackground className="hero-shader-canvas" />
          <div className="hero-shader-overlay" />
        </div>

        {/* Elementos orgânicos flutuantes */}
        <FloatingElements />

        <div className="container hero-container">
          {/* Copy */}
          <div className="hero-copy">
            <div className="hero-kicker-row">
              <span className="hero-kicker">Cê Saladas</span>
              <span className="hero-chip">Leve, fresco e objetivo</span>
            </div>

            <SplitTitle text={heroTitle} className="hero-title" />
            <p className="hero-description">{heroDescription}</p>

            <div className="hero-actions">
              <Link href="/cardapio" className="btn-primary btn-glow">
                Ver cardápio
                <ArrowRight size={18} />
              </Link>
              <a href="#como-funciona" className="btn-secondary">Entender o fluxo</a>
            </div>
          </div>

          {/* Visual */}
          <div className="hero-visual">
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
            </div>
          </div>
        </div>
      </header>

      {/* ── Brand strip ────────────────────────────────────── */}
      <section className="brand-strip">
        <div className="container brand-strip__inner">
          <div className="brand-strip__item"><Leaf size={18} /> Saladas frescas todo dia</div>
          <div className="brand-strip__item"><Clock3 size={18} /> Ingredientes naturais e saudáveis</div>
          <div className="brand-strip__item"><Zap size={18} /> Delivery e retirada disponíveis</div>
        </div>
      </section>

      {/* ── Como funciona ──────────────────────────────────── */}
      <section id="como-funciona" className="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Como pedir</span>
            <h2 className="section-title">Salada fresca em poucos passos</h2>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Escolha sua salada</h3>
              <p>Navegue pelo cardápio de saladas, bowls e pratos fit. Veja ingredientes, calorias e preço antes de decidir.</p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Monte do seu jeito</h3>
              <p>Personalize com ingredientes frescos, proteínas, toppings e molhos saudáveis — tudo feito para você.</p>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Receba em casa</h3>
              <p>Sem cadastro obrigatório. Pague com PIX, cartão ou dinheiro e aguarde a entrega da sua salada.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Por que Cê Saladas ─────────────────────────────── */}
      <section className="why-ce-saladas">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Por que escolher</span>
            <h2 className="section-title">Por que escolher o Cê Saladas</h2>
          </div>
          <div className="features-grid">
            <article className="feature-card">
              <span className="feature-icon"><Leaf size={22} /></span>
              <h3>Ingredientes sempre frescos</h3>
              <p>Selecionados diariamente para garantir sabor, qualidade e frescor em cada salada preparada.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon"><Sparkles size={22} /></span>
              <h3>Comida fit e saudável</h3>
              <p>Do low carb ao proteico: opções balanceadas para quem cuida da alimentação sem abrir mão do sabor.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon"><Zap size={22} /></span>
              <h3>Monte sua salada</h3>
              <p>Escolha base, proteína, toppings e molho. Crie a salada perfeita com os ingredientes que você quer.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon"><ShieldCheck size={22} /></span>
              <h3>Delivery e retirada</h3>
              <p>Peça pelo cardápio digital e receba em casa ou retire na loja — rápido, fácil e sem complicação.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────── */}
      <section className="cta-section">
        <div className="container cta-shell">
          <div className="cta-copy">
            <span className="section-eyebrow section-eyebrow--light">Peça agora</span>
            <h2>Monte sua salada agora mesmo.</h2>
            <p>
              Saladas frescas, bowls proteicos e opções fit prontos para você. Monte seu pedido
              em poucos toques e receba em casa ou retire na loja.
            </p>
          </div>
          <div className="cta-actions">
            <Link href="/cardapio" className="btn-primary btn-large btn-cta-blob">
              Ir para o cardápio
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
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
