# Cê Saladas (Customer Frontend) — Repository Knowledge

Next.js customer-facing storefront for the Cê Saladas e-commerce store (saladas e refeições leves). Built on top of the same multi-tenant backend API (Pastita platform) that powers pastita-3d.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.x — Pages Router |
| Styling | CSS custom properties system + Tailwind CSS v4 + CSS Modules (for scoped component styles) |
| State / Data | React Context API + SWR (not heavily used) |
| Payment | MercadoPago SDK React (`@mercadopago/sdk-react`) |
| Maps | HERE Maps API (HERE Routing + HERE Map tiles) |
| HTTP | Axios (two instances: `storeApi` and `authApi`) |
| Icons | Lucide React |
| Analytics | Google Analytics 4 (GA_ID: `G-F6RDSM45Q0`) |

---

## Project Structure

```
ce-saladas/
├── pages/                    # Next.js Pages Router entry points
│   ├── _app.js               # Global providers, global CSS imports
│   ├── _document.js          # HTML document customisation
│   ├── index.js              # → renders LandingPage
│   ├── cardapio.js           # → renders Cardapio
│   ├── checkout.js           # → renders CheckoutPage
│   ├── login.js              # Redirects to /cardapio (login is modal-based)
│   ├── registro.js           # → renders Register
│   ├── perfil.js             # → renders Profile
│   ├── sucesso.js            # → renders PaymentSuccess
│   ├── pendente.js           # → renders PaymentPending
│   ├── erro.js               # → renders PaymentError
│   └── 404.js                # Not found
│
├── src/
│   ├── index.css             # Global CSS — design tokens (CSS vars), typography, Tailwind base
│   ├── context/
│   │   ├── ThemeContext.jsx  # Dark/light mode toggle
│   │   ├── AuthContext.jsx   # Authentication state + profile
│   │   ├── StoreContext.jsx  # Store info + full catalog
│   │   ├── CartContext.jsx   # Shopping cart (products + combos)
│   │   └── WishlistContext.jsx # User wishlist (auth-only)
│   ├── services/
│   │   ├── storeApi.js       # PRIMARY API client — all HTTP calls go here
│   │   ├── tokenStorage.js   # localStorage token persistence
│   │   ├── hereMapService.js # HERE Maps tile/geocode service
│   │   ├── hereRoutingService.js # HERE routing (distance/ETA)
│   │   └── logger.js         # Structured client-side logging
│   ├── components/
│   │   ├── Navbar.jsx / .css
│   │   ├── CartSidebar.jsx / .css  # Slide-in cart panel
│   │   ├── LoginModal.jsx / .css   # Auth modal (email+password)
│   │   ├── ProductDetailModal.jsx  # Product detail overlay
│   │   ├── ProductFilters.jsx      # Category/type filter bar
│   │   ├── ComboCard.jsx           # Combo product display
│   │   ├── MenuProductRow.jsx      # Row-style product listing
│   │   ├── StoreHead.jsx           # <Head> with store meta tags
│   │   ├── FavoriteButton.jsx
│   │   ├── StockBadge.jsx
│   │   ├── Toast.jsx / .css        # Toast notification system (ToastProvider)
│   │   ├── InteractiveMap.jsx      # HERE map embedded component
│   │   ├── ErrorBoundary.jsx
│   │   ├── checkout/               # Checkout flow components (see below)
│   │   └── ui/                     # Reusable primitives
│   ├── pages/                # Page-level React components (not routing)
│   │   ├── LandingPage.jsx / .css
│   │   ├── CheckoutPage.jsx / .css
│   │   ├── Login.jsx / Auth.css
│   │   ├── Register.jsx
│   │   ├── PaymentSuccess.jsx
│   │   ├── PaymentPending.jsx
│   │   ├── PaymentError.jsx
│   │   └── NotFound.jsx
│   ├── styles/               # Shared CSS files and CSS Modules
│   │   ├── forms.css
│   │   ├── status-pages.css
│   │   ├── Checkout.module.css
│   │   ├── CheckoutFlow.module.css
│   │   ├── CheckoutModal.module.css
│   │   └── DeliveryMap.module.css
│   └── utils/
│       ├── media.js          # buildMediaUrl() — prepends API base URL to media paths
│       └── routeCache.js     # HERE route cache utility
│
├── next.config.js
├── tailwind.config.js
├── package.json
└── AGENTS.md
```

---

## How to Run

```bash
# Install dependencies
npm install

# Development server (localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

### Required Environment Variables

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://backend.pastita.com.br/api/v1` |
| `NEXT_PUBLIC_STORE_SLUG` | Store identifier (fallback) | `ce-saladas` |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | MercadoPago public key | `APP_USR-xxx` |
| `NEXT_PUBLIC_HERE_API_KEY` | HERE Maps API key | `xxx` |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL (optional) | `wss://backend.pastita.com.br/ws` |

The `next.config.js` resolves `NEXT_PUBLIC_API_URL` from `NEXT_PUBLIC_API_URL`, `API_BASE_URL`, or `API_URL` (in that priority order), so any of those env var names will work.

The default fallback (when no env var is set) is `https://backend.pastita.com.br/api/v1`.

---

## Context Providers

Providers are nested in `pages/_app.js` in this exact order (outermost first):

```
ThemeProvider
  AuthProvider
    StoreProvider
      StoreHead            ← reads store metadata from StoreContext
      ToastProvider
        WishlistProvider
          CartProvider     ← can call useToast() since ToastProvider is above it
            CartSidebar    ← always-mounted slide-in panel
            <Page />
```

### ThemeContext (`src/context/ThemeContext.jsx`)

Manages light/dark mode. `localStorage` key: `ce-saladas-theme`. On mount: reads stored preference, falls back to `prefers-color-scheme` system query. Applies `dark` class to `<html>` via `useEffect`. Uses `useState` lazy initialiser — safe for SSR (returns `'light'` on server).

Exported hook: `useTheme()` → `{ theme, toggleTheme }`

### AuthContext (`src/context/AuthContext.jsx`)

Manages user authentication state. Uses `storeApi.getProfile()` (calls `GET /users/profile/`) on mount to bootstrap auth state. Caches profile for 5 minutes in module-level variables (not Redux/state — module scope).

Exported hook: `useAuth()` → `{ user, profile, loading, isAuthenticated, signIn, signOut, updateProfile, fetchProfile }`

Key behaviour:
- `signIn(email, password)` calls `storeApi.loginUser()`, then fetches profile.
- `signOut()` calls `storeApi.logoutUser()`, clears cache and state.
- 401 on `/users/profile/` silently clears auth state (expected for guests).
- In-flight deduplication: only one profile fetch runs at a time via `profileFetchPromise`.

### StoreContext (`src/context/StoreContext.jsx`)

Fetches and caches the full store catalog from `GET /api/v1/stores/ce-saladas/catalog/`. Cache TTL is 10 minutes.

Exported hook: `useStore()` → `{ store, categories, products, productsByCategory, combos, featuredProducts, productTypes, isLoading, error, getProductsByCategory, getProductsByType, getProductById, getComboById, searchProducts, refreshCatalog }`

Also applies store branding: when `store.primary_color` and `store.secondary_color` are set in the API response, they are written to CSS custom properties `--primary-color` and `--secondary-color` on `document.documentElement`.

Note: The context also exposes legacy Pastita-style groupings (`molhos`, `carnes`, `rondellis`) from StoreContext — these may not be populated for Cê Saladas since the catalog has different product types.

### CartContext (`src/context/CartContext.jsx`)

Manages the cart using the backend cart API (`/api/v1/stores/ce-saladas/cart/`). Supports both regular products and combos as separate arrays.

Exported hook: `useCart()` → `{ cart, combos, cartCount, cartTotal, hasItems, isCartOpen, isLoading, addToCart, removeFromCart, updateQuantity, addComboToCart, removeComboFromCart, updateComboQuantity, clearCart, openCart, closeCart, toggleCart, fetchCart }`

Key behaviours:
- **Optimistic updates**: UI updates immediately; reverts on API error. Errors shown via `useToast()` (not `alert()`).
- **Guest cart**: Works for unauthenticated users. A `guest_cart_key` is generated and stored in `localStorage`. Every request includes it as `X-Cart-Key` header, `cart_key` query param, and `cart_key` body field.
- Cart items use `cart_item_id` (backend ID) for updates/deletes. Temp IDs (`temp_xxx`) are used during optimistic updates and skip the API call.

### WishlistContext (`src/context/WishlistContext.jsx`)

Auth-only wishlist. Fetches from `GET /api/v1/stores/ce-saladas/wishlist/`. Silently clears if not authenticated.

Exported hook: `useWishlist()` → `{ wishlist, loading, toggleFavorite, addToWishlist, removeFromWishlist, isFavorited, wishlistCount, refreshWishlist }`

---

## Services

### `src/services/storeApi.js` — Primary API Client

This is the single source of truth for all HTTP communication. Do not use raw `axios` directly; call functions exported from this module.

Two axios instances:

| Instance | Base URL | Purpose |
|---|---|---|
| `storeApi` | `${API_ROOT}/stores/ce-saladas` | All store-specific endpoints (catalog, cart, checkout, etc.) |
| `authApi` | `${API_ROOT}` | Auth and user profile endpoints |

The `STORE_SLUG` is hardcoded to `'ce-saladas'` (line 87). There is also a `getStoreSlug()` helper that can detect the slug from hostname for multi-tenant setups, but it is not used for the axios instances.

Token handling:
- Both instances read the token fresh on every request via `getAuthToken()` → `tokenStorage.getAccessToken()`.
- Tokens can be DRF Token format (plain string) or JWT (3-part dot-separated). The `buildAuthHeader()` function detects the format and returns `Token xxx` or `Bearer xxx` accordingly.
- After login, `window.dispatchEvent(new CustomEvent('auth:login'))` is fired so all API instances sync their headers immediately.

Guest cart key:
- `attachGuestCartKey(config)` injects `X-Cart-Key` header and `cart_key` into query params and request body for every `storeApi` request.

CSRF:
- CSRF token is read from the `csrftoken` cookie and attached as `X-CSRFToken` header on non-GET requests.
- `fetchCsrfToken()` can be called to pre-fetch the CSRF token from `GET /csrf/`.

Key exported functions (grouped):

```javascript
// Store
getStoreInfo()                             // GET /
getCatalog()                               // GET /catalog/

// Cart
getCart()                                  // GET /cart/
addToCart(productId, qty, options, notes)  // POST /cart/add/
addComboToCart(comboId, qty, customizations, notes) // POST /cart/add/
updateCartItem(itemId, qty)                // PATCH /cart/item/{id}/
removeCartItem(itemId)                     // DELETE /cart/item/{id}/
clearCart()                                // DELETE /cart/clear/

// Checkout
checkout(checkoutData)                     // POST /checkout/
calculateDeliveryFee(distanceKm, zipCode)  // GET /delivery-fee/
validateCoupon(code, subtotal)             // POST /validate-coupon/

// Delivery / Maps
calculateRoute(destLat, destLng)           // GET /route/
validateDeliveryAddress(lat, lng)          // POST /validate-delivery/
validateDeliveryByAddress(address)         // POST /validate-delivery/
getDeliveryZones(timeRanges)              // GET /delivery-zones/
autosuggestAddress(query, limit)          // GET /autosuggest/
geocodeAddress(address)                   // GET /stores/maps/geocode/  (global)
reverseGeocode(lat, lng)                  // GET /stores/maps/reverse-geocode/ (global)

// Orders
getOrderByToken(accessToken)              // GET /stores/orders/by-token/{token}/ (public)
getOrderStatus(orderIdOrNumber, token)    // GET /stores/orders/{id}/payment-status/
getUserOrders()                           // GET /stores/orders/

// Auth
registerUser(data)                        // POST /auth/register/
loginUser(email, password)                // POST /auth/login/
logoutUser()                              // POST /auth/logout/
getProfile()                              // GET /users/profile/
updateProfile(data)                       // PATCH /users/profile/

// Wishlist
getWishlist()                             // GET /wishlist/
toggleWishlist(productId)                 // POST /wishlist/toggle/
addToWishlist(productId)                  // POST /wishlist/add/
removeFromWishlist(productId)             // POST /wishlist/remove/

// WebSocket
createOrderWebSocket(orderId, onMessage, onError)
createStoreOrdersWebSocket(onMessage, onError)
```

### `src/services/tokenStorage.js`

Thin wrapper around `localStorage`. Single source of truth for auth tokens.

| Key | Value |
|---|---|
| `access_token` | DRF Token or JWT access token |
| `ce_saladas_refresh_token` | JWT refresh token (optional) |
| `ce_saladas_user` | Serialised user object |

Exported: `setTokens(access, refresh)`, `getAccessToken()`, `getRefreshToken()`, `clearTokens()`, `setUser(user)`, `getUser()`.

### `src/services/logger.js`

Structured client-side logger. Use `logger.error()`, `logger.info()`, `logger.apiError()` instead of `console.log`.

---

## CSS Architecture

### Design Token System (`src/index.css`)

All visual values are CSS custom properties defined in `:root`. The palette is organised around natural/organic colours matching the Cê Saladas brand ("Minimalismo Orgânico"):

Colour palettes:
- `--clr-leaf-*` (50–900) — Green palette (primary brand colour, `--clr-leaf-500` = `#649e20`)
- `--clr-terra-*` (50–700) — Terracotta/orange palette (accent colour, `--clr-terra-400` = `#de6b36`)
- `--clr-sand-*` (50–500) — Warm beige (background tones, `--clr-sand-50` = `#fdfbf7`)
- `--clr-stone-*` (50–900) — Neutral grey-brown (text, borders, `--clr-stone-800` = `#36332f`)
- Plus: `--clr-moss-*`, `--clr-amber-*`, `--clr-clay-*` (supporting accents)

Semantic tokens (what components should use):

```css
--color-bg              /* main background */
--color-bg-card         /* card/surface background */
--color-bg-muted        /* subtle background */
--color-text-base       /* primary text */
--color-text-muted      /* secondary text */
--color-text-hint       /* placeholder/hint */
--color-text-inverse    /* text on dark bg */
--color-border          /* default border */
--color-border-focus    /* focused element border */
--color-primary         /* primary action (leaf green) */
--color-primary-hover
--color-primary-light
--color-accent          /* accent (terracotta) */
--color-accent-hover
--color-accent-fg       /* text on accent bg */
```

Typography tokens: `--font-display` (Merriweather serif), `--font-body` (Montserrat sans), type scale `--text-xs` through `--text-3xl`.

Spacing: `--space-1` through `--space-24` (0.25rem steps).

Shape: `--o-radius-sm` through `--o-radius-full`.

Shadows: `--o-shadow-xs` through `--o-shadow-xl`, `--o-shadow-accent`.

Animation easings: `--ease-organic`, `--ease-spring`, `--ease-out`; durations `--dur-fast/base/slow`.

### Dark Mode

Implemented via `ThemeContext`. The `ThemeProvider` adds `class="dark"` and `data-theme="dark"` to `<html>`. CSS components define dark-mode overrides using `[data-theme="dark"]` selectors.

Stored in `localStorage` key `ce-saladas-theme`. On first visit, respects `prefers-color-scheme`.

### CSS File Conventions

| Pattern | Usage |
|---|---|
| `ComponentName.css` | Global scope styles, imported once in `_app.js` |
| `ComponentName.module.css` | CSS Modules (scoped), imported in component file |
| `src/styles/*.css` | Shared non-component styles (forms, status pages, checkout layouts) |

All global CSS is imported at the top of `pages/_app.js`. CSS Modules are imported directly into their component.

---

## Checkout Flow

The checkout is a multi-step flow built around `CheckoutPage` and sub-components in `src/components/checkout/`.

### Step Structure

```
CheckoutPage
├── (Step 1) OrderSummary          — Cart review + shipping method
│   ├── ShippingMethodSelector     — Delivery vs Pickup toggle
│   ├── DeliveryMap / DeliveryMapSimple  — Map showing delivery zone
│   ├── CouponInput                — Coupon code field (via useCoupon hook)
│   └── LocationModal              — GPS-based address capture
│
├── (Step 2) PaymentStep           — Customer data + payment
│   ├── CustomerForm               — Name, email, phone, CPF fields
│   ├── PaymentMethodSelector      — PIX / Card / Cash options
│   ├── SchedulingSection          — Optional delivery scheduling
│   └── CardPayment (MercadoPago)  — Credit/debit card form
│
└── (Step 3) OrderConfirmation     — Post-checkout success summary
```

### Key Checkout Hooks

`useCheckoutForm` (`src/components/checkout/hooks/useCheckoutForm.js`):
- Manages all form fields with validation.
- Loads user profile data from `AuthContext` on mount to pre-fill fields.
- Persists draft to `localStorage` (key: `checkout_draft:ce-saladas`) with version guard (`CHECKOUT_DRAFT_VERSION = 1`).
- `buildCheckoutPayload()` assembles the final payload for `storeApi.checkout()`.
- `buildProfileUpdatePayload()` prepares profile fields to save back (only empty profile fields are updated, never overwrites existing).
- When `shippingMethod === 'pickup'`, swaps address fields to the store address (`STORE_ADDRESS` from `checkout/utils.js`).
- Two-step identification: user must confirm email + phone before delivery/payment fields unlock (`isIdentificationComplete`).

`useDelivery` (`src/components/checkout/hooks/useDelivery.js`):
- Manages delivery method state, fee calculation, and zone validation.

`useCoupon` (`src/components/checkout/hooks/useCoupon.js`):
- Validates coupon codes via `storeApi.validateCoupon()`.

`useGeolocation` (`src/components/checkout/hooks/useGeolocation.js`):
- Browser geolocation API wrapper, produces address via reverse geocode.

### Checkout Payload Structure

```javascript
{
  customer_name: "Full Name",
  customer_email: "email@example.com",      // Real email — user must enter it
  customer_phone: "11999999999",            // digits only
  cpf: "12345678900",                       // digits only, optional
  shipping_address: "Rua X, 123",
  shipping_city: "Cidade",
  shipping_state: "UF",
  shipping_zip_code: "00000000",
  delivery_address: {
    street: "Rua X",
    number: "123",
    complement: "Apto 1",
    neighborhood: "Bairro",
    city: "Cidade",
    state: "UF",
    zip_code: "00000000"
  },
  scheduled_date: "2026-03-20",             // null if no scheduling
  scheduled_time_slot: "12:00-13:00"        // null if no scheduling
}
```

Note: Unlike pastita-3d, Cê Saladas does NOT auto-generate the email from the phone number. The user must provide a real email address.

---

## Authentication Flow

1. User opens `LoginModal` (accessible from Navbar or during Checkout).
2. `signIn(email, password)` calls `POST /auth/login/`.
3. On success, token (DRF Token or JWT) is saved via `tokenStorage.setTokens()`.
4. `window.dispatchEvent('auth:login')` fires — `storeApi` picks it up and refreshes headers.
5. Profile is fetched immediately via `GET /users/profile/`.
6. `WishlistContext` detects `isAuthenticated` change and loads wishlist.

Registration goes to `POST /auth/register/`. The `/registro` page renders the Register component.

The `/login` Next.js page redirects to `/cardapio` — login happens in a modal, not a dedicated page.

---

## Pages and Routing

| Route | Component | Purpose |
|---|---|---|
| `/` | `LandingPage` | Hero, features, store intro |
| `/cardapio` | `Cardapio` | Product catalog with filters |
| `/checkout` | `CheckoutPage` | Full checkout flow |
| `/sucesso?token=xxx` | `PaymentSuccess` | Order confirmed |
| `/pendente?token=xxx` | `PaymentPending` | Awaiting PIX payment |
| `/erro?token=xxx` | `PaymentError` | Payment failed |
| `/perfil` | `Profile` | User account page (auth required) |
| `/registro` | `Register` | New user registration |
| `/login` | (redirect) | Redirects to `/cardapio` |
| `/404` | `NotFound` | 404 page |

IMPORTANT: There are two directories named `pages/`. The `pages/` at root is Next.js routing (thin wrappers). `src/pages/` contains the actual React page components. The routing files just import and re-export.

### Payment Status Pages

All three status pages (`sucesso`, `pendente`, `erro`) accept a `?token=xxx` query param. They call `getOrderByToken(token)` (public endpoint, no auth required) to load order details.

---

## How Cart Works

1. On mount, `CartProvider` calls `storeApi.getCart()`.
2. Items are normalised via `normalizeCartItem()` and `normalizeComboItem()`.
3. Guest users: every request sends `X-Cart-Key` header so the backend links cart to the anonymous session.
4. Authenticated users: the auth token is sent and the backend links cart to the user account.
5. `addToCart(product)` — optimistic update, then `POST /cart/add/ { product_id, quantity: 1 }`. On error, reverts.
6. `addComboToCart(combo)` — same pattern with `{ combo_id, quantity: 1 }`.
7. `updateQuantity(productId, delta)` — calculates new quantity, calls `PATCH /cart/item/{cart_item_id}/`.
8. If new quantity < 1, delegates to `removeFromCart()`.
9. Temp IDs (starting with `temp_`) skip the API call — these are from the optimistic update window.

---

## UI Components (`src/components/ui/`)

| Component | Purpose |
|---|---|
| `Button.jsx` | Primary, secondary, ghost, danger variants |
| `Card.jsx` | Standard card container |
| `Input.jsx` | Text input with label and error state |
| `Modal.jsx` | Generic modal wrapper |
| `Badge.jsx` | Status/label badges |
| `Skeleton.jsx` | Loading skeleton placeholder |
| `EmptyState.jsx` | Empty list state with icon/message |
| `OrderTimeline.jsx` | Order status timeline display |
| `PixPayment.jsx` | PIX QR code + copy code display |
| `ProductCard.jsx` | Product listing card |
| `CarouselCard.jsx` | Horizontal carousel card |
| `LoadingOverlay.jsx` | Full-screen loading overlay |
| `PageTransition.jsx` | Page transition animation wrapper |
| `ShaderBackground.jsx` | WebGL/CSS shader decorative background |

---

## Common Patterns

### Adding a New Page

1. Create the React component in `src/pages/MyPage.jsx`.
2. Create the Next.js route in `pages/my-route.js`:
   ```javascript
   import MyPage from '../src/pages/MyPage';
   export default MyPage;
   ```
3. If it needs CSS, create `src/pages/MyPage.css` and import it in `pages/_app.js`.

### Making an API Call

Always import from `src/services/storeApi.js`:
```javascript
import * as storeApi from '../services/storeApi';

// In a component or hook:
const catalog = await storeApi.getCatalog();
```

Never construct axios calls manually. If an endpoint is missing, add a new exported function to `storeApi.js`.

### Using Cart from a Component

```javascript
import { useCart } from '../context/CartContext';

const { addToCart, cartCount, openCart } = useCart();
```

### Using Auth from a Component

```javascript
import { useAuth } from '../context/AuthContext';

const { isAuthenticated, user, profile, signOut } = useAuth();
```

### Adding a New CSS Variable

Add to `:root` in `src/index.css`. Use the semantic naming convention (`--color-*`, `--space-*`, etc.), not hardcoded values in component CSS.

### Dark Mode in a Component

Use `[data-theme="dark"]` selector in component CSS:
```css
.myComponent {
  background: var(--color-bg);
  color: var(--color-text-base);
}

[data-theme="dark"] .myComponent {
  /* dark overrides if needed */
}
```

---

## Brand / Design Identity

- Name: **Cê Saladas**
- Tagline: Minimalismo Orgânico
- Primary colour: `--clr-leaf-500` (`#649e20`, fresh green)
- Accent colour: `--clr-terra-400` (`#de6b36`, terracotta/orange)
- Background: `--clr-sand-50` (`#fdfbf7`, warm cream)
- Text: `--clr-stone-800` (`#36332f`, warm dark)
- Fonts: Merriweather (headings, serif), Montserrat (body, sans-serif)

---

## Relationship to Other Projects

| Project | Role |
|---|---|
| `server` (Django) | Shared backend — all APIs |
| `pastita-3d` | Sister storefront (same architecture, different branding) |
| `pastita-dash` | Admin dashboard (not customer-facing) |

ce-saladas and pastita-3d share the same backend. Store isolation is done by `STORE_SLUG = 'ce-saladas'` in `storeApi.js`. Components ported between them must have branding adapted (colors, copy, logo).

---

## Known Quirks and Things to Be Aware Of

1. **`src/pages/` vs `pages/`**: There are two directories. `pages/` is Next.js routing. `src/pages/` contains the actual React page components. The routing files in `pages/` are thin wrappers.

2. **Email is real, not auto-generated**: Unlike pastita-3d, this storefront requires a real customer email. The `useCheckoutForm` does NOT auto-generate an email from the phone.

3. **Login is modal-only**: The `/login` route redirects to `/cardapio`. Auth happens in `LoginModal` which is accessible from the Navbar. The `Register` component at `/registro` is a proper page.

4. **Module-level caches**: `AuthContext`, `StoreContext`, and `CartContext` all use module-level variables (outside the component) for caching and deduplication of in-flight requests. This means the cache persists across React re-renders and even component unmounts within a single page session. Use `refreshCatalog()`, `fetchProfile({ force: true })`, or `fetchCart({ force: true })` to bypass.

5. **STORE_SLUG is hardcoded**: `STORE_SLUG = 'ce-saladas'` is set on line 87 of `storeApi.js`. The `getStoreSlug()` helper exists for multi-tenant detection but is not wired to the axios instances.

6. **Two CSS approaches coexist**: Most component styles are plain `.css` files (global scope, imported in `_app.js`). Checkout-specific components use CSS Modules (`.module.css`, imported directly). Do not mix them accidentally.

7. **ThemeContext SSR safety**: `ThemeProvider` uses a lazy `useState` initialiser that reads `localStorage`. This runs only on the client — on the server it returns `'light'`, avoiding hydration mismatches. The `useEffect` applies the `dark` class to `<html>` after mount.

8. **Guest cart key in all request methods**: The `attachGuestCartKey` function modifies headers, query params, AND body. If you add a new endpoint that should support guest carts, make sure it goes through the `storeApi` axios instance (not `authApi`).

9. **Checkout draft versioning**: The checkout form draft uses a `version` field (`CHECKOUT_DRAFT_VERSION = 1`). If the data shape changes, bump this version to auto-clear stale drafts.

10. **MercadoPago integration**: The `CardPayment` component from `@mercadopago/sdk-react` is used inside `PaymentStep`. It requires `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` to be set.

11. **HERE Maps**: Two services — `hereMapService.js` (tile map display via `InteractiveMap`) and `hereRoutingService.js` (route/distance calculation). Both require `NEXT_PUBLIC_HERE_API_KEY`. The backend also has HERE integration for server-side geocoding via the `/autosuggest/`, `/route/`, and `/validate-delivery/` endpoints.

12. **`outputFileTracingRoot`**: Set to `process.cwd()` in `next.config.js` to prevent Next.js from tracing files from parent directories (the monorepo root has multiple `package-lock.json` files).

13. **Legacy StoreContext fields**: `StoreContext` exports `molhos`, `carnes`, `rondellis` (filtered from products by `product_type` attribute). These were copied from the Pastita codebase. For Cê Saladas, they will likely always be empty arrays unless the catalog uses those exact `product_type` values.
