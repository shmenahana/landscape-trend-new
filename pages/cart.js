import Link from "next/link";
import Layout from "../components/Layout";
import { useCart, buildOrder, formatUSD } from "../lib/cart";

export default function CartPage() {
  const { items, setQuantity, count, loaded } = useCart();
  const order = buildOrder(items);

  return (
    <Layout title="Your cart">
      <h1 className="text-2xl font-bold text-amber-900">Your cart</h1>

      {loaded && count === 0 ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-white p-8 text-center">
          <p className="text-stone-600">Your cart is empty.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-md bg-amber-700 px-4 py-2 font-medium text-white hover:bg-amber-800"
          >
            Browse firewood
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {order.lines.map((line) => (
            <div
              key={line.id}
              className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold text-amber-900">{line.name}</p>
                <p className="text-sm text-stone-600">
                  {formatUSD(line.unitPrice)} each
                  {line.cubicFeet != null && (
                    <> · {line.cubicFeet} cubic feet total</>
                  )}
                </p>
                {line.discount > 0 && (
                  <p className="text-sm font-medium text-green-700">
                    Bulk discount −{formatUSD(line.discount)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-md border border-stone-300">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    className="px-3 py-1 text-lg text-stone-600 hover:bg-stone-100"
                    onClick={() => setQuantity(line.id, line.quantity - 1)}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={line.quantity}
                    onChange={(e) => setQuantity(line.id, e.target.value)}
                    className="w-14 border-x border-stone-300 py-1 text-center"
                  />
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    className="px-3 py-1 text-lg text-stone-600 hover:bg-stone-100"
                    onClick={() => setQuantity(line.id, line.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <span className="w-24 text-right font-semibold text-amber-900">
                  {formatUSD(line.total)}
                </span>
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-amber-200 bg-white p-5">
            <div className="flex items-center justify-between text-lg font-bold text-amber-900">
              <span>Subtotal</span>
              <span>{formatUSD(order.productsTotal)}</span>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Delivery and stacking are added at checkout.
            </p>
            <Link
              href="/checkout"
              className="mt-4 block rounded-md bg-amber-700 py-3 text-center font-medium text-white hover:bg-amber-800"
            >
              Continue to checkout
            </Link>
            <Link
              href="/"
              className="mt-2 block text-center text-sm text-amber-800 hover:underline"
            >
              Keep shopping
            </Link>
          </div>
        </div>
      )}
    </Layout>
  );
}
