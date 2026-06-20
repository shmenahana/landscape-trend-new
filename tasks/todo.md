# Tasks: SMS Consent + Online Shop

## Feature 1 — SMS Consent + Twilio (Twilio send already built in /api/notify)
- [ ] db: add `smsConsent` boolean column to orders (+ type)
- [ ] /order: required consent checkbox after phone, block Continue until checked
- [ ] /order: send smsConsent in submitOrder FormData
- [ ] /api/orders POST: parse + store smsConsent
- [ ] dashboard: notify alert copy → "SMS failed — notify customer manually"

## Feature 2 — Online Shop /shop (shipped orders)
- [ ] db: add orderType, lastName, email, shippingAddress(JSON), shippingRate, trackingNumber columns (+ types)
- [ ] pricing: SHIPPING_CENTS=699, shippedTotalCents()
- [ ] /api/create-payment-intent: support shipping (package + $6.99)
- [ ] /api/orders POST: branch on orderType=shipped (validate name/email/address, amount incl shipping, phone optional)
- [ ] app/shop/page.tsx: 6-step flow (details → package → crop → review → Stripe → confirm)
- [ ] /api/ship POST: set trackingNumber + status=shipped, SendGrid email to customer
- [ ] dashboard: separate "Online Orders" section, Mark Shipped + tracking input, exclude shipped from market queue/print
- [ ] homepage: hero/section link + nav "Order Online"
- [ ] .env.example unchanged (creds already present)

## Verify & Deploy
- [ ] npm run build passes
- [ ] commit on branch, deploy to VPS, preserve .env (do NOT rotate dashboard password)

## Review
- SMS: Twilio send was already built in /api/notify (exact message). Added required
  consent checkbox on /order (blocks Continue), `smsConsent` boolean column + storage,
  and updated operator alert to "SMS failed — notify customer manually".
- Shop: new /shop 6-step flow (details w/ US-state dropdown → package+shipping → square
  crop → review → Stripe-only → confirm). New DB columns orderType/lastName/email/
  shippingAddress(JSON)/shippingRate/trackingNumber. create-payment-intent + /api/orders
  POST validate package + $6.99 shipping for shipped orders; phone optional, name/email/
  address required.
- Dashboard: separate "Online Orders" section (full name, email, address, package, paid
  badge, photos) with Mark Shipped + tracking input → /api/ship updates status + emails
  customer via SendGrid (skips gracefully if unconfigured). Shipped orders excluded from
  market queue + print sheet.
- Home: "Order Online — We Ship Nationwide" hero CTA + nav link (desktop + mobile).
- `npm run build` passes (13 routes incl. /shop, /api/ship). DB migrations are additive
  ALTER TABLEs — preserve existing prod data.
</content>
</invoke>
