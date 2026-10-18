"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { getSourceImg } from "@/lib/cropImage";
import { CropStep, isTooSmallToPrint, type PickedImage } from "../CropStep";
import { SHIPPING_CENTS, priceDollars, shippedQuote, type PackageKey, type ShippedQuote } from "@/lib/pricing";

type Stage = "landing" | "details" | "package" | "photos" | "cropping" | "review" | "payment" | "confirm";

const SHIPPING = SHIPPING_CENTS / 100;

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV",
  "WI","WY","DC",
];

// Lazy single-instance Stripe loader. The publishable key is public by design.
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

function money(n: number): string {
  return n.toFixed(2);
}

// A code the server says applies right now. Display only — the server
// re-derives the discount when it creates the PaymentIntent.
type AppliedPromo = { code: string; percentOff: number };

async function checkPromo(raw: string): Promise<AppliedPromo | null> {
  if (!raw.trim()) return null;
  try {
    const res = await fetch(`/api/promo?code=${encodeURIComponent(raw.trim())}`, { cache: "no-store" });
    const j = await res.json();
    return typeof j?.code === "string" && typeof j?.percentOff === "number" ? { code: j.code, percentOff: j.percentOff } : null;
  } catch {
    return null;
  }
}

export default function ShopPage() {
  const [stage, setStage] = useState<Stage>("landing");

  // Step 4 — customer details + shipping address (asked last, before payment)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");

  // Step 1 — package
  const [pkg, setPkg] = useState<PackageKey>("3");

  // Step 2 — photos
  const [photos, setPhotos] = useState<Blob[]>([]);
  const [thumbs, setThumbs] = useState<string[]>([]);
  // Uncropped copy of each photo (index-aligned with `photos`), uploaded so a
  // bad crop can be redone later. null if it couldn't be made — never blocks.
  const [sources, setSources] = useState<(Blob | null)[]>([]);
  // FILL crop short side in source px per photo (null = FIT), for the
  // dashboard's "low res" badge.
  const [cropPxs, setCropPxs] = useState<(number | null)[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Promo: from ?code= on load (the postcard QR), or typed at review.
  // Unknown codes are ignored silently — full price, no error.
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoChecking, setPromoChecking] = useState(false);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return;
    setPromoInput(code.trim());
    checkPromo(code).then((p) => { if (p) setPromo(p); });
  }, []);
  async function applyPromoInput() {
    setPromoChecking(true);
    const p = await checkPromo(promoInput);
    setPromoChecking(false);
    if (p) setPromo(p);
  }

  const maxPhotos = pkg === "3" ? 3 : 9;
  const quote = shippedQuote(pkg, promo?.percentOff ?? 0);
  const totalDollars = quote.totalCents / 100;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping state (always square)
  // Photo picked and awaiting its crop/fit step.
  const [pending, setPending] = useState<PickedImage | null>(null);
  // Square magnets get Fill/Fit + the 720px floor; 2x3 keeps the plain cropper.
  const square = true;

  const goToPayment = () => {
    if (!firstName.trim()) return setError("Please enter your first name.");
    if (!lastName.trim()) return setError("Please enter your last name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please enter a valid email address.");
    if (!street.trim()) return setError("Please enter your street address.");
    if (!city.trim()) return setError("Please enter your city.");
    if (!stateCode) return setError("Please select your state.");
    if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) return setError("Please enter a valid ZIP code.");
    setError(null);
    setStage("payment");
  };

  const goToPhotos = () => {
    setError(null);
    // Trim any extra photos if the customer reduced the package size.
    setPhotos((p) => p.slice(0, maxPhotos));
    setSources((s) => s.slice(0, maxPhotos));
    setCropPxs((c) => c.slice(0, maxPhotos));
    setThumbs((t) => {
      t.slice(maxPhotos).forEach((u) => URL.revokeObjectURL(u));
      return t.slice(0, maxPhotos);
    });
    setStage("photos");
  };

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const picked = { src, width: img.naturalWidth, height: img.naturalHeight };
        if (isTooSmallToPrint(picked, square)) {
          return setError("That photo is too small to print sharp. Please choose a different one.");
        }
        setError(null);
        setPending(picked);
        setStage("cropping");
      };
      img.onerror = () => setError("Could not open that photo. Try another.");
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const confirmCrop = async (blob: Blob, cropPx: number | null) => {
    if (!pending) return;
    const url = URL.createObjectURL(blob);
    const source = await getSourceImg(pending.src).catch(() => null);
    setPhotos((p) => [...p, blob]);
    setSources((s) => [...s, source]);
    setCropPxs((c) => [...c, cropPx]);
    setThumbs((t) => [...t, url]);
    setPending(null);
    setStage("photos");
  };

  const cancelCrop = () => {
    setPending(null);
    setStage("photos");
  };

  const removePhoto = (idx: number) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
    setSources((s) => s.filter((_, i) => i !== idx));
    setCropPxs((c) => c.filter((_, i) => i !== idx));
    setThumbs((t) => {
      URL.revokeObjectURL(t[idx]);
      return t.filter((_, i) => i !== idx);
    });
  };

  const goToReview = () => {
    if (photos.length !== maxPhotos) return setError(`Please upload all ${maxPhotos} photos.`);
    setError(null);
    setStage("review");
  };

  const prettyPhone = useMemo(() => {
    const d = phone.replace(/\D/g, "");
    if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    if (d.length === 11 && d.startsWith("1")) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
    return phone;
  }, [phone]);

  async function submitOrder(paymentIntentId: string) {
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("orderType", "shipped");
      form.append("firstName", firstName.trim());
      form.append("lastName", lastName.trim());
      form.append("email", email.trim());
      form.append("phone", phone.trim());
      form.append("package", pkg);
      form.append("paymentMethod", "stripe");
      form.append("paymentIntentId", paymentIntentId);
      form.append(
        "shippingAddress",
        JSON.stringify({ street: street.trim(), city: city.trim(), state: stateCode, zip: zip.trim() })
      );
      photos.forEach((b, i) => form.append("photos", b, `photo-${i}.jpg`));
      sources.forEach((b, i) => { if (b) form.append(`source-${i}`, b, `photo-${i}-source.jpg`); });
      cropPxs.forEach((px, i) => { if (px !== null) form.append(`cropPx-${i}`, String(px)); });
      const res = await fetch("/api/orders", { method: "POST", body: form });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Submission failed");
      return j.order;
    } catch (e: any) {
      setError(e.message || "Something went wrong. Try again.");
      throw e;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="awning" />
      <div className="flex-1 flex flex-col items-center px-5 py-8 max-w-md w-full mx-auto">
        {stage === "landing" && <Landing onStart={() => { setError(null); setStage("package"); }} />}

        {stage === "package" && (
          <section className="w-full">
            <Header subtitle="Step 1 of 5 · Choose Your Package" />
            <div className="parlor-card p-6 mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <PackageOption active={pkg === "3"} onClick={() => setPkg("3")} count={3} price={priceDollars("3")} />
                <PackageOption active={pkg === "9"} onClick={() => setPkg("9")} count={9} price={priceDollars("9")} />
              </div>
              <Totals pkg={pkg} quote={quote} promo={promo} shippingLabel="Flat-rate shipping" />
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button className="btn-primary w-full" onClick={goToPhotos}>Continue →</button>
            </div>
          </section>
        )}

        {stage === "photos" && (
          <section className="w-full">
            <Header subtitle="Step 2 of 5 · Your Photos" />
            <div className="parlor-card p-6 mt-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <p className="font-serif text-navy text-lg">{photos.length} of {maxPhotos} photos uploaded</p>
                <span className="text-xs text-warmgray uppercase tracking-widest">{pkg === "3" ? "3 Magnets" : "9 Magnets"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: maxPhotos }).map((_, i) => {
                  const t = thumbs[i];
                  return (
                    <div key={i} className="aspect-square border border-bordercream rounded bg-cream relative overflow-hidden">
                      {t ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-navy/80 text-warmwhite rounded-full w-6 h-6 text-xs" aria-label="Remove">×</button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-bordercream text-3xl font-serif">{i + 1}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
              {photos.length < maxPhotos && (
                <button className="btn-outline w-full" onClick={() => fileInputRef.current?.click()}>+ Add Photo {photos.length + 1}</button>
              )}
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button className="btn-primary w-full" onClick={goToReview} disabled={photos.length !== maxPhotos}>Review Order →</button>
              <button className="text-sm text-warmgray underline w-full" onClick={() => setStage("package")}>← Back to package</button>
            </div>
          </section>
        )}

        {stage === "cropping" && pending && (
          <section className="w-full">
            <Header subtitle="Fit or Crop" />
            <CropStep
              key={pending.src}
              image={pending}
              square={square}
              onConfirm={confirmCrop}
              onCancel={cancelCrop}
            />
          </section>
        )}

        {stage === "review" && (
          <section className="w-full">
            <Header subtitle="Step 3 of 5 · Review Your Order" />
            <div className="parlor-card p-6 mt-6 space-y-5">
              <div>
                <p className="label">Your Magnets</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {thumbs.map((t, i) => (
                    <div key={i} className="aspect-square rounded overflow-hidden border border-bordercream relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-sm">
                <p className="label">Package</p>
                <p className="text-charcoal">{pkg === "9" ? "9 Magnets" : "3 Magnets"}</p>
              </div>

              <Totals pkg={pkg} quote={quote} promo={promo} shippingLabel="Shipping" />

              <form
                className="flex gap-2 items-end"
                onSubmit={(e) => { e.preventDefault(); applyPromoInput(); }}
              >
                <label className="flex-1">
                  <span className="label">Promo code</span>
                  <input
                    className="input uppercase"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Optional"
                  />
                </label>
                <button type="submit" className="btn-outline px-4" disabled={promoChecking || !promoInput.trim()}>
                  {promoChecking ? "…" : "Apply"}
                </button>
              </form>

              {error && <p className="text-sm text-red-700">{error}</p>}

              <button className="btn-primary w-full" onClick={() => { setError(null); setStage("details"); }}>Continue to Shipping →</button>
              <button className="btn-outline w-full" onClick={() => setStage("photos")}>Edit Photos</button>
            </div>
          </section>
        )}

        {stage === "details" && (
          <section className="w-full">
            <Header subtitle="Step 4 of 5 · Shipping Details" />
            <div className="parlor-card p-6 mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name</label>
                  <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Eleanor" autoComplete="given-name" />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Hart" autoComplete="family-name" />
                </div>
              </div>
              <div>
                <label className="label">Email Address</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email" />
              </div>
              <div>
                <label className="label">Phone Number <span className="normal-case tracking-normal text-warmgray">(optional)</span></label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" inputMode="tel" autoComplete="tel" />
              </div>
              <div>
                <label className="label">Street Address</label>
                <input className="input" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="123 Main St" autoComplete="address-line1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">City</label>
                  <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cleveland" autoComplete="address-level2" />
                </div>
                <div>
                  <label className="label">State</label>
                  <select className="input" value={stateCode} onChange={(e) => setStateCode(e.target.value)} autoComplete="address-level1">
                    <option value="" disabled>Select…</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">ZIP Code</label>
                <input className="input" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="44101" inputMode="numeric" autoComplete="postal-code" />
              </div>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button className="btn-primary w-full" onClick={goToPayment}>Continue to Payment →</button>
              <button className="text-sm text-warmgray underline w-full" onClick={() => { setError(null); setStage("review"); }}>← Back to review</button>
            </div>
          </section>
        )}

        {stage === "payment" && (
          <section className="w-full">
            <Header subtitle="Step 5 of 5 · Payment" />
            <div className="mt-6 space-y-4">
              <div className="parlor-card p-5 text-center">
                <p className="text-xs text-warmgray uppercase tracking-widest">Total (incl. shipping)</p>
                <p className="font-serif text-gold text-4xl leading-none mt-1">${money(totalDollars)}</p>
                <p className="text-xs text-warmgray mt-1">
                  {pkg === "9" ? "9 Magnets" : "3 Magnets"}
                  {promo && quote.discountCents > 0 && <> · {promo.code} −${money(quote.discountCents / 100)}</>}
                  {" "}· ${money(SHIPPING)} shipping
                </p>
                <p className="text-xs text-charcoal mt-3 leading-snug">
                  Ships to {firstName} {lastName}, {street}, {city}, {stateCode} {zip}
                </p>
              </div>

              <ShippedPayment
                pkg={pkg}
                promoCode={promo?.code ?? null}
                expectedCents={quote.totalCents}
                customer={{
                  firstName: firstName.trim(),
                  lastName: lastName.trim(),
                  email: email.trim(),
                  shippingAddress: { street: street.trim(), city: city.trim(), state: stateCode, zip: zip.trim() },
                }}
                submitting={submitting}
                onSuccess={async (paymentIntentId) => {
                  try {
                    await submitOrder(paymentIntentId);
                    setStage("confirm");
                  } catch { /* error state already set */ }
                }}
              />

              {error && <p className="text-sm text-red-700">{error}</p>}

              <button className="text-sm text-warmgray underline w-full" onClick={() => setStage("details")} disabled={submitting}>← Back to shipping details</button>
            </div>
          </section>
        )}

        {stage === "confirm" && (
          <section className="w-full text-center mt-12">
            <div className="mx-auto w-20 h-20 rounded-full bg-navy flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-warmwhite" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="font-serif text-4xl text-navy mt-6">Your order has been placed!</h1>
            <div className="heart-divider my-6"><span>♥</span></div>
            <p className="text-warmgray text-lg leading-relaxed">
              We&apos;ll send tracking info to <span className="text-charcoal font-semibold break-words">{email}</span> when your magnets ship.
            </p>
            <p className="font-script text-gold text-3xl mt-10">— The Magnet Parlor</p>
          </section>
        )}
      </div>
      <footer className="text-center text-xs text-warmgray py-4">
        <Link href="/" className="underline-offset-2 hover:underline">The Magnet Parlor</Link>{" "}
        · Capture the moment. Keep the memory.
      </footer>
    </main>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  // Cold visitors (store QR code) see the price before anything else.
  return (
    <section className="w-full text-center mt-8">
      <p className="font-script text-gold text-4xl">The</p>
      <h1 className="font-serif text-5xl text-navy leading-tight tracking-wide">Magnet Parlor</h1>
      <div className="heart-divider my-6"><span>♥</span></div>
      <p className="font-serif italic text-warmgray text-lg">Your photos on magnets, shipped to your door.</p>

      <div className="grid grid-cols-2 gap-3 mt-8">
        {(["3", "9"] as const).map((k) => (
          <div key={k} className="parlor-card p-5">
            <div className="font-serif text-navy text-3xl leading-none">{k}</div>
            <div className="text-xs text-warmgray uppercase tracking-widest mt-1">Magnets</div>
            <div className="font-serif text-gold text-2xl mt-3">${priceDollars(k)}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-warmgray mt-4">Flat ${money(SHIPPING)} shipping anywhere in the US.</p>

      <button className="btn-primary mt-8 w-full text-lg" onClick={onStart}>Start Your Order</button>
    </section>
  );
}

// Subtotal, promo line (when one applies), shipping, total — all from the
// same shippedQuote the server charges with.
function Totals({ pkg, quote, promo, shippingLabel }: {
  pkg: PackageKey; quote: ShippedQuote; promo: AppliedPromo | null; shippingLabel: string;
}) {
  const discounted = promo !== null && quote.discountCents > 0;
  return (
    <div className="border-t border-bordercream pt-4 space-y-2 text-sm">
      <div className="flex justify-between text-charcoal">
        <span>{pkg === "9" ? "9 Magnets" : "3 Magnets"}{discounted && " (subtotal)"}</span>
        <span>${money(quote.subtotalCents / 100)}</span>
      </div>
      {discounted && (
        <div className="flex justify-between text-navy">
          <span>{promo.code} ({promo.percentOff}% off)</span>
          <span>−${money(quote.discountCents / 100)}</span>
        </div>
      )}
      <div className="flex justify-between text-charcoal">
        <span>{shippingLabel}</span>
        <span>${money(quote.shippingCents / 100)}</span>
      </div>
      <div className="flex justify-between items-baseline pt-2 border-t border-bordercream">
        <span className="label mb-0">Total</span>
        <span className="font-serif text-gold text-2xl leading-none">${money(quote.totalCents / 100)}</span>
      </div>
    </div>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <div className="text-center mt-2">
      <p className="font-script text-gold text-2xl">The</p>
      <h2 className="font-serif text-3xl text-navy -mt-2">Magnet Parlor</h2>
      <p className="text-xs text-warmgray uppercase tracking-widest mt-3">{subtitle}</p>
    </div>
  );
}

function PackageOption({ active, onClick, count, price }: { active: boolean; onClick: () => void; count: number; price: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded border text-left transition ${active ? "border-navy bg-navy text-warmwhite" : "border-bordercream bg-warmwhite text-charcoal"}`}
    >
      <div className="font-serif text-2xl">{count}</div>
      <div className="text-xs uppercase tracking-widest">Magnets</div>
      <div className={`text-sm mt-2 ${active ? "text-warmwhite" : "text-gold"}`}>${price}</div>
    </button>
  );
}

function ShippedPayment({
  pkg, promoCode, expectedCents, customer, submitting, onSuccess,
}: {
  pkg: PackageKey;
  // Just the code — the server looks it up and prices the intent itself.
  promoCode: string | null;
  // What the page is showing, to catch a code that stopped applying
  // between review and payment (the server's amount always wins).
  expectedCents: number;
  // Sent with the intent request so the server validates the address before
  // any charge can exist.
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    shippingAddress: { street: string; city: string; state: string; zip: string };
  };
  submitting: boolean;
  onSuccess: (paymentIntentId: string) => Promise<void>;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [chargedCents, setChargedCents] = useState<number | null>(null);
  const stripeReady = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  async function startCard() {
    setIntentError(null);
    setCreatingIntent(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: pkg, orderType: "shipped", promoCode, ...customer }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not start card payment");
      setClientSecret(j.clientSecret);
      setIntentId(j.paymentIntentId);
      setChargedCents(typeof j.amount === "number" ? j.amount : null);
    } catch (e: any) {
      setIntentError(e.message || "Could not start card payment");
    } finally {
      setCreatingIntent(false);
    }
  }

  if (!stripeReady) {
    return (
      <div className="parlor-card p-5 text-center">
        <p className="font-serif text-navy text-lg">Online checkout unavailable</p>
        <p className="text-warmgray text-sm mt-1">Card payments are not configured yet. Please check back soon.</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="space-y-3">
        <button onClick={startCard} disabled={creatingIntent || submitting} className="btn-primary w-full disabled:opacity-50">
          {creatingIntent ? "Loading…" : "Enter Card Details"}
        </button>
        {intentError && <p className="text-sm text-red-700">{intentError}</p>}
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
      {chargedCents !== null && chargedCents !== expectedCents && (
        <p className="text-sm text-navy text-center mb-3">
          Your card will be charged ${money(chargedCents / 100)}.
        </p>
      )}
      <CardForm intentId={intentId!} onSuccess={onSuccess} />
    </Elements>
  );
}

function CardForm({ intentId, onSuccess }: { intentId: string; onSuccess: (paymentIntentId: string) => Promise<void> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [payErr, setPayErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pay() {
    if (!stripe || !elements) return;
    setBusy(true);
    setPayErr(null);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: "if_required" });
      if (error) throw new Error(error.message || "Payment failed");
      if (!paymentIntent || paymentIntent.status !== "succeeded") throw new Error("Payment was not completed.");
      await onSuccess(paymentIntent.id);
    } catch (e: any) {
      setPayErr(e.message || "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="parlor-card p-5 space-y-4">
      <PaymentElement />
      {payErr && <p className="text-sm text-red-700">{payErr}</p>}
      <button className="btn-primary w-full" onClick={pay} disabled={!stripe || busy}>{busy ? "Processing…" : "Pay Now"}</button>
      <p className="text-[10px] text-warmgray text-center">Payment ID: {intentId.slice(-6)}</p>
    </div>
  );
}
