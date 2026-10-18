# Tasks: zoom cap regression — 720px floor becomes a soft warning

## Problem (user, 2026-10-18)
fillMaxZoom = shortEdge / 720 choked the slider (1080x807 → 1.12x) and left no
pan slack. Composition beats a modest upscale.

## A. Restore zoom range
- [x] lib/cropImage.ts: drop fillMaxZoom; FILL_MAX_ZOOM = 3 for every source
- [x] app/CropStep.tsx: Cropper maxZoom + slider max = 3 (square and 2x3)

## B. Hard floor → soft warning
- [x] getCroppedImg: optional `minW` — a crop narrower than that is upscaled
      to it (square: exactly 720x720; 2x3: 720 wide). Above 720 unchanged
      (still capped at 1200 / 800x1200, never upscaled past the crop)
- [x] CropStep: square crop area normalised to a true square before export
- [x] CropStep: when the live crop's short side < 720 source px, a small
      non-blocking note by the slider ("Zoomed in this far, this photo will
      print a little soft."). Never blocks Use Photo.

## C. Keep
- [x] Square: short edge < 720 still forces FIT (canFill unchanged);
      long edge < 720 still rejected at upload
- [x] 2x3: upload still rejected when no 2:3 crop ≥ 720 wide fits the photo
- [x] FILL/FIT tiles, auto-select < 0.6 / > 1.67, -source upload: untouched

## D. Surface it to the operator
- [x] CropStep.onConfirm(blob, cropPx) — crop short side in source px
      (null for FIT, which never zooms)
- [x] /order, /shop (and /wedding's own cropper) send `cropPx-<i>` per photo
- [x] lib/db.ts: additive `cropPx TEXT` column (JSON, index-aligned with
      photos; null for legacy orders) → Order.cropPx: (number|null)[]
- [x] /api/orders: parse cropPx-<i> (positive int or null), store
- [x] dashboard: small "low res" badge under any photo with cropPx < 720,
      on market, online, wedding cards

## Verify
- [x] npm run build passes
- [x] 1080x807: slider reaches 3x; drag works at 3x with mouse and touch
- [x] crop < 720 → exported file is 720x720, soft-print note visible
- [x] short edge < 720 → FIT forced
- [x] order with a low-res crop → stored [269,269,null], /api/orders returns it
      (badge itself not eyeballed: didn't enter the operator password in the browser)

## Review
- 1080x807: slider max 3; mouse drag at 3x → translate(128,80); touch drag at
  3x pans too. Crop 269px → note shown, upload 720x720 (17 KB JPEG).
- 900x600: FIT forced, Fill tile disabled, no slider.
- Legacy orders: cropPx [] → no badge.
- Note: before the floor, the app did NOT upscale small crops in the browser
  (a 269px crop uploaded as 269px; the print sheet scaled it into the cell).
  Now it uploads 720 as asked. Same print pixels either way.

## Deploy
- [ ] deploy.py; .env preserved, DASHBOARD_PASSWORD not rotated
