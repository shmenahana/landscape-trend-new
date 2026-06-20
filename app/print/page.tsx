import { db, rowToOrder, type OrderRow, type LibraryDesign } from "@/lib/db";
import PrintControls from "./PrintControls";
import { CroppedImage, type CropArea } from "../CroppedImage";
import "./print.css";

export const dynamic = "force-dynamic";

const SHEET_COLORS = [
  "#2B3856", "#8B5E3C", "#6B8E5A", "#D87B5A",
  "#A07848", "#5A6B8E", "#8E5A7B", "#3A6B6B",
];

const SLOTS = 9;

type Cell =
  | { kind: "empty" }
  | { kind: "order"; photo: string; label: string; color: string }
  | { kind: "stock"; photo: string; crop: CropArea | null };

type CompactSlot =
  | null
  | { k: "o"; oid: string; pi: number }
  | { k: "s"; did: string; c: CropArea | null };

function decodeSlots(raw: string | undefined): CompactSlot[] | null {
  if (!raw) return null;
  try {
    // base64 → JSON, with UTF-8 safety for browser-encoded payloads.
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    const arr = JSON.parse(decoded);
    if (!Array.isArray(arr)) return null;
    return arr.slice(0, SLOTS);
  } catch {
    return null;
  }
}

export default function PrintPage({
  searchParams,
}: {
  searchParams: { slots?: string; size?: string };
}) {
  const magnetSize = searchParams.size === "2x3" ? "2x3" : "2x2";
  const compact = decodeSlots(searchParams.slots);

  // Build cells from the slot encoding, looking up orders + designs from DB.
  const cells: Cell[] = Array.from({ length: SLOTS }, () => ({ kind: "empty" } as Cell));

  if (compact) {
    const orderIds = Array.from(
      new Set(compact.filter((s): s is { k: "o"; oid: string; pi: number } => s?.k === "o").map((s) => s.oid))
    );
    const designIds = Array.from(
      new Set(compact.filter((s): s is { k: "s"; did: string; c: CropArea | null } => s?.k === "s").map((s) => s.did))
    );

    const orderMap = new Map<string, ReturnType<typeof rowToOrder>>();
    if (orderIds.length) {
      const placeholders = orderIds.map(() => "?").join(",");
      const rows = db
        .prepare(`SELECT * FROM orders WHERE id IN (${placeholders})`)
        .all(...orderIds) as OrderRow[];
      rows.forEach((r) => orderMap.set(r.id, rowToOrder(r)));
    }

    const designMap = new Map<string, LibraryDesign>();
    if (designIds.length) {
      const placeholders = designIds.map(() => "?").join(",");
      const rows = db
        .prepare(`SELECT * FROM library_designs WHERE id IN (${placeholders})`)
        .all(...designIds) as LibraryDesign[];
      rows.forEach((r) => designMap.set(r.id, r));
    }

    // Stable color assignment: order of first appearance in slot list.
    const orderColors = new Map<string, string>();
    compact.forEach((s) => {
      if (s?.k === "o" && !orderColors.has(s.oid)) {
        orderColors.set(s.oid, SHEET_COLORS[orderColors.size % SHEET_COLORS.length]);
      }
    });

    compact.forEach((s, i) => {
      if (!s) return;
      if (s.k === "o") {
        const o = orderMap.get(s.oid);
        if (!o) return;
        const photo = o.photos[s.pi];
        if (!photo) return;
        cells[i] = {
          kind: "order",
          photo,
          label: o.firstName,
          color: orderColors.get(s.oid) || SHEET_COLORS[0],
        };
      } else if (s.k === "s") {
        const d = designMap.get(s.did);
        if (!d) return;
        cells[i] = { kind: "stock", photo: d.path, crop: s.c };
      }
    });
  }

  const sheetClass =
    magnetSize === "2x3"
      ? "print-sheet print-sheet-2x3"
      : "print-sheet print-sheet-2x2";
  // Both 2x2 and 2x3 now print on portrait 8.5×11 (3×3 grid).
  const pageSize = "8.5in 11in";
  const hasAnyCrop = cells.some((c) => c.kind === "stock" && c.crop);

  return (
    <div className="print-root">
      <style>{`@page { size: ${pageSize}; margin: 0; }`}</style>
      {/* Give cropped images extra time to measure natural dims before printing. */}
      <PrintControls delayMs={hasAnyCrop ? 1500 : 500} />
      <div className={sheetClass}>
        {cells.map((cell, i) => {
          if (cell.kind === "empty") {
            return <div className="print-cell print-cell-empty" key={i} />;
          }
          if (cell.kind === "stock") {
            return (
              <div className="print-cell print-cell-stock" key={i}>
                <CroppedImage src={cell.photo} crop={cell.crop} />
                <span className="print-cell-name print-cell-name-stock">STOCK</span>
              </div>
            );
          }
          return (
            <div className="print-cell" key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cell.photo} alt="" />
              <span className="print-cell-name" style={{ background: cell.color }}>
                {cell.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
