import { business } from "../lib/config";

// Required by Ohio: business name, contact, and the firewood/vendor
// registration number are shown on every page.
export default function Footer() {
  const { address } = business;
  return (
    <footer className="mt-16 border-t border-amber-200 bg-amber-900 text-amber-50">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm">
        <p className="text-base font-semibold">{business.name}</p>
        <p className="mt-1 text-amber-100/90">
          {address.line1}, {address.city}, {address.state} {address.zip}
        </p>
        <p className="mt-1 text-amber-100/90">
          <a href={`tel:${business.phone}`} className="hover:underline">
            {business.phone}
          </a>{" "}
          ·{" "}
          <a href={`mailto:${business.email}`} className="hover:underline">
            {business.email}
          </a>
        </p>
        <p className="mt-1 text-amber-100/90">
          Ohio Firewood/Vendor Registration #: {business.registrationNumber}
        </p>
        <p className="mt-4 text-xs text-amber-200/70">
          Firewood is sold by the cord or fraction of a cord. A full cord = 128
          cubic feet. © {new Date().getFullYear()} {business.name}.
        </p>
      </div>
    </footer>
  );
}
