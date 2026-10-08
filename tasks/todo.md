# Tasks: Dashboard — tabbed queues left, production right

## Problem
Left rail = market only and mostly empty; Online + Wedding orders sit ~3
screens down, below the Print Sheet Builder. Waiting online orders get missed.

## Plan (app/dashboard/page.tsx only — layout, no card/data/sheet changes)
- [x] Left rail: tab bar MARKET / ONLINE / WEDDING, each with its live active
      count, visible without clicking. Sticky at the top of the rail.
  - Market count = in print queue + awaiting cash (both need the operator);
    a gold "N cash" badge shows when anyone is waiting to pay at the table,
    so a waiting customer is visible from the other tabs too
  - Online count = to-ship, shown as a gold badge (the to-ship surfacing)
  - Wedding count = not picked up
- [x] Market tab: Awaiting Cash, queue cards, Picked Up + Archived (collapsed)
      — exactly today's rail content
- [x] Online tab: unshipped first, then Shipped (collapsed); same
      ShippedOrderCard, single column to fit the rail
- [x] Wedding tab: active, then Picked Up (collapsed), Event Settings link;
      same WeddingOrderCard
- [x] Remove the Online + Wedding sections below the sheet (no duplicates)
- [x] Refresh button moves to the tab bar (available on every tab)
- [x] Tab persisted in localStorage (read after mount, try/catch)
- [x] Sticky rail on lg+: page scrolls, rail is `sticky top-0 h-screen` and
      scrolls internally. Below lg: rail stacks above the sheet, full width.

## Must NOT change
Card components, print sheet output, pricing, crop, /shop, order data/API.

## Verify
- [x] build
- [x] Seeded orders of every kind → each tab shows the right cards + counts
- [x] Add to Sheet from Market and Online tabs fills the sheet
- [x] Download → 2550x3300 PNG
- [x] Reload keeps the tab
- [x] Rail stays in view while the sheet scrolls; narrow width usable
- [x] No Online/Wedding sections left under the sheet

## Deploy
- [x] deploy.py → DEPLOY SUCCESS; .env 12 keys, DASHBOARD_PASSWORD not rotated,
      uploads 138, pm2 both online. Live dashboard (read-only check): tabs
      "MARKET 0", "ONLINE 2 · 2 TO SHIP", "WEDDING 0" match /api/orders exactly;
      no old sections under the sheet; zero page errors.

## Results (Playwright vs local `next start`, 9 seeded orders of every type)
- Tabs: "MARKET 3 · 1 CASH", "ONLINE 2 · 2 TO SHIP", "WEDDING 1" — correct
  (market = 2 queued + 1 awaiting cash; online = 2 unshipped; wedding = 1).
- Market: cash section, queue cards, Picked Up (1) + Archived (1) collapsed.
  Online: SeedShipA, SeedShipB first, Shipped (1) collapsed; no market items.
  Wedding: active card, Picked Up (1), Event Settings link.
- No "Online Orders" / "Wedding Orders" sections left under the sheet.
- Add to Sheet from Market and Online → both on the sheet + "On this sheet".
- Download → 2550x3300 PNG. NOTE: the PNG carries no DPI metadata (no pHYs
  chunk) — canvas export never writes it; pre-existing, sheet code untouched.
- Sticky: page scrolled 738px → rail still at top 0, full height, tabs visible.
- Reload keeps the tab (Wedding → Wedding; Online → Online).
- 390px: tabs 117px each, no horizontal overflow, rail stacks above the sheet.
- Zero console/page errors. Seed rows deleted.

---

# Tasks: Validate shipping address BEFORE the Stripe PaymentIntent

## Problem
A shipped order is saved only after Stripe charges the card. If /api/orders
then rejected the address, the customer was charged with no order and no
signal. Only the browser checks matching the server prevented it.

## Done — committed 577f090, deployed on user's go
- [x] Committed the deployed /shop reorder first (f1af444)
- [x] lib/shipping.ts (new): validateShippedCustomer — the ONE copy of the
      rules (first/last name, email, street, city, US state, ZIP / ZIP+4;
      phone optional). Accepts the orders form's JSON string or an object.
- [x] /api/create-payment-intent: for shipped orders, validate → 400 BEFORE
      the Stripe key check and before any Stripe call
- [x] /api/orders: old EMAIL_RE / US_STATES / parseShippingAddress deleted;
      the backstop now calls the same shared function (messages unchanged)
- [x] /shop: ShippedPayment sends {firstName,lastName,email,shippingAddress}
      in the intent body. Unavoidable: the route can't validate data it never
      receives, and without this every live checkout would 400. No UI,
      step-order, crop, or pricing change.

## Verified (local, fake Stripe keys + an https tracer logging every
## outbound call to api.stripe.com)
- [x] build passes (and rebuilt clean afterwards — no fake key in .next)
- [x] 13 invalid shipped intent requests (no details/old client, each field
      missing, bad email/state/ZIP, non-object & malformed address,
      `shipping:true` w/o address) → 400, 0 Stripe calls each
- [x] Valid shipped (incl. ZIP+4, lowercase state) and market → exactly 1
      POST /v1/payment_intents each (502 only because the key is fake)
- [x] Real /shop in Chromium sends the trimmed details → passes → 1 Stripe call
- [x] /api/orders backstop still 400s bad shipped orders; market cash and
      wedding orders with no address → 201 (test rows/files removed)
- [x] Production after deploy: .env 12 keys, DASHBOARD_PASSWORD not rotated,
      uploads 137 (user's live test order intact), pm2 both online. Live intent
      route: no details / missing street / bad state / bad ZIP / bad email →
      400, no clientSecret. Live /shop walk → intent 200, $18.99 (1899),
      Payment Element + Pay Now shown. One unpaid test intent left (…mKBkEo).
      Paid completion NOT exercised by me (would charge a real card).

## Flagged, not fixed (out of scope)
- /api/gallery/[id]/intent creates a shipped PaymentIntent with no address
  validation at all — same charged-without-order risk for gallery orders.

---

# Tasks: /shop — prices up front, address last

## Problem
QR-code visitors from a sports store hit a full shipping-address form as step 1
of 5, before seeing a price or uploading anything.

## Plan (app/shop/page.tsx only)
- [x] Landing: real 3- and 9-magnet prices from lib/pricing (priceDollars),
      "Flat $X shipping anywhere in the US" from SHIPPING_CENTS, one short line,
      Start button. No hardcoded money anywhere on the page (package tiles had
      $12/$25 literals, page had SHIPPING = 6.99 — both now from lib/pricing).
- [x] New order: package (1/5) → photos+crop (2/5) → review (3/5) →
      details/address (4/5) → payment (5/5) → confirm
- [x] Review no longer shows name/address (not entered yet); Continue → details.
      Payment card shows "Ships to …" so the address is still seen before paying.
- [x] Back links: photos → package, review → photos (Edit Photos), details →
      review, payment → details
- [x] All order state already lives in ShopPage (photos, sources, thumbs, pkg,
      address fields) — stages only switch views, so nothing is lost. The crop
      position + Fill/Fit choice are baked into each confirmed photo blob.
- [x] Validation unchanged: same client checks (now gate details → payment);
      server /api/orders address validation untouched

## Must NOT change
/order, /wedding, CropStep, lib/cropImage.ts, source upload, Stripe intent
creation + server amount verification, /api/orders validation.

## Verify
- [x] build
- [x] Walk: prices on landing → package → 3 crops (1 FIT, 2 FILL) → review →
      BACK to photos → BACK to package → forward again: same 3 thumbs (byte-
      identical blobs), sources intact → review → details → payment (Stripe)
- [x] Each missing address field blocks details → payment client-side
- [x] Server: POST /api/orders shipped with each address field missing → 400
- [x] photo-N.jpg + photo-N-source.jpg land (via /order cash — same server
      path; local has no Stripe keys)

## Deploy
- [x] deploy.py → DEPLOY SUCCESS; .env 12 keys, DASHBOARD_PASSWORD not rotated,
      136 upload dirs untouched, pm2 magnet-parlor + email-agent online.
      Live walk on https://themagnetparlor.com/shop: prices on landing → package
      → 3 photos → review → shipping → payment → Stripe Payment Element loaded
      ($18.99, server-computed). Left one unpaid test PaymentIntent (…JE9GtE).

## Results (Playwright, 390px viewport, local `next start`)
- Landing: "3 Magnets $12 · 9 Magnets $25 · Flat $6.99 shipping anywhere in
  the US." — all from lib/pricing (no money literals left in app/shop).
- Steps read 1 of 5 Package → 2 Photos → 3 Review → 4 Shipping Details →
  5 Payment. Walked review→photos→package→photos→review→shipping→review→
  shipping→payment→shipping→payment: photo + source Blobs SHA-256 identical
  before/after (FIT photo, zoomed FILL, 4:3 FILL); address fields kept.
- Client: blanking first/last/email/street/city/state/ZIP each blocks with its
  message; phone blank passes. Payment card shows "Ships to …".
- Server: shipped POST missing street/city/state/zip, bad state, bad ZIP, or no
  address → 400 each, no upload folder created. Full address passes validation.
- Source landing: /api/orders + submit code unchanged since verified earlier
  today (photo-N.jpg + photo-N-source.jpg via /order cash).
- Known, pre-existing: the order POST happens after Stripe captures payment, so
  a server-side address rejection there would mean charged-without-order.
  Client checks mirror the server's exactly, which is what prevents it today.

---

# Tasks: Crop defaults revision + 2x3 resolution floor, then commit

## Change (user correction to the 0.80–1.25 auto-select)
- [x] Remove ratio-band auto-select. Default is always FILL…
- [x] …except extreme ratios (< 0.6 or > 1.67) → FIT auto-selects (note shown)
- [x] FIT shown side by side with FILL as an option: two tiles, each with a live
      thumbnail (Fill = current crop via CroppedImage, Fit = rendered fit image);
      tapping a tile switches the large preview. Fit is pre-rendered for this.
- [x] Keep: short edge < 720 → FIT forced, Fill disabled
- [x] 2x3: add the 720px floor, no Fit mode:
      - zoom capped so the 2:3 crop's short side (width) never drops under 720
      - upload rejected if no 2:3 crop of width ≥ 720 fits (min(w, h·2/3) < 720)
- [x] Commit everything (branch claude/magnet-parlor-system-JBzAG); ignore
      `*.tsbuildinfo`; public/uploads already gitignored

## Verify
- [x] build; 4:3 photo → FILL; 1604x2048 (0.78) → FILL with Fit tile beside it;
      1000x2000 (0.5) → FIT auto; 1500x700 → FIT forced; 2x3 zoom stops at
      width 720; 2x3 too-small rejected; print sheet 2550x3300

## Results (Playwright, 390px viewport)
- 4032x3024 (1.33) → FILL · 1604x2048 (0.78) → FILL · 1000x2000 (0.50) → FIT
  auto + note · 2400x1200 (2.00) → FIT auto + note · 1500x700 → FIT forced,
  Fill disabled. Fill + Fit tiles with live thumbnails shown side by side on
  every square photo.
- 2x3: no Fit tiles; 700x1200 and 2000x1000 rejected "too small"; 1200x1800
  slider max 1.66, End + wheel zoom stop there → output 723x1084 (≥ 720 wide).
- Zero page errors. Print sheet code untouched.

---

# Tasks: FILL / FIT crop modes + resolution floor (/order + /shop)

## Problem
(a) Only square FILL crops — a tall sports poster loses its team/athlete name.
(b) No resolution floor — 67/351 photos (19%) were < 720px and got upscaled.

## Geometry (from lib/printSheetImage.ts)
2x2 cell = 2.4in = 720px @300DPI; die-safe = 2.0in = 600px. Output square S
(720..1200) maps 1:1 onto the cell, so the print sheet needs no change.

## Plan
- [x] `lib/cropImage.ts` (pure helpers, shared):
  - `defaultCropMode(w,h)` → "fit" outside aspect 0.80–1.25, else "fill"
  - `fillMaxZoom(w,h,sliderMax)` → zoom where the crop's side hits 720px
    (react-easy-crop at zoom 1 = short edge), capped at the existing 3
  - `getFitImg(src)` → S×S JPEG, S = clamp(longEdge·720/600, 720, 1200);
    photo scaled into the centred S·600/720 die-safe square; every pixel
    outside the photo = nearest photo edge pixel (clamped sample = outermost
    row/column extended, corners from corner pixel); that region then blended
    with a ~9px (@720, scaled with S) gaussian (3× box approx — no ctx.filter,
    iOS Safari lacks it) through a feathered mask that is 0 on the photo, so
    the photo itself is never blurred
- [x] `app/CropStep.tsx` (new, shared by /order + /shop): Fill/Fit segmented
  toggle + live preview of the active mode (Cropper for Fill; rendered FIT
  image w/ faint dashed magnet-edge guide for Fit). Fit = no zoom/pan.
  Toggle shown prominently w/ a one-line note when auto-defaulted to Fit.
  Fill = today's cropper, slider/pinch capped by `fillMaxZoom`.
  If short edge < 720, Fill can't reach 720 at any zoom → Fill disabled, Fit used.
- [x] Upload floor: on pick, read natural size; long edge < 720 → "too small to
  print sharp, pick another" message on the photos step, no crop screen
- [x] /order + /shop use CropStep; source copy upload kept as is
- [x] 2x3 market size: unchanged (FILL only, no floor) — the spec is square-only

## Must NOT change
- Print sheet builder, pricing, dashboard, /wedding single-photo flow

## Verify
- [x] `npm run build`
- [x] 1604x2048 poster → defaults FIT; output shows the whole poster, no crop,
      no gray band/border (pixel-check the extension region vs edge colours)
- [x] Square-ish photo → defaults FILL, same cropper/output as before
- [x] FILL max zoom → crop ≥ 720×720
- [x] Image with long edge < 720 → rejected at upload
- [x] Print sheet download still 2550×3300

## Verification results (Playwright, real Chromium, 390px phone viewport)
- 1604x2048 poster → FIT default, no zoom slider; output 1200x1200, photo
  783x1000 centred in the 1000px safe area; bleed pixels within 6 levels of the
  photo's edge colour on every sampled row, min saturation 54 (no gray band).
  Visually: whole poster, EAGLES + J. SMITH intact, no visible border.
- 3000x3000 → FILL, slider max 3 (same as before), 1200x1200 output.
- 1000x900 → FILL, slider max 1.25; slider End + 15 wheel-zoom ticks both stop
  at 1.25 → output exactly 720x720.
- 700x500 → "too small to print sharp" on the photos step, no crop screen.
- 1500x700 (short edge < 720) → FIT, Fill disabled.
- Fit↔Fill toggle switches previews both ways.
- /order cash order (2 FIT + 1 FILL) → source copies still uploaded; print
  sheet 2550x3300, posters print whole. Zero page/console errors. Test data removed.

## Deploy
- [x] deploy.py → DEPLOY SUCCESS. .env 12 keys preserved, DASHBOARD_PASSWORD
      not rotated, 136 upload dirs untouched; live /shop + /order chunks carry
      the Fit/Fill UI; /, /shop, /order, /wedding 200, /dashboard 307 (login).

---

# Tasks: Keep an uncropped "source" copy of every customer photo

## Problem
Only the cropped square is uploaded, so a badly-cropped order is unrecoverable.
(Exception: /wedding already sends the raw camera file to `originals/` for the
couple's gallery — that path stays exactly as is.)

## Plan
- [x] `lib/cropImage.ts`: add `getSourceImg(src)` — full uncropped image,
      long edge ≤ 2000px, JPEG q0.88 (never upscales)
- [x] /order, /shop, /wedding: in `confirmCrop`, build the source from the same
      picked image and keep it in a `sources` array parallel to `photos`
      (add/remove/trim in lockstep). Source failure never blocks the crop.
- [x] Submit: append each source as its own field `source-<i>` (index-keyed, so
      a missing one can't shift the others) named `photo-<i>-source.jpg`
- [x] `POST /api/orders`: for each photo i, if `source-<i>` is a JPEG File
      (≤ 15MB) write `photo-<i+1>-source.jpg` in the same order folder. Optional
      — absent/invalid sources are skipped silently. No DB change.
- [x] `GET /api/orders`: add derived `sourcePhotos: (string|null)[]` per order
      (filename convention + exists-on-disk check), so the dashboard never
      links to a 404 for pre-change orders
- [x] Dashboard: small "Original" link (new tab) under each photo that has a
      source — market, archived, online (shipped), wedding cards

## Must NOT change
- Crop UI, crop output (size/quality), print sheet, pricing, wedding originals,
  gallery, order validation (photo count etc.)

## Verify
- [x] `npm run build` passes
- [ ] Test /shop order (local, Stripe test mode): photo-N.jpg + photo-N-source.jpg
      in the folder; source is full-frame (non-square, matches original aspect)
- [ ] Pre-change order renders in dashboard with no Original link, no broken
      image, and still adds to the print sheet without errors

## Deploy
- [x] `python .claude/deploy/deploy.py` → DEPLOY SUCCESS. .env preserved (12 keys,
      DASHBOARD_PASSWORD not rotated), 136 upload dirs untouched. Prod
      /api/orders: all 136 orders carry `sourcePhotos`, all null (pre-change) →
      no Original links, dashboard 200. Live client chunks contain the upload.

---

# Tasks: Add to Sheet for Online Orders (shipped + gallery_order)

## Problem
Online Orders cards (`ShippedOrderCard`) had no way to put their photos on the
Print Sheet Builder — only market and wedding cards did. Their magnets couldn't
be printed from the dashboard.

## Plan
- [x] `ShippedOrderCard` gains `onSheet` / `canAdd` / `onAdd` / `onRemove` props
- [x] Render "Add to Sheet" / "Remove from Sheet" using the same pattern as the
      market + wedding cards (same button classes, same disabled behavior)
- [x] Disable Delete while the order is on the sheet (matches other cards; also
      matches the server, which 409s a DELETE on a `printing` order)
- [x] Wire both call sites (awaiting-shipment grid + collapsed "Shipped" grid)
- [x] Hide Add for already-shipped orders (mirrors ready/picked_up on market)
- [x] "On this sheet" list: label online orders as magnet count + online/gallery
      instead of "N-pack · <empty phone>"

## Must NOT change
- [x] Online orders stay out of `marketOrders` / the wait estimate — the count is
      server-side (`orderType = 'market'` in app/api/orders), proven unchanged
      with both online orders forced to `printing`
- [x] Online orders stay in their own Online Orders dashboard section
- [x] `/api/ship` ignores status — a `printing` online order still ships (tested)

## Verify
- [x] `tsc --noEmit` + `npm run build` clean
- [x] Playwright against `next start`: seeded a 3-photo shipped + 2-photo gallery
      order, both Add buttons enabled, sheet filled SHIPIA×3 / GALE×2 with the
      per-order colour name label under each photo
- [x] Download Print Sheet → PNG exactly 2550×3300 with both orders rendered
- [x] Remove from Sheet clears only that order; Delete disables/re-enables with it
- [x] No console/page errors; seed rows + scratch files removed afterwards

## Deploy
- [x] `python .claude/deploy/deploy.py` → DEPLOY SUCCESS, pm2 magnet-parlor online,
      https://themagnetparlor.com 200
- [x] .env preserved (all 12 keys present), data/ + public/uploads untouched
      (45 upload dirs, 45 orders, 3 galleries), email-agent pm2 app untouched

## Review
- Single-file change (app/dashboard/page.tsx) plus CHANGES.md/todo.md. No API,
  DB, pricing, or wait-estimate changes — online orders gained a button and
  nothing else about their handling moved.
- Known limit, deliberate: a gallery order with more than 9 photos can't be
  placed (one sheet holds 9). The Add button greys out with a tooltip saying so
  rather than silently half-filling and losing track of what already printed.
  Ask if partial/multi-sheet placement is wanted.
## Follow-up: reprints on shipped orders (done)
- [x] Add to Sheet stays available on shipped/gallery orders at every status —
      lost parcels and damaged magnets need a reprint path that isn't
      "un-ship the order". Market cards still hide it at ready/picked_up.
- [x] `markSheetPrinted()` skips `shipped` orders, so a reprint can't rewind
      fulfillment (it would otherwise drop back into "awaiting shipment" and
      hide the tracking number). Other orders on the same sheet still advance.
- [x] Verified: shipped seeds reprint and stay shipped w/ tracking; mixed sheet
      advances only the market order; wait estimate still market-only
- [x] Deployed; .env preserved, dashboard password NOT rotated
- 9+ photo grey-out left exactly as it was, per your call.
