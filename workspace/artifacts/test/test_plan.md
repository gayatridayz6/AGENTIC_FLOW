# Test Plan - CCP-1 "Add to Cart" button (Phase 4)

Stack: React 18 + Redux Toolkit, Jest (babel-jest, jsdom), @testing-library/react, user-event, jest-dom.
`axios` and `react-toastify` are mocked via `jest.mock`; no real network. `localStorage` is cleared in `beforeEach`.
Test files are written to import `../components`, `../store`, `../services`, `../utils`, `../data`, `../App`, so they resolve once copied to `src/__tests__/`.

## AC -> test matrix

Budget: at most 3 test definitions per AC. `it.each` counts as one definition; the number of executed cases is in brackets.

| AC | Positive | Edge | Failure |
|---|---|---|---|
| AC-1 Button on every product card | `shouldRenderAddToCartButtonOnEveryProductCardWhenCatalogLoaded` (ProductList) | `shouldRenderNoCardsOrButtonsWhenProductListIsEmpty` (ProductList) | `shouldStillRenderButtonWhenImageUrlIsUnsafeOrMissing` [2 cases] (ProductList) |
| AC-2 Click adds item to cart | `shouldAddProductToCartWhenAddToCartButtonClicked` (AddToCartButton) | `shouldIncreaseQuantityAndCountWhenSameProductAddedTwice` (cartSlice) | `shouldRejectWithInvalidInputWhenProductId...AreInvalid` [3 cases] (cartSlice) |
| AC-3 Visual indicator | `shouldShowAddedLabelAndSuccessToastWhenAddSucceeds` (AddToCartButton) | `shouldRevertToAddToCartLabelWhenAddedDurationElapses` (AddToCartButton) | `shouldShowErrorToastAndTryAgainLabelWhenAddFails` (AddToCartButton) |
| AC-4 Header counter updates live | `shouldShowZeroThenUpdateCounterWhenCartCountChanges` (Header) | `shouldIncrementHeaderCounterWhenEachProductIsAdded` (App) | `shouldLeaveHeaderCounterUnchangedWhenAddFails` (App) |
| AC-5 Out of stock disabled + label | `shouldDisableButtonAndShowOutOfStockWhenProductNotInStock` (AddToCartButton) | `shouldNotAddToCartWhenOutOfStockButtonClicked` (AddToCartButton) | `shouldSwitchToOutOfStockWhenServerRespondsWith409` (AddToCartButton) |
| AC-6 Guest cart in local storage | `shouldPersistItemInLocalStorageWhenGuestAddsItem` [3 cases: new, merge, cap 99] (cartStorage) | `shouldShowStoredGuestCartCountWhenAppLoads` (App) | `shouldReturnEmptyCartWhenStoredDataIsInvalid` [2 cases] (cartStorage) |
| AC-7 Logged-in cart syncs with backend | `shouldPostToCartAddEndpointWhenAddItemCalled` (cartService) | `shouldSyncCartFromServerAndSkipLocalStorageWhenAuthenticated` [2 cases] (cartSlice) | `shouldMapToSafeCartErrorWhenBackendFailsWithStatus` [3 cases: 401, 409, 500] (cartService) |

## Totals
- Test definitions: 21 (3 per AC, AC-1..AC-7 each covered)
- Executed cases including `it.each` expansion: 30 (target ~40, hard cap 60)

| File | Definitions | Cases |
|---|---|---|
| ProductList.test.jsx | 3 | 4 |
| AddToCartButton.test.jsx | 7 | 7 |
| Header.test.jsx | 1 | 1 |
| App.test.jsx | 3 | 3 |
| cartStorage.test.js | 2 | 5 |
| cartService.test.js | 2 | 4 |
| cartSlice.test.js | 3 | 6 |

Not written on purpose: tests for `validators.js`, `authSlice.js`, `store/index.js`, `getButtonState` and `formatPrice` in isolation. They are exercised indirectly. The heal phase will measure coverage against the 70% threshold and add targeted tests only if needed.

## Known production bugs and gaps (reported, not tested)
1. Logged-in path is unreachable from the UI: nothing dispatches `setAuthenticated`, so `isAuthenticated` stays `false` in the running app. AC-7 is only verifiable at the thunk level with a preloaded or dispatched auth state.
2. On app load only the guest cart is hydrated (`App` calls `hydrateGuestCart(loadGuestCart())`). A logged-in user's server cart is never fetched, so the header counter starts at 0 or at guest data.
3. No guest-to-server cart merge on login, and no GET cart endpoint; the backend contract for `/api/cart/add` is unspecified (see spec open_questions).
4. Guest storage ambiguity ("local storage/session"): the code uses `localStorage` only.
5. A 401 response is mapped to "Your session has expired", but the button shows the generic error toast instead. The specific message is never surfaced and no sign-in prompt appears.
6. A 409 response is always treated as OUT_OF_STOCK, which may hide other conflict causes. No toast is shown, only the button state.
7. Quantity is silently capped at 99 per product (and 100 entries), yet the UI still shows the success toast and "Added ✓".
8. The button stays disabled for 2 seconds in the "Added ✓" state, so rapid repeated adds are blocked by the UI.
9. Stock status is a static `inStock` flag from sample data. There is no live inventory check, so the out-of-stock state after a 409 is lost on reset or re-render.
10. `jest.config.js` `collectCoverageFrom` includes `src/data/products.js` and `src/index.jsx` is excluded; this is fine. The `react-scripts` dependency alongside a custom Jest config is redundant (informational).
11. Jira data inconsistencies (priority and issue type) are carried over from spec.json open_questions; they do not affect the tests.
