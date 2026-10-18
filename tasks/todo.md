# Tasks: promo codes on /shop (NEWDAY10 for New Day Cleveland)

## Goal (user, 2026-10-18)
QR → themagnetparlor.com/shop?code=NEWDAY10 → 10% off the package, never the
shipping. Charged amount must be exactly right. Server is the only authority.

## Design
- Math lives in lib/pricing.ts (pure, shared): shippedQuote(pkg, percentOff)
  → { subtotalCents, discountCents, shippingCents, totalCents }.
  discount = round(subtotal × pct / 100), clamped so total ≥ 50¢.
  shippedTotalCents(pkg) = shippedQuote(pkg, 0).totalCents (unchanged values).
- Lookup lives in lib/promo.ts (server only): lookupPromo(raw) → trim +
  uppercase → row in promo_codes with active = 1 → { code, percentOff } | null.
- The PaymentIntent is the record of what was charged: create-payment-intent
  writes promoCode / promoPercent / discountCents into its metadata. The
  orders POST reads the promo back FROM STRIPE (not from the client) and
  checks intent.amount against shippedQuote(pkg, metadata percent). So a
  code switched off between intent and order can't strand a paid customer,
  and nothing the client sends can change the amount.

## Added mid-task (user, 2026-10-18)
- expiresAt (NEWDAY10: 90 days out → through 2027-01-16 ET), maxRedemptions
  (NEWDAY10: 250) + redemptionCount, all checked server-side; count bumps only
  on a saved PAID order (same transaction as the insert); dashboard shows
  remaining + expiry.

## A. Code definition
- [x] lib/db.ts: promo_codes (code TEXT PK, percentOff INTEGER, active
      INTEGER); seed INSERT OR IGNORE NEWDAY10 = 10, active
- [x] lib/promo.ts: normalize (trim, uppercase), lookupPromo

## B. Server-side discount
- [x] lib/pricing.ts: shippedQuote + STRIPE_MIN_CHARGE_CENTS
- [x] create-payment-intent: shipped only → lookupPromo(body.promoCode) →
      amount = shippedQuote().totalCents; metadata carries promo. Market
      intents ignore any code. Unknown/inactive → full price, no error.
- [x] /api/orders (shipped): percent from intent.metadata; expected =
      shippedQuote(pkg, pct).totalCents; also require metadata.package = pkg
- [x] GET /api/promo?code= → { code, percentOff } or { code: null }
      (display only — never trusted for money)

## C. /shop UI
- [x] On load read ?code= → /api/promo → apply if valid (silent otherwise)
- [x] Small "Promo code" field + Apply at the review step
- [x] Totals (package, review, payment card) from the same shippedQuote:
      subtotal, "NEWDAY10 (10% off) −$1.20", shipping, total
- [x] Intent request sends promoCode (server re-derives everything)

## D. Record it
- [x] lib/db.ts: orders.promoCode TEXT, orders.discountAmount REAL (dollars,
      like shippingRate/tipAmount)
- [x] /api/orders stores them (from Stripe metadata)
- [x] dashboard online card: "NEWDAY10 −$1.20" line

## Verify (local, fake Stripe key + tracer on api.stripe.com)
- [x] npm run build passes
- [x] 3-pack + NEWDAY10 → intent amount 1779; 9-pack → 2949
- [x] "newday10 " → same; no code / bogus → 1899 / 3199
- [x] client-sent amount/discount fields ignored
- [x] market intent with code → 1200 (unaffected); wedding untouched
- [x] orders POST: metadata promo → accepted + stored; mismatched amount → 402
- [x] /shop?code=NEWDAY10 in the browser shows the breakdown
- [x] clean rebuild afterwards (no fake key left in .next)

## Review (45/45 checks, local server + fake Stripe that records every call)
- Intents: 3-pack NEWDAY10 1779, 9-pack 2949, "newday10 " 1779; none/bogus/
  expired/inactive/used-up/non-string code → 1899 (3199 for 9); client
  amount/discount fields ignored; 100% test code → 699 (shipping kept, ≥ 50¢);
  market intent + code → 1200.
- Creating intents never counted. Paid order → +1. Same intent again → 409.
  Two concurrent POSTs of one intent → one 201 + one 409, one row, +1.
- Client promo fields on a full-price order → stored nothing. 3-pack intent
  posted as 9-pack → 402. Tampered metadata → 402.
- Cap: intent made before the cap filled is still honoured at its price
  (count can end slightly over max); new intents at the cap → full price.
- Market cash + wedding orders unaffected. Stats need login (401 without).
- Browser: /shop?code=NEWDAY10 → package + review show subtotal / NEWDAY10
  (10% off) −$1.20 / shipping / $17.79 (9-pack $29.49); typed "newday10 " at
  review applies; BOGUS → $18.99, no error; payment card $17.79; the page's
  own intent request → Stripe amount=1779 with promo metadata.
- Not eyeballed: dashboard panel/card render (didn't enter the password in the
  browser); data feeding it verified via the API.
- Local DB restored from backup, 8 test upload dirs removed, clean rebuild.

## Follow-up (user, 2026-10-18): invalid-code message, review field only
- [x] Typed bad code + Apply → "That code isn’t valid." (aria-invalid); clears
      on edit; full price kept; a previously applied valid code stays applied
- [x] ?code= bad → silent: no message, field left empty (only a VALID URL
      code pre-fills the field)
- [x] Browser: ?code=BOGUSCODE → $18.99, no msg, empty field; typed BOGUS →
      msg; typed "newday10 " → msg gone, $17.79; ?code=newday10 → field
      NEWDAY10, $17.79

## Deploy
- [x] deploy.py → DEPLOY SUCCESS (4afead6); .env preserved, DASHBOARD_PASSWORD
      not rotated; pm2 online; https 200
- [x] live: /api/promo NEWDAY10 / "newday10 " / " NewDay10" → 10%; BOGUS and
      empty → null (so promo_codes table + seed exist in prod); live /shop
      bundle has the invalid-code message; /api/orders 401 without login
- [ ] NOT done: a real card purchase on prod (would charge a real card) —
      recommended before Tuesday, then refund
