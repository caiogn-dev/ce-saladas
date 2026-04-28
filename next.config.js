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
      // Scripts: include Google Maps runtime domains recommended by Google CSP docs.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://connect.facebook.net https://www.googletagmanager.com https://www.google-analytics.com https://sdk.mercadopago.com https://api.mercadopago.com https://api-static.mercadopago.com https://http2.mlstatic.com https://www.mercadolibre.com https://www.mercadolivre.com https://*.googleapis.com https://*.gstatic.com *.google.com https://*.ggpht.com *.googleusercontent.com",
      // Styles: own domain + inline (required by Next.js and MercadoPago) + Google Fonts + Google Maps
      "style-src 'self' 'unsafe-inline' https://http2.mlstatic.com https://fonts.googleapis.com https://maps.googleapis.com",
      // Images: include Google Maps CDN domains used for tiles and markers.
      "img-src 'self' data: blob: https: https://*.googleapis.com https://*.gstatic.com *.google.com *.googleusercontent.com",
      // Fonts: own domain + Google Fonts CDN
      "font-src 'self' data: https://fonts.gstatic.com",
      // API + WebSocket + maps + analytics connections
      "connect-src 'self' https://backend.pastita.com.br wss://backend.pastita.com.br https://connect.facebook.net https://www.facebook.com https://www.google-analytics.com https://api.mercadopago.com https://api-static.mercadopago.com https://secure-fields.mercadopago.com https://api.mercadolibre.com https://sdk.mercadopago.com https://http2.mlstatic.com https://www.mercadolibre.com https://www.mercadolivre.com https://*.googleapis.com *.google.com https://*.gstatic.com data: blob: https://viacep.com.br",
      // Frames: Mercado Pago checkout fields and Google Maps embeds/auth flows.
      "frame-src https://secure-fields.mercadopago.com https://www.mercadopago.com.br https://www.mercadopago.com https://sandbox.mercadopago.com.br https://api.mercadopago.com https://www.mercadolibre.com https://www.mercadolivre.com *.google.com https://storage.googleapis.com",
      // Workers: own domain + blob (Next.js)
      "worker-src 'self' blob:",
      // child-src: legacy fallback
      "child-src 'self' blob: https://storage.googleapis.com",
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
