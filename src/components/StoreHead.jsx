import React from 'react';
import Head from 'next/head';
import { useStore } from '../context/StoreContext';

const StoreHead = () => {
    const { store } = useStore();

    if (!store) return (
        <Head>
            <title>Loading... | Storefront</title>
        </Head>
    );

    const title = `${store.name} | Massas artesanais`;
    const description = store.description || `${store.name}: massas artesanais, molhos e refeições prontas. Peça online e receba em casa.`;
    const logoUrl = store.logo_url || '/design.webp';
    const url = typeof window !== 'undefined' ? window.location.origin : '';

    return (
        <Head>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="robots" content="index,follow" />
            <link rel="icon" type="image/x-icon" href={store.logo_url || "/favicon.ico"} />
            <link rel="canonical" href={url} />
            <meta name="theme-color" content={store.primary_color || "#722f37"} />

            {/* OG Tags */}
            <meta property="og:locale" content="pt_BR" />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={logoUrl} />
            <meta property="og:site_name" content={store.name} />

            {/* Twitter Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={logoUrl} />

            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Organization',
                        name: store.name,
                        url: url,
                        logo: logoUrl,
                        image: logoUrl
                    })
                }}
            />
        </Head>
    );
};

export default StoreHead;
