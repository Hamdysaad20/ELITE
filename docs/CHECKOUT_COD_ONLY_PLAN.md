# Checkout (COD-only) Plan — December 12, 2025

Status: **Plan only (no code yet)**

Goal
- Make checkout fully production-usable with **Cash on Delivery (COD) only**.
- Seamlessly **use saved addresses** (import/list/select default).
- Allow **adding & saving a new address during checkout** (no dead-ends).
- **Prefill customer info** from session/profile where available.
- Cover corner cases: auth, empty cart, address failures, retries, race conditions.

Non-goals
- Do not build online payments, card forms, wallet integrations.
- Do not redesign unrelated pages or add new flows beyond what’s needed.

---

## 0) Current system snapshot (as-is)

### Client checkout page
- Page: `src/app/order/page.tsx`
  - This is the effective “checkout” page today.
  - Current payload hardcodes `paymentMethod: "ONLINE"`.
  - Uses `useCart()` and `useAddresses()`.
  - Delivery address section:
    - If `addresses.length === 0`, it shows an empty message but **does not provide a way to add an address**.
    - If addresses exist, it renders `AddressManager` in selection mode.

### Address subsystem
- Hook: `src/hooks/useAddresses.ts`
  - Calls `/api/addresses` with cookies (`credentials: include`).
- APIs:
  - `src/app/api/addresses/route.ts` (GET/POST)
  - `src/app/api/addresses/[id]/route.ts` (GET/PATCH/DELETE)
  - Auth: uses `getServerSession(getAuthOptions())` → returns **401** if not signed in.
  - Address creation: if first address, it becomes default.

### Order creation
- API: `src/app/api/orders/route.ts`
  - Validates `paymentMethod` against enum `PaymentMethod`.
  - Validates `DELIVERY` requires `addressId`.
  - Verifies `addressId` ownership.
  - Clears cart after order.

### Cart
- Hook: `src/hooks/useCart.ts`
  - Only fetches cart when `status === "authenticated"`.
  - Add/remove/update are blocked when not authenticated.
- APIs:
  - `src/app/api/cart/route.ts` uses `getAuthUser(request)` (JWT cookie) and a fallback `getUserId(request)`.
  - `src/app/api/cart/[itemId]/route.ts` currently reads `x-user-id` header directly and falls back to `demo-user`.

### Important note (auth header propagation)
- Middleware: `middleware.ts`
  - Protects `/api/cart` and `/api/orders`.
  - It sets `x-user-id` on the **response**, not the request.
  - So server handlers reading `request.headers.get("x-user-id")` will not receive a value unless the client explicitly sends it.

---

## 1) Desired checkout behavior (COD-only)

User story
1) User goes to Checkout (`/order`).
2) User reviews cart items.
3) User selects Pickup or Delivery.
4) If Delivery:
   - User selects a saved address OR adds a new one.
   - Default address is auto-selected.
5) User confirms “Cash on Delivery”.
6) User places order.
7) Success screen shows order number; cart is cleared.

### Payment method rules
- Only supported option: `PaymentMethod.CASH`.
- UI should not expose other payment methods.
- API should receive `paymentMethod: CASH` from checkout.

Pseudo-code (client payload)
```ts
payload = {
  paymentMethod: "CASH",
  orderType: orderType, // "PICKUP" | "DELIVERY"
  addressId: orderType === "DELIVERY" ? selectedAddress.id : undefined,
  notes,
  odoo: {
    partner: { name, email, phone },
    sale: { enable: saleEnabled, autoConfirm },
    pos: { enable: posEnabled, posConfigName },
  },
}
POST /api/orders payload
```

---

## 2) Address selection + add/save during checkout

### Problem to fix
- `AddressManager` hides “Add New Address” whenever `onSelectAddress` is passed.
- Checkout passes `onSelectAddress`, therefore the user cannot add an address from checkout.

### Target behavior
- Checkout (Delivery) must always provide an “Add address” path.
- After creating an address:
  - it appears in the list immediately.
  - it is auto-selected for delivery.

### Implementation approach options

Option A (recommended): Extend `AddressManager` with a checkout-friendly mode
- Add a prop (example):
  - `mode?: "manage" | "select"` (default "manage")
  - `allowAddInSelectMode?: boolean` (default false)
  - `onAddressCreated?: (address: Address) => void`
- In select mode with allowAdd:
  - show the “Add New Address” button
  - keep edit/delete hidden (still fine for checkout)

Option B: Add a dedicated inline address form in checkout page
- Keep AddressManager unchanged.
- Add a minimal address form block under the delivery address section.
- On submit: call `createAddress` and then set selected address.

Recommendation: **Option A** because the address form is already implemented and styled.

Pseudo-flow
```txt
User chooses DELIVERY
  if addresses.length > 0:
    show list + radio-like selection
    show "Add New Address" CTA
  else:
    show empty-state + "Add New Address" CTA

When new address saved:
  refetch addresses
  select new address
  if first address => it becomes default automatically
```

---

## 3) Prefill user/customer info

### Data sources
- NextAuth session provides:
  - `user.name`, `user.email`, `user.image`, `user.id`.
- Address provides:
  - `phone` and delivery notes.
- DB user has optional `phone` in Prisma schema.

### Target behavior
- On checkout, prefill partner info for order sync:
  - Prefer `session.user.name` → fallback to `session.user.email` prefix.
  - Use `session.user.email`.
  - Prefer `selectedAddress.phone` for phone.

Pseudo-code
```ts
partnerName = session.user.name ?? session.user.email.split("@")[0]
partnerEmail = session.user.email
partnerPhone = selectedAddress.phone ?? "" // only if available
```

Notes
- This does not require editing the user profile; it’s only used to build order payload.

---

## 4) Authentication expectations

Given current architecture
- Cart is only usable when authenticated (`useCart` blocks unauthenticated).
- Address APIs require a session.

Therefore
- Checkout should be treated as **auth-required**.

UX behavior
- If session is not authenticated:
  - redirect to `/auth/signin?callbackUrl=/order`
  - OR show a clear sign-in required empty state with a button.

Checklist
- [ ] Decide whether `/order` should be added to `PROTECTED_ROUTES` in middleware.
- [ ] Ensure delivery address fetch failures show a friendly prompt to sign in.

---

## 5) Reliability & corner cases checklist

Cart state
- [ ] Empty cart: show empty state + browse menu.
- [ ] Cart updating (`isUpdating`): disable Place Order.
- [ ] Quantity edits while submitting: lock controls during submission.

Address state
- [ ] Delivery selected with no address: block submission with inline message.
- [ ] Default address exists: auto-select it when switching to Delivery.
- [ ] Address list fetch 401: prompt user to sign in.
- [ ] Create address fails (network/400): keep form open, show error.
- [ ] Selected address deleted/vanishes: fall back to default or require reselect.

Order submit
- [ ] API 400 (cart empty / invalid address): show error and refresh cart/addresses.
- [ ] API 401: prompt sign-in.
- [ ] API 500: retry option, keep user selections.
- [ ] Prevent double submit: disable button while submitting.

---

## 6) Known technical mismatches to address (important)

These can affect checkout correctness and should be fixed as part of making checkout production-grade.

1) `/api/cart/[itemId]` auth mismatch
- File: `src/app/api/cart/[itemId]/route.ts`
- Uses `request.headers.get("x-user-id") || "demo-user"`.
- But clients do not send `x-user-id`, and middleware currently doesn’t inject it into the request.
- Risk: updating/removing items may operate on the wrong user/cart.

Mitigation plan
- Prefer using `getAuthUser(request)` (same as `/api/cart` route) to derive userId.

2) Middleware header injection misunderstanding
- File: `middleware.ts`
- Setting headers on the response does not populate `request.headers` for the server handler.

Mitigation plan
- Either:
  - update middleware to forward headers via `NextResponse.next({ request: { headers } })`, OR
  - stop relying on request headers in APIs and use cookie/JWT-based `getAuthUser` consistently.

---

## 7) Suggested implementation order (when we start coding)

Phase 1 (must-have for COD checkout)
- [ ] Change checkout payload to `paymentMethod: CASH`.
- [ ] Adjust checkout UI text to “Cash on Delivery”.
- [ ] Enable “Add address” during checkout (no dead-ends) and auto-select newly created address.

Phase 2 (polish + correctness)
- [x] Prefill partner info from session + address phone.
- [x] Disable Place Order while cart is updating/submitting.
- [x] Add clear unauthenticated handling for `/order`.

Phase 3 (API correctness hardening)
- [x] Align `/api/cart/[itemId]` and `/api/orders/[id]` with `getAuthUser`.
- [x] Audit any other endpoints relying on `x-user-id` request header.

---

## 8) Acceptance criteria (definition of done)

COD-only
- [x] Checkout places an order with `paymentMethod = CASH`.
- [x] UI never shows card/online options.

Addresses
- [x] Delivery checkout works with existing saved addresses.
- [x] Delivery checkout works when user has **zero** addresses (can add one inline).
- [x] Newly created address can be selected immediately (auto-selected).

Prefill
- [x] Order payload includes partner name/email from session (no “Website Customer” placeholder).

Edge cases
- [x] Unauthenticated users are redirected or prompted to sign in.
- [x] Empty cart cannot place order.
- [x] Errors are shown clearly and allow retry without losing selections.
