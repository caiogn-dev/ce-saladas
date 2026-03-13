import React from 'react';
import Head from 'next/head';
import { useStore } from '../context/StoreContext';

const StoreHead = () => {
  const { store } = useStore();

  if (!store) {
    return (
      <Head>
        <title>Carregando... | Cê Saladas</title>
      </Head>
    );
  }

  const title = `${store.name} | Saladas e refeições leves`;
  const description = store.description || `${store.name}: saladas, pratos leves e refeições frescas. Peça online e receba em casa.`;
  const logoUrl = store.logo_url || '/design.webp';
  const url = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index,follow" />
      <link rel="icon" type="image/x-icon" href={store.logo_url || '/favicon.ico'} />
      <link rel="canonical" href={url} />
      <meta name="theme-color" content={store.primary_color || '#f06a32'} />

      <meta property="og:locale" content="pt_BR" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={logoUrl} />
      <meta property="og:site_name" content={store.name} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={logoUrl} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: store.name,
            url,
            logo: logoUrl,
            image: logoUrl,
          }),
        }}
      />
    </Head>
  );
};

export default StoreHead;
