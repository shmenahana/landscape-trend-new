// =============================================================================
// CART STATE + PRICING
// -----------------------------------------------------------------------------
// A small cart implemented with React context + localStorage so a customer's
// cart survives a page refresh. Pricing (including the automatic bag discount
// and delivery rules) is computed here so it stays consistent everywhere.
// =============================================================================
import { createContext, useContext, useEffect, useState } from "react";
import { getProduct, bagDiscount, delivery } from "./config";

const CartContext = createContext(null);
const STORAGE_KEY = "wafs-cart-v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState({}); // { [productId]: quantity }
  const [loaded, setLoaded] = useState(false);

  // Load saved cart once on mount (client only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch (e) {
      /* ignore corrupt storage */
    }
    setLoaded(true);
  }, []);

  // Persist on change.
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  function setQuantity(id, qty) {
    setItems((prev) => {
      const next = { ...prev };
      const q = Math.max(0, Math.floor(Number(qty) || 0));
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }

  function addToCart(id, qty = 1) {
    setItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + qty }));
  }

  function clearCart() {
    setItems({});
  }

  const count = Object.values(items).reduce((a, b) => a + b, 0);

  return (
    <CartContext.Provider
      value={{ items, setQuantity, addToCart, clearCart, count, loaded }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

// Round to cents to avoid floating point surprises.
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function formatUSD(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n || 0);
}

// Compute discount on the bag product. Returns a positive number to subtract.
function bagDiscountAmount(productId, qty, lineSubtotal) {
  const product = getProduct(productId);
  if (!product || !product.hasBulkDiscount) return 0;
  if (qty < bagDiscount.threshold) return 0;

  if (bagDiscount.type === "perUnit") {
    const discounted = round2(qty * bagDiscount.discountedUnitPrice);
    return round2(Math.max(0, lineSubtotal - discounted));
  }
  // default: percent off
  return round2(lineSubtotal * (bagDiscount.value / 100));
}

// Build a full, itemized order summary from cart items + checkout options.
// options: { delivery: boolean, withinFreeRadius: boolean, stacking: boolean }
export function buildOrder(items, options = {}) {
  const lines = [];

  for (const [id, qty] of Object.entries(items)) {
    const product = getProduct(id);
    if (!product || qty <= 0) continue;

    const subtotal = round2(product.price * qty);
    const discount = bagDiscountAmount(id, qty, subtotal);
    const total = round2(subtotal - discount);

    lines.push({
      id,
      name: product.name,
      unitLabel: product.unitLabel,
      quantity: qty,
      unitPrice: product.price,
      // Total cubic feet for cord products (Ohio compliance), null otherwise.
      cubicFeet: product.cubicFeet != null ? round2(product.cubicFeet * qty) : null,
      perUnitCubicFeet: product.cubicFeet,
      subtotal,
      discount,
      total,
    });
  }

  const productsTotal = round2(lines.reduce((a, l) => a + l.total, 0));
  const productsDiscount = round2(lines.reduce((a, l) => a + l.discount, 0));

  // Add-ons
  const addOns = [];
  let deliveryFee = 0;
  if (options.delivery) {
    deliveryFee = options.withinFreeRadius ? 0 : round2(delivery.feeBeyondRadius);
    addOns.push({
      id: "delivery",
      name: options.withinFreeRadius
        ? `Delivery (free within ${delivery.freeRadiusMiles} mi of Akron)`
        : `Delivery (beyond ${delivery.freeRadiusMiles} mi)`,
      total: deliveryFee,
    });
  }

  let stackingFee = 0;
  if (options.stacking) {
    stackingFee = round2(delivery.stackingFee);
    addOns.push({ id: "stacking", name: "Stacking service", total: stackingFee });
  }

  const grandTotal = round2(productsTotal + deliveryFee + stackingFee);

  return {
    lines,
    addOns,
    productsTotal,
    productsDiscount,
    deliveryFee,
    stackingFee,
    grandTotal,
  };
}
