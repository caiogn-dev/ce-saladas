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
      "connect-src 'self' https://backend.pastita.com.br wss://backend.pastita.com.br https://connect.facebook.net https://www.facebook.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net https://api.mercadopago.com https://api-static.mercadopago.com https://secure-fields.mercadopago.com https://api.mercadolibre.com https://sdk.mercadopago.com https://http2.mlstatic.com https://www.mercadolibre.com https://www.mercadolivre.com https://*.googleapis.com *.google.com https://*.gstatic.com data: blob: https://viacep.com.br",
      // Frames: Mercado Pago checkout fields and Google Maps embeds/auth flows.
      "frame-src https://secure-fields.mercadopago.com https://www.mercadopago.com.br https://www.mercadopago.com https://sandbox.mercadopago.com.br https://api.mercadopago.com https://www.mercadolibre.com https://www.mercadolivre.com https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.googleusercontent.com https://storage.googleapis.com https://www.facebook.com https://connect.facebook.net",
      // Workers: own domain + blob (Next.js)
      "worker-src 'self' blob:",
      // child-src: legacy fallback
      "child-src 'self' blob: https://storage.googleapis.com https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.googleusercontent.com",
    ].join('; '),
  },
];

// Vitrine canônica da loja na plataforma; é ela que serve TUDO.
export const STOREFRONT_CANONICO = 'https://cardapidex.com.br/ce-saladas';
export const CAMINHOS_DA_PLATAFORMA = ['/orders', '/carteira', '/promos'];
// 01/10: a compra também vai para a vitrine canônica — o cardápio daqui era
// uma cópia antiga (barra de categorias sumia ao rolar; sacola, pagamento e
// endereço novos nunca chegaram). Temporário (307): reversível sem o
// navegador do cliente ficar preso. /sucesso, /pendente e /erro ficam aqui
// porque pedidos já feitos neste domínio voltam do pagamento para eles.
export const CAMINHOS_DA_COMPRA = ['/checkout', '/perfil', '/login', '/registro'];

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['openclaw.pastita.com.br'],
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
      // Mídia do palco (fotos, vídeos, quadros, libs): o padrão da Vercel faz o
      // navegador revalidar tudo a cada visita. Um dia no aparelho + renovação
      // em segundo plano: quem volta abre na hora. Nome novo quando o arquivo muda.
      {
        source: '/palco/:dir(assets|vendor)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ];
  },
  // O domínio próprio serve só a vitrine (cardápio, checkout, perfil). "Meus
  // pedidos", carteira e promoções vivem no storefront canônico da plataforma
  // — e o convite de avaliação, o link da carteira e o "acompanhar pedido"
  // apontam para esses caminhos. Sem isto, 81 avaliações renderam 2 comentários:
  // o cliente batia num 404. Redirect permanente, com o caminho preservado.
  // A home de cesaladas.com.br é o palco (página estática em public/palco):
  // fica fora do _app de propósito — o CSS global e o WhatsApp flutuante da
  // vitrine antiga brigavam com o layout. A landing anterior segue em
  // /landing-antiga e na tag git landing-antiga-2026-10-06.
  async rewrites() {
    return { beforeFiles: [{ source: '/', destination: '/palco/index.html' }] };
  },
  async redirects() {
    const permanentes = CAMINHOS_DA_PLATAFORMA.map((caminho) => ({
      source: `${caminho}/:path*`,
      destination: `${STOREFRONT_CANONICO}${caminho}/:path*`,
      permanent: true,
    }));
    const compra = CAMINHOS_DA_COMPRA.map((caminho) => ({
      source: `${caminho}/:path*`,
      destination: `${STOREFRONT_CANONICO}${caminho}/:path*`,
      permanent: false,
    }));
    return [
      ...permanentes,
      { source: '/cardapio', destination: STOREFRONT_CANONICO, permanent: false },
      ...compra,
    ];
  },
};

export default nextConfig;
