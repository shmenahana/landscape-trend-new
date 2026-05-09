# The Magnet Parlor

> Capture the moment. Keep the memory.

Single Next.js 14 app with two interfaces:

- **`/`** — Mobile-first customer upload page (QR-code landing). Customer enters name + phone, picks a 3- or 9-pack, uploads + crops square photos, submits.
- **`/dashboard`** — Operator dashboard. Order queue, drag orders onto a 3×3 print sheet, send Twilio SMS when ready, mark picked up.
- **`/print?ids=...`** — Print-optimized 8.5×11" sheet. Auto-fires `window.print()`.

## Stack
Next.js 14 (App Router) · better-sqlite3 · Twilio · react-easy-crop · Tailwind.

## Setup

```bash
npm install
cp .env.example .env       # fill in TWILIO_* if you want SMS
npm run dev
```

Open `http://localhost:3000` (customer) and `http://localhost:3000/dashboard` (operator).

Photos are stored under `public/uploads/{orderId}/` and the SQLite DB lives at `data/magnet-parlor.db`.

## Env

| Variable | Purpose |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio account |
| `TWILIO_AUTH_TOKEN` | Twilio auth |
| `TWILIO_PHONE_NUMBER` | Sender (e.g. `+15551234567`) |
| `DATABASE_URL` | (informational; SQLite path is hardcoded under `data/`) |
| `NEXT_PUBLIC_APP_URL` | Public URL behind the QR code |

If Twilio env vars are absent, the **Ready for Pickup** action still updates the order status — it just skips sending an SMS (operator gets a heads-up alert).

## Print sheet specs

- Page: 8.5" × 11" (`@page` size with zero margin)
- Cells: 2.25" × 2.25" with 0.15" gutters
- 3 columns × 3 rows centered (0.725" side margin, 1.975" top margin)
- `object-fit: cover` (photos already square from crop step)

## Deploy notes

- Tested target: Hostinger VPS, Ubuntu, PM2 (`pm2 start "npm run start" --name magnet-parlor`)
- `better-sqlite3` is a native dep — `npm rebuild better-sqlite3` on the server if you copy `node_modules`
- Either run on the laptop's hotspot LAN or expose publicly so QR-code scanners on cellular work
