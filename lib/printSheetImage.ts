// Client-side generator for the 300-DPI print sheet image.
//
// Chrome's window.print() rasterizes images at screen quality, which produced
// visible banding on the physical magnets. Instead we render the exact same
// 3×3 sheet onto a 2550×3300 canvas (8.5×11 in at 300 DPI) and hand the
// operator a PNG to print from Windows Photos / any image viewer, which prints
// at full quality with no banding.

import type { CropArea } from "../app/CroppedImage";

export type PrintCell =
  | { kind: "empty" }
  | { kind: "order"; photo: string; label: string; color: string }
  | { kind: "stock"; photo: string; crop: CropArea | null };

export type MagnetSize = "2x2" | "2x3";

const DPI = 300;
export const SHEET_W = 8.5 * DPI; // 2550
export const SHEET_H = 11 * DPI; //  3300

type Layout = {
  padL: number;
  padT: number;
  cellW: number;
  cellH: number;
  gapX: number;
  gapY: number;
};

// Mirrors app/print/print.css exactly, converted to 300-DPI pixels.
//   2x2: 2.4in cells, 0.4in gaps, 0.25in L/R & 1.5in T/B padding.
//   2x3: 2.25×3.25in cells, 0.625/0.375in gaps, 0.25in padding all round.
const LAYOUTS: Record<MagnetSize, Layout> = {
  "2x2": {
    padL: 0.25 * DPI, // 75
    padT: 1.5 * DPI, // 450
    cellW: 2.4 * DPI, // 720
    cellH: 2.4 * DPI, // 720
    gapX: 0.4 * DPI, // 120
    gapY: 0.4 * DPI, // 120
  },
  "2x3": {
    padL: 0.25 * DPI, // 75
    padT: 0.25 * DPI, // 75
    cellW: 2.25 * DPI, // 675
    cellH: 3.25 * DPI, // 975
    gapX: 0.625 * DPI, // 187.5
    gapY: 0.375 * DPI, // 112.5
  },
};

const STOCK_COLOR = "#6B6058";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    // Same-origin uploads, so no crossOrigin needed (and setting it would
    // fail on servers that don't send CORS headers, tainting the canvas).
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// object-fit: cover — scale to fill the cell, center-crop the overflow.
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  const scale = Math.max(dw / iw, dh / ih);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// Explicit crop — the crop rectangle (source-image pixels) exactly fills the
// cell, matching CroppedImage's rendering.
function drawCropped(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  crop: CropArea,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, dx, dy, dw, dh);
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  bg: string,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const fontPx = Math.round((8 * DPI) / 72); // 8pt → 33px
  const barH = Math.round(fontPx * 1.5); // ≈ 50px
  const barY = dy + dh - barH;

  ctx.fillStyle = bg;
  ctx.fillRect(dx, barY, dw, barH);

  const label = text.toUpperCase();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const ls = Math.round(fontPx * 0.08); // letter-spacing 0.08em
  try {
    // Not universally supported, but present in the operator's Chrome.
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${ls}px`;
  } catch {
    /* ignore */
  }

  // Shrink to fit very long names rather than overflow the cell.
  let size = fontPx;
  ctx.font = `600 ${size}px 'Josefin Sans', sans-serif`;
  const maxW = dw - fontPx; // small horizontal breathing room
  while (ctx.measureText(label).width > maxW && size > 12) {
    size -= 1;
    ctx.font = `600 ${size}px 'Josefin Sans', sans-serif`;
  }

  ctx.fillText(label, dx + dw / 2, barY + barH / 2 + 1);

  try {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  } catch {
    /* ignore */
  }
}

function cellRect(L: Layout, i: number) {
  const row = Math.floor(i / 3);
  const col = i % 3;
  return {
    dx: L.padL + col * (L.cellW + L.gapX),
    dy: L.padT + row * (L.cellH + L.gapY),
    dw: L.cellW,
    dh: L.cellH,
  };
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(
    d.getHours()
  )}${p(d.getMinutes())}`;
}

/**
 * Render the sheet and trigger a PNG download. Returns once the download has
 * been kicked off (all images loaded + canvas exported).
 */
export async function downloadPrintSheet(
  cells: PrintCell[],
  magnetSize: MagnetSize
): Promise<void> {
  const L = LAYOUTS[magnetSize];

  // Make sure the label font is available before we rasterize text.
  try {
    if (document.fonts?.load) {
      await Promise.all([
        document.fonts.load("600 33px 'Josefin Sans'"),
        document.fonts.ready,
      ]);
    }
  } catch {
    /* fall back to sans-serif */
  }

  // Preload every image first so we can draw synchronously in slot order.
  const srcs = cells.map((c) => (c.kind === "empty" ? null : c.photo));
  const imgs = await Promise.all(srcs.map((s) => (s ? loadImage(s) : Promise.resolve(null))));

  const canvas = document.createElement("canvas");
  canvas.width = SHEET_W;
  canvas.height = SHEET_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // White paper.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);

  cells.forEach((cell, i) => {
    if (cell.kind === "empty") return;
    const { dx, dy, dw, dh } = cellRect(L, i);
    const img = imgs[i];

    // Clip drawing to the cell so nothing bleeds into the gaps.
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, dw, dh);
    ctx.clip();

    if (img) {
      if (cell.kind === "stock" && cell.crop) {
        drawCropped(ctx, img, cell.crop, dx, dy, dw, dh);
      } else {
        drawCover(ctx, img, dx, dy, dw, dh);
      }
    } else {
      // Missing image — leave a light placeholder so the slot is obvious.
      ctx.fillStyle = "#eee";
      ctx.fillRect(dx, dy, dw, dh);
    }
    ctx.restore();

    if (cell.kind === "order") {
      drawLabel(ctx, cell.label, cell.color, dx, dy, dw, dh);
    } else {
      // Stock: dashed outline (so it's spottable after cutting) + STOCK label.
      ctx.save();
      ctx.strokeStyle = STOCK_COLOR;
      ctx.lineWidth = 6;
      ctx.setLineDash([18, 12]);
      ctx.strokeRect(dx + 3, dy + 3, dw - 6, dh - 6);
      ctx.restore();
      drawLabel(ctx, "STOCK", STOCK_COLOR, dx, dy, dw, dh);
    }
  });

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png")
  );
  if (!blob) throw new Error("Failed to encode print sheet PNG");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `magnet-sheet-${magnetSize}-${timestamp()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after a tick so the download has grabbed the blob.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
