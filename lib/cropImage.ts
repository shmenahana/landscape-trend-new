export type CropArea = { x: number; y: number; width: number; height: number };

/**
 * Crop and resize an image region. Supports both square (1:1) and rectangular (2:3) outputs.
 * `maxW`/`maxH` control the maximum output dimensions independently. With
 * `minW`, a crop narrower than that is upscaled to it (a tight zoom still
 * fills the print cell; it just prints a little soft).
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea,
  size: { maxW: number; maxH: number; minW?: number } = { maxW: 1200, maxH: 1200 },
  quality = 0.85
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  let scale = Math.min(size.maxW / pixelCrop.width, size.maxH / pixelCrop.height, 1);
  if (size.minW && pixelCrop.width * scale < size.minW) scale = size.minW / pixelCrop.width;
  const outW = Math.round(pixelCrop.width * scale);
  const outH = Math.round(pixelCrop.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    );
  });
}

/**
 * The full, uncropped image downscaled so its long edge is at most `maxEdge`
 * (never upscaled). Uploaded next to the crop so a bad crop can be redone
 * later — small enough not to crawl on venue wifi, unlike the raw camera file.
 */
export async function getSourceImg(
  imageSrc: string,
  maxEdge = 2000,
  quality = 0.88
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  return getCroppedImg(imageSrc, { x: 0, y: 0, width: w, height: h }, { maxW: maxEdge, maxH: maxEdge }, quality);
}

// ── Square magnet geometry (2x2) ─────────────────────────────────────────────
// The print sheet draws each photo into a 2.4in cell = 720px at 300 DPI; the
// magnet's die-safe area is the centred 2.0in = 600px. Output squares are
// 720..1200px and map 1:1 onto the cell.
export const PRINT_CELL_PX = 720;
export const DIE_SAFE_PX = 600;
export const MAX_OUT_PX = 1200;

export type CropMode = "fill" | "fit";

/**
 * FILL is the default. FIT only auto-selects for extreme shapes (tall posters,
 * panoramas) where a square crop would lose most of the photo.
 */
export function defaultCropMode(w: number, h: number): CropMode {
  const r = w / h;
  return r < 0.6 || r > 1.67 ? "fit" : "fill";
}

/**
 * Widest crop of `aspect` (w/h) that fits in the image, in source pixels —
 * what react-easy-crop shows at zoom 1. Its short side is the width for 1:1
 * and 2:3 alike.
 */
function maxCropWidth(w: number, h: number, aspect: number): number {
  return Math.min(w, h * aspect);
}

/**
 * FILL zooms to 3x whatever the source resolution — composition beats a modest
 * upscale. A crop that ends up under 720px is upscaled on export and flagged
 * (soft-print note for the customer, "low res" badge for the operator).
 */
export const FILL_MAX_ZOOM = 3;

/** Would a crop this many source px across print soft (upscaled to 720)? */
export function isSoftCrop(cropShortSidePx: number): boolean {
  return cropShortSidePx < PRINT_CELL_PX;
}

/** Can a crop of `aspect` with a short side ≥ 720px be cut from this image? */
export function canFill(w: number, h: number, aspect = 1): boolean {
  return maxCropWidth(w, h, aspect) >= PRINT_CELL_PX;
}

/**
 * FIT: the whole photo, uncropped, scaled into the centred die-safe square of
 * an S×S output. The bleed around it is the photo's own outermost rows and
 * columns extended outward, softened by a ~9px gaussian that is feathered in
 * from the photo's edge — the photo itself is never blurred.
 */
export async function getFitImg(imageSrc: string, quality = 0.85): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const iw = image.naturalWidth;
  const ih = image.naturalHeight;
  // Don't upscale the photo: its long edge fills S·600/720 of the square.
  const S = Math.round(
    Math.max(PRINT_CELL_PX, Math.min(MAX_OUT_PX, (Math.max(iw, ih) * PRINT_CELL_PX) / DIE_SAFE_PX))
  );
  const safe = Math.round((S * DIE_SAFE_PX) / PRINT_CELL_PX);
  const k = safe / Math.max(iw, ih);
  const pw = Math.max(1, Math.round(iw * k));
  const ph = Math.max(1, Math.round(ih * k));
  const px = Math.floor((S - pw) / 2);
  const py = Math.floor((S - ph) / 2);

  const pc = document.createElement("canvas");
  pc.width = pw;
  pc.height = ph;
  const pctx = pc.getContext("2d");
  if (!pctx) throw new Error("Canvas unsupported");
  pctx.imageSmoothingQuality = "high";
  pctx.drawImage(image, 0, 0, pw, ph);
  const photo = pctx.getImageData(0, 0, pw, ph).data;

  // Every output pixel samples the nearest photo pixel: inside the photo
  // that's itself; outside it's the edge row/column (corners: corner pixel).
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  const out = ctx.createImageData(S, S);
  const o = out.data;
  for (let y = 0; y < S; y++) {
    const sy = Math.min(ph - 1, Math.max(0, y - py));
    for (let x = 0; x < S; x++) {
      const sx = Math.min(pw - 1, Math.max(0, x - px));
      const si = (sy * pw + sx) * 4;
      const oi = (y * S + x) * 4;
      o[oi] = photo[si];
      o[oi + 1] = photo[si + 1];
      o[oi + 2] = photo[si + 2];
      o[oi + 3] = 255;
    }
  }

  // Blur the extended canvas, then mix it in ONLY outside the photo, ramping
  // from 0 at the photo's edge to full over `feather` px.
  const scale = S / PRINT_CELL_PX;
  const blurred = gaussianBlurRGB(o, S, S, 9 * scale);
  const feather = 12 * scale;
  for (let y = 0; y < S; y++) {
    const dy = y < py ? py - y : y >= py + ph ? y - (py + ph - 1) : 0;
    for (let x = 0; x < S; x++) {
      const dx = x < px ? px - x : x >= px + pw ? x - (px + pw - 1) : 0;
      if (dx === 0 && dy === 0) continue;
      const t = Math.min(1, Math.hypot(dx, dy) / feather);
      const m = t * t * (3 - 2 * t);
      const oi = (y * S + x) * 4;
      const bi = (y * S + x) * 3;
      o[oi] = o[oi] + (blurred[bi] - o[oi]) * m;
      o[oi + 1] = o[oi + 1] + (blurred[bi + 1] - o[oi + 1]) * m;
      o[oi + 2] = o[oi + 2] + (blurred[bi + 2] - o[oi + 2]) * m;
    }
  }
  ctx.putImageData(out, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    );
  });
}

// Gaussian blur of an RGBA buffer's RGB channels, approximated by three box
// blurs (no ctx.filter — older iOS Safari ignores it). Returns packed RGB.
function gaussianBlurRGB(rgba: Uint8ClampedArray, w: number, h: number, sigma: number): Float32Array {
  const n = w * h;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    a[i * 3] = rgba[i * 4];
    a[i * 3 + 1] = rgba[i * 4 + 1];
    a[i * 3 + 2] = rgba[i * 4 + 2];
  }
  const b = new Float32Array(n * 3);
  for (const size of boxesForGauss(sigma, 3)) {
    const r = (size - 1) / 2;
    boxBlur(a, b, w, h, r, 1, w); // horizontal
    boxBlur(b, a, h, w, r, w, 1); // vertical (transposed walk)
  }
  return a;
}

// Box widths whose three passes approximate a gaussian of `sigma`.
function boxesForGauss(sigma: number, n: number): number[] {
  const wIdeal = Math.sqrt((12 * sigma * sigma) / n + 1);
  let wl = Math.floor(wIdeal);
  if (wl % 2 === 0) wl--;
  const wu = wl + 2;
  const mIdeal = (12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4);
  const m = Math.round(mIdeal);
  return Array.from({ length: n }, (_, i) => (i < m ? wl : wu));
}

// 1-D running-sum box blur along `lines` lines of `len` pixels. `step` is the
// pixel stride along a line and `lineStride` between lines; edges clamp.
function boxBlur(src: Float32Array, dst: Float32Array, len: number, lines: number, r: number, step: number, lineStride: number) {
  const inv = 1 / (2 * r + 1);
  for (let l = 0; l < lines; l++) {
    const base = l * lineStride;
    for (let c = 0; c < 3; c++) {
      const at = (i: number) => src[(base + Math.min(len - 1, Math.max(0, i)) * step) * 3 + c];
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += at(i);
      for (let i = 0; i < len; i++) {
        dst[(base + i * step) * 3 + c] = acc * inv;
        acc += at(i + r + 1) - at(i - r);
      }
    }
  }
}

/** Keep the old name working for any other callers. */
export const getCroppedSquare = (src: string, crop: CropArea, maxSize = 1200, quality = 0.85) =>
  getCroppedImg(src, crop, { maxW: maxSize, maxH: maxSize }, quality);

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
