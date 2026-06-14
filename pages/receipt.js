import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import { useCart, buildOrder, formatUSD } from "../lib/cart";
import { business } from "../lib/config";

// Renders the receipt / delivery ticket from the order saved at checkout.
// Includes everything Ohio requires: business name, address, phone, email,
// registration number, product type, quantity in cubic feet, price, and date.
export default function ReceiptPage() {
  const [data, setData] = useState(null);
  const { clearCart } = useCart();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("wafs-last-order");
      if (raw) {
        setData(JSON.parse(raw));
        clearCart(); // order is finalized; empty the cart
      }
    } catch (e) {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return (
      <Layout title="Receipt">
        <h1 className="text-2xl font-bold text-amber-900">No recent order</h1>
        <p className="mt-3 text-stone-600">
          We couldn&apos;t find a recent order to show a receipt for.
        </p>
        <Link href="/" className="mt-4 inline-block text-amber-800 hover:underline">
          ← Back to store
        </Link>
      </Layout>
    );
  }

  const order = buildOrder(data.items, {
    delivery: data.fulfillment === "delivery",
    withinFreeRadius: data.withinFreeRadius,
    stacking: data.stacking,
  });
  const { address } = business;
  const dateStr = data.date
    ? new Date(data.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <Layout title="Receipt / Delivery Ticket">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-amber-900">Order confirmed</h1>
        <button
          onClick={() => window.print()}
          className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          Print / Save PDF
        </button>
      </div>
      <p className="mt-2 text-stone-600 print:hidden">
        Here is your receipt and delivery ticket. Keep a copy — print it or save
        as PDF.
      </p>

      {/* Printable ticket */}
      <div className="mt-6 rounded-xl border border-stone-300 bg-white p-6 text-sm text-stone-800">
        {/* Business header */}
        <div className="flex flex-col justify-between gap-2 border-b border-stone-200 pb-4 sm:flex-row">
          <div>
            <p className="text-lg font-bold text-amber-900">{business.name}</p>
            <p>
              {address.line1}, {address.city}, {address.state} {address.zip}
            </p>
            <p>
              {business.phone} · {business.email}
            </p>
            <p>Ohio Firewood/Vendor Registration #: {business.registrationNumber}</p>
          </div>
          <div className="sm:text-right">
            <p className="font-semibold">Receipt / Delivery Ticket</p>
            <p>Order #: {data.orderId}</p>
            <p>Placed: {new Date(data.placedAt).toLocaleString("en-US")}</p>
          </div>
        </div>

        {/* Customer + fulfillment */}
        <div className="grid gap-4 border-b border-stone-200 py-4 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-amber-900">Customer</p>
            <p>{data.customer.name}</p>
            <p>{data.customer.phone}</p>
            <p>{data.customer.email}</p>
            {data.fulfillment === "delivery" && data.customer.address && (
              <p>{data.customer.address}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="font-semibold text-amber-900">
              {data.fulfillment === "delivery" ? "Delivery" : "Pickup"}
            </p>
            <p>
              {data.fulfillment === "delivery" ? "Delivery date" : "Pickup date"}:{" "}
              {dateStr}
            </p>
            {data.notes && <p className="mt-1 italic">Notes: {data.notes}</p>}
          </div>
        </div>

        {/* Line items */}
        <table className="mt-4 w-full text-left">
          <thead>
            <tr className="border-b border-stone-300 text-xs uppercase tracking-wide text-stone-500">
              <th className="py-2">Product type</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Volume (cu ft)</th>
              <th className="py-2 text-right">Unit price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.id} className="border-b border-stone-100 align-top">
                <td className="py-2">
                  {line.name}
                  {line.discount > 0 && (
                    <span className="block text-xs text-green-700">
                      Bulk discount −{formatUSD(line.discount)}
                    </span>
                  )}
                </td>
                <td className="py-2 text-right">{line.quantity}</td>
                <td className="py-2 text-right">
                  {line.cubicFeet != null ? `${line.cubicFeet}` : "—"}
                </td>
                <td className="py-2 text-right">{formatUSD(line.unitPrice)}</td>
                <td className="py-2 text-right">{formatUSD(line.total)}</td>
              </tr>
            ))}
            {order.addOns.map((a) => (
              <tr key={a.id} className="border-b border-stone-100">
                <td className="py-2" colSpan={4}>
                  {a.name}
                </td>
                <td className="py-2 text-right">{formatUSD(a.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 ml-auto w-full max-w-xs space-y-1">
          <div className="flex justify-between">
            <span>Products</span>
            <span>{formatUSD(order.productsTotal)}</span>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{formatUSD(order.deliveryFee)}</span>
            </div>
          )}
          {order.stackingFee > 0 && (
            <div className="flex justify-between">
              <span>Stacking</span>
              <span>{formatUSD(order.stackingFee)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-stone-300 pt-1 text-base font-bold text-amber-900">
            <span>Total</span>
            <span>{formatUSD(order.grandTotal)}</span>
          </div>
        </div>

        <p className="mt-6 border-t border-stone-200 pt-4 text-xs text-stone-500">
          Firewood is sold by the cord or fraction of a cord. A full cord = 128
          cubic feet. Thank you for your business with {business.name}.
        </p>
      </div>

      <div className="mt-6 print:hidden">
        <Link href="/" className="text-amber-800 hover:underline">
          ← Back to store
        </Link>
      </div>
    </Layout>
  );
}
