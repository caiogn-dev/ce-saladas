# Cê Saladas (Customer Frontend) — Repository Knowledge

Next.js customer-facing storefront for Cê Saladas e-commerce (saladas e refeições leves).
Same backend as Pastita — isolated by `NEXT_PUBLIC_STORE_SLUG=ce-saladas`.

## Tech Stack
- **Framework**: Next.js 15.x (Pages Router)
- **Styling**: CSS Modules + Tailwind CSS + global CSS
- **Typography**: DM Serif Display (headings) + DM Sans (body)
- **Icons**: lucide-react
- **Payment**: MercadoPago SDK
- **Maps**: HERE Maps API

## Project Structure

```
src/
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── Modal.jsx            # Base modal
│   │   ├── Button.jsx           # Primary button
│   │   ├── Badge.jsx            # Status badges
│   │   ├── Input.jsx            # Form input
│   │   ├── CarouselCard.jsx     # Horizontal carousel
│   │   ├── ShaderBackground.jsx # WebGL animated background
│   │   └── ProductCard.jsx      # Card layout (used in featured carousel)
│   ├── MenuProductRow.jsx       # Vertical list row (iFood-style)
│   ├── SaladBuilder.jsx         # "Monte sua Salada" interactive builder
│   ├── ProductDetailModal.jsx   # Product detail modal
│   ├── StoreHead.jsx            # Dynamic SEO head from store data
│   ├── Navbar.jsx               # Top navigation
│   ├── CartSidebar.jsx          # Cart drawer
│   ├── FavoriteButton.jsx       # Wishlist toggle
│   └── checkout/                # Checkout flow components
├── context/
│   ├── AuthContext.jsx          # Authentication state
│   ├── CartContext.jsx          # Shopping cart
│   └── StoreContext.jsx         # Store info + catalog
├── pages/
│   ├── _app.js                  # Global providers, CSS imports
│   ├── cardapio.js              # Menu page
│   ├── checkout.js              # Checkout flow
│   ├── index.js                 # Landing page
│   └── perfil.js                # User profile
└── services/
    ├── storeApi.js              # Main API client (token auth, CSRF, guest cart)
    ├── tokenStorage.js          # Centralized localStorage token wrapper
    ├── auth.js                  # Auth facade: login, logout, WhatsApp OTP
    └── logger.js                # Logging utility
```

## Brand / Design System

- **Primary**: `--clr-leaf-500` (#649e20, green)
- **Accent**: `--clr-terra-400` (#de6b36, orange)
- **Background**: `--clr-sand-50` (#fdfbf7, cream)
- **Text**: `--clr-stone-800` (#36332f)
- **Border**: `--clr-stone-200`
- Border radius tokens: `--o-radius-full`, `--o-radius-2xl`, `--o-radius-xl`, `--o-radius-lg`

## Cardápio Architecture

The menu page (`src/pages/Cardapio.jsx`) uses:
- **Vertical list layout** (iFood/anotaai-inspired): `MenuProductRow` per product
- **Featured carousel** at the top: `CarouselCard` + `ProductCard`
- **Sticky category nav** with IntersectionObserver for active section detection
- **"Monte sua Salada" builder**: `SaladBuilder` component + ingredient products
- **Sections**: `destaques` (featured), `saladas`, `molhos`, `ingredientes`, `monte-sua-salada`

### Catalog section inference (`inferCatalogSection`)
Products are bucketed by `categorySlug`, `category`, `productTypeName`, and tags:
- `molho` → "molhos"
- `ingrediente`, `base`, `complemento`, `proteina` → "ingredientes"
- `combo`/`isCombo` → "monte-sua-salada"
- default → "saladas"

### "Monte sua Salada" builder
`SaladBuilder` receives `ingredients` (products from the 'ingredientes' section) and displays:
1. Base (1 required)
2. Proteínas (up to 2)
3. Complementos (up to 6)
4. Molho (1 required)

Ingredient step is inferred by `inferIngredientStep()` from product name/category.

## API Client (`src/services/storeApi.js`)

- Base URL: `/api/v1/stores/{STORE_SLUG}/` (public store API)
- Auth URL: `NEXT_PUBLIC_API_URL` + `/auth/`
- Token auth via `Authorization: Token {token}`
- CSRF token fetched on boot via `/csrf/` endpoint
- Guest cart: UUID stored in `localStorage.guest_cart_key`, sent as `X-Cart-Key` header + `cart_key` param

## Auth

- `tokenStorage.js` — localStorage wrapper (keys: `access_token`, `ce_saladas_refresh_token`, `ce_saladas_user`)
- `auth.js` — facades: `login()`, `logout()`, `register()`, `sendWhatsAppCode()`, `verifyWhatsAppCode()`
- WhatsApp OTP: user enters phone → receives code via WhatsApp → verifies → receives DRF/JWT token
- AuthContext reads profile from `/users/profile/` on mount

## Key Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_STORE_SLUG` | Store slug (`ce-saladas`) |
| `NEXT_PUBLIC_API_URL` | Backend base URL (e.g. `https://api.example.com`) |
| `NEXT_PUBLIC_MEDIA_URL` | Media files base URL |
| `NEXT_PUBLIC_HERE_API_KEY` | HERE Maps API key |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | MercadoPago public key |

## Relationship to Other Projects

| Project | Role |
|---|---|
| `server` (Django) | Shared backend — all APIs |
| `pastita-3d` | Sister storefront (same structure, different branding) |
| `pastita-dash` | Admin dashboard (not customer-facing) |

**Important**: ce-saladas and pastita-3d share the same backend. Store isolation is done via `NEXT_PUBLIC_STORE_SLUG`. Components ported between them must have branding adapted (colors, copy, logo).
