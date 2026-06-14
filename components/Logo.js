import { business } from "../lib/config";

// Shows the real logo if configured in lib/config.js, otherwise a clean
// text/emoji placeholder so the site looks finished today.
export default function Logo({ className = "" }) {
  if (business.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={business.logo} alt={business.name} className={className} />;
  }
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-700 text-lg text-white"
      >
        🪵
      </span>
      <span className="font-semibold leading-tight text-amber-900">
        West Akron
        <br className="hidden sm:block" /> Firewood
      </span>
    </div>
  );
}
