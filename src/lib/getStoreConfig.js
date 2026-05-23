const STORE_CONFIG_TTL_MS = 5 * 60 * 1000; // 5 minutos

// Cache module-level: persiste entre requests no mesmo processo Node.js
const cache = new Map(); // domain -> { config, ts }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function getStoreConfig(domain) {
  // Dev local: fallback para env var quando domínio é localhost
  if (!domain || domain === 'localhost') {
    const slug = process.env.NEXT_PUBLIC_STORE_SLUG || 'ce-saladas';
    return {
      slug,
      template: 'fresh',
      primary_color: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#2D6A4F',
      secondary_color: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#1B4332',
      logo_url: null,
      name: process.env.NEXT_PUBLIC_STORE_NAME || 'Loja',
      tagline: '',
    };
  }

  const cached = cache.get(domain);
  if (cached && Date.now() - cached.ts < STORE_CONFIG_TTL_MS) {
    return cached.config;
  }

  try {
    const baseUrl = API_URL.replace(/\/api\/v1\/?$/, '');
    const res = await fetch(
      `${baseUrl}/api/v1/public/store-by-domain/?domain=${encodeURIComponent(domain)}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      console.error(`[getStoreConfig] ${res.status} para domain=${domain}`);
      return null;
    }

    const config = await res.json();
    cache.set(domain, { config, ts: Date.now() });
    return config;
  } catch (err) {
    console.error('[getStoreConfig] erro:', err.message);
    return null;
  }
}
