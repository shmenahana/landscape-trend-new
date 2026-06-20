// Source of truth for package pricing. Used by both client and server.
// Amounts in cents — Stripe requires integer cents.

export type PackageKey = "3" | "9";

const PRICES: Record<PackageKey, number> = {
  "3": 1200, // $12.00
  "9": 2500, // $25.00
};

// Flat shipping rate for online /shop orders (shipped to the customer).
export const SHIPPING_CENTS = 699; // $6.99

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
