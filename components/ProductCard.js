import { useState } from "react";
import { formatUSD } from "../lib/cart";
import { bagDiscount } from "../lib/config";

export default function ProductCard({ product, onAdd }) {
  const [qty, setQty] = useState(1);

  const discountLabel =
    product.hasBulkDiscount &&
    (bagDiscount.type === "perUnit"
      ? `${formatUSD(bagDiscount.discountedUnitPrice)}/bag at ${bagDiscount.threshold}+`
      : `${bagDiscount.value}% off at ${bagDiscount.threshold}+`);

  return (
    <div className="flex flex-col rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-amber-900">{product.name}</h3>
        <span className="whitespace-nowrap text-lg font-bold text-amber-800">
          {formatUSD(product.price)}
        </span>
      </div>

      <p className="mt-1 text-sm text-stone-600">{product.blurb}</p>

      <ul className="mt-3 space-y-1 text-sm text-stone-700">
        {product.cubicFeet != null && (
          <li>
            <span className="font-medium">{product.cubicFeet} cubic feet</span>{" "}
            per {product.unitLabel}
          </li>
        )}
        {product.note && <li className="text-amber-700">{product.note}</li>}
        {discountLabel && (
          <li className="font-medium text-green-700">Bulk price: {discountLabel}</li>
        )}
      </ul>

      <div className="mt-4 flex items-center gap-2">
        <label htmlFor={`qty-${product.id}`} className="text-sm text-stone-600">
          Qty
        </label>
        <div className="flex items-center rounded-md border border-stone-300">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="px-3 py-1 text-lg text-stone-600 hover:bg-stone-100"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <input
            id={`qty-${product.id}`}
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            className="w-14 border-x border-stone-300 py-1 text-center"
          />
          <button
            type="button"
            aria-label="Increase quantity"
            className="px-3 py-1 text-lg text-stone-600 hover:bg-stone-100"
            onClick={() => setQty((q) => q + 1)}
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAdd(product.id, qty)}
        className="mt-4 w-full rounded-md bg-amber-700 py-2 font-medium text-white hover:bg-amber-800"
      >
        Add to cart
      </button>
    </div>
  );
}
