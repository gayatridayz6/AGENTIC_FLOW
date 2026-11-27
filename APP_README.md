# CCP-1 Add to Cart (React 18 + Redux Toolkit)

Layout mirrors the live project: `src/components`, `src/services`, `src/store`, `src/data`, `src/server`.

- Client API base URL: `REACT_APP_API_BASE_URL` (no secrets in the bundle). The JWT is read from the Redux `auth` slice (`setToken`).
- Guests: cart stored in `localStorage` key `guest_cart_v1` (validated on read). On login, `syncGuestCartOnLogin` merges it via `POST /api/cart/add`.
- `src/server/*` holds dependency-free handler functions (`cartRouteHandler`, `cartServerService`, `cartRepository`, in-memory). Wire them to any HTTP framework and supply `verifyToken` (JWT key from env) and `findProduct`.
- Tests (Phase 4) go in `src/__tests__`; run with `npm test` from the project root.
