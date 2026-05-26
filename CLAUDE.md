# CLAUDE.md — ce-saladas

Storefront Next.js da loja Cê Saladas. Frontend de cliente para cardápio, SaladBuilder, sacola, checkout, perfil e status de pagamento.

## Documentação

- Obsidian vault: `/home/graco/WORK/Obsidian/10-Projetos/ce-saladas.md`
- Ecossistema: `/home/graco/WORK/Obsidian/10-Projetos/Ecossistema Pastita.md`
- Backend (server2): `/home/graco/WORK/Obsidian/10-Projetos/server2.md`

## Stack

- Next.js 15 + React 19, Pages Router
- CSS custom properties + Tailwind CSS v4 + CSS Modules
- Axios — `src/services/storeApi.js` (instância principal + publicApi)
- `@mercadopago/sdk-react`
- GSAP 3 (lazy, apenas na LandingPage)
- WebGL GLSL shader — `src/components/ui/ShaderBackground.jsx` (splash screen)
- `NEXT_PUBLIC_STORE_SLUG` define o tenant (fallback: `ce-saladas`)

## Commands

```bash
npm run dev      # dev server
npm run build    # build produção
npm run start    # serve build
```

## Regras críticas

- **Guest checkout nativo**: qualquer usuário finaliza sem login — `CartSidebar` vai direto para `/checkout`
- **guest_cart_key**: UUID em `localStorage` (`guest_cart_key`), enviado como `X-Cart-Key` + `cart_key` em toda request de carrinho
- **IdentificationStep**: identificação progressiva só por celular — sem senha, sem cadastro
- **useGuestInfo**: persiste `{ name, phone, email }` por 90 dias (`ce_guest_info`)
- **checkout_draft**: estado do formulário persiste em `checkout_draft:{store_slug}`
- **CPF**: opcional — só valida se preenchido
- **Auth JWT**: `tokenStorage.js` é a fonte de verdade; `setTokens` do tokenStorage deve ser chamado em toda autenticação para garantir sync entre storeApi e authApi
- **App.getInitialProps removido**: `_app.js` não tem mais `getInitialProps` — `/pendente`, `/erro`, `/sucesso` são páginas estáticas (○ Static). Não reintroduzir `App.getInitialProps`.
- **storeConfig**: multi-tenant via `pageProps.previewStoreConfig` (injetado pelo `preview/[slug]` com `getServerSideProps`). Na home normal, StoreContext busca config client-side.

## Arquivos-chave

| Arquivo | Responsabilidade |
|---|---|
| `src/services/storeApi.js` | API client unificado |
| `src/context/AuthContext.jsx` | Auth com cache TTL, WhatsApp OTP |
| `src/context/CartContext.jsx` | Carrinho com mutex e updates otimistas |
| `src/hooks/useGuestInfo.js` | Persistência guest 90 dias |
| `src/components/checkout/IdentificationStep.jsx` | Identificação por celular |
| `src/components/checkout/hooks/useCheckoutForm.js` | Form state completo do checkout |
| `src/utils/brazil.js` | Formatadores canônicos (CPF, telefone, CEP, estados) |
| `src/components/SplashScreen.jsx` | Intro splash 2s — shader WebGL + logo |
| `src/components/ui/ShaderBackground.jsx` | Canvas WebGL com GLSL fbm noise (usado pela SplashScreen) |
| `src/lib/getStoreConfig.js` | Fetch de config por domain/slug (usado só em preview/[slug]) |

## Contratos com server2

- `POST /api/v1/stores/{slug}/checkout/` — AllowAny, aceita `customer=null`
- `GET /api/v1/stores/{slug}/cart/` — precisa `X-Cart-Key` + `cart_key`
- `GET /api/v1/stores/orders/by-token/{token}/` — acesso pós-compra sem login
- `GET /api/v1/public/{slug}/availability/` — endpoint público sem auth

## Geocodificação

Google Maps é o provider canônico. Não reintroduzir HERE. O backend `server2`/`GeoService` decide geocode, rota, taxa de entrega e fora de área.

## Diferenças em relação ao pastita-3d

ce-saladas é a versão mais avançada. Features que ce-saladas tem e pastita-3d não:
- `IdentificationStep`, `WhatsAppOTPModal`, `SavedAddressPicker`, `FloatingWhatsApp`
- `src/utils/brazil.js` centralizado (pastita-3d usa formatadores inline)
- `CartContext` com mutex e syncCartState
- `AuthContext` com caching TTL e `signInWithWhatsApp`
- Splash screen com shader WebGL
