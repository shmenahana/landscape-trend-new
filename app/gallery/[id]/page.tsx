"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { CoupleHeader } from "../../wedding/CoupleHeader";
import {
  galleryMagnetTotalCents,
  galleryOrderTotalCents,
  GALLERY_MAGNET_CENTS,
  GALLERY_EXPIRED_EACH_CENTS,
  SHIPPING_CENTS,
} from "@/lib/pricing";

type GalleryData = {
  id: string;
  coupleDisplayText: string;
  eventDate: string;
  customSubtitle: string;
  photos: string[];
  photoCount: number;
  coupleEmail: string;
  expiresAt: string;
  expired: boolean;
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV",
  "WI","WY","DC",
];

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

const money = (cents: number) => (cents / 100).toFixed(2);

export default function GalleryPage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState<"loading" | "ready" | "expired" | "notfound">("loading");
  const [data, setData] = useState<GalleryData | null>(null);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [view, setView] = useState<"gallery" | "checkout" | "done">("gallery");
  const [confirmEmail, setConfirmEmail] = useState("");

  useEffect(() => {
    fetch(`/api/gallery/${params.id}`, { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 410) return setStatus("expired");
        if (!r.ok) return setStatus("notfound");
        const j: GalleryData = await r.json();
        setData(j);
        setStatus("ready");
      })
      .catch(() => setStatus("notfound"));
  }, [params.id]);

  const daysLeft = useMemo(() => {
    if (!data) return 0;
    const exp = new Date(data.expiresAt.replace(" ", "T") + "Z").getTime();
    return Math.max(0, Math.ceil((exp - Date.now()) / (24 * 60 * 60 * 1000)));
  }, [data]);

  function toggleSelect(i: number) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  if (status === "loading") {
    return (
      <ShellCentered>
        <p className="font-script text-goldmuted text-3xl">One moment…</p>
      </ShellCentered>
    );
  }

  if (status === "expired") {
    return (
      <ShellCentered>
        <div className="ornament-line" aria-hidden><span>♥</span></div>
        <h1 className="font-script text-navy text-5xl leading-tight">The Magnet Parlor</h1>
        <div className="ornament-line" aria-hidden><span>♥</span></div>
        <p className="text-warmgray text-lg mt-6">This gallery has expired.</p>
        <p className="text-warmgray mt-2">
          Wedding galleries stay online for 30 days. Please reach out to us if you&apos;d
          still love copies of your photos.
        </p>
      </ShellCentered>
    );
  }

  if (status === "notfound" || !data) {
    return (
      <ShellCentered>
        <div className="ornament-line" aria-hidden><span>♥</span></div>
        <h1 className="font-script text-navy text-5xl leading-tight">The Magnet Parlor</h1>
        <div className="ornament-line" aria-hidden><span>♥</span></div>
        <p className="text-warmgray text-lg mt-6">We couldn&apos;t find that gallery.</p>
        <p className="text-warmgray mt-2">Please double-check the link you were sent.</p>
      </ShellCentered>
    );
  }

  const selectedIndexes = Array.from(selected).sort((a, b) => a - b);

  if (view === "done") {
    return (
      <ShellCentered>
        <div className="mx-auto w-20 h-20 rounded-full bg-navy flex items-center justify-center shadow-md">
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-warmwhite" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="font-serif text-4xl text-navy mt-6">Your magnets are on the way!</h1>
        <div className="heart-divider my-6"><span>♥</span></div>
        <p className="text-warmgray text-lg leading-relaxed">
          We&apos;ll send tracking info to{" "}
          <span className="text-charcoal font-semibold break-words">{confirmEmail}</span>{" "}
          when they ship.
        </p>
        <button
          className="btn-outline mt-8"
          onClick={() => { setSelected(new Set()); setView("gallery"); }}
        >
          ← Back to the gallery
        </button>
        <p className="font-script text-gold text-3xl mt-10">— The Magnet Parlor</p>
      </ShellCentered>
    );
  }

  if (view === "checkout") {
    return (
      <Checkout
        gallery={data}
        selectedIndexes={selectedIndexes}
        onBack={() => setView("gallery")}
        onDone={(email) => { setConfirmEmail(email); setView("done"); }}
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <div className="wedding-border" aria-hidden />
      <div className="w-full max-w-6xl mx-auto px-5 pb-28 flex-1">
        <div className="max-w-2xl mx-auto mt-6">
          <CoupleHeader
            coupleText={data.coupleDisplayText}
            eventDate={data.eventDate}
            subtitle={data.customSubtitle}
          />
          <p className="text-center text-warmgray mt-4 leading-relaxed">
            Every photo your guests shared throughout the celebration — all yours to keep.
          </p>
          <p className="text-center text-xs text-warmgray uppercase tracking-[0.3em] mt-4">
            {data.photoCount} photo{data.photoCount === 1 ? "" : "s"}
          </p>

          <div className="flex justify-center mt-5">
            <a
              href={`/api/gallery/${data.id}/download`}
              className="btn-outline text-sm inline-flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download All Photos
            </a>
          </div>

          {/* Urgency / pricing — framed as a warm offer, not a sales pitch. */}
          <div className="gallery-urgency mt-8 p-5 text-center">
            <p className="font-serif text-navy text-lg">Turn your favorites into magnets</p>
            <p className="text-warmgray text-sm mt-2 leading-relaxed">
              Order within 30 days and get magnets for{" "}
              <span className="text-gold font-serif">${money(GALLERY_MAGNET_CENTS)} each</span>{" "}
              (or 3 for ${money(2000)}). After that, ${money(GALLERY_EXPIRED_EACH_CENTS)} each.
            </p>
            <p className="text-xs text-warmgray mt-2 uppercase tracking-widest">
              {daysLeft} day{daysLeft === 1 ? "" : "s"} left · tap any photo&apos;s ♥ to add it
            </p>
          </div>
        </div>

        <div className="gallery-masonry mt-10">
          {data.photos.map((src, i) => {
            const isSel = selected.has(i);
            return (
              <div key={i} className="gallery-tile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Guest photo ${i + 1}`}
                  loading="lazy"
                  onClick={() => setLightbox(i)}
                />
                <button
                  type="button"
                  className={`gallery-magnet-btn ${isSel ? "is-selected" : ""}`}
                  onClick={() => toggleSelect(i)}
                  aria-pressed={isSel}
                >
                  <span aria-hidden>{isSel ? "✓" : "♥"}</span>
                  {isSel ? "Added" : "Order as Magnet"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="gallery-cart no-print">
          <div className="leading-tight">
            <p className="font-serif text-navy">
              {selected.size} magnet{selected.size === 1 ? "" : "s"} selected
            </p>
            <p className="text-xs text-warmgray">
              ${money(galleryOrderTotalCents(selected.size))} incl. shipping
            </p>
          </div>
          <button className="btn-primary text-sm py-2 px-4 whitespace-nowrap" onClick={() => setView("checkout")}>
            Review &amp; Checkout →
          </button>
        </div>
      )}

      {lightbox !== null && (
        <Lightbox
          photos={data.photos}
          index={lightbox}
          isSelected={selected.has(lightbox)}
          onToggle={() => toggleSelect(lightbox)}
          onClose={() => setLightbox(null)}
          onNav={(dir) =>
            setLightbox((cur) => {
              if (cur === null) return cur;
              const n = (cur + dir + data.photos.length) % data.photos.length;
              return n;
            })
          }
        />
      )}

      <footer className="text-center text-xs text-warmgray py-6">
        <span className="font-script text-goldmuted text-lg">The Magnet Parlor</span>
        <br />
        Capture the moment. Keep the memory.
      </footer>
    </main>
  );
}

function ShellCentered({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <div className="wedding-border" aria-hidden />
      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <section className="w-full max-w-md text-center">{children}</section>
      </div>
    </main>
  );
}

function Lightbox({
  photos, index, isSelected, onToggle, onClose, onNav,
}: {
  photos: string[];
  index: number;
  isSelected: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNav: (dir: number) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onNav(-1);
      else if (e.key === "ArrowRight") onNav(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNav]);

  return (
    <div className="lightbox no-print" onClick={onClose}>
      <button
        className="lightbox-btn left-4"
        onClick={(e) => { e.stopPropagation(); onNav(-1); }}
        aria-label="Previous photo"
      >‹</button>
      <div className="relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[index]} alt={`Guest photo ${index + 1}`} />
        <div className="mt-4 flex items-center gap-4">
          <button
            className={isSelected ? "btn-gold text-sm py-2 px-4" : "btn-primary text-sm py-2 px-4"}
            onClick={onToggle}
          >
            {isSelected ? "✓ Added as magnet" : "♥ Order as Magnet"}
          </button>
          <span className="text-warmwhite/80 text-sm">{index + 1} / {photos.length}</span>
        </div>
      </div>
      <button
        className="lightbox-btn right-4"
        onClick={(e) => { e.stopPropagation(); onNav(1); }}
        aria-label="Next photo"
      >›</button>
      <button
        className="absolute top-4 right-4 text-warmwhite text-3xl leading-none"
        onClick={onClose}
        aria-label="Close"
      >×</button>
    </div>
  );
}

// ── Checkout ─────────────────────────────────────────────────────────────────
function Checkout({
  gallery, selectedIndexes, onBack, onDone,
}: {
  gallery: GalleryData;
  selectedIndexes: number[];
  onBack: () => void;
  onDone: (email: string) => void;
}) {
  const count = selectedIndexes.length;
  const [name, setName] = useState("");
  const [email, setEmail] = useState(gallery.coupleEmail || "");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [payReady, setPayReady] = useState(false);

  const magnetsCents = galleryMagnetTotalCents(count);
  const totalCents = galleryOrderTotalCents(count);

  function validateDetails(): boolean {
    if (!name.trim()) { setError("Please enter a name for shipping."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter a valid email."); return false; }
    if (!street.trim()) { setError("Please enter your street address."); return false; }
    if (!city.trim()) { setError("Please enter your city."); return false; }
    if (!stateCode) { setError("Please select your state."); return false; }
    if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) { setError("Please enter a valid ZIP code."); return false; }
    setError(null);
    return true;
  }

  const shippingAddress = { street: street.trim(), city: city.trim(), state: stateCode, zip: zip.trim() };

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <div className="wedding-border" aria-hidden />
      <div className="flex-1 w-full max-w-md mx-auto px-5 pb-16">
        <div className="text-center mt-4">
          <p className="font-script text-goldmuted text-3xl leading-none">{gallery.coupleDisplayText || "Your Magnets"}</p>
          <p className="text-xs text-warmgray uppercase tracking-[0.3em] mt-3">Your Keepsake Magnets</p>
        </div>

        {/* Selected photos */}
        <div className="parlor-card p-5 mt-6">
          <p className="label">Your {count} magnet{count === 1 ? "" : "s"}</p>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {selectedIndexes.map((i) => (
              <div key={i} className="aspect-square rounded overflow-hidden border border-bordercream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gallery.photos[i]} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="parlor-card p-5 mt-4 space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Eleanor Hart" autoComplete="name" disabled={payReady} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email" disabled={payReady} />
          </div>
          <div>
            <label className="label">Street Address</label>
            <input className="input" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="123 Main St" autoComplete="address-line1" disabled={payReady} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">City</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cleveland" autoComplete="address-level2" disabled={payReady} />
            </div>
            <div>
              <label className="label">State</label>
              <select className="input" value={stateCode} onChange={(e) => setStateCode(e.target.value)} autoComplete="address-level1" disabled={payReady}>
                <option value="" disabled>Select…</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">ZIP Code</label>
            <input className="input" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="44101" inputMode="numeric" autoComplete="postal-code" disabled={payReady} />
          </div>
        </div>

        {/* Totals */}
        <div className="parlor-card p-5 mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-charcoal">
            <span>{count} magnet{count === 1 ? "" : "s"}</span>
            <span>${money(magnetsCents)}</span>
          </div>
          <div className="flex justify-between text-charcoal">
            <span>Flat-rate shipping</span>
            <span>${money(SHIPPING_CENTS)}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-bordercream">
            <span className="label mb-0">Total</span>
            <span className="font-serif text-gold text-2xl leading-none">${money(totalCents)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}

        {!payReady ? (
          <div className="mt-5 space-y-3">
            <button className="btn-primary w-full" onClick={() => { if (validateDetails()) setPayReady(true); }}>
              Continue to Payment →
            </button>
            <button className="text-sm text-warmgray underline w-full" onClick={onBack}>← Back to gallery</button>
          </div>
        ) : (
          <div className="mt-5">
            <GalleryPayment
              galleryId={gallery.id}
              count={count}
              selected={selectedIndexes}
              name={name.trim()}
              email={email.trim()}
              shippingAddress={shippingAddress}
              onEdit={() => setPayReady(false)}
              onDone={() => onDone(email.trim())}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function GalleryPayment({
  galleryId, count, selected, name, email, shippingAddress, onEdit, onDone,
}: {
  galleryId: string;
  count: number;
  selected: number[];
  name: string;
  email: string;
  shippingAddress: { street: string; city: string; state: string; zip: string };
  onEdit: () => void;
  onDone: () => void;
}) {
  const stripeReady = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!stripeReady) return;
    let cancelled = false;
    setCreating(true);
    fetch(`/api/gallery/${galleryId}/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Details go with the intent so the server validates the address before
      // any charge can exist.
      body: JSON.stringify({ count, name, email, shippingAddress }),
    })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "Could not start payment");
        if (cancelled) return;
        setClientSecret(j.clientSecret);
        setIntentId(j.paymentIntentId);
      })
      .catch((e) => { if (!cancelled) setError(e.message || "Could not start payment"); })
      .finally(() => { if (!cancelled) setCreating(false); });
    return () => { cancelled = true; };
  }, [galleryId, count, stripeReady]);

  if (!stripeReady) {
    return (
      <div className="parlor-card p-5 text-center">
        <p className="font-serif text-navy text-lg">Checkout unavailable</p>
        <p className="text-warmgray text-sm mt-1">Card payments aren&apos;t configured yet. Please check back soon.</p>
        <button className="text-sm text-warmgray underline mt-3" onClick={onEdit}>← Back</button>
      </div>
    );
  }

  if (creating || !clientSecret) {
    return (
      <div className="parlor-card p-5 text-center">
        <p className="text-warmgray text-sm">{error ? error : "Preparing secure checkout…"}</p>
        <button className="text-sm text-warmgray underline mt-3" onClick={onEdit}>← Back to details</button>
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#2B3856",
            colorBackground: "#FFFAF4",
            colorText: "#3A3632",
            colorDanger: "#b91c1c",
            fontFamily: "'Josefin Sans', system-ui, sans-serif",
            borderRadius: "4px",
          },
        },
      }}
    >
      <GalleryCardForm
        galleryId={galleryId}
        intentId={intentId!}
        selected={selected}
        name={name}
        email={email}
        shippingAddress={shippingAddress}
        onEdit={onEdit}
        onDone={onDone}
      />
    </Elements>
  );
}

function GalleryCardForm({
  galleryId, intentId, selected, name, email, shippingAddress, onEdit, onDone,
}: {
  galleryId: string;
  intentId: string;
  selected: number[];
  name: string;
  email: string;
  shippingAddress: { street: string; city: string; state: string; zip: string };
  onEdit: () => void;
  onDone: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pay() {
    if (!stripe || !elements) return;
    setBusy(true);
    setErr(null);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: "if_required" });
      if (error) throw new Error(error.message || "Payment failed");
      if (!paymentIntent || paymentIntent.status !== "succeeded") throw new Error("Payment was not completed.");
      const res = await fetch(`/api/gallery/${galleryId}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          selected,
          name,
          email,
          shippingAddress,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not finalize your order.");
      onDone();
    } catch (e: any) {
      setErr(e.message || "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="parlor-card p-5 space-y-4">
      <PaymentElement />
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button className="btn-primary w-full" onClick={pay} disabled={!stripe || busy}>
        {busy ? "Processing…" : "Pay Now"}
      </button>
      <button className="text-sm text-warmgray underline w-full" onClick={onEdit} disabled={busy}>
        ← Edit details
      </button>
      <p className="text-[10px] text-warmgray text-center">Payment ID: {intentId.slice(-6)}</p>
      <p className="text-center text-xs text-warmgray">
        <Link href="/" className="underline-offset-2 hover:underline">The Magnet Parlor</Link>
      </p>
    </div>
  );
}
