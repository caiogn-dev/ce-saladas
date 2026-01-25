# Pastita 3D - Customer Frontend

Next.js 15 + React 19 customer-facing e-commerce frontend for Pastita artisanal pasta shop.

## Quick Start

```bash
npm install
npm run dev
```

App runs at: `http://localhost:3000`

## Environment Variables

Create `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# Payment
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=your-mercado-pago-public-key

# Maps
NEXT_PUBLIC_HERE_API_KEY=G9H9YAXgkVi1YDXhkea18Sb5EIUAch5m1oNYoaPUZNw

# Contact
NEXT_PUBLIC_WHATSAPP_NUMBER=5563992957931
NEXT_PUBLIC_CONTACT_EMAIL=contato@pastita.com.br

# Store Location
NEXT_PUBLIC_STORE_ADDRESS=Q. 112 Sul Rua SR 1, conj. 06 lote 04 - Plano Diretor Sul
NEXT_PUBLIC_STORE_CITY=Palmas
NEXT_PUBLIC_STORE_STATE=TO
NEXT_PUBLIC_STORE_ZIP=77020-170
NEXT_PUBLIC_STORE_LAT=-10.1847
NEXT_PUBLIC_STORE_LNG=-48.3337

# Auth
NEXT_PUBLIC_AUTH_COOKIE_NAME=auth_token
```

### HERE Maps API Key

Get your API key at: https://platform.here.com/

Required services:
- HERE Vector Tile
- HERE Routing
- HERE Isoline Routing
- HERE Geocoding & Search

Free tier: 250,000 transactions/month

## Features

### Products
- **Product catalog** with categories and search
- **Product types**: Rondelli (Clássicos/Gourmet), Molhos, Carnes
- **Combos**: Bundle deals with discounts
- **Favorites/Wishlist** system

### Shopping Cart
- **Separate sections** for products and combos
- **Real-time sync** with backend
- **Quantity controls** with optimistic updates

### Checkout
- **Payment methods**: PIX, Credit Card, Cash on delivery
- **Mercado Pago** integration
- **Interactive map** for delivery address selection
- **Route visualization** and delivery time estimation
- **Order scheduling** (date/time selection)
- **Coupon validation**
- **Delivery fee calculation** with zone-based pricing

### Post-Purchase
- **WhatsApp confirmation** for orders
- **Order tracking** and history
- **User profile** management

## Tech Stack

- **Framework**: Next.js 15 + React 19
- **Styling**: CSS Variables + Tailwind CSS
- **Data Fetching**: SWR + Axios
- **Maps**: HERE Maps JavaScript API
- **Payments**: Mercado Pago SDK
- **State**: React Context (Auth, Cart, Wishlist)

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # Base UI components (Button, Input, etc.)
│   ├── CartSidebar  # Shopping cart with products + combos
│   ├── ComboCard    # Combo display component
│   └── ...
├── context/         # React Context providers
│   ├── AuthContext  # Authentication state
│   ├── CartContext  # Cart with products + combos support
│   └── WishlistContext
├── pages/           # Next.js pages
│   ├── Cardapio    # Product catalog
│   ├── CheckoutPage # Checkout flow
│   └── Payment*    # Payment result pages
├── services/        # API services
│   ├── api.js      # Base API client
│   ├── pastitaApi.js # Pastita-specific endpoints
│   └── here*.js    # HERE Maps services
└── styles/         # CSS files
```

## API Endpoints

The frontend connects to these backend APIs:

### Pastita API (`/api/v1/pastita/`)
- `GET /catalogo/` - Full product catalog
- `GET /rondellis/` - Rondelli pastas
- `GET /molhos/` - Sauces
- `GET /carnes/` - Meats
- `GET /combos/` - Combo bundles
- `GET /carrinho/` - User's cart
- `POST /carrinho/adicionar_produto/` - Add product
- `POST /carrinho/adicionar_combo/` - Add combo
- `POST /checkout/` - Create payment
- `GET /pedidos/` - User's orders

### Legacy API (`/api/v1/`)
- `/products/` - Products (fallback)
- `/cart/` - Cart operations (fallback)
- `/checkout/` - Checkout (fallback)

## Scripts

```bash
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

## Documentation

See `/docs` folder in the project root:
- [Technical Evaluation](../docs/TECHNICAL_EVALUATION.md)
- [HERE Maps Integration](../docs/HERE_MAPS_INTEGRATION.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)
