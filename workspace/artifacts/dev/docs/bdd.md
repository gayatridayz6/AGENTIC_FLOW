# BDD Scenarios - CCP-1 "Add to Cart" button on product listing

Stack: React 18 + Redux Toolkit frontend. External endpoint: POST /api/cart/add.

Scenario: AC-1 button visible on every product card
Given the product listing page is displayed with the sample catalogue
When the page renders
Then every product card shows an "Add to Cart" button (or a disabled "Out of Stock" button for unavailable products)

Scenario: AC-2 clicking the button adds the item to the cart
Given an in-stock product card with an enabled "Add to Cart" button
When the customer clicks the button
Then the addToCart thunk is dispatched with {productId, quantity: 1} and the item is added to the cart state

Scenario: AC-3 visual feedback after adding
Given the customer has clicked "Add to Cart" on an in-stock product
When the add completes successfully
Then a toast "Item added to cart!" is shown and the button shows "Added ✓" for about 2 seconds before reverting to "Add to Cart"

Scenario: AC-4 header cart counter updates immediately
Given the cart counter in the header shows N
When an item is added to the cart successfully
Then the cart icon counter updates to N + 1 without a page reload and the change is announced via aria-live

Scenario: AC-5 out-of-stock product
Given a product with inStock = false is displayed on the listing
When the card renders
Then the button is disabled, labelled exactly "Out of Stock", and clicking it dispatches nothing

Scenario: AC-6 guest cart stored locally
Given the user is a guest (auth.isAuthenticated is false)
When the guest adds an item to the cart
Then no API request is made and the cart is persisted in localStorage under the key "guest_cart"

Scenario: AC-7 logged-in cart syncs with backend
Given the user is logged in (auth.isAuthenticated is true)
When the user adds an item to the cart
Then the cart is synced with the backend database via POST /api/cart/add and the returned count is shown in the header

Scenario: AC-8 /api/cart/add integrated
Given the cartService is configured with REACT_APP_API_BASE_URL and withCredentials
When addItem(productId, quantity) is called with valid input
Then a POST /api/cart/add request with body {productId, quantity} is sent and the 200 response {items, count} is returned

Scenario: AC-9 unit tests cover UI component states
Given the AddToCartButton component
When it is rendered as in stock, out of stock, adding, added and error
Then each state shows the label and disabled attribute defined in design.json button_states (tests written by Phase 4)

Scenario: AC-10 responsive on desktop and mobile
Given the product listing and header are viewed on a mobile (<600px) and a desktop (>900px) viewport
When the page renders
Then the grid shows 1 column on mobile and 3-4 columns on desktop, buttons keep a minimum 44px touch target, and the header remains usable
