"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedSquare, type CropArea } from "@/lib/cropImage";

type Stage = "landing" | "details" | "photos" | "cropping" | "confirm";

export default function CustomerUploadPage() {
  const [stage, setStage] = useState<Stage>("landing");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [pkg, setPkg] = useState<"3" | "9">("3");
  const [photos, setPhotos] = useState<Blob[]>([]);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxPhotos = pkg === "3" ? 3 : 9;
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
      const blob = await getCroppedSquare(pendingSrc, cropAreaPx);
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

  const submitOrder = async () => {
    if (photos.length !== maxPhotos) {
      return setError(`Please upload all ${maxPhotos} photos.`);
    }
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("firstName", firstName.trim());
      form.append("phone", phone);
      form.append("package", pkg);
      photos.forEach((b, i) => form.append("photos", b, `photo-${i}.jpg`));
      const res = await fetch("/api/orders", { method: "POST", body: form });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Submission failed");
      }
      setStage("confirm");
    } catch (e: any) {
      setError(e.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const prettyPhone = useMemo(() => {
    const d = phone.replace(/\D/g, "");
    if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return phone;
  }, [phone]);

  return (
    <main className="min-h-screen flex flex-col">
      <div className="awning" />
      <div className="flex-1 flex flex-col items-center px-5 py-8 max-w-md w-full mx-auto">
        {stage === "landing" && (
          <Landing onStart={startDetails} />
        )}

        {stage === "details" && (
          <section className="w-full">
            <Header subtitle="Step 1 of 2 · Your Details" />
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
                <p className="text-xs text-warmgray mt-1">We'll text you when your magnets are ready.</p>
              </div>
              <div>
                <label className="label">Package</label>
                <div className="grid grid-cols-2 gap-3">
                  <PackageOption active={pkg === "3"} onClick={() => setPkg("3")} count={3} price={12} />
                  <PackageOption active={pkg === "9"} onClick={() => setPkg("9")} count={9} price={25} />
                </div>
              </div>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button className="btn-primary w-full" onClick={goToPhotos}>Continue →</button>
            </div>
          </section>
        )}

        {stage === "photos" && (
          <section className="w-full">
            <Header subtitle={`Step 2 of 2 · Your Photos`} />
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
                      className="aspect-square border border-bordercream rounded bg-cream relative overflow-hidden"
                    >
                      {t ? (
                        <>
                          <img src={t} alt="" className="w-full h-full object-cover" />
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
                onClick={submitOrder}
                disabled={submitting || photos.length !== maxPhotos}
              >
                {submitting ? "Submitting…" : "Submit Order"}
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
            <Header subtitle="Crop to Square" />
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
                  <button className="btn-outline flex-1" onClick={cancelCrop}>Cancel</button>
                  <button className="btn-primary flex-1" onClick={confirmCrop}>Use Photo</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {stage === "confirm" && (
          <section className="w-full text-center mt-12">
            <h1 className="font-serif text-4xl text-navy">You're all set!</h1>
            <div className="heart-divider my-6"><span>♥</span></div>
            <p className="text-warmgray text-lg leading-relaxed">
              We'll text you at <span className="text-charcoal font-semibold">{prettyPhone}</span> when your
              magnets are ready.
            </p>
            <p className="text-warmgray mt-4">Go enjoy the market!</p>
            <p className="font-script text-gold text-3xl mt-10">— The Magnet Parlor</p>
          </section>
        )}
      </div>
      <footer className="text-center text-xs text-warmgray py-4">
        The Magnet Parlor · Capture the moment. Keep the memory.
      </footer>
    </main>
  );
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
          <li>2. Upload your favorite photos and crop them square.</li>
          <li>3. We'll text you when they're ready for pickup.</li>
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
