// =============================================================================
// WEST AKRON FIREWOOD SALES LLC — SITE CONFIGURATION
// -----------------------------------------------------------------------------
// This is the ONLY file you need to edit to update business info, prices,
// the bulk discount, and delivery rules. Look for the "TODO" markers and
// replace the placeholder values with your real numbers.
//
// Ohio legal note (built in): firewood is sold ONLY by the cord or a fraction
// of a cord. The terms "face cord", "rick", and "rack" are illegal for retail
// firewood sales in Ohio and are intentionally NOT used anywhere on this site.
// =============================================================================

export const business = {
  name: "West Akron Firewood Sales LLC",

  // TODO: Replace with your real business email
  email: "PLACEHOLDER@example.com",

  // TODO: Replace with your real phone number
  phone: "(330) 555-0000",

  // TODO: Replace with your real business address
  address: {
    line1: "123 Placeholder St",
    city: "Akron",
    state: "OH",
    zip: "44300",
  },

  // TODO: Replace with your Ohio firewood/vendor registration number
  // (Required on the footer, checkout page, and every receipt.)
  registrationNumber: "OH-FW-PLACEHOLDER",

  // Path to your logo. A placeholder mark is shown until you drop a real
  // image into /public and point this at it (e.g. "/logo.png").
  logo: null,
};

// -----------------------------------------------------------------------------
// DELIVERY RULES — "Free within radius, flat fee beyond"
// -----------------------------------------------------------------------------
export const delivery = {
  // TODO: Free delivery within this many miles of Akron.
  freeRadiusMiles: 15,

  // TODO: Flat delivery fee charged for addresses beyond the free radius.
  feeBeyondRadius: 50.0,

  // Stacking is an optional add-on the customer can request at checkout.
  // TODO: Set your flat stacking charge.
  stackingFee: 40.0,
};

// -----------------------------------------------------------------------------
// BULK DISCOUNT — automatic discount on the "Bag of 8 pieces" product
// -----------------------------------------------------------------------------
// PLACEHOLDER: This is wired up and working, but the numbers are placeholders.
// "percent": take `value`% off the bag subtotal once quantity reaches
//            `threshold`. (To switch to a flat per-bag price instead, change
//            type to "perUnit" and set `discountedUnitPrice` below.)
export const bagDiscount = {
  threshold: 20, // TODO: confirm minimum bags to trigger the discount
  type: "percent", // "percent" | "perUnit"
  value: 10, // TODO: percent off (used when type === "percent")
  discountedUnitPrice: 5.0, // TODO: per-bag price at threshold (used when type === "perUnit")
};

// -----------------------------------------------------------------------------
// PRODUCTS
// -----------------------------------------------------------------------------
// A full cord = 128 cubic feet. Fractions are shown in cubic feet for Ohio
// compliance. "price" is in US dollars. Edit prices freely.
export const products = [
  {
    id: "bag-8",
    name: "Bag of 8 Pieces",
    blurb: "Convenient pre-bagged firewood — perfect for a quick fire.",
    price: 6.0, // TODO: price per bag
    unitLabel: "bag",
    cubicFeet: null, // bags are sold by the piece count, not cubic feet
    note: "Automatic discount when you order 20 or more bags.",
    hasBulkDiscount: true,
  },
  {
    id: "cord-third",
    name: "1/3 Cord",
    blurb: "A third of a full cord of seasoned firewood.",
    price: 120.0, // TODO: price
    unitLabel: "1/3 cord",
    cubicFeet: 42.7, // ≈ 128 / 3
  },
  {
    id: "cord-half",
    name: "1/2 Cord",
    blurb: "Half a full cord of seasoned firewood.",
    price: 175.0, // TODO: price
    unitLabel: "1/2 cord",
    cubicFeet: 64, // 128 / 2
  },
  {
    id: "cord-full",
    name: "Full Cord",
    blurb: "A full cord of seasoned firewood — best value.",
    price: 320.0, // TODO: price
    unitLabel: "full cord",
    cubicFeet: 128, // a full cord = 128 cubic feet
  },
  {
    id: "pallet",
    name: "Pallet",
    blurb: "Wood pallet sold for pallet bonfires.",
    price: 15.0, // TODO: price per pallet
    unitLabel: "pallet",
    cubicFeet: null,
    note: "Sold for pallet bonfires.",
  },
];

export function getProduct(id) {
  return products.find((p) => p.id === id);
}
