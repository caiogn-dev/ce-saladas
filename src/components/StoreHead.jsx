import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useStore } from '../context/StoreContext';

const SITE_URL = 'https://cesaladas.com.br';

const PRIVATE_PAGES = ['/checkout', '/perfil', '/sucesso', '/pendente', '/erro', '/login', '/registro'];

const PAGE_META = {
  '/': (name) => ({
    title: `${name} | Saladas frescas e confeitaria artesanal`,
    description: `Peça online no ${name}. Saladas frescas, bowls, pratos leves e confeitaria artesanal. Delivery e retirada.`,
  }),
  '/cardapio': (name) => ({
    title: `Cardápio | ${name} — Saladas e confeitaria`,
    description: `Veja o cardápio completo do ${name}. Saladas, bowls e confeitaria artesanal. Monte seu pedido e receba em casa.`,
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
    `${store.name}: saladas, pratos leves e refeições frescas. Peça online.`;
  const logoUrl = store.logo_url || `${SITE_URL}/icon-512.png`;
  const canonicalUrl = `${SITE_URL}${pathname}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: store.name,
    url: SITE_URL,
    logo: logoUrl,
    image: logoUrl,
    description,
    servesCuisine: ['Saladas', 'Comida saudável', 'Confeitaria'],
    menu: `${SITE_URL}/cardapio`,
    hasMenu: `${SITE_URL}/cardapio`,
    acceptsReservations: false,
    priceRange: '$$',
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
      <meta
        name="keywords"
        content="saladas frescas, comida saudável, confeitaria artesanal, delivery salada, bowl saudável, Cê Saladas"
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
