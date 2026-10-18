"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import {
  DIE_SAFE_PX,
  FILL_MAX_ZOOM,
  PRINT_CELL_PX,
  canFill,
  defaultCropMode,
  getCroppedImg,
  getFitImg,
  isSoftCrop,
  type CropArea,
  type CropMode,
} from "@/lib/cropImage";

export type PickedImage = { src: string; width: number; height: number };

/**
 * Photo can't print sharp at all — rejected at upload.
 *   Square: long edge < 720 (FIT still works down to that).
 *   2x3:    no FIT fallback, so a 2:3 crop at least 720 wide must fit.
 */
export function isTooSmallToPrint(img: { width: number; height: number }, square: boolean): boolean {
  return square
    ? Math.max(img.width, img.height) < PRINT_CELL_PX
    : !canFill(img.width, img.height, 2 / 3);
}

/**
 * Crop step shared by /order and /shop.
 *   FILL — the classic crop (pinch/drag), zoom to 3x. A crop under 720px is
 *          upscaled to 720 on export, with a soft-print note — never blocked.
 *          The default, and the only mode for 2x3.
 *   FIT  — square only: the whole photo inside the die-safe area, bleed filled
 *          from its own edges. No zoom/pan. Offered side by side with FILL;
 *          auto-selected only for extreme shapes, or forced when the photo is
 *          too narrow for a 720px square crop.
 */
export function CropStep({
  image,
  square,
  onConfirm,
  onCancel,
}: {
  image: PickedImage;
  square: boolean;
  /** cropPx: the FILL crop's short side in source px; null for FIT. */
  onConfirm: (blob: Blob, cropPx: number | null) => void;
  onCancel: () => void;
}) {
  const { src, width, height } = image;
  const aspect = square ? 1 : 2 / 3;
  const fillAllowed = canFill(width, height, aspect);
  const autoMode: CropMode = !square ? "fill" : !fillAllowed ? "fit" : defaultCropMode(width, height);
  const [mode, setMode] = useState<CropMode>(autoMode);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAreaPx, setCropAreaPx] = useState<CropArea | null>(null);
  const onCropComplete = useCallback((_: CropArea, areaPx: CropArea) => {
    setCropAreaPx(areaPx);
  }, []);
  // Short side of the live crop in source px (width, for 1:1 and 2:3 alike).
  const cropPx = cropAreaPx ? Math.min(cropAreaPx.width, cropAreaPx.height * aspect) : null;
  const soft = mode === "fill" && cropPx !== null && isSoftCrop(cropPx);
  // Fill tile thumbnail: the live crop, or (before the cropper has reported
  // one, e.g. when FIT was auto-selected) the centred zoom-1 square.
  const side = Math.min(width, height);
  const thumbArea: CropArea = cropAreaPx ?? { x: (width - side) / 2, y: (height - side) / 2, width: side, height: side };

  // FIT image == exactly what gets uploaded. Pre-rendered for square photos so
  // its tile can sit next to FILL's from the start.
  const [fit, setFit] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!square) return;
    let cancelled = false;
    let url: string | null = null;
    getFitImg(src)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setFit({ blob, url });
      })
      .catch(() => {
        if (!cancelled) setError("Could not process that photo. Try another.");
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [square, src]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === "fit") {
        if (!fit) return;
        onConfirm(fit.blob, null);
      } else {
        if (!cropAreaPx || cropPx === null) return;
        // react-easy-crop can report a square off by a pixel; trim it so a
        // soft crop upscales to exactly 720x720.
        const area = square ? { ...cropAreaPx, width: cropPx, height: cropPx } : cropAreaPx;
        const blob = await getCroppedImg(
          src,
          area,
          square
            ? { maxW: 1200, maxH: 1200, minW: PRINT_CELL_PX }
            : { maxW: 800, maxH: 1200, minW: PRINT_CELL_PX }
        );
        onConfirm(blob, Math.round(cropPx));
      }
    } catch {
      setError("Could not process that photo. Try another.");
    } finally {
      setBusy(false);
    }
  };

  // Die-safe guide inset, as a % of the square (60/720 per side).
  const guideInset = `${((PRINT_CELL_PX - DIE_SAFE_PX) / 2 / PRINT_CELL_PX) * 100}%`;

  return (
    <div className="parlor-card mt-6 overflow-hidden">
      <div className="relative w-full bg-charcoal" style={{ height: 360 }}>
        {mode === "fill" ? (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            maxZoom={FILL_MAX_ZOOM}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {fit ? (
              <div className="relative h-full aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fit.url} alt="Your whole photo, fitted to the magnet" className="w-full h-full" />
                {/* Faint magnet-edge guide: everything inside it is on the magnet. */}
                <div
                  className="absolute border border-dashed border-white/60 pointer-events-none"
                  style={{ inset: guideInset }}
                  aria-hidden
                />
              </div>
            ) : (
              <p className="text-xs text-cream/80 uppercase tracking-widest">Preparing preview…</p>
            )}
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        {mode === "fill" && (
          <div>
            <input
              type="range"
              min={1}
              max={FILL_MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
              aria-label="Zoom"
            />
            {soft && (
              <p className="text-xs text-warmgray text-center mt-1" role="status">
                Zoomed in this far, this photo will print a little soft.
              </p>
            )}
          </div>
        )}
        {square && (
          <div>
            {autoMode === "fit" && (
              <p className="text-sm text-navy text-center mb-2">
                {fillAllowed
                  ? "We fit your whole photo so nothing gets cut off. Prefer to crop? Tap Fill."
                  : "This photo is too narrow to crop sharply, so we fit the whole thing."}
              </p>
            )}
            <div role="radiogroup" aria-label="Crop mode" className="grid grid-cols-2 gap-2">
              <ModeTile
                label="Fill — crop to square"
                checked={mode === "fill"}
                disabled={!fillAllowed}
                onSelect={() => setMode("fill")}
              >
                {fillAllowed && (
                  // Live thumbnail of the current crop, positioned from the
                  // known natural size (no re-decode while dragging).
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    style={{
                      position: "absolute",
                      maxWidth: "none",
                      width: `${(width / thumbArea.width) * 100}%`,
                      height: `${(height / thumbArea.height) * 100}%`,
                      left: `${-(thumbArea.x / thumbArea.width) * 100}%`,
                      top: `${-(thumbArea.y / thumbArea.height) * 100}%`,
                    }}
                  />
                )}
              </ModeTile>
              <ModeTile
                label="Fit — whole photo"
                checked={mode === "fit"}
                onSelect={() => setMode("fit")}
              >
                {fit && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fit.url} alt="" className="absolute inset-0 w-full h-full" />
                )}
              </ModeTile>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button className="btn-outline flex-1" onClick={onCancel}>Cancel</button>
          <button
            className="btn-primary flex-1 disabled:opacity-50"
            onClick={confirm}
            disabled={busy || (mode === "fit" ? !fit : !cropAreaPx)}
          >
            Use Photo
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeTile({
  label,
  checked,
  disabled,
  onSelect,
  children,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onSelect}
      className={`rounded border-2 p-1.5 text-left transition disabled:opacity-40 ${
        checked ? "border-navy" : "border-bordercream hover:border-goldmuted"
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-charcoal">{children}</div>
      <p className={`mt-1.5 text-xs text-center ${checked ? "text-navy font-semibold" : "text-warmgray"}`}>
        {label}
      </p>
    </button>
  );
}
