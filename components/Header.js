import Link from "next/link";
import Logo from "./Logo";
import { useCart } from "../lib/cart";

export default function Header() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-20 border-b border-amber-200 bg-amber-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>
        <Link
          href="/cart"
          className="relative inline-flex items-center gap-2 rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          Cart
          {count > 0 && (
            <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-amber-800">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
