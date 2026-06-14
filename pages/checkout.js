import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/Layout";
import { useCart, buildOrder, formatUSD } from "../lib/cart";
import { business, delivery } from "../lib/config";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, count, loaded } = useCart();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    fulfillment: "delivery", // "delivery" | "pickup"
    withinFreeRadius: "yes", // "yes" | "no"
    stacking: false,
    date: "",
    notes: "",
  });

  const wantsDelivery = form.fulfillment === "delivery";
  const order = buildOrder(items, {
    delivery: wantsDelivery,
    withinFreeRadius: wantsDelivery && form.withinFreeRadius === "yes",
    stacking: form.stacking,
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function placeOrder(e) {
    e.preventDefault();
    // Persist the finalized order so the receipt page can render it.
    const payload = {
      customer: {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      },
      fulfillment: form.fulfillment,
      withinFreeRadius: form.withinFreeRadius === "yes",
      stacking: form.stacking,
      date: form.date,
      notes: form.notes,
      items,
      placedAt: new Date().toISOString(),
      orderId: "WAFS-" + Date.now().toString(36).toUpperCase(),
    };
    sessionStorage.setItem("wafs-last-order", JSON.stringify(payload));
    router.push("/receipt");
  }

  if (loaded && count === 0) {
    return (
      <Layout title="Checkout">
        <h1 className="text-2xl font-bold text-amber-900">Checkout</h1>
        <p className="mt-4 text-stone-600">Your cart is empty.</p>
        <Link href="/" className="mt-4 inline-block text-amber-800 hover:underline">
          ← Browse firewood
        </Link>
      </Layout>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600";

  return (
    <Layout title="Checkout">
      <h1 className="text-2xl font-bold text-amber-900">Checkout</h1>

      <form onSubmit={placeOrder} className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Customer + options */}
        <div className="space-y-6 lg:col-span-2">
          <fieldset className="rounded-xl border border-amber-200 bg-white p-5">
            <legend className="px-1 font-semibold text-amber-900">Your details</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                Full name
                <input
                  required
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </label>
              <label className="text-sm">
                Phone
                <input
                  required
                  type="tel"
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Email
                <input
                  required
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-amber-200 bg-white p-5">
            <legend className="px-1 font-semibold text-amber-900">
              Delivery or pickup
            </legend>

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="fulfillment"
                  checked={form.fulfillment === "delivery"}
                  onChange={() => update("fulfillment", "delivery")}
                />
                Delivery
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="fulfillment"
                  checked={form.fulfillment === "pickup"}
                  onChange={() => update("fulfillment", "pickup")}
                />
                Pickup (free)
              </label>
            </div>

            {wantsDelivery && (
              <div className="mt-4 space-y-4">
                <label className="block text-sm">
                  Delivery address
                  <input
                    required
                    className={inputClass}
                    placeholder="Street, city, ZIP"
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                  />
                </label>
                <div className="text-sm">
                  <p className="text-stone-600">
                    Delivery is free within {delivery.freeRadiusMiles} miles of
                    Akron. A flat {formatUSD(delivery.feeBeyondRadius)} fee applies
                    beyond that.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="radius"
                        checked={form.withinFreeRadius === "yes"}
                        onChange={() => update("withinFreeRadius", "yes")}
                      />
                      Within {delivery.freeRadiusMiles} mi (free)
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="radius"
                        checked={form.withinFreeRadius === "no"}
                        onChange={() => update("withinFreeRadius", "no")}
                      />
                      Beyond {delivery.freeRadiusMiles} mi (+
                      {formatUSD(delivery.feeBeyondRadius)})
                    </label>
                  </div>
                </div>
              </div>
            )}

            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.stacking}
                onChange={(e) => update("stacking", e.target.checked)}
              />
              Add stacking service (+{formatUSD(delivery.stackingFee)})
            </label>

            <label className="mt-4 block text-sm">
              Preferred {wantsDelivery ? "delivery" : "pickup"} date
              <input
                required
                type="date"
                className={inputClass}
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </label>

            <label className="mt-4 block text-sm">
              Notes (optional)
              <textarea
                rows={2}
                className={inputClass}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </label>
          </fieldset>

          {/* PAYMENT PLACEHOLDER --------------------------------------------- */}
          <fieldset className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-5">
            <legend className="px-1 font-semibold text-amber-900">Payment</legend>
            <p className="text-sm text-stone-700">
              <strong>Payment is not connected yet.</strong> When you choose a
              processor (Stripe or Square), this is where the secure card form /
              checkout button goes. For now, placing the order creates a receipt /
              delivery ticket and you collect payment your usual way.
            </p>
            <p className="mt-2 text-xs text-stone-500">
              Developer note: swap this block for a Stripe Checkout redirect or
              Square payment link. See README.
            </p>
          </fieldset>
        </div>

        {/* Order summary */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border border-amber-200 bg-white p-5">
            <h2 className="font-semibold text-amber-900">Order summary</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {order.lines.map((line) => (
                <li key={line.id} className="flex justify-between gap-2">
                  <span className="text-stone-700">
                    {line.name} × {line.quantity}
                  </span>
                  <span className="text-stone-900">{formatUSD(line.total)}</span>
                </li>
              ))}
              {order.addOns.map((a) => (
                <li key={a.id} className="flex justify-between gap-2">
                  <span className="text-stone-700">{a.name}</span>
                  <span className="text-stone-900">{formatUSD(a.total)}</span>
                </li>
              ))}
            </ul>
            {order.productsDiscount > 0 && (
              <p className="mt-2 text-sm font-medium text-green-700">
                Bulk discount applied: −{formatUSD(order.productsDiscount)}
              </p>
            )}
            <div className="mt-4 flex justify-between border-t border-stone-200 pt-3 text-lg font-bold text-amber-900">
              <span>Total</span>
              <span>{formatUSD(order.grandTotal)}</span>
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-md bg-amber-700 py-3 font-medium text-white hover:bg-amber-800"
            >
              Place order
            </button>

            <p className="mt-3 text-xs text-stone-500">
              {business.name} · Ohio Reg #: {business.registrationNumber}
            </p>
          </div>
        </aside>
      </form>
    </Layout>
  );
}
