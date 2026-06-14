import { useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import { products } from "../lib/config";
import { useCart } from "../lib/cart";

export default function Home() {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(null);

  function handleAdd(id, qty) {
    addToCart(id, qty);
    setAdded({ id, qty });
    setTimeout(() => setAdded(null), 2500);
  }

  return (
    <Layout title="Firewood for sale in Akron, Ohio">
      <section className="rounded-2xl bg-amber-800 px-6 py-10 text-amber-50">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Seasoned firewood, delivered around Akron
        </h1>
        <p className="mt-3 max-w-2xl text-amber-100">
          Sold by the cord and fraction of a cord. Pick your wood, choose
          delivery or pickup, and check out in minutes.
        </p>
      </section>

      <h2 className="mt-10 text-2xl font-bold text-amber-900">Our firewood</h2>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={handleAdd} />
        ))}
      </div>

      <p className="mt-6 text-sm text-stone-600">
        Need delivery or stacking? Add those at checkout. Delivery is free within
        our local radius of Akron; a flat fee applies beyond it.
      </p>

      {added && (
        <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg bg-green-700 px-4 py-3 text-sm text-white shadow-lg">
          <span>Added {added.qty} to your cart.</span>
          <Link href="/cart" className="rounded bg-white px-3 py-1 font-medium text-green-800">
            View cart
          </Link>
        </div>
      )}
    </Layout>
  );
}
