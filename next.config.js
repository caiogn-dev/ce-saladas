const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: own domain + Google Analytics + MercadoPago SDK + HERE Maps SDK
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://sdk.mercadopago.com https://js.api.here.com",
      // Styles: own domain + inline (required by Next.js and MercadoPago) + HERE Maps UI CSS
      "style-src 'self' 'unsafe-inline' https://js.api.here.com",
      // Images: own domain + backend media + map tiles + external images
      "img-src 'self' data: blob: https:",
      // Fonts: own domain only
      "font-src 'self' data:",
      // API + WebSocket + maps + analytics connections
      "connect-src 'self' https://backend.pastita.com.br wss://backend.pastita.com.br https://www.google-analytics.com https://api.here.com https://geocoder.ls.hereapi.com https://route.ls.hereapi.com https://revgeocode.search.hereapi.com https://autosuggest.search.hereapi.com https://geocode.search.hereapi.com https://router.hereapi.com https://*.ls.hereapi.com https://*.hereapi.com",
      // Frames: MercadoPago checkout iframes
      "frame-src https://www.mercadopago.com.br https://www.mercadopago.com https://sandbox.mercadopago.com.br",
      // Workers: own domain only (Next.js service worker)
      "worker-src 'self' blob:",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  // Keep tracing scoped to this app when parent folders also have lockfiles.
  outputFileTracingRoot: process.cwd(),
  env: {
    // Expose API_BASE_URL or API_URL to the client
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || process.env.API_URL,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
