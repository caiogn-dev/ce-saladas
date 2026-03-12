# CE Saladas - Customer Frontend

Next.js storefront for CE Saladas integrated with the unified `server` API.

## Quick Start

```bash
npm install
npm run dev
```

App runs at: `http://localhost:3000`

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_MEDIA_URL=http://localhost:8000
NEXT_PUBLIC_STORE_SLUG=ce-saladas

NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_HERE_API_KEY=your-here-api-key

NEXT_PUBLIC_CONTACT_EMAIL=contato@cesaladas.com.br
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
```

## API Contract

This frontend uses the unified store endpoints:

- `GET /api/v1/stores/{store_slug}/`
- `GET /api/v1/stores/{store_slug}/catalog/`
- `GET /api/v1/stores/{store_slug}/cart/`
- `POST /api/v1/stores/{store_slug}/cart/add/`
- `POST /api/v1/stores/{store_slug}/checkout/`
- `POST /api/v1/stores/{store_slug}/validate-delivery/`
- `GET /api/v1/stores/{store_slug}/delivery-zones/`

Global endpoints used by checkout and status pages:

- `GET /api/v1/stores/orders/by-token/{access_token}/`
- `GET /api/v1/stores/orders/{order_id}/payment-status/`
- `GET /api/v1/stores/maps/geocode/`
- `GET /api/v1/stores/maps/reverse-geocode/`

WebSocket endpoints:

- `/ws/orders/{order_id}/`
- `/ws/stores/{store_slug}/orders/`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Deploy Checklist (ce-saladas -> API)

Frontend envs (Vercel/host):

```env
NEXT_PUBLIC_API_URL=https://SEU_BACKEND/api/v1
NEXT_PUBLIC_MEDIA_URL=https://SEU_BACKEND
NEXT_PUBLIC_WS_URL=wss://SEU_BACKEND/ws
NEXT_PUBLIC_STORE_SLUG=ce-saladas
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=APP_USR-ou-TEST
NEXT_PUBLIC_HERE_API_KEY=sua-chave
NEXT_PUBLIC_SITE_URL=https://SEU_FRONTEND
```

Backend requirements:

- Cadastrar loja com slug `ce-saladas` no backend.
- Liberar origem do frontend em `CORS_ALLOWED_ORIGINS`.
- Adicionar frontend em `DJANGO_CSRF_TRUSTED_ORIGINS` (ou `CSRF_TRUSTED_ORIGINS`).
- Garantir que `ALLOWED_HOSTS` inclui o domínio da API.
- Validar endpoints:
  - `GET /api/v1/health/`
  - `GET /api/v1/stores/ce-saladas/`
  - `GET /api/v1/stores/ce-saladas/catalog/`
