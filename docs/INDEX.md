# Docs Index

Quick map for current codebase.

## Overview

Uniblox Market is a single Wrangler project.

- Worker serves JSON API
- Worker serves static storefront assets
- State is in-memory
- Tests cover core business logic and route flow

## Runtime

- `wrangler.toml` points `main` at `src/index.js`
- `frontend/` builds into `frontend/dist`
- `run_worker_first = true` keeps API and UI on same origin
- `/health` returns API version and timestamp

## Scripts

- `npm run dev` - worker + storefront together
- `npm run deploy` - build and deploy
- `npm run ui:dev` - Vite-only storefront
- `npm run ui:build` - production frontend build
- `npm run ui:preview` - preview built frontend
- `npm test` - Vitest
- `npm run lint` - ESLint

## API Routes

### Health

- `GET /health`
- Returns `{ status, timestamp, apiVersion }`

### Cart

- `GET /api/cart/:cartId`
- Returns cart if found
- Returns empty cart shell if not found
- `POST /api/cart/:cartId/items`
- Body: `{ userId, product }`
- `DELETE /api/cart/:cartId/items/:productId`
- `DELETE /api/cart/:cartId`

### Checkout

- `POST /api/checkout/:cartId`
- Body: `{ userId, discountCode? }`
- Rejects empty cart
- Applies valid discount code if provided

### Discounts

- `POST /api/discount/apply`
- Body: `{ cartId, discountCode }`
- Validates code and returns discount math

### Orders

- `GET /api/orders/:orderId`
- `GET /api/orders/user/:userId`
- `GET /api/orders`

### Admin

- `POST /api/admin/discount/generate`
- Body: `{ percentage, type?, maxUsage?, expiresAt? }`
- `GET /api/admin/analytics`
- `GET /api/admin/stats`

## Business Rules

- Nth-order discount is triggered every 5th order
- Nth-order discount percentage is 10%
- Discount codes are tracked in memory
- Cart/order data resets on restart

## Frontend

- Main entry: `frontend/src/main.jsx`
- App: `frontend/src/app.jsx`
- API helper: `frontend/src/api.js`
- Catalog data: `frontend/src/data.js`
- Styles: `frontend/src/styles.css`

## Testing

- `tests/cart.test.js`
- `tests/order.test.js`
- `tests/discount.test.js`
- `tests/admin.test.js`
- `tests/integration.test.js`
- `tests/shared.test.js`

## Change Notes

- Empty cart checkout is blocked in UI
- Missing cart GET returns empty shell for smoother storefront load
- Worker dispatch is explicit, not router-middleware based
