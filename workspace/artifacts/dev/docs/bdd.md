# BDD Scenarios - CCP-1 "Add to Cart" button on Product Listing Page

One scenario per acceptance criterion (spec.json `acceptance_criteria`, 1-based index).
Format adapted to UI/API: UI steps use the rendered component, API steps use the HTTP contract in design.json.

```
Scenario: AC-1 Add to Cart button visible on every product card
Given the product catalogue contains in-stock and out-of-stock products
When the ProductList page is rendered
Then every ProductCard contains exactly one AddToCartButton
And in-stock cards show the label "Add to Cart"
```

```
Scenario: AC-2 Clicking the button adds the item to the cart
Given an in-stock product "p-1001" and a cart that does not contain it
When the user clicks "Add to Cart" on that product
Then the addToCart thunk validates productId (^[A-Za-z0-9_-]{1,64}$) and quantity (integer 1..99, default 1)
And a guest user's item is merged into localStorage key "guest_cart"
And a logged-in user's item is sent with POST /api/cart/add { productId, quantity } and the response is { items, count } with status 200
```

```
Scenario: AC-3 A visual indicator is shown after adding
Given the user clicks "Add to Cart" on an in-stock product and the add succeeds
When the addToCart thunk is fulfilled
Then a toast "Item added to cart!" is displayed
And the button label changes to "Added ✓" for about 2 seconds, then returns to "Add to Cart"
And a polite aria-live region announces "Item added to cart!"
```

```
Scenario: AC-4 Header cart counter updates in real time
Given the header CartIcon shows a count of N
When an item is added successfully (quantity 1)
Then the CartIcon badge shows N + 1 immediately, without a page reload
And on page load the count is hydrated from the guest cart in localStorage (hydrateGuestCart)
```

```
Scenario: AC-5 Out-of-stock product has a disabled "Out of Stock" button
Given a product with inStock = false (or POST /api/cart/add responded 409)
When the product card is rendered or the 409 response is received
Then the AddToCartButton is disabled and labelled "Out of Stock"
And clicking it dispatches no addToCart action and makes no request
```

```
Scenario: AC-6 Guest cart is persisted in local storage
Given the user is not authenticated (authSlice.isAuthenticated = false)
When the user adds a product to the cart
Then cartStorage.addGuestItem writes the validated cart ({ productId, quantity } only) under "guest_cart"
And no network call to /api/cart/add is made
And corrupt, oversized or schema-invalid stored JSON is ignored and treated as an empty cart on load
```

```
Scenario: AC-7 Logged-in user's cart syncs with the backend database
Given the user is authenticated (authSlice.isAuthenticated = true)
When the user adds a product to the cart
Then cartService.addItem sends POST /api/cart/add { productId, quantity } with credentials and a 10 s timeout
And the Redux cart state is replaced with the server's authoritative { items, count } from the 200 response
And a 401 response shows "Your session has expired. Please sign in again." and other failures show the generic message "Could not add item. Please try again."
```
