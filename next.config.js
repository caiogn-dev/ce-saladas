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
      // 'unsafe-eval' required: HERE Maps v3 uses H.util.eval() internally
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://sdk.mercadopago.com https://api.mercadopago.com https://http2.mlstatic.com https://www.mercadolibre.com https://www.mercadolivre.com https://js.api.here.com",
      // Styles: own domain + inline (required by Next.js and MercadoPago) + HERE Maps UI CSS + Google Fonts
      "style-src 'self' 'unsafe-inline' https://http2.mlstatic.com https://js.api.here.com https://fonts.googleapis.com",
      // Images: own domain + backend media + map tiles + external images
      "img-src 'self' data: blob: https:",
      // Fonts: own domain + Google Fonts CDN
      "font-src 'self' data: https://fonts.gstatic.com",
      // API + WebSocket + maps + analytics connections
      "connect-src 'self' https://backend.pastita.com.br wss://backend.pastita.com.br https://www.google-analytics.com https://api.mercadopago.com https://api.mercadolibre.com https://sdk.mercadopago.com https://http2.mlstatic.com https://www.mercadolibre.com https://www.mercadolivre.com https://api.here.com https://js.api.here.com https://geocoder.ls.hereapi.com https://route.ls.hereapi.com https://revgeocode.search.hereapi.com https://autosuggest.search.hereapi.com https://geocode.search.hereapi.com https://router.hereapi.com https://*.ls.hereapi.com https://*.hereapi.com",
      // Frames: Mercado Pago checkout fields and antifraud fingerprint iframe
      "frame-src https://www.mercadopago.com.br https://www.mercadopago.com https://sandbox.mercadopago.com.br https://api.mercadopago.com https://www.mercadolibre.com https://www.mercadolivre.com",
      // Workers: own domain + blob (Next.js) + HERE Maps vector tile workers
      "worker-src 'self' blob: https://js.api.here.com",
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
