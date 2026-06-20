"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import Link from "next/link";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { getCroppedImg, type CropArea } from "@/lib/cropImage";
import { priceDollars, type PackageKey } from "@/lib/pricing";

type Stage =
  | "landing"
  | "details"
  | "photos"
  | "cropping"
  | "review"
  | "payment"
  | "waiting_cash"
  | "confirm";
type MagnetSize = "2x2" | "2x3";

// Lazy single-instance Stripe loader. The publishable key is public by design.
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

export default function CustomerOrderPage() {
  const [stage, setStage] = useState<Stage>("landing");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [pkg, setPkg] = useState<PackageKey>("3");
  const [photos, setPhotos] = useState<Blob[]>([]);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magnetSize, setMagnetSize] = useState<MagnetSize>("2x2");
  const [smsConsent, setSmsConsent] = useState(false);

  // Set once an order is created. Cash orders need it for polling; Stripe
  // orders just keep it for completeness.
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingOrderCode, setPendingOrderCode] = useState<string>("");
  const [waitingStatus, setWaitingStatus] = useState<string>("cash_pending");
  // Market orders ahead of this one when it was submitted — drives the wait estimate.
  const [ordersAhead, setOrdersAhead] = useState<number>(0);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => { if (j.activeMagnetSize) setMagnetSize(j.activeMagnetSize); })
      .catch(() => {});
  }, []);

  const cropAspect = magnetSize === "2x3" ? 2 / 3 : 1;
  const cellAspectClass = magnetSize === "2x3" ? "aspect-[2/3]" : "aspect-square";
  const maxPhotos = pkg === "3" ? 3 : 9;
  const totalDollars = priceDollars(pkg);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingSrc, setPendingSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAreaPx, setCropAreaPx] = useState<CropArea | null>(null);

  const onCropComplete = useCallback((_: CropArea, areaPx: CropArea) => {
    setCropAreaPx(areaPx);
  }, []);

  const startDetails = () => {
    setError(null);
    setStage("details");
  };

  const goToPhotos = () => {
    if (!firstName.trim()) return setError("Please enter your first name.");
    if (phone.replace(/\D/g, "").length < 10) return setError("Please enter a valid phone number.");
    if (!smsConsent) return setError("Please agree to receive a text when your order is ready.");
    setError(null);
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
      const blob = await getCroppedImg(
        pendingSrc,
        cropAreaPx,
        magnetSize === "2x3" ? { maxW: 800, maxH: 1200 } : { maxW: 1200, maxH: 1200 }
      );
      const url = URL.createObjectURL(blob);
      setPhotos((p) => [...p, blob]);
      setThumbs((t) => [...t, url]);
      setPendingSrc(null);
      setStage("photos");
    } catch (err) {
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
    if (photos.length !== maxPhotos) {
      return setError(`Please upload all ${maxPhotos} photos.`);
    }
    setError(null);
    setStage("review");
  };

  const prettyPhone = useMemo(() => {
    const d = phone.replace(/\D/g, "");
    if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    if (d.length === 11 && d.startsWith("1")) {
      return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
    }
    return phone;
  }, [phone]);

  // Submits the order to /api/orders with the given payment metadata.
  // Used by both Stripe (after card success) and Cash flows.
  async function submitOrder(opts: { paymentMethod: "stripe" | "cash"; paymentIntentId?: string }) {
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("firstName", firstName.trim());
      form.append("phone", phone);
      form.append("package", pkg);
      form.append("magnetSize", magnetSize);
      form.append("smsConsent", smsConsent ? "true" : "false");
      form.append("paymentMethod", opts.paymentMethod);
      if (opts.paymentIntentId) form.append("paymentIntentId", opts.paymentIntentId);
      photos.forEach((b, i) => form.append("photos", b, `photo-${i}.jpg`));
      const res = await fetch("/api/orders", { method: "POST", body: form });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Submission failed");
      setPendingOrderId(j.order.id);
      setPendingOrderCode(j.order.orderCode || "");
      setWaitingStatus(j.order.paymentStatus);
      setOrdersAhead(typeof j.ordersAhead === "number" ? j.ordersAhead : 0);
      return j.order;
    } catch (e: any) {
      setError(e.message || "Something went wrong. Try again.");
      throw e;
    } finally {
      setSubmitting(false);
    }
  }

  // Cash waiting screen: poll for operator confirmation.
  useEffect(() => {
    if (stage !== "waiting_cash" || !pendingOrderId) return;
    const tick = async () => {
      try {
        const res = await fetch(`/api/orders/${pendingOrderId}/status`, { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        setWaitingStatus(j.paymentStatus);
        if (j.paymentStatus === "cash_confirmed") {
          setStage("confirm");
        }
      } catch { /* ignore — keep polling */ }
    };
    tick();
    const t = setInterval(tick, 3000);
    return () => clearInterval(t);
  }, [stage, pendingOrderId]);

  return (
    <main className="min-h-screen flex flex-col">
      <div className="awning" />
      <div className="flex-1 flex flex-col items-center px-5 py-8 max-w-md w-full mx-auto">
        {stage === "landing" && <Landing onStart={startDetails} />}

        {stage === "details" && (
          <section className="w-full">
            <Header subtitle="Step 1 of 4 · Your Details" />
            <div className="parlor-card p-6 mt-6 space-y-5">
              <div>
                <label className="label">First Name</label>
                <input
                  className="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Eleanor"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  inputMode="tel"
                  autoComplete="tel"
                />
                <p className="text-xs text-warmgray mt-1">We&apos;ll text you when your magnets are ready.</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-navy shrink-0"
                />
                <span className="text-sm text-charcoal leading-snug">
                  I agree to receive a text message when my order is ready for pickup.
                </span>
              </label>
              <div>
                <label className="label">Package</label>
                <div className="grid grid-cols-2 gap-3">
                  <PackageOption active={pkg === "3"} onClick={() => setPkg("3")} count={3} price={12} />
                  <PackageOption active={pkg === "9"} onClick={() => setPkg("9")} count={9} price={25} />
                </div>
              </div>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button
                className="btn-primary w-full"
                onClick={goToPhotos}
                disabled={!smsConsent}
              >
                Continue →
              </button>
            </div>
          </section>
        )}

        {stage === "photos" && (
          <section className="w-full">
            <Header subtitle="Step 2 of 4 · Your Photos" />
            <div className="parlor-card p-6 mt-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <p className="font-serif text-navy text-lg">
                  {photos.length} of {maxPhotos} photos uploaded
                </p>
                <span className="text-xs text-warmgray uppercase tracking-widest">
                  {pkg === "3" ? "3 Magnets" : "9 Magnets"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: maxPhotos }).map((_, i) => {
                  const t = thumbs[i];
                  return (
                    <div
                      key={i}
                      className={`${cellAspectClass} border border-bordercream rounded bg-cream relative overflow-hidden`}
                    >
                      {t ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          <button
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 bg-navy/80 text-warmwhite rounded-full w-6 h-6 text-xs"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-bordercream text-3xl font-serif">
                          {i + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFilePicked}
              />
              {photos.length < maxPhotos && (
                <button
                  className="btn-outline w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  + Add Photo {photos.length + 1}
                </button>
              )}

              {error && <p className="text-sm text-red-700">{error}</p>}

              <button
                className="btn-primary w-full"
                onClick={goToReview}
                disabled={photos.length !== maxPhotos}
              >
                Review Order →
              </button>
              <button
                className="text-sm text-warmgray underline w-full"
                onClick={() => setStage("details")}
              >
                ← Back to details
              </button>
            </div>
          </section>
        )}

        {stage === "cropping" && pendingSrc && (
          <section className="w-full">
            <Header subtitle={magnetSize === "2x3" ? "Crop to 2:3" : "Crop to Square"} />
            <div className="parlor-card mt-6 overflow-hidden">
              <div className="relative w-full bg-charcoal" style={{ height: 360 }}>
                <Cropper
                  image={pendingSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={cropAspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid
                />
              </div>
              <div className="p-4 space-y-3">
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                  aria-label="Zoom"
                />
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
            <Header subtitle="Step 3 of 4 · Review Your Order" />
            <div className="parlor-card p-6 mt-6 space-y-5">
              <div>
                <p className="label">Your Magnets</p>
                <div className={`grid grid-cols-3 gap-2 mt-2`}>
                  {thumbs.map((t, i) => (
                    <div key={i} className={`${cellAspectClass} rounded overflow-hidden border border-bordercream relative`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="label">Name</p>
                  <p className="text-charcoal">{firstName}</p>
                </div>
                <div>
                  <p className="label">Phone</p>
                  <p className="text-charcoal">{prettyPhone}</p>
                </div>
                <div>
                  <p className="label">Package</p>
                  <p className="text-charcoal">{pkg === "9" ? "9 Magnets" : "3 Magnets"}</p>
                </div>
                <div>
                  <p className="label">Total</p>
                  <p className="font-serif text-gold text-2xl leading-none">${totalDollars}.00</p>
                </div>
              </div>

              {error && <p className="text-sm text-red-700">{error}</p>}

              <button className="btn-primary w-full" onClick={() => { setError(null); setStage("payment"); }}>
                Continue to Payment →
              </button>
              <button
                className="btn-outline w-full"
                onClick={() => setStage("photos")}
              >
                ← Edit Photos
              </button>
            </div>
          </section>
        )}

        {stage === "payment" && (
          <section className="w-full">
            <Header subtitle="Step 4 of 4 · Payment" />
            <div className="mt-6 space-y-4">
              <div className="parlor-card p-5 text-center">
                <p className="text-xs text-warmgray uppercase tracking-widest">Total</p>
                <p className="font-serif text-gold text-4xl leading-none mt-1">${totalDollars}.00</p>
                <p className="text-xs text-warmgray mt-1">{pkg === "9" ? "9 Magnets" : "3 Magnets"}</p>
              </div>

              <PaymentChoice
                pkg={pkg}
                submitting={submitting}
                onCardSuccess={async (paymentIntentId) => {
                  try {
                    await submitOrder({ paymentMethod: "stripe", paymentIntentId });
                    setStage("confirm");
                  } catch { /* error state already set */ }
                }}
                onCashChosen={async () => {
                  try {
                    await submitOrder({ paymentMethod: "cash" });
                    setStage("waiting_cash");
                  } catch { /* error state already set */ }
                }}
              />

              {error && <p className="text-sm text-red-700">{error}</p>}

              <button
                className="text-sm text-warmgray underline w-full"
                onClick={() => setStage("review")}
                disabled={submitting}
              >
                ← Back to review
              </button>
            </div>
          </section>
        )}

        {stage === "waiting_cash" && (
          <section className="w-full text-center mt-8">
            <p className="font-script text-gold text-3xl">The</p>
            <h2 className="font-serif text-3xl text-navy -mt-1">Magnet Parlor</h2>
            <div className="heart-divider my-6"><span>♥</span></div>

            <p className="text-xs text-warmgray uppercase tracking-widest mb-3">Your Order Code</p>
            <div className="parlor-card py-6 px-4 mb-4">
              <p
                className="font-serif text-navy tracking-[0.25em] leading-none"
                style={{ fontSize: "5.5rem" }}
              >
                {pendingOrderCode || "----"}
              </p>
            </div>

            <p className="font-serif text-navy text-xl">{firstName}</p>
            <p className="text-warmgray text-sm">
              {pkg === "9" ? "9 Magnets" : "3 Magnets"} ·{" "}
              <span className="text-gold font-serif">${totalDollars}.00 owed</span>
            </p>

            <p className="text-warmgray text-base mt-8 leading-relaxed px-4">
              Show this screen to the table to complete your order.
            </p>
            <p className="text-xs text-warmgray uppercase tracking-widest mt-6 animate-pulse">
              Waiting for payment…
            </p>
            <p className="sr-only">Status: {waitingStatus}</p>
          </section>
        )}

        {stage === "confirm" && (
          <section className="w-full text-center mt-12">
            <div className="mx-auto w-20 h-20 rounded-full bg-navy flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-warmwhite" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="font-serif text-4xl text-navy mt-6">You&apos;re all set!</h1>
            <div className="heart-divider my-6"><span>♥</span></div>

            {(() => {
              const est = waitEstimate(ordersAhead);
              return (
                <div className="parlor-card p-5 mb-6">
                  <p className="text-xs text-warmgray uppercase tracking-widest">Estimated Wait</p>
                  <p className="font-serif text-navy text-2xl mt-1 leading-tight">{est.headline}</p>
                  {est.detail && <p className="text-gold font-serif text-lg mt-1">{est.detail}</p>}
                </div>
              );
            })()}

            <p className="text-warmgray text-lg leading-relaxed">
              We&apos;ll text you at <span className="text-charcoal font-semibold">{prettyPhone}</span> when your
              magnets are ready.
            </p>
            <p className="text-warmgray mt-4">Go enjoy the market!</p>
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

// Rough wait estimate from the number of market orders ahead in the queue.
// ~5 min per order (print, cut, press); minimum band is 5-10 minutes.
function waitEstimate(ordersAhead: number): { headline: string; detail: string } {
  const low = Math.max(5, ordersAhead * 5);
  const high = low + 5;
  if (ordersAhead <= 0) {
    return { headline: "You're first in line!", detail: `About ${low}-${high} minutes` };
  }
  if (ordersAhead === 1) {
    return { headline: "You're next!", detail: `About ${low}-${high} minutes` };
  }
  return { headline: `Estimated wait: ${low}-${high} minutes`, detail: "" };
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <section className="w-full text-center mt-8">
      <p className="font-script text-gold text-4xl">The</p>
      <h1 className="font-serif text-5xl text-navy leading-tight tracking-wide">
        Magnet Parlor
      </h1>
      <div className="heart-divider my-6"><span>♥</span></div>
      <p className="font-serif italic text-warmgray text-lg">
        Capture the moment. Keep the memory.
      </p>

      <div className="parlor-card p-6 mt-10 text-left">
        <p className="font-serif text-navy text-xl mb-2">How it works</p>
        <ol className="space-y-2 text-warmgray text-sm">
          <li>1. Pick your package — 3 or 9 magnets.</li>
          <li>2. Upload your favorite photos and crop them.</li>
          <li>3. Review and pay (card or cash at the table).</li>
          <li>4. We&apos;ll text you when they&apos;re ready for pickup.</li>
        </ol>
      </div>

      <button className="btn-primary mt-10 w-full text-lg" onClick={onStart}>
        Start Your Order
      </button>
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

function PackageOption({
  active,
  onClick,
  count,
  price,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  price: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded border text-left transition ${
        active
          ? "border-navy bg-navy text-warmwhite"
          : "border-bordercream bg-warmwhite text-charcoal"
      }`}
    >
      <div className="font-serif text-2xl">{count}</div>
      <div className="text-xs uppercase tracking-widest">Magnets</div>
      <div className={`text-sm mt-2 ${active ? "text-warmwhite" : "text-gold"}`}>${price}</div>
    </button>
  );
}

function PaymentChoice({
  pkg, submitting, onCardSuccess, onCashChosen,
}: {
  pkg: PackageKey;
  submitting: boolean;
  onCardSuccess: (paymentIntentId: string) => Promise<void>;
  onCashChosen: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"choose" | "card" | "cash">("choose");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);

  // Check whether the publishable key is configured before showing the card option.
  useEffect(() => {
    setStripeReady(Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY));
  }, []);

  async function startCard() {
    setIntentError(null);
    setCreatingIntent(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: pkg }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not start card payment");
      setClientSecret(j.clientSecret);
      setIntentId(j.paymentIntentId);
      setMode("card");
    } catch (e: any) {
      setIntentError(e.message || "Could not start card payment");
    } finally {
      setCreatingIntent(false);
    }
  }

  if (mode === "choose") {
    return (
      <div className="space-y-3">
        {stripeReady ? (
          <button
            onClick={startCard}
            disabled={creatingIntent || submitting}
            className="parlor-card w-full p-5 text-left hover:border-navy transition disabled:opacity-50"
          >
            <p className="font-serif text-navy text-xl">Pay with Card</p>
            <p className="text-warmgray text-sm mt-1">
              Secure card payment. Your order goes straight into the print queue.
            </p>
            {creatingIntent && (
              <p className="text-xs text-warmgray uppercase tracking-widest mt-2">Loading…</p>
            )}
          </button>
        ) : (
          <div className="parlor-card w-full p-5 text-left opacity-60">
            <p className="font-serif text-navy text-xl">Pay with Card</p>
            <p className="text-warmgray text-sm mt-1">
              Card payments are not configured yet. Pay at the table instead.
            </p>
          </div>
        )}

        <button
          onClick={() => { setMode("cash"); onCashChosen(); }}
          disabled={submitting}
          className="parlor-card w-full p-5 text-left hover:border-navy transition disabled:opacity-50"
        >
          <p className="font-serif text-navy text-xl">Pay at Table (Cash)</p>
          <p className="text-warmgray text-sm mt-1">
            Show us this screen and pay at the table. We&apos;ll start your magnets once we&apos;ve got the cash.
          </p>
        </button>

        {intentError && <p className="text-sm text-red-700">{intentError}</p>}
      </div>
    );
  }

  if (mode === "card" && clientSecret) {
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
        <CardForm
          intentId={intentId!}
          onBack={() => { setMode("choose"); setClientSecret(null); }}
          onSuccess={onCardSuccess}
        />
      </Elements>
    );
  }

  return null;
}

function CardForm({
  intentId,
  onBack,
  onSuccess,
}: {
  intentId: string;
  onBack: () => void;
  onSuccess: (paymentIntentId: string) => Promise<void>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [payErr, setPayErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pay() {
    if (!stripe || !elements) return;
    setBusy(true);
    setPayErr(null);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (error) throw new Error(error.message || "Payment failed");
      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        throw new Error("Payment was not completed.");
      }
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
      <button className="btn-primary w-full" onClick={pay} disabled={!stripe || busy}>
        {busy ? "Processing…" : "Pay Now"}
      </button>
      <button
        className="text-sm text-warmgray underline w-full"
        onClick={onBack}
        disabled={busy}
      >
        ← Use a different payment method
      </button>
      <p className="text-[10px] text-warmgray text-center">Payment ID: {intentId.slice(-6)}</p>
    </div>
  );
}
