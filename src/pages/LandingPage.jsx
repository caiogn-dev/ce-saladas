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
   Word-mask title: cada palavra num clip container para o
   reveal por baixo estilo editorial (yPercent 115 → 0).
   A última palavra recebe a classe hero-accent (itálico laranja).
───────────────────────────────────────────────────────────── */
const MaskTitle = ({ text, className }) => {
  const words = text.trim().split(/\s+/);
  const last = words.pop();
  return (
    <h1 className={className}>
      {words.map((word, i) => (
        // eslint-disable-next-line react/no-array-index-key
        [<span key={i} className="word-mask">
          <span className="word-inner">{word}</span>
        </span>, ' ']
      ))}
      {' '}
      <span className="word-mask">
        <em className="hero-accent word-inner">{last}</em>
      </span>
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
  const cursorGlowRef = useRef(null);

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
    let onMouseMove = null;
    const cleanupHandlers = [];

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        /* ── Cursor glow + hero parallax multi-layer ─────────── */
        onMouseMove = (e) => {
          if (cursorGlowRef.current) {
            gsap.to(cursorGlowRef.current, {
              x: e.clientX, y: e.clientY, duration: 0.9, ease: 'power2.out',
            });
          }
          const xPct = e.clientX / window.innerWidth - 0.5;
          const yPct = e.clientY / window.innerHeight - 0.5;
          gsap.to('.hero-food-blob', {
            x: xPct * 28, duration: 1.4, ease: 'power2.out', overwrite: 'auto',
          });
          gsap.to('.hero-badge-pill--top', {
            x: xPct * -22, y: yPct * -14, duration: 1.0, ease: 'power2.out', overwrite: 'auto',
          });
          gsap.to('.hero-badge-pill--bottom', {
            x: xPct * 16, y: yPct * 11, duration: 1.1, ease: 'power2.out', overwrite: 'auto',
          });
        };
        window.addEventListener('mousemove', onMouseMove);

        /* ── Magnetic buttons ─────────────────────────────────── */
        gsap.utils.toArray('.btn-hero-main, .btn-cta-primary').forEach((btn) => {
          const onMove = (e) => {
            const r = btn.getBoundingClientRect();
            const x = (e.clientX - (r.left + r.width / 2)) * 0.28;
            const y = (e.clientY - (r.top + r.height / 2)) * 0.28;
            gsap.to(btn, { x, y, duration: 0.3, ease: 'power2.out' });
          };
          const onLeave = () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1.1, 0.4)' });
          };
          btn.addEventListener('mousemove', onMove);
          btn.addEventListener('mouseleave', onLeave);
          cleanupHandlers.push(() => {
            btn.removeEventListener('mousemove', onMove);
            btn.removeEventListener('mouseleave', onLeave);
          });
        });

        /* ── 3D card tilt ─────────────────────────────────────── */
        gsap.utils.toArray('.feature-card').forEach((card) => {
          const onMove = (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            gsap.to(card, {
              rotateX: y * -13,
              rotateY: x * 13,
              transformPerspective: 700,
              duration: 0.4,
              ease: 'power2.out',
            });
          };
          const onLeave = () => {
            gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.65, ease: 'elastic.out(1, 0.3)' });
          };
          card.addEventListener('mousemove', onMove);
          card.addEventListener('mouseleave', onLeave);
          cleanupHandlers.push(() => {
            card.removeEventListener('mousemove', onMove);
            card.removeEventListener('mouseleave', onLeave);
          });
        });

        ctx = gsap.context(() => {

          /* ────────────────────────────────────────────────────
             HERO — Timeline coordenado
          ──────────────────────────────────────────────────── */
          const heroTL = gsap.timeline({ defaults: { ease: 'power4.out' } });

          heroTL
            .from('.hero-food-blob', {
              opacity: 0, scale: 0.78, y: 36, duration: 1.1, ease: 'back.out(1.5)',
            }, 0)
            .from('.hero-tag', { opacity: 0, x: -28, duration: 0.5 }, 0.12)
            /* Word-mask reveal — cada palavra sobe por baixo do clip */
            .from('.hero-title .word-inner', {
              yPercent: 115, opacity: 0,
              duration: 0.9, stagger: 0.075, ease: 'power4.out',
            }, 0.25)
            .from('.hero-description', { opacity: 0, y: 24, duration: 0.65 }, 0.72)
            .from('.hero-actions',     { opacity: 0, y: 20, duration: 0.55 }, 0.88)
            .from('.hero-stats',       { opacity: 0, y: 18, duration: 0.5  }, 1.02);

          /* Badge pills entram com mais bounce */
          gsap.from('.hero-badge-pill', {
            opacity: 0, scale: 0.55, duration: 0.6, ease: 'back.out(2.8)',
            delay: 1.1, stagger: { each: 0.22 },
          });

          /* Float orgânico no blob */
          gsap.to('.hero-food-blob', {
            y: '-=14', duration: 4.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.2,
          });

          /* Count-up stats */
          gsap.utils.toArray('.stat-count').forEach((el) => {
            const target = parseFloat(el.dataset.target);
            const suffix = el.dataset.suffix || '';
            const decimals = parseInt(el.dataset.decimal || '0', 10);
            const obj = { val: 0 };
            gsap.to(obj, {
              val: target, duration: 2.0, ease: 'power2.out', delay: 1.2,
              onUpdate() { el.textContent = obj.val.toFixed(decimals) + suffix; },
              onComplete() { el.textContent = target.toFixed(decimals) + suffix; },
            });
          });

          /* ────────────────────────────────────────────────────
             SCROLL
          ──────────────────────────────────────────────────── */

          gsap.from('.brand-strip', {
            opacity: 0, y: 20, duration: 0.55, ease: 'power2.out',
            scrollTrigger: { trigger: '.brand-strip', start: 'top 96%' },
          });

          /* Section eyebrows */
          gsap.utils.toArray('.section-eyebrow').forEach((el) => {
            gsap.from(el, {
              opacity: 0, x: -18, duration: 0.5, ease: 'power2.out',
              scrollTrigger: { trigger: el, start: 'top 92%' },
            });
          });

          /* Step cards — mais dramáticos */
          gsap.from('.step-card', {
            opacity: 0, y: 68, scale: 0.9,
            stagger: 0.14, duration: 0.95, ease: 'back.out(1.5)',
            scrollTrigger: { trigger: '.steps-grid', start: 'top 82%' },
          });

          /* Feature card icons — rotation + scale */
          gsap.from('.feature-icon', {
            scale: 0, rotation: -60, opacity: 0,
            stagger: 0.1, duration: 0.7, ease: 'back.out(2.2)',
            scrollTrigger: { trigger: '.features-grid', start: 'top 88%' },
          });

          /* Feature cards h3 + p — slide sutil após ícone */
          gsap.from('.feature-card h3, .feature-card p', {
            opacity: 0, y: 18, stagger: 0.05, duration: 0.5, ease: 'power2.out',
            scrollTrigger: { trigger: '.features-grid', start: 'top 82%' },
          });

          /* Section accent titles */
          gsap.utils.toArray('.section-accent-title').forEach((el) => {
            gsap.from(el, {
              opacity: 0, y: 28, duration: 0.65, ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 90%' },
            });
          });

          /* CTA */
          gsap.from('.cta-copy > *', {
            opacity: 0, x: -40, stagger: 0.1, duration: 0.75, ease: 'power3.out',
            scrollTrigger: { trigger: '.cta-section', start: 'top 80%' },
          });
          gsap.from('.cta-btn-wrap', {
            opacity: 0, scale: 0.6, duration: 0.9, ease: 'back.out(2.2)',
            scrollTrigger: { trigger: '.cta-section', start: 'top 76%' },
          });

          /* Parallax hero visual */
          gsap.to('.hero-visual-col', {
            y: -48, ease: 'none',
            scrollTrigger: {
              trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 2.5,
            },
          });

          ScrollTrigger.refresh();

        }, pageRef);
      }
    );

    return () => {
      if (onMouseMove) window.removeEventListener('mousemove', onMouseMove);
      cleanupHandlers.forEach((fn) => fn());
      ctx?.revert();
    };
  }, [store]);

  if (isLoading || !store) return <div className="loading-screen">Carregando...</div>;

  const whatsappNumber = store.whatsapp_number || store.phone || '';
  const whatsappUrl = whatsappNumber ? `https://api.whatsapp.com/send?phone=${whatsappNumber}` : '#';
  const instagramUrl = store.metadata?.instagram_url || '#';
  const heroTitle = store.metadata?.hero_title || 'Saladas frescas entregues para você';
  const heroDescription = store.description || 'Saladas, pratos leves e combinações frescas para quem quer comer bem sem complicação.';

  return (
    <div className="landing-page" ref={pageRef}>
      {/* Cursor glow — segue o mouse, visível apenas em dispositivos com hover */}
      <div className="hero-cursor-glow" ref={cursorGlowRef} aria-hidden="true" />
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

            <MaskTitle text={heroTitle} className="hero-title" />

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

          {/* Visual — Food Blob */}
          <div className="hero-visual-col">
            <div className="hero-visual-wrapper">

              {/* ── Blob laranja com imagem dentro — um só bloco ── */}
              <div className="hero-food-blob">
                <img
                  src={DISHES.shrimp}
                  alt="Bowl de camarão com molho"
                  draggable="false"
                />
              </div>

              {/* ── Badges fora do blob, relativos ao wrapper ─── */}
              <div className="hero-badge-pill hero-badge-pill--top">
                <Leaf size={13} />
                <span>100% fresco</span>
              </div>
              <div className="hero-badge-pill hero-badge-pill--bottom">
                <Clock3 size={13} />
                <span>Entrega hoje</span>
              </div>

            </div>
          </div>

        </div>
      </header>

      {/* ── Brand strip — marquee ticker ───────────────────────── */}
      <section className="brand-strip" aria-label="Diferenciais">
        <div className="brand-strip__track" aria-hidden="true">
          {/* Duplicado para loop contínuo sem gap */}
          {[0, 1].map((set) => (
            <div key={set} className="brand-strip__set">
              <span className="brand-pill"><Leaf size={14} /> Ingredientes frescos</span>
              <span className="brand-sep" aria-hidden="true">·</span>
              <span className="brand-pill"><Clock3 size={14} /> Entrega e retirada</span>
              <span className="brand-sep" aria-hidden="true">·</span>
              <span className="brand-pill"><Zap size={14} /> Monte sua salada</span>
              <span className="brand-sep" aria-hidden="true">·</span>
              <span className="brand-pill"><ShieldCheck size={14} /> Sem conservantes</span>
              <span className="brand-sep" aria-hidden="true">·</span>
              <span className="brand-pill"><Star size={14} fill="currentColor" /> 4.9 no Google</span>
              <span className="brand-sep" aria-hidden="true">·</span>
              <span className="brand-pill"><Sparkles size={14} /> Feito na hora</span>
              <span className="brand-sep" aria-hidden="true">·</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Como funciona ──────────────────────────────────────── */}
      <section id="como-funciona" className="how-it-works">
        <div className="container how-it-works__inner">

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
              <div key={n} className="step-card" data-n={n}>
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

      {/* ── SEO local ─────────────────────────────────────────── */}
      <section className="how-it-works" aria-labelledby="seo-local-title">
        <div className="container how-it-works__inner">
          <div className="section-header">
            <p className="section-eyebrow">Saladeria em Palmas</p>
            <h2 id="seo-local-title" className="section-accent-title">
              Comida saudável, saladas e <em>almoço fit em Palmas</em>
            </h2>
          </div>
          <div className="steps-grid">
            {[
              {
                n: '01',
                title: 'Saladas frescas em Palmas',
                body: 'O Cê Saladas prepara saladas, bowls e pratos leves com ingredientes frescos para quem busca comida saudável no almoço ou jantar.',
              },
              {
                n: '02',
                title: 'Restaurante saudável e fit',
                body: 'Uma opção prática para comer bem: culinária saudável, refeições equilibradas, proteínas, toppings, molhos e combinações feitas na hora.',
              },
              {
                n: '03',
                title: 'Delivery de salada',
                body: 'Peça pelo cardápio online e receba sua salada em Palmas, com retirada na loja ou delivery conforme a região atendida.',
              },
            ].map(({ n, title, body }) => (
              <article key={n} className="step-card" data-n={n}>
                <div className="step-number">{n}</div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="why-section" aria-labelledby="seo-faq-title">
        <div className="container why-section__inner">
          <div className="section-header">
            <p className="section-eyebrow">Dúvidas frequentes</p>
            <h2 id="seo-faq-title" className="section-accent-title">
              Perguntas sobre <em>saladas e comida saudável</em>
            </h2>
          </div>
          <div className="features-grid">
            {[
              {
                title: 'Onde pedir salada em Palmas?',
                body: 'No Cê Saladas você encontra saladas frescas, bowls, comida fit e almoço saudável com pedido online.',
              },
              {
                title: 'Tem almoço saudável e comida fit?',
                body: 'Sim. O cardápio tem opções leves, ingredientes frescos, proteínas e combinações para uma rotina mais equilibrada.',
              },
              {
                title: 'A loja faz delivery?',
                body: 'Sim. Atendemos delivery e retirada em Palmas conforme a área de entrega disponível no checkout.',
              },
              {
                title: 'Posso montar minha salada?',
                body: 'Sim. Você pode escolher bases, proteínas, toppings e molhos para montar uma salada do seu jeito.',
              },
            ].map(({ title, body }) => (
              <article key={title} className="feature-card">
                <span className="feature-icon"><Leaf size={24} /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Localização ───────────────────────────────────────── */}
      <section id="localizacao" className="location-section" aria-labelledby="location-title">
        <div className="container location-section__inner">
          <div className="location-copy">
            <p className="section-eyebrow">Nossa localização</p>
            <h2 id="location-title" className="section-accent-title">
              Encontre o <em>Cê Saladas</em>
            </h2>
            <p>
              Veja o endereço no mapa, pesquise a rota e venha retirar seu pedido na loja.
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=C%C3%AA%20Saladas%20Palmas%20TO&query_place_id=ChIJ0c_zgLjNJJMRdwOAY3VKXi4"
              target="_blank"
              rel="noopener noreferrer"
              className="location-route-link"
            >
              Abrir rota no Google Maps
              <ArrowRight size={18} />
            </a>
          </div>
          <div className="location-map-shell" aria-label="Mapa com a localização do Cê Saladas">
            <iframe
              src="https://storage.googleapis.com/maps-solutions-9es6wufhru/locator-plus/1a50/locator-plus.html"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização do Cê Saladas"
            />
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
