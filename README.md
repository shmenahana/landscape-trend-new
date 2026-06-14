# West Akron Firewood Sales LLC — Store

A simple, mobile-friendly firewood store: browse products, add to cart, check
out, and generate a printable receipt / delivery ticket. Built with Next.js +
Tailwind CSS. Designed to be **easy for you to run and edit**.

Built with Ohio firewood law in mind: everything is sold by the **cord or a
fraction of a cord**, cord volumes are shown in **cubic feet**, and the terms
"face cord", "rick", and "rack" are intentionally never used.

---

## 1. Edit everything in one file

Open **`lib/config.js`** and replace the `TODO` placeholders:

- **Business info** — email, phone, address, and your **Ohio firewood/vendor
  registration number** (shown in the footer, on checkout, and on every receipt).
- **Logo** — set `logo: "/logo.png"` after dropping an image into the `public/`
  folder. Until then a tasteful placeholder shows.
- **Prices** — each product's `price` (in dollars).
- **Bag bulk discount** — `bagDiscount` (threshold + percentage). These are
  **placeholder numbers** right now; set your real discount here.
- **Delivery** — free radius (miles) and the flat fee beyond it, plus the
  stacking fee.

You don't need to touch any other file to run the business.

## 2. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## 3. Put it online (suggested: Vercel — free)

1. Push this repo to GitHub.
2. Go to vercel.com, "Add New Project", import the repo, click Deploy.
3. You get a live URL in ~1 minute. Vercel's free tier is plenty for this.

(Any host that runs Next.js works — Netlify, Render, etc.)

## 4. Taking payments (not connected yet)

Right now, placing an order produces a **receipt / delivery ticket** and you
collect payment your usual way (cash, card reader, Venmo, etc.). The checkout
page has a clearly-marked **Payment** placeholder block.

When you're ready to take cards online, pick one:

- **Stripe Checkout** (recommended for online cards): create a free Stripe
  account, then replace the placeholder block in `pages/checkout.js` with a
  redirect to a Stripe Checkout Session. This needs a tiny serverless function
  (e.g. `pages/api/checkout.js`) that creates the session with your secret key.
  Stripe hosts the secure payment page.
- **Square**: if you already use Square in person, generate a Square Payment
  Link / hosted checkout and send the customer there from the same spot.

Tell your developer "wire up Stripe Checkout" (or Square) and point them at the
`Payment` placeholder in `pages/checkout.js`.

---

## Project map

- `lib/config.js` — **all editable business/pricing settings** (start here)
- `lib/cart.js` — cart state + pricing, discount, and delivery math
- `pages/index.js` — storefront / product grid
- `pages/cart.js` — cart review
- `pages/checkout.js` — customer info, delivery/stacking, payment placeholder
- `pages/receipt.js` — printable receipt / delivery ticket
- `components/` — header, footer (registration # required by Ohio), product card
