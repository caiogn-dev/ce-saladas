import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Leaf,
  MapPinned,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useStore } from '../context/StoreContext';

const DISHES = {
  shrimp: '/dishes/bowl-shrimp.webp',
  salmon: '/dishes/bowl-salmon.webp',
  pork: '/dishes/bowl-pork.png',
};

const normalizePhone = (value = '') => value.replace(/\D/g, '');

const formatMoney = (value) => Number(value || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const buildFeaturedFallback = () => ([
  {
    id: 'builder',
    name: 'Monte sua salada',
    description: 'Escolha base, proteína, complementos e molho em poucos toques.',
    image: DISHES.shrimp,
    priceLabel: 'Personalize do seu jeito',
  },
  {
    id: 'signature',
    name: 'Bowls da casa',
    description: 'Combinações equilibradas para pedir rápido sem abrir mão de sabor.',
    image: DISHES.salmon,
    priceLabel: 'Favoritos do cardápio',
  },
  {
    id: 'express',
    name: 'Pedido leve e rápido',
    description: 'Entrega, retirada e checkout desenhados para funcionar bem no celular.',
    image: DISHES.pork,
    priceLabel: 'Experiência pensada para mobile',
  },
]);

const getLocationLabel = (store) => {
  if (store?.metadata?.city && store?.metadata?.state) {
    return `${store.metadata.city} • ${store.metadata.state}`;
  }

  if (store?.city && store?.state) {
    return `${store.city} • ${store.state}`;
  }

  return store?.address || 'Entrega e retirada disponíveis';
};

const getHoursLabel = (availability, store) => {
  if (availability?.hours?.open && availability?.hours?.close) {
    return `${availability.hours.open} às ${availability.hours.close}`;
  }

  return store?.metadata?.business_hours_label
    || store?.metadata?.opening_hours
    || 'Pedidos com retirada e entrega';
};

const LandingPage = () => {
  const {
    store,
    featuredProducts,
    availability,
    isStoreOpen,
    isLoading,
  } = useStore();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const elements = document.querySelectorAll('.landing-reveal');
    if (!elements.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [store?.id, featuredProducts?.length]);

  const featuredCards = useMemo(() => {
    if (!featuredProducts?.length) {
      return buildFeaturedFallback();
    }

    return featuredProducts.slice(0, 3).map((product, index) => {
      const fallback = buildFeaturedFallback()[index] || buildFeaturedFallback()[0];
      return {
        id: product.id || fallback.id,
        name: product.name || fallback.name,
        description: product.short_description || product.description || fallback.description,
        image: product.main_image_url || product.main_image || fallback.image,
        priceLabel: product.price ? formatMoney(product.price) : fallback.priceLabel,
      };
    });
  }, [featuredProducts]);

  if (isLoading || !store) {
    return <div className="loading-screen">Carregando...</div>;
  }

  const storeName = store.name || 'Cê Saladas';
  const heroTitle = store.metadata?.hero_title || 'Comida leve, fresca e fácil de pedir no celular';
  const heroDescription = store.metadata?.hero_description
    || store.description
    || 'Entre no cardápio, monte seu pedido e finalize com uma jornada mais clara, rápida e confiável.';
  const locationLabel = getLocationLabel(store);
  const hoursLabel = getHoursLabel(availability, store);
  const whatsappNumber = normalizePhone(store.whatsapp_number || store.phone || '');
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá! Quero fazer um pedido na ${storeName}.`)}`
    : '/cardapio';
  const instagramUrl = store.metadata?.instagram_url || null;

  const heroSignals = [
    {
      icon: Clock3,
      label: isStoreOpen ? 'Aberto agora' : 'Agende seu pedido',
      value: hoursLabel,
    },
    {
      icon: Truck,
      label: 'Entrega e retirada',
      value: locationLabel,
    },
    {
      icon: ShieldCheck,
      label: 'Checkout simples',
      value: 'Pagamento com mais clareza e menos atrito',
    },
  ];

  const trustSignals = [
    {
      icon: Leaf,
      title: 'Ingredientes frescos',
      body: 'Cardápio pensado para decisão rápida sem perder a sensação de qualidade.',
    },
    {
      icon: ShoppingBag,
      title: 'Sacola sempre visível',
      body: 'A jornada de compra fica clara do primeiro clique até o pagamento.',
    },
    {
      icon: CheckCircle2,
      title: 'Login com WhatsApp',
      body: 'Autenticação rápida antes do pagamento, sem virar um cadastro pesado.',
    },
    {
      icon: Star,
      title: 'Marca com mais confiança',
      body: 'Visual premium e direto, com foco em conversão no iPhone e no Android.',
    },
  ];

  const journeySteps = [
    {
      step: '01',
      title: 'Abra o cardápio',
      body: 'A landing vira uma ponte direta para o pedido, sem ruído visual desnecessário.',
    },
    {
      step: '02',
      title: 'Monte e ajuste sua sacola',
      body: 'Busca, destaques e navegação por seção ficam mais claros no mobile.',
    },
    {
      step: '03',
      title: 'Entre com WhatsApp',
      body: 'Antes do pagamento, o cliente autentica rápido e mantém a continuidade da compra.',
    },
  ];

  const whatsappBenefits = [
    'Entrar e validar a conta sem perder a sacola.',
    'Receber status do pedido com mais contexto.',
    'Voltar para suporte ou recompra de forma natural.',
  ];

  return (
    <div className="landing-page">
      <Navbar />

      <main className="landing-main">
        <section className="landing-hero">
          <div className="container landing-hero__grid">
            <div className="landing-hero__content landing-reveal">
              <span className="landing-pill">
                {isStoreOpen ? 'Aberto agora para pedidos' : 'Experiência pronta para agendamento'}
              </span>

              <h1 className="landing-hero__title">{heroTitle}</h1>
              <p className="landing-hero__description">{heroDescription}</p>

              <div className="landing-hero__actions">
                <Link href="/cardapio" className="landing-cta-primary">
                  Abrir cardápio
                  <ArrowRight size={18} />
                </Link>
                <a
                  href={whatsappUrl}
                  target={whatsappNumber ? '_blank' : undefined}
                  rel={whatsappNumber ? 'noopener noreferrer' : undefined}
                  className="landing-cta-secondary"
                >
                  Falar no WhatsApp
                  <MessageCircle size={18} />
                </a>
              </div>

              <div className="landing-hero__signals">
                {heroSignals.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="landing-hero__signal">
                    <span className="landing-hero__signal-icon">
                      <Icon size={16} />
                    </span>
                    <div>
                      <strong>{label}</strong>
                      <span>{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-hero__visual landing-reveal">
              <div className="landing-hero__card">
                <div className="landing-hero__media">
                  <img
                    src={featuredCards[0]?.image || DISHES.shrimp}
                    alt={featuredCards[0]?.name || 'Destaque do cardápio'}
                  />
                </div>

                <div className="landing-hero__card-body">
                  <span className="landing-hero__card-label">Mais pedido agora</span>
                  <strong>{featuredCards[0]?.name || 'Monte sua salada'}</strong>
                  <p>{featuredCards[0]?.description}</p>
                </div>

                <div className="landing-hero__card-footer">
                  <span>{featuredCards[0]?.priceLabel || 'Escolha rápida'}</span>
                  <Link href="/cardapio">
                    Ver menu
                  </Link>
                </div>
              </div>

              <div className="landing-hero__floating landing-hero__floating--top">
                <span>Cardápio pensado para mobile</span>
                <strong>iPhone e Android</strong>
              </div>
              <div className="landing-hero__floating landing-hero__floating--bottom">
                <span>WhatsApp como eixo da jornada</span>
                <strong>login, status e recompra</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-proof landing-reveal">
          <div className="container">
            <div className="landing-section-header">
              <p>Experiência de compra mais útil</p>
              <h2>Menos efeito decorativo, mais clareza para pedir</h2>
            </div>

            <div className="landing-proof__grid">
              {trustSignals.map(({ icon: Icon, title, body }) => (
                <article key={title} className="landing-proof__card">
                  <span className="landing-proof__icon">
                    <Icon size={20} />
                  </span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-showcase landing-reveal">
          <div className="container">
            <div className="landing-section-header">
              <p>Escolha mais rápido</p>
              <h2>Entradas claras para o que mais converte no cardápio</h2>
            </div>

            <div className="landing-showcase__grid">
              {featuredCards.map((item) => (
                <article key={item.id} className="landing-showcase__card">
                  <div className="landing-showcase__media">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="landing-showcase__body">
                    <span>{item.priceLabel}</span>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <Link href="/cardapio" className="landing-showcase__link">
                    Ver no cardápio
                    <ArrowRight size={16} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="landing-journey landing-reveal">
          <div className="container">
            <div className="landing-section-header">
              <p>Jornada principal</p>
              <h2>Home curta, cardápio forte e checkout mais confiável</h2>
            </div>

            <div className="landing-journey__grid">
              {journeySteps.map((item) => (
                <article key={item.step} className="landing-journey__card">
                  <span>{item.step}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-whatsapp landing-reveal">
          <div className="container">
            <div className="landing-whatsapp__panel">
              <div className="landing-whatsapp__copy">
                <p>WhatsApp-first</p>
                <h2>O retorno do cliente passa por um canal que ele já usa</h2>
                <p>
                  O WhatsApp entra como login rápido, ponto de status e ponte para suporte e recompra.
                  Isso melhora a continuidade da experiência sem depender de fluxos longos.
                </p>
              </div>

              <div className="landing-whatsapp__list">
                {whatsappBenefits.map((item) => (
                  <div key={item} className="landing-whatsapp__item">
                    <CheckCircle2 size={18} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-cta landing-reveal">
          <div className="container landing-cta__shell">
            <div className="landing-cta__copy">
              <p>Pronto para pedir</p>
              <h2>Abra o cardápio e finalize com uma experiência mais rápida no celular.</h2>
            </div>

            <div className="landing-cta__actions">
              <Link href="/cardapio" className="landing-cta-primary">
                Pedir agora
                <ArrowRight size={18} />
              </Link>
              <a
                href={whatsappUrl}
                target={whatsappNumber ? '_blank' : undefined}
                rel={whatsappNumber ? 'noopener noreferrer' : undefined}
                className="landing-cta-secondary"
              >
                Tirar dúvidas
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="container landing-footer__grid">
          <div className="landing-footer__brand">
            <h3>{storeName}</h3>
            <p>{heroDescription}</p>
          </div>

          <div className="landing-footer__links">
            <h4>Navegação</h4>
            <Link href="/">Início</Link>
            <Link href="/cardapio">Cardápio</Link>
            <Link href="/checkout">Checkout</Link>
          </div>

          <div className="landing-footer__contact">
            <h4>Contato</h4>
            <p className="landing-footer__contact-item">
              <MapPinned size={16} />
              <span>{store.address || locationLabel}</span>
            </p>
            <p className="landing-footer__contact-item">
              <Clock3 size={16} />
              <span>{hoursLabel}</span>
            </p>
            <div className="landing-footer__social">
              <a
                href={whatsappUrl}
                target={whatsappNumber ? '_blank' : undefined}
                rel={whatsappNumber ? 'noopener noreferrer' : undefined}
              >
                WhatsApp
              </a>
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
