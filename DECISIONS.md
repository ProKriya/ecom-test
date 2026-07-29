## Decision: Single Worker Owns UI and API

**Context:** What problem were you solving?
The storefront and backend needed to feel like one app during local dev and deploy, not two separate services with cross-origin noise.

**Options Considered:**
- Option A: Split UI and API into separate deployments
- Option B: Serve frontend assets and JSON API from one Cloudflare Worker

**Choice:** Option B

**Why:** One origin keeps fetches simple, removes CORS friction, and matches how `wrangler dev` and deploy now work in this repo. It also makes the demo easier to run and review.

## Decision: Explicit Request Dispatch in Worker

**Context:** What problem were you solving?
The original router-based worker path was hanging in dev, so API requests needed a simpler, more predictable control flow.

**Options Considered:**
- Option A: Keep a shared router library for all routes
- Option B: Dispatch requests manually in `src/index.js`

**Choice:** Option B

**Why:** Manual dispatch makes request handling obvious, avoids router lifecycle edge cases, and keeps the worker easier to debug under Wrangler.

## Decision: In-Memory Domain State

**Context:** What problem were you solving?
The assignment and tests only needed a lightweight store, not persistence, and the repo already centered on fast local iteration.

**Options Considered:**
- Option A: Add SQLite or another database layer
- Option B: Keep carts, orders, and discounts in module-level memory

**Choice:** Option B

**Why:** In-memory state keeps the code small, testable, and easy to reset between runs (for starting out). It also matches the current business logic and avoids storage setup overhead. For production obviously a DB is needed.

## Decision: Local Session IDs for Cart and User

**Context:** What problem were you solving?
The UI needed a stable way to keep one shopper's cart separate from another without login infrastructure.

**Options Considered:**
- Option A: Hardcode a single demo cart
- Option B: Generate cart and user IDs in browser localStorage

**Choice:** Option B

**Why:** Local storage gives each browser its own session identity, supports multi-session testing, and keeps the storefront usable without auth.

## Decision: Frontend Build Served by Wrangler Assets

**Context:** What problem were you solving?
The storefront needed to ship with the worker and stay same-origin in dev and deploy.

**Options Considered:**
- Option A: Run Vite separately and proxy to the API
- Option B: Build `frontend/` into `frontend/dist` and serve it through Wrangler assets

**Choice:** Option B

**Why:** The worker can own routing, the build artifact is explicit, and the deployed shape matches local dev. Same-origin assets also keep API calls simple.

## Decision: Clear API Shape with Small Route Set

**Context:** What problem were you solving?
The app needed enough endpoints for cart, checkout, discount, and admin flows without drifting into overengineering.

**Options Considered:**
- Option A: Expose many granular endpoints for every tiny action
- Option B: Keep a compact JSON API around core ecommerce flows

**Choice:** Option B

**Why:** A compact route set is easier to document, easier to test, and easier to reason about. The current UI and integration tests only need these core flows.
