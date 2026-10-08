// The one set of rules for a shipped order's customer + address, for every
// checkout that ships: /shop (create-payment-intent before the charge,
// /api/orders as the backstop) and wedding galleries (gallery intent before
// the charge, gallery order as the backstop). Edit here only — a second copy
// is how a customer ends up charged for an order the server then refuses.

import type { ShippingAddress } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV",
  "WI","WY","DC",
]);

export type ShippedCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  address: ShippingAddress;
};

/**
 * Validate and normalize a shipped order's name, email and address. Phone is
 * optional and not checked here. `shippingAddress` may be the JSON string the
 * orders form sends or an already-parsed object.
 */
export function validateShippedCustomer(input: {
  firstName: unknown;
  lastName: unknown;
  email: unknown;
  shippingAddress: unknown;
}): { ok: true; value: ShippedCustomer } | { ok: false; error: string } {
  const firstName = String(input.firstName ?? "").trim();
  const lastName = String(input.lastName ?? "").trim();
  const email = String(input.email ?? "").trim().slice(0, 200);
  if (!firstName) return { ok: false, error: "firstName required" };
  if (!lastName) return { ok: false, error: "lastName required" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "A valid email is required" };
  const address = parseShippingAddress(input.shippingAddress);
  if (!address.ok) return address;
  return { ok: true, value: { firstName, lastName, email, address: address.value } };
}

export type GalleryCustomer = { name: string; email: string; address: ShippingAddress };

/**
 * Same rules for a wedding-gallery order, whose form has a single "Full Name"
 * field (required; split into first/last when the order is saved).
 */
export function validateGalleryCustomer(input: {
  name: unknown;
  email: unknown;
  shippingAddress: unknown;
}): { ok: true; value: GalleryCustomer } | { ok: false; error: string } {
  const name = String(input.name ?? "").trim().slice(0, 120);
  const email = String(input.email ?? "").trim().slice(0, 200);
  if (!name) return { ok: false, error: "Please enter a name for shipping." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "A valid email is required" };
  const address = parseShippingAddress(input.shippingAddress);
  if (!address.ok) return address;
  return { ok: true, value: { name, email, address: address.value } };
}

function parseShippingAddress(raw: unknown): { ok: true; value: ShippingAddress } | { ok: false; error: string } {
  let obj: any = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return { ok: false, error: "Invalid shipping address" };
    }
  }
  if (!obj || typeof obj !== "object") return { ok: false, error: "Invalid shipping address" };
  const street = String(obj.street || "").trim().slice(0, 200);
  const city = String(obj.city || "").trim().slice(0, 120);
  const state = String(obj.state || "").trim().toUpperCase().slice(0, 2);
  const zip = String(obj.zip || "").trim().slice(0, 10);
  if (!street) return { ok: false, error: "Street address is required" };
  if (!city) return { ok: false, error: "City is required" };
  if (!US_STATES.has(state)) return { ok: false, error: "A valid US state is required" };
  if (!/^\d{5}(-\d{4})?$/.test(zip)) return { ok: false, error: "A valid ZIP code is required" };
  return { ok: true, value: { street, city, state, zip } };
}
