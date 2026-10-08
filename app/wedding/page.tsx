"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { getCroppedImg, getSourceImg, type CropArea } from "@/lib/cropImage";
import { CoupleHeader } from "./CoupleHeader";

type Stage = "loading" | "closed" | "name" | "photo" | "cropping" | "confirm";

type WeddingSettings = {
  weddingModeActive: boolean;
  coupleDisplayText: string;
  eventDate: string;
  customSubtitle: string;
};

// Lazy single-instance Stripe loader. The publishable key is public by design.
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

export default function WeddingPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [settings, setSettings] = useState<WeddingSettings | null>(null);

  const [firstName, setFirstName] = useState("");
  const [photo, setPhoto] = useState<Blob | null>(null);
  // The raw uncropped file the guest picked. Saved alongside the crop so the
  // couple's gallery can show the full original photo.
  const [original, setOriginal] = useState<File | null>(null);
  // Downscaled uncropped copy (≤2000px) saved next to the crop so a bad crop
  // can be redone. Separate from `original`, which feeds the gallery.
  const [source, setSource] = useState<Blob | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAreaPx, setCropAreaPx] = useState<CropArea | null>(null);

  const onCropComplete = useCallback((_: CropArea, areaPx: CropArea) => {
    setCropAreaPx(areaPx);
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j: WeddingSettings) => {
        setSettings(j);
        setStage(j.weddingModeActive ? "name" : "closed");
      })
      .catch(() => setStage("closed"));
  }, []);

  const goToPhoto = () => {
    if (!firstName.trim()) return setError("Please enter your first name.");
    setError(null);
    setStage("photo");
  };

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setOriginal(file);
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
      if (thumb) URL.revokeObjectURL(thumb);
      setSource(await getSourceImg(pendingSrc).catch(() => null));
      setPhoto(blob);
      setThumb(URL.createObjectURL(blob));
      setPendingSrc(null);
      setStage("photo");
    } catch {
      setError("Could not process that photo. Try another.");
      setStage("photo");
    }
  };

  const retakePhoto = () => {
    if (thumb) URL.revokeObjectURL(thumb);
    setPhoto(null);
    setSource(null);
    setThumb(null);
  };

  async function submitWedding() {
    if (!photo) return setError("Please add a photo first.");
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("orderType", "wedding");
      form.append("firstName", firstName.trim());
      form.append("photos", photo, "photo-0.jpg");
      if (source) form.append("source-0", source, "photo-0-source.jpg");
      // Send the uncropped original too, for the couple's gallery.
      if (original) {
        const oext = original.type === "image/png" ? "png"
          : original.type === "image/webp" ? "webp"
          : "jpg";
        form.append("originals", original, `original-0.${oext}`);
      }
      const res = await fetch("/api/orders", { method: "POST", body: form });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Submission failed");
      setPendingOrderId(j.order.id);
      setStage("confirm");
    } catch (e: any) {
      setError(e.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <div className="wedding-border" aria-hidden />
      <div className="flex-1 flex flex-col items-center px-5 pb-10 max-w-md w-full mx-auto">
        {stage === "loading" && (
          <p className="text-warmgray italic mt-24 font-script text-3xl text-goldmuted">
            One moment…
          </p>
        )}

        {stage === "closed" && (
          <section className="w-full text-center mt-20">
            <div className="ornament-line" aria-hidden><span>♥</span></div>
            <h1 className="font-script text-navy text-5xl leading-tight">The Magnet Parlor</h1>
            <div className="ornament-line" aria-hidden><span>♥</span></div>
            <p className="text-warmgray text-lg mt-6 leading-relaxed">
              There&apos;s no active event right now.
            </p>
            <p className="text-warmgray mt-2">
              Please check back with your host, or find us at a market.
            </p>
          </section>
        )}

        {stage === "name" && settings && (
          <section className="w-full">
            <div className="mt-8">
              <CoupleHeader
                coupleText={settings.coupleDisplayText}
                eventDate={settings.eventDate}
                subtitle={settings.customSubtitle}
              />
            </div>
            <div className="parlor-card p-6 mt-8 space-y-5">
              <p className="text-center font-serif text-navy text-xl">
                Let&apos;s make you a keepsake magnet
              </p>
              <p className="text-center text-warmgray text-sm -mt-3">
                A little gift from the happy couple.
              </p>
              <div>
                <label className="label">Your First Name</label>
                <input
                  className="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Eleanor"
                  autoComplete="given-name"
                  onKeyDown={(e) => { if (e.key === "Enter") goToPhoto(); }}
                />
              </div>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button className="btn-primary w-full" onClick={goToPhoto}>
                Continue →
              </button>
            </div>
          </section>
        )}

        {stage === "photo" && settings && (
          <section className="w-full">
            <MiniHeader coupleText={settings.coupleDisplayText} subtitle="Choose Your Photo" />
            <div className="parlor-card p-6 mt-6 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFilePicked}
              />
              {thumb ? (
                <>
                  <p className="text-center font-serif text-navy text-lg">Looking lovely, {firstName}!</p>
                  <div className="aspect-square rounded overflow-hidden border border-bordercream relative mx-auto max-w-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  {error && <p className="text-sm text-red-700">{error}</p>}
                  <button
                    className="btn-primary w-full"
                    onClick={submitWedding}
                    disabled={submitting}
                  >
                    {submitting ? "Sending…" : "Make My Magnet ♥"}
                  </button>
                  <button
                    className="text-sm text-warmgray underline w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting}
                  >
                    Choose a different photo
                  </button>
                </>
              ) : (
                <>
                  <p className="text-center text-warmgray text-sm">
                    Pick one photo — a favorite moment from today, or any memory you love.
                  </p>
                  <button
                    className="w-full aspect-square border-2 border-dashed border-bordercream rounded flex flex-col items-center justify-center text-warmgray hover:border-navy hover:text-navy transition"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="text-5xl leading-none text-gold">♥</span>
                    <span className="mt-3 font-serif text-lg">Add Your Photo</span>
                  </button>
                  {error && <p className="text-sm text-red-700">{error}</p>}
                  <button
                    className="text-sm text-warmgray underline w-full"
                    onClick={() => setStage("name")}
                  >
                    ← Back
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        {stage === "cropping" && pendingSrc && (
          <section className="w-full">
            <MiniHeader coupleText={settings?.coupleDisplayText || ""} subtitle="Crop to Square" />
            <div className="parlor-card mt-6 overflow-hidden">
              <div className="relative w-full bg-charcoal" style={{ height: 360 }}>
                <Cropper
                  image={pendingSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
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
                  <button className="btn-outline flex-1" onClick={() => setStage("photo")}>Cancel</button>
                  <button className="btn-primary flex-1" onClick={confirmCrop}>Use Photo</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {stage === "confirm" && (
          <section className="w-full text-center mt-12">
            <div className="ornament-line" aria-hidden><span>♥</span></div>
            <p className="font-script text-goldmuted text-3xl">Thank you</p>
            <h1 className="font-script text-navy text-5xl leading-tight mt-1">{firstName}!</h1>
            <div className="ornament-line" aria-hidden><span>♥</span></div>

            <div className="parlor-card p-6 mt-6">
              <p className="font-serif text-navy text-2xl">Your magnet is being made!</p>
              <p className="text-warmgray mt-3 leading-relaxed">
                We&apos;ll have it ready for you shortly. Keep celebrating — and
                stop by our table in a bit to pick up your keepsake.
              </p>
            </div>

            {pendingOrderId && <TipJar orderId={pendingOrderId} />}

            <p className="font-script text-gold text-3xl mt-12">— The Magnet Parlor</p>
          </section>
        )}
      </div>

      <footer className="text-center text-xs text-warmgray py-5">
        <span className="font-script text-goldmuted text-lg">The Magnet Parlor</span>
        <br />
        Capture the moment. Keep the memory.
      </footer>
    </main>
  );
}

function MiniHeader({ coupleText, subtitle }: { coupleText: string; subtitle: string }) {
  return (
    <div className="text-center mt-6">
      {coupleText.trim() && (
        <p className="font-script text-goldmuted text-3xl leading-none">{coupleText.trim()}</p>
      )}
      <p className="text-xs text-warmgray uppercase tracking-[0.3em] mt-3">{subtitle}</p>
    </div>
  );
}

// ── Optional tip jar ─────────────────────────────────────────────────────────
const PRESETS = [300, 500, 1000]; // cents

function TipJar({ orderId }: { orderId: string }) {
  const stripeReady = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const [phase, setPhase] = useState<"prompt" | "amount" | "pay" | "done">("prompt");
  const [amountCents, setAmountCents] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!stripeReady) return null;

  async function startPay(cents: number) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: cents }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not start tip payment");
      setAmountCents(cents);
      setClientSecret(j.clientSecret);
      setPhase("pay");
    } catch (e: any) {
      setError(e.message || "Could not start tip payment");
    } finally {
      setBusy(false);
    }
  }

  function chooseCustom() {
    const dollars = Number(custom);
    if (!Number.isFinite(dollars) || dollars < 1) {
      setError("Please enter at least $1.");
      return;
    }
    startPay(Math.round(dollars * 100));
  }

  if (phase === "done") {
    return (
      <div className="parlor-card p-6 mt-6">
        <div className="text-5xl tip-heart" aria-hidden>💛</div>
        <p className="font-serif text-navy text-2xl mt-2">Thank you so much!</p>
        <p className="text-warmgray mt-1">
          Your magnet maker appreciates you{amountCents ? ` — $${(amountCents / 100).toFixed(2)}` : ""} ♥
        </p>
      </div>
    );
  }

  if (phase === "prompt") {
    return (
      <div className="mt-8">
        <p className="text-warmgray text-sm leading-relaxed">
          Enjoying the magnets? Leave a tip for your magnet maker <span className="text-gold">♥</span>
        </p>
        <button
          className="btn-outline mt-3 text-sm"
          onClick={() => { setError(null); setPhase("amount"); }}
        >
          Leave a Tip
        </button>
      </div>
    );
  }

  if (phase === "amount") {
    return (
      <div className="parlor-card p-6 mt-6 text-left">
        <p className="font-serif text-navy text-lg text-center">Leave a Tip</p>
        <p className="text-warmgray text-xs text-center mt-1 mb-4">
          Completely optional — only if you&apos;d like to.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((c) => (
            <button
              key={c}
              className="btn-outline py-3"
              disabled={busy}
              onClick={() => startPay(c)}
            >
              ${c / 100}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3 items-center">
          <span className="text-warmgray">$</span>
          <input
            className="input py-2"
            inputMode="decimal"
            placeholder="Custom amount"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <button className="btn-gold text-sm py-2 px-3 whitespace-nowrap" disabled={busy} onClick={chooseCustom}>
            {busy ? "…" : "Tip"}
          </button>
        </div>
        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
        <button
          className="text-xs text-warmgray underline w-full mt-3"
          onClick={() => setPhase("prompt")}
          disabled={busy}
        >
          No thanks
        </button>
      </div>
    );
  }

  // phase === "pay"
  return (
    <div className="parlor-card p-6 mt-6 text-left">
      <p className="font-serif text-navy text-lg text-center mb-1">
        Tip ${amountCents ? (amountCents / 100).toFixed(2) : ""}
      </p>
      <p className="text-warmgray text-xs text-center mb-4">Thank you for your generosity ♥</p>
      {clientSecret && (
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
          <TipForm
            orderId={orderId}
            onDone={() => setPhase("done")}
            onCancel={() => setPhase("amount")}
          />
        </Elements>
      )}
    </div>
  );
}

function TipForm({
  orderId,
  onDone,
  onCancel,
}: {
  orderId: string;
  onDone: () => void;
  onCancel: () => void;
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
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (error) throw new Error(error.message || "Payment failed");
      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        throw new Error("Payment was not completed.");
      }
      // Record the tip against the order (best-effort — the payment already went
      // through Stripe regardless of whether recording succeeds).
      await fetch("/api/tip", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentIntentId: paymentIntent.id }),
      }).catch(() => {});
      onDone();
    } catch (e: any) {
      setErr(e.message || "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button className="btn-primary w-full" onClick={pay} disabled={!stripe || busy}>
        {busy ? "Processing…" : "Send Tip ♥"}
      </button>
      <button className="text-xs text-warmgray underline w-full" onClick={onCancel} disabled={busy}>
        ← Back
      </button>
    </div>
  );
}
