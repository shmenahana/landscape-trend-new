# Change Log

Agents: log every change here with timestamp, role, file, and what was done.

## 2026-09-29 — Library: 7 Louisville Leopards designs added (LOCAL + PRODUCTION)
- Source: ~/Downloads/louisville-leopards-magnets.zip — 7 PNGs, all 720x720
  (= 2.4in @ 300 DPI, exactly one 2x2 print cell). Imported as 7 SEPARATE
  library designs, category "Sports":
  little-leopards-cheerleading{,-navy}, louisville-cheer-megaphone{,-white},
  louisville-leopard-head, louisville-leopards-football-claw,
  louisville-leopards-soccer.
- Method (both environments): a throwaway script mirroring
  POST /api/library/designs — file copied to public/uploads/library as
  `<uuid>-<original>.png`, one `library_designs` row with the original filename
  (so search works) and tags ''. Dup-guard on filename. No code, schema,
  pricing, or .env changes; no redeploy (deploy.py excludes data/ and
  public/uploads/, so this had to be a direct data push).
- LOCAL: data/magnet-parlor.db, 1 -> 8 designs.
- PRODUCTION (/opt/magnet-parlor on the VPS): 5 -> 12 designs. DB backed up
  first to data/magnet-parlor.db.bak-lib-import (139264 bytes, pre-import).
  Orders (52) and galleries (3) unchanged before and after. Stage dir and
  import script removed from the server.
- Verified:
  - Local: Playwright login -> /dashboard/library, all 7 thumbnails load, Sports = 7.
  - Prod files: all 7 https://themagnetparlor.com/uploads/library/<file> return
    200 with byte-identical sizes and a valid PNG header.
  - Prod API: GET /api/library/designs (operator session minted server-side from
    the box's own .env, secret never displayed) returns 200 with all 12 designs
    incl. the 7 new ones — this is the same endpoint the Print Sheet Builder's
    "Pick a Design" slot picker calls, so they are placeable on a sheet.
  - The production dashboard password differs from the local .env value, so the
    prod UI was not driven through a browser login; verification went through the
    API + static URLs instead.

## 2026-08-12 — Reprints: keep "Add to Sheet" on shipped/gallery orders at every status
- Rationale: parcels get lost, magnets arrive damaged, a customer reports a blurry
  print. Recovery previously meant un-shipping the order or rebuilding it by hand.
  Market pickups keep hiding the button at ready/picked_up — the customer physically
  walked away with those.
- app/dashboard/page.tsx:
  - `ShippedOrderCard`: dropped the `!isShipped` guard on "Add to Sheet"; the button
    is now offered at every status. Label is unchanged (the Shipped badge and
    tracking number already give the context); on a shipped order the tooltip reads
    "Reprint these magnets — the order stays shipped".
  - `markSheetPrinted()`: skips orders already at status `shipped` instead of
    PATCHing everything on the sheet to `printing`. Without this, reprinting a
    shipped order rewound it out of the collapsed Shipped list into "awaiting
    shipment" and hid its tracking number — re-creating the un-shipping dance the
    change is meant to remove. Non-shipped orders on the same sheet still advance.
- Unchanged: the 9+ photo grey-out, the market/online split, the Online Orders
  section, and the wait estimate (server-side, `orderType = 'market'`).
- Verified locally (build + Playwright against `next start`): with two ALREADY
  SHIPPED seeds (shop + gallery), both showed an enabled Add button inside the
  collapsed Shipped list with tracking still displayed, filled the sheet
  SHIPIA×3 / GALE×2, and after Mark Printed both remained `status=shipped` with
  tracking intact and stayed out of "awaiting shipment". Mixed sheet (pending
  market + shipped online) → market advanced to `printing`, shipped untouched,
  wait-estimate count correct at 2. No console errors. Seeds/scratch removed.

## 2026-08-12 — Online orders can be added to the print sheet
- Problem: Online Orders cards (orderType `shipped` + `gallery_order`) had no
  "Add to Sheet" control, so their magnets couldn't be printed from the builder.
- app/dashboard/page.tsx:
  - `ShippedOrderCard` takes `onSheet` / `canAdd` / `onAdd` / `onRemove` and renders
    "Add to Sheet" / "Remove from Sheet" using the same markup + rules as the market
    and wedding cards. Add is hidden once the order is shipped (mirrors
    ready/picked_up on market cards); a `title` explains a greyed-out Add
    (not enough empty slots, or more photos than the 9-slot sheet).
  - Delete is disabled while the order sits on the sheet — matches the other cards
    and the server, which 409s a DELETE on a `printing` order.
  - Both call sites wired (awaiting-shipment grid + collapsed "Shipped" grid).
  - New `isOnlineOrder()` + `sheetOrderDetail()`: the "On this sheet" list showed
    "N-pack · <empty phone>" for online orders; now "3 magnets · online · phone"
    / "2 magnets · gallery", with the phone segment dropped when absent.
- Deliberately unchanged: online orders stay out of `marketOrders`, keep their own
  dashboard section, and don't reach the wait estimate — that count is server-side
  (`orderType = 'market' AND status IN ('pending','printing')` in app/api/orders),
  so an online order going to `printing` via Mark Sheet Printed can't leak into it.
- Verified locally (build + Playwright against `next start`): seeded a 3-photo
  shipped and a 2-photo gallery order, added both, sheet showed SHIPIA×3 / GALE×2
  with per-order colour labels, downloaded PNG exactly 2550×3300 with both orders
  rendered, Remove/Delete round-tripped, no console errors. Wait-estimate query
  returned 1 before and after both online orders were set to `printing`. A
  `printing` online order still ships via /api/ship. Seed rows and scratch removed.

## 2026-07-16 — Print Sheet: download 300-DPI PNG instead of window.print()
- Problem: Chrome's window.print() rasterized images at screen quality → visible
  banding on the physical magnets.
- lib/printSheetImage.ts (new): client-side canvas renderer. Draws the exact 3×3
  sheet onto a 2550×3300 canvas (8.5×11 in @ 300 DPI). Layout mirrors
  app/print/print.css (2x2: 2.4in/720px cells, 0.4in gaps, 0.25/1.5in padding;
  2x3: 2.25×3.25in cells). object-fit:cover + explicit-crop drawing match
  CroppedImage; order/STOCK label bars rendered in Josefin Sans with the order
  colour; downloads magnet-sheet-<size>-<ts>.png.
- app/dashboard/page.tsx: openPrint() now builds PrintCells from sheet state and
  calls downloadPrintSheet() (no more /print tab). Added downloadingSheet state.
  Button renamed "Print Sheet →" → "Download Print Sheet" ("Generating…" while busy).
- /print page + PrintControls left in place (unused by dashboard, harmless).
- Verified end-to-end headless (Playwright): logged in, added 3-pack order,
  clicked Download → PNG exactly 2550×3300, real photo content, label bar RGB =
  #2B3856 (correct order colour). Visual check matches print view.
- Deployed to VPS (pm2 reload magnet-parlor, https 200). .env preserved.

## 2026-07-12 — Wedding day checklist on /dashboard/wedding
- app/dashboard/wedding/page.tsx: added a collapsible <WeddingChecklist /> at the
  top of the editor column. Three sections (At Setup / After the Wedding / When
  Gallery Magnet Orders Arrive) with tappable checkboxes; N/12 progress counter in
  the header; state persists in localStorage ("mp_wedding_checklist_v1"); Reset
  Checklist button. The two manual-email steps (gallery link email + tracking
  notification) render as gold-bordered "✉ Do this yourself" cards since the system
  doesn't send those. Mobile-first, collapsed by default. Verified end-to-end with
  Playwright (auth, expand, check, persist-across-reload, reset). No API/DB changes;
  .env and dashboard password untouched.

## 2026-07-12 — /weddings marketing page (sales/informational, separate from /wedding)
- app/weddings/page.tsx (new): server-rendered, statically prerendered marketing
  page for couples/planners. Hero, "guest book on the fridge", 5-step How It Works
  (real product screenshots in CSS phone frames), timeline, After-the-Wedding
  gallery (browser frame), planner "Easy on Your Venue", FAQ (<details>), final CTA.
  NO pricing anywhere. CTAs → homepage inquiry form (/#contact), mailto
  hello@themagnetparlor.com, tel:+13304174183. SEO title/description + OG/Twitter
  images (/weddings/og.jpg).
- public/weddings/{step-1..5,gallery}.webp + og.jpg (new): real screenshots of the
  /wedding guest flow + a populated demo gallery, captured with Playwright at iPhone
  viewport (DSF 3), optimized to WebP with sharp. OG rendered 1200x630 with brand
  fonts. Gallery shot has the pricing block removed (marketing page is price-free).
- app/globals.css: .device-phone / .device-browser frames + .wed-step-num.
- app/HomeClient.tsx: "Weddings" nav link (desktop + mobile); "See our wedding
  experience →" links on the Weddings cards in Events and Pricing.
- app/sitemap.ts: add /weddings (priority 0.9).
- Screenshots taken against LOCAL dev with temporary demo data (wedding mode
  "Sarah & Michael" + demo gallery), fully reset afterward. Production DB/settings
  never touched. Playwright/sharp installed with --no-save (no committed dep change,
  not deployed). /wedding, .env, dashboard password, and the VPS email agent
  untouched.

## 2026-07-11 — Wedding Gallery, Export & Upsell system (main build) — DONE
- lib/db.ts: galleries table, orderType += gallery_order, orders += galleryId,
  originalPhotos; Gallery types + isGalleryExpired.
- lib/zip.ts (new): dependency-free streaming store-method ZIP (CRC-32).
- lib/email.ts (new): SendGrid wrapper with skipped/failed status.
- lib/gallery.ts (new): current-event photo gathering + zip file mapping.
- lib/pricing.ts: gallery pricing ($8 each / 3-for-$20 + shipping).
- app/api/orders/route.ts: save wedding originals to /originals subfolder.
- app/wedding/page.tsx: upload original alongside crop.
- app/api/settings/route.ts: coupleEmail + weddingEventStartedAt stamp.
- app/api/wedding/export/route.ts (new): GET zip/meta, POST create gallery+email.
- app/api/gallery/[id]/{route,download,intent,order}.ts (new): public gallery API.
- app/gallery/[id]/page.tsx (new): premium gallery + lightbox + cart + checkout.
- app/dashboard/page.tsx: gallery_order in Online Orders; card + delete modal.
- app/dashboard/wedding/page.tsx: Export section + Close Event.
- app/api/ship/route.ts: accept gallery_order.
- app/globals.css: gallery masonry, lightbox, cart, magnet overlay.
- Verified locally (build + full API smoke, valid ZIPs). No new npm deps.

## 2026-10-07 — Keep an uncropped "source" copy of every customer photo — DONE
- lib/cropImage.ts: getSourceImg() — full image, long edge ≤2000px, JPEG q0.88.
- app/order, app/shop, app/wedding pages: build the source in confirmCrop from
  the same picked image; upload as field `source-<i>` (photo-<i>-source.jpg).
  Never blocks — a failed source is just skipped. Crop output untouched.
  /wedding's existing raw `originals` upload (gallery) unchanged.
- app/api/orders/route.ts: POST writes photo-N-source.jpg next to photo-N.jpg
  when a valid JPEG ≤15MB is sent (optional). GET adds derived
  `sourcePhotos` (null unless the file exists on disk). No DB change.
- app/dashboard/page.tsx: "Original" link (new tab) under each photo that has
  a source — market, archived, online, wedding cards.

## 2026-10-07 — FILL / FIT crop modes + 720px resolution floor — DONE
- lib/cropImage.ts: defaultCropMode (fit outside aspect 0.80–1.25),
  fillMaxZoom (crop never < 720px), getFitImg (whole photo in the 600/720
  die-safe square; bleed = edge pixels extended + feathered ~9px gaussian,
  photo itself untouched; S = 720..1200, no upscaling).
- app/CropStep.tsx (new): shared crop step with Fit/Fill toggle + live preview;
  2x3 keeps the original rectangle cropper.
- app/order/page.tsx, app/shop/page.tsx: use CropStep; reject photos whose long
  edge < 720 at pick time (square only); subtitle "Fit or Crop".
- Untouched: print sheet, pricing, dashboard, /wedding, source-copy upload.

## 2026-10-07 — Crop defaults revision + 2x3 floor
- lib/cropImage.ts: defaultCropMode → FIT only for ratio < 0.6 or > 1.67
  (FILL otherwise); fillMaxZoom/canFill take the crop aspect.
- app/CropStep.tsx: Fill/Fit shown side by side as tiles with live thumbnails;
  short edge < 720 still forces FIT. 2x3 gets the 720px floor (zoom cap +
  upload reject when no 2:3 crop ≥ 720 wide fits), no Fit mode.
- app/order + app/shop: isTooSmallToPrint(picked, square).
- .gitignore: *.tsbuildinfo. tasks/lessons.md: crop-default lesson.

## 2026-10-07 — /shop: prices up front, address last
- app/shop/page.tsx: landing shows 3/9-magnet prices + flat shipping from
  lib/pricing (removed $12/$25/6.99 literals). Steps now package → photos →
  review → shipping details → payment. Review no longer shows name/address;
  payment card shows "Ships to …". Validation unchanged, now gates payment.
- Untouched: /order, /wedding, CropStep, lib/cropImage.ts, /api/orders,
  create-payment-intent.

## 2026-10-07 — Address validated before the PaymentIntent (deployed, 577f090)
- lib/shipping.ts (new): validateShippedCustomer — single source of the
  shipped-order name/email/address rules.
- app/api/create-payment-intent/route.ts: shipped → validate, 400 before any
  Stripe call.
- app/api/orders/route.ts: duplicate rules removed; backstop uses the shared fn.
- app/shop/page.tsx: intent request body now carries name/email/address.

## 2026-10-07 — Dashboard: tabbed queues left, production right
- app/dashboard/page.tsx: left rail = MARKET / ONLINE / WEDDING tabs with live
  active counts + gold badges ("N cash", "N to ship"); tab remembered in
  localStorage; rail sticky + internally scrolling on lg+. Online/Wedding
  sections removed from under the sheet. Cards unchanged (single column in
  the rail). Right column: Print Sheet Builder, On this sheet, Batch Hopper.

## 2026-10-07 — 300 DPI tag on print sheet; gallery pre-charge address check
- lib/crc32.ts (new): CRC-32 moved out of lib/zip.ts so the browser can use it.
- lib/printSheetImage.ts: pHYs chunk (300 DPI) inserted after IHDR before
  download. Pixels/layout unchanged.
- lib/shipping.ts: + validateGalleryCustomer (single full-name field), same
  shared address/email rules.
- app/api/gallery/[id]/intent: validate → 400 before any Stripe call.
- app/api/gallery/[id]/order: its own copy of the rules removed; backstop
  uses the shared fn.
- app/gallery/[id]/page.tsx: intent body carries name/email/address.
