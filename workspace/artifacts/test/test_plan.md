# Test Plan - CCP-1 "Add to Cart" button (Phase 4)

## Stack (overrides the JUnit/Mockito wording in the shared test docs)
Jest 29 (jsdom, babel-jest) + @testing-library/react 14 + @testing-library/user-event 14 +
@testing-library/jest-dom 6 (loaded by `src/setupTests.js`) + a real Redux Toolkit store
(`createAppStore`). `axios` and `react-toastify` are mocked with `jest.mock` factories.
Tests were not executed in Phase 4 (deps not installed); Phase 5 runs `npm test`.

## Layout and how to run
Test files live in `workspace/artifacts/test/src/__tests__/` and use imports relative to the
repo-root `src/` layout (`../components/...`, `../store/...`). Phase 5 must copy that folder to
repo-root `src/__tests__/` before running `npm test`. Left in place, jest's default `testMatch`
would also discover them under `workspace/` where those imports do not resolve.
Coverage config (jest.config.js) excludes `src/__tests__/**`, `src/index.jsx`, `src/setupTests.js`.

## Test files
| File | Scope | ~Tests |
|---|---|---|
| validators.test.js | isValidProductId / isValidQuantity / validateCartSchema / isSafeImageUrl | 62 |
| cartStorage.test.js | localStorage load/save/clear/addGuestItem incl. corrupt, invalid, throwing storage | 35 |
| cartService.test.js | axios client config, addItem, mapError, CartError, error mapping | 27 |
| authSlice.test.js | auth reducer, selector | 11 |
| store.test.js | createAppStore, singleton, preloaded state | 5 |
| cartSlice.test.js | reducers, selectors, extraReducers, addToCart thunk (guest + logged in) | 43 |
| AddToCartButton.test.jsx | getButtonState, In stock / Out of stock / Success / Adding / Error states, fake-timer revert | 29 |
| ProductList.test.jsx | ProductList, ProductCard, formatPrice, sample data | 18 |
| Header.test.jsx | Header, CartIcon live counter | 8 |
| App.test.jsx | App smoke, guest hydration, end-to-end guest/logged-in flows | 14 |
| responsive.test.jsx | CSS breakpoints / touch targets / viewport meta, viewport-independent DOM | 17 |

## AC traceability
| AC | Positive | Edge | Failure |
|---|---|---|---|
| AC1 button on every card | ProductList "button on EVERY product card"; App "button on every product card" | empty product list; custom products; unsafe/missing image url placeholder | validators.isSafeImageUrl rejects javascript:/data: |
| AC2 click adds item | AddToCartButton "AC2/AC3/AC9 clicking adds"; cartSlice guest thunk; App guest flow | default quantity 1; double click while adding sends one request | thunk invalid input never adds |
| AC3 feedback (toast + "Added ✓") | toast.success('Item added to cart!') once; "Added ✓" label + sr-only status | fake timers: still "Added ✓" at 1000ms, reverts to "Add to Cart" after 2000ms; unmount clears timer; re-add after revert merges | error path shows "Try again" and no success toast |
| AC4 header counter | Header/CartIcon count from store, live update on dispatch; App increments per add | singular/plural sr text; aria-live/status attrs; accumulation; logged-in count from response | failed add leaves counter unchanged |
| AC5 out of stock | disabled button, label exactly "Out of Stock", class/aria; list-level counts | out-of-stock beats stale "added"; server out_of_stock status; click dispatches nothing | HTTP 409 -> out_of_stock with no error toast (component, thunk, service, App) |
| AC6 guest localStorage | key `guest_cart`, persisted JSON, merge quantities, restore on App mount, no API call | cap at 99, 100-entry limit (CART_FULL), numeric ids normalised | corrupt JSON, schema-invalid, getItem/setItem/removeItem throwing, STORAGE_FAILED |
| AC7 logged-in backend sync | POST /api/cart/add with {productId, quantity}; response items/count applied; no localStorage write | count derived from items; invalid count ignored; auth switch at runtime | 400 / 401 / 409 / 500 / network -> error state, safe generic message, no server text leaked |
| AC8 API integration + validators | cartService.addItem request/response; axios config (withCredentials, timeout, JSON header) | numeric productId; default quantity | invalid productId/quantity rejected before any request |
| AC9 UI component states | Explicit describe blocks "In stock state", "Out of stock state", "Success state" (+ Adding, Error) in AddToCartButton.test.jsx; getButtonState table | all label/disabled/aria-busy/class values | - |
| AC10 responsive | responsive.test.jsx: viewport meta, 1/2/3/4 column breakpoints (599/600/900/1200), 44px touch targets, sticky header | DOM identical at 375/768/1280px | - |

Every `it` title carries its AC number.

## Bugs / risks found (production code NOT modified)
1. LOW - `isValidProductId` accepts NaN, Infinity and -1 (String() output matches the id pattern). Test documents current behaviour (`// BUG:` in validators.test.js).
2. LOW - `formatPrice(null)` returns "$0.00" because `Number(null) === 0`. Documented in ProductList.test.jsx.
3. MEDIUM-LOW - Logged-in add with a 2xx response lacking usable `{items,count}` is treated as success ("Added ✓" + success toast) but the header counter does not change (cartSlice.test.js, `// BUG:`). Server contract should guarantee the body, or the thunk should refresh/increment.
4. LOW (observation) - On 401 the component toast shows the generic message; the "session expired" text only lives in `state.cart.error`, and `auth.isAuthenticated` is not reset, so the user stays "logged in" client-side.
5. DESIGN GAP - No guest-to-server cart merge on login and no GET cart on load: a logged-in user's header counter starts at the guest localStorage count (usually 0) after reload.
6. LOW - design.json says the toast is top-center on mobile; CSS only offsets `top` for `.Toastify__toast-container--top-right`. Test asserts the actual rule.
7. UX note - the button stays disabled ("Added ✓") for 2s, so rapid repeat adds of one product are blocked.
8. LOW - numeric product ids are sent to the API as numbers but stored as strings for guests.

## Likely first-run failure points
- Jest also discovering `workspace/artifacts/test/src/__tests__` if not copied/ignored (see Layout).
- jest-haste-map warning for duplicate package name (`shopping-cart-feature`) in `workspace/artifacts/dev/package.json`; harmless but noisy.
- Fake-timer tests (AddToCartButton "reverts ... after ~2 seconds", "added again after revert") rely on RTL `findBy*` advancing jest fake timers.
- Spying on `Storage.prototype` methods to simulate throwing localStorage in jsdom.
- Coverage threshold (70%) is computed over all `src/**/*.{js,jsx}`; expected well above, unverified until run.
