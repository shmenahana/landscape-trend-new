// Source of truth for package pricing. Used by both client and server.
// Amounts in cents — Stripe requires integer cents.

export type PackageKey = "3" | "9";

const PRICES: Record<PackageKey, number> = {
  "3": 1200, // $12.00
  "9": 2500, // $25.00
};

// Flat shipping rate for online /shop orders (shipped to the customer).
export const SHIPPING_CENTS = 699; // $6.99

// ── Wedding gallery upsell pricing ───────────────────────────────────────────
// Within the 30-day gallery window: $8 each, or 3 for $20 (auto-applied).
// After expiry the gallery is inaccessible, so the $12/each rate is only shown
// as urgency copy and never actually charged.
export const GALLERY_MAGNET_CENTS = 800; // $8 each
export const GALLERY_BUNDLE_3_CENTS = 2000; // 3 for $20
export const GALLERY_EXPIRED_EACH_CENTS = 1200; // $12 each (display only)

// Best price for `count` magnets: pack every group of 3 into the $20 bundle,
// charge the remainder at $8 each (2 singles at $16 beat a $20 bundle, so we
// never round up).
export function galleryMagnetTotalCents(count: number): number {
  const n = Math.max(0, Math.floor(count));
  const bundles = Math.floor(n / 3);
  const remainder = n % 3;
  return bundles * GALLERY_BUNDLE_3_CENTS + remainder * GALLERY_MAGNET_CENTS;
}

// Full gallery order total: magnets + flat shipping.
export function galleryOrderTotalCents(count: number): number {
  return galleryMagnetTotalCents(count) + SHIPPING_CENTS;
}

export function priceCents(pkg: PackageKey): number {
  return PRICES[pkg];
}

// Total for a shipped online order: package price + flat shipping.
export function shippedTotalCents(pkg: PackageKey): number {
  return priceCents(pkg) + SHIPPING_CENTS;
}

export function priceDollars(pkg: PackageKey): string {
  return (priceCents(pkg) / 100).toFixed(0);
}

export function isPackageKey(v: unknown): v is PackageKey {
  return v === "3" || v === "9";
}

// Random 4-digit order code (1000-9999). Used to match cash orders at the table.
export function generateOrderCode(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}
