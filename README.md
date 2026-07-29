# Uniblox Market

Small ecommerce demo: Cloudflare Worker API + Preact storefront, both served from same Wrangler project.

## What It Does

- Browse catalog and add items to cart
- Place checkout with optional discount code
- Auto-issue nth-order discounts
- Generate admin discount codes
- View admin analytics for orders, revenue, and discounts

## Stack

- Cloudflare Workers via Wrangler
- Preact + Vite frontend
- In-memory storage for carts, orders, and discounts
- Vitest for unit and integration tests

## Scripts

- `npm run dev` - run worker and UI together through Wrangler
- `npm run deploy` - build frontend and deploy worker + assets
- `npm run ui:dev` - run Vite storefront only
- `npm run ui:build` - build storefront into `frontend/dist`
- `npm run ui:preview` - preview built storefront
- `npm test` - run Vitest suite
- `npm run lint` - lint `src/` and `frontend/src/`

## Local Dev

1. Install deps.
2. Run `npm run dev`.
3. Open Wrangler URL, usually `http://127.0.0.1:8787`.

Note:
- Wrangler v4 needs Node.js 22+
- Worker + asset shell share same origin
- State is in-memory, so restart clears carts/orders/discounts

## API Summary

Full route reference in [docs/INDEX.md](docs/INDEX.md).

Core routes:

- `GET /health`
- `GET /api/cart/:cartId`
- `POST /api/cart/:cartId/items`
- `DELETE /api/cart/:cartId/items/:productId`
- `DELETE /api/cart/:cartId`
- `POST /api/checkout/:cartId`
- `POST /api/discount/apply`
- `GET /api/orders/:orderId`
- `GET /api/orders/user/:userId`
- `GET /api/orders`
- `POST /api/admin/discount/generate`
- `GET /api/admin/analytics`
- `GET /api/admin/stats`

## Repo Layout

- `src/` - Worker API and business logic
- `frontend/` - Preact storefront
- `tests/` - unit and integration coverage
- `docs/` - docs index and notes
- `wrangler.toml` - Worker config

## Notes

- Nth-order discount constants live in `src/shared/constants.js`
- Cart endpoint returns empty shell when cart missing
- Checkout blocks empty cart in UI
- Asset build output goes to `frontend/dist`
