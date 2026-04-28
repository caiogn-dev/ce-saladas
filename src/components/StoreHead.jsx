import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useStore } from '../context/StoreContext';

const SITE_URL = 'https://cesaladas.com.br';

const PRIVATE_PAGES = ['/checkout', '/perfil', '/sucesso', '/pendente', '/erro', '/login', '/registro'];

const PAGE_META = {
  '/': (name) => ({
    title: `${name} | Melhor saladeria em Palmas, comida saudável e almoço fit`,
    description: `${name} é saladeria e restaurante saudável em Palmas. Peça saladas frescas, comida fit, almoço leve, bowls, pratos saudáveis e delivery.`,
  }),
  '/cardapio': (name) => ({
    title: `Cardápio ${name} | Saladas, comida fit, almoço saudável em Palmas`,
    description: `Veja o cardápio do ${name}: saladas frescas, bowls, comida saudável, pratos fit, almoço leve, delivery e retirada em Palmas.`,
  }),
};

const StoreHead = () => {
  const { store } = useStore();
  const { pathname } = useRouter();

  if (!store) {
    return (
      <Head>
        <title>Carregando... | Cê Saladas</title>
      </Head>
    );
  }

  const isPrivate = PRIVATE_PAGES.includes(pathname);
  const pageMeta = PAGE_META[pathname]?.(store.name);

  const title = pageMeta?.title || `${store.name} | Saladas e refeições leves`;
  const description =
    pageMeta?.description ||
    store.description ||
    `${store.name}: saladas frescas, comida saudável, almoço fit, bowls e refeições leves em Palmas. Peça online.`;
  const logoUrl = store.logo_url || `${SITE_URL}/icon-512.png`;
  const canonicalUrl = `${SITE_URL}${pathname}`;
  const address = [store.address, store.city, store.state, store.zip_code].filter(Boolean).join(', ');
  const phone = store.whatsapp_number || store.phone || '';
  const instagramUrl = store.metadata?.instagram_url;
  const keywords = [
    'Cê Saladas',
    'Ce Saladas',
    'melhor salada de Palmas',
    'melhor saladeria de Palmas',
    'saladeria em Palmas',
    'restaurante saudável em Palmas',
    'saladas em Palmas',
    'salada delivery Palmas',
    'comida saudável Palmas',
    'comida fit Palmas',
    'almoço saudável Palmas',
    'almoço fit Palmas',
    'culinária saudável',
    'saladas frescas',
    'bowls saudáveis',
    'monte sua salada',
    'delivery saudável',
    'restaurante fit',
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: store.name,
        alternateName: ['Ce Saladas', 'Cê Saladas Palmas', 'Cê Saladas & Confeitaria'],
        url: SITE_URL,
        inLanguage: 'pt-BR',
        description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/cardapio?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': ['Restaurant', 'LocalBusiness', 'FoodEstablishment'],
        '@id': `${SITE_URL}/#restaurant`,
        name: store.name,
        alternateName: ['Ce Saladas', 'Cê Saladas Palmas', 'Saladeria Cê Saladas'],
        url: SITE_URL,
        logo: logoUrl,
        image: [logoUrl, `${SITE_URL}/dishes/bowl-shrimp.webp`, `${SITE_URL}/dishes/bowl-salmon.webp`],
        description,
        slogan: 'Saladas frescas, comida saudável e almoço fit em Palmas.',
        telephone: phone || undefined,
        address: {
          '@type': 'PostalAddress',
          streetAddress: store.address || undefined,
          addressLocality: store.city || 'Palmas',
          addressRegion: store.state || 'TO',
          postalCode: store.zip_code || undefined,
          addressCountry: 'BR',
        },
        geo: store.latitude && store.longitude ? {
          '@type': 'GeoCoordinates',
          latitude: Number(store.latitude),
          longitude: Number(store.longitude),
        } : undefined,
        areaServed: [
          { '@type': 'City', name: 'Palmas' },
          { '@type': 'AdministrativeArea', name: 'Plano Diretor Sul' },
          { '@type': 'AdministrativeArea', name: 'Plano Diretor Norte' },
          { '@type': 'AdministrativeArea', name: 'Taquaralto' },
        ],
        servesCuisine: [
          'Saladas',
          'Comida saudável',
          'Comida fit',
          'Almoço saudável',
          'Culinária natural',
          'Bowls',
          'Confeitaria artesanal',
        ],
        keywords: keywords.join(', '),
        menu: `${SITE_URL}/cardapio`,
        hasMenu: `${SITE_URL}/cardapio`,
        acceptsReservations: false,
        priceRange: '$$',
        paymentAccepted: ['PIX', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro'],
        sameAs: instagramUrl ? [instagramUrl] : undefined,
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Onde pedir salada em Palmas?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: `No ${store.name}, você pode pedir saladas frescas, comida saudável, bowls e almoço fit em Palmas pelo cardápio online.`,
            },
          },
          {
            '@type': 'Question',
            name: 'O Cê Saladas faz delivery?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Sim. O Cê Saladas atende delivery e retirada em áreas de Palmas, com cálculo de entrega conforme localização.',
            },
          },
          {
            '@type': 'Question',
            name: 'Tem comida fit e almoço saudável?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Sim. O cardápio inclui saladas, pratos leves, opções fit, combinações saudáveis, proteínas, toppings e molhos.',
            },
          },
        ],
      },
    ],
  };

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={isPrivate ? 'noindex,nofollow' : 'index,follow'} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="manifest" href="/manifest.json" />
      <link rel="icon" type="image/x-icon" href={store.logo_url || '/favicon.ico'} />
      <meta name="theme-color" content={store.primary_color || '#2D6A4F'} />
      <meta name="author" content={store.name} />
      <meta name="geo.region" content="BR-TO" />
      <meta name="geo.placename" content={address || 'Palmas, Tocantins'} />
      <meta name="ICBM" content={store.latitude && store.longitude ? `${store.latitude}, ${store.longitude}` : '-10.1840, -48.3336'} />
      <meta
        name="keywords"
        content={keywords.join(', ')}
      />

      {/* Open Graph */}
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={logoUrl} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:site_name" content={store.name} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={logoUrl} />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
};

export default StoreHead;
