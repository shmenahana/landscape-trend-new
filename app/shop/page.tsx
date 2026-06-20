"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import Link from "next/link";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { getCroppedImg, type CropArea } from "@/lib/cropImage";
import { priceDollars, type PackageKey } from "@/lib/pricing";

type Stage = "landing" | "details" | "package" | "photos" | "cropping" | "review" | "payment" | "confirm";

const SHIPPING = 6.99;

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

export default function ShopPage() {
  const [stage, setStage] = useState<Stage>("landing");

  // Step 1 — customer details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");

  // Step 2 — package
  const [pkg, setPkg] = useState<PackageKey>("3");

  // Step 3 — photos
  const [photos, setPhotos] = useState<Blob[]>([]);
  const [thumbs, setThumbs] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxPhotos = pkg === "3" ? 3 : 9;
  const packageDollars = Number(priceDollars(pkg));
  const totalDollars = packageDollars + SHIPPING;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping state (always square)
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAreaPx, setCropAreaPx] = useState<CropArea | null>(null);

  const onCropComplete = useCallback((_: CropArea, areaPx: CropArea) => {
    setCropAreaPx(areaPx);
  }, []);

  const goToPackage = () => {
    if (!firstName.trim()) return setError("Please enter your first name.");
    if (!lastName.trim()) return setError("Please enter your last name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please enter a valid email address.");
    if (!street.trim()) return setError("Please enter your street address.");
    if (!city.trim()) return setError("Please enter your city.");
    if (!stateCode) return setError("Please select your state.");
    if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) return setError("Please enter a valid ZIP code.");
    setError(null);
    setStage("package");
  };

  const goToPhotos = () => {
    setError(null);
    // Trim any extra photos if the customer reduced the package size.
    setPhotos((p) => p.slice(0, maxPhotos));
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
      setPendingSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropAreaPx(null);
      setStage("cropping");
    };
    reader.readAsDataURL(file);
  };

  const confirmCrop = async () => {
    if (!pendingSrc || !cropAreaPx) return;
    try {
      const blob = await getCroppedImg(pendingSrc, cropAreaPx, { maxW: 1200, maxH: 1200 });
      const url = URL.createObjectURL(blob);
      setPhotos((p) => [...p, blob]);
      setThumbs((t) => [...t, url]);
      setPendingSrc(null);
      setStage("photos");
    } catch {
      setError("Could not process that photo. Try another.");
    }
  };

  const cancelCrop = () => {
    setPendingSrc(null);
    setStage("photos");
  };

  const removePhoto = (idx: number) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
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
        {stage === "landing" && <Landing onStart={() => { setError(null); setStage("details"); }} />}

        {stage === "details" && (
          <section className="w-full">
            <Header subtitle="Step 1 of 5 · Your Details" />
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
              <button className="btn-primary w-full" onClick={goToPackage}>Continue →</button>
            </div>
          </section>
        )}

        {stage === "package" && (
          <section className="w-full">
            <Header subtitle="Step 2 of 5 · Choose Your Package" />
            <div className="parlor-card p-6 mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <PackageOption active={pkg === "3"} onClick={() => setPkg("3")} count={3} price={12} />
                <PackageOption active={pkg === "9"} onClick={() => setPkg("9")} count={9} price={25} />
              </div>
              <div className="border-t border-bordercream pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-charcoal">
                  <span>{pkg === "9" ? "9 Magnets" : "3 Magnets"}</span>
                  <span>${money(packageDollars)}</span>
                </div>
                <div className="flex justify-between text-charcoal">
                  <span>Flat-rate shipping</span>
                  <span>${money(SHIPPING)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-bordercream">
                  <span className="label mb-0">Total</span>
                  <span className="font-serif text-gold text-2xl leading-none">${money(totalDollars)}</span>
                </div>
              </div>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button className="btn-primary w-full" onClick={goToPhotos}>Continue →</button>
              <button className="text-sm text-warmgray underline w-full" onClick={() => setStage("details")}>← Back to details</button>
            </div>
          </section>
        )}

        {stage === "photos" && (
          <section className="w-full">
            <Header subtitle="Step 3 of 5 · Your Photos" />
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

        {stage === "cropping" && pendingSrc && (
          <section className="w-full">
            <Header subtitle="Crop to Square" />
            <div className="parlor-card mt-6 overflow-hidden">
              <div className="relative w-full bg-charcoal" style={{ height: 360 }}>
                <Cropper image={pendingSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} showGrid />
              </div>
              <div className="p-4 space-y-3">
                <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" aria-label="Zoom" />
                <div className="flex gap-2">
                  <button className="btn-outline flex-1" onClick={cancelCrop}>Cancel</button>
                  <button className="btn-primary flex-1" onClick={confirmCrop}>Use Photo</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {stage === "review" && (
          <section className="w-full">
            <Header subtitle="Step 4 of 5 · Review Your Order" />
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

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="label">Name</p>
                  <p className="text-charcoal">{firstName} {lastName}</p>
                </div>
                <div>
                  <p className="label">Email</p>
                  <p className="text-charcoal break-words">{email}</p>
                </div>
                {phone.trim() && (
                  <div>
                    <p className="label">Phone</p>
                    <p className="text-charcoal">{prettyPhone}</p>
                  </div>
                )}
                <div>
                  <p className="label">Package</p>
                  <p className="text-charcoal">{pkg === "9" ? "9 Magnets" : "3 Magnets"}</p>
                </div>
              </div>

              <div>
                <p className="label">Ship To</p>
                <p className="text-charcoal text-sm leading-snug">
                  {street}<br />
                  {city}, {stateCode} {zip}
                </p>
              </div>

              <div className="border-t border-bordercream pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-charcoal"><span>{pkg === "9" ? "9 Magnets" : "3 Magnets"}</span><span>${money(packageDollars)}</span></div>
                <div className="flex justify-between text-charcoal"><span>Shipping</span><span>${money(SHIPPING)}</span></div>
                <div className="flex justify-between items-baseline pt-2 border-t border-bordercream">
                  <span className="label mb-0">Total</span>
                  <span className="font-serif text-gold text-2xl leading-none">${money(totalDollars)}</span>
                </div>
              </div>

              {error && <p className="text-sm text-red-700">{error}</p>}

              <button className="btn-primary w-full" onClick={() => { setError(null); setStage("payment"); }}>Continue to Payment →</button>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-outline" onClick={() => setStage("details")}>Edit Details</button>
                <button className="btn-outline" onClick={() => setStage("photos")}>Edit Photos</button>
              </div>
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
                <p className="text-xs text-warmgray mt-1">{pkg === "9" ? "9 Magnets" : "3 Magnets"} · ${money(SHIPPING)} shipping</p>
              </div>

              <ShippedPayment
                pkg={pkg}
                submitting={submitting}
                onSuccess={async (paymentIntentId) => {
                  try {
                    await submitOrder(paymentIntentId);
                    setStage("confirm");
                  } catch { /* error state already set */ }
                }}
              />

              {error && <p className="text-sm text-red-700">{error}</p>}

              <button className="text-sm text-warmgray underline w-full" onClick={() => setStage("review")} disabled={submitting}>← Back to review</button>
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
  return (
    <section className="w-full text-center mt-8">
      <p className="font-script text-gold text-4xl">The</p>
      <h1 className="font-serif text-5xl text-navy leading-tight tracking-wide">Magnet Parlor</h1>
      <div className="heart-divider my-6"><span>♥</span></div>
      <p className="font-serif italic text-warmgray text-lg">Order online — we ship nationwide.</p>

      <div className="parlor-card p-6 mt-10 text-left">
        <p className="font-serif text-navy text-xl mb-2">How it works</p>
        <ol className="space-y-2 text-warmgray text-sm">
          <li>1. Tell us where to ship your magnets.</li>
          <li>2. Pick your package — 3 or 9 magnets.</li>
          <li>3. Upload your favorite photos and crop them.</li>
          <li>4. Pay securely by card. We&apos;ll email tracking when it ships.</li>
        </ol>
        <p className="text-xs text-warmgray mt-4">Flat $6.99 shipping anywhere in the US.</p>
      </div>

      <button className="btn-primary mt-10 w-full text-lg" onClick={onStart}>Start Your Order</button>
    </section>
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

function PackageOption({ active, onClick, count, price }: { active: boolean; onClick: () => void; count: number; price: number }) {
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
  pkg, submitting, onSuccess,
}: {
  pkg: PackageKey;
  submitting: boolean;
  onSuccess: (paymentIntentId: string) => Promise<void>;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const stripeReady = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  async function startCard() {
    setIntentError(null);
    setCreatingIntent(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: pkg, orderType: "shipped" }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not start card payment");
      setClientSecret(j.clientSecret);
      setIntentId(j.paymentIntentId);
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
