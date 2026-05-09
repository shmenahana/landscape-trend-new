import { db, rowToOrder, type OrderRow } from "@/lib/db";
import PrintControls from "./PrintControls";
import "./print.css";

export const dynamic = "force-dynamic";

type Cell = { photo: string; orderName: string };

export default function PrintPage({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  const ids = (searchParams.ids || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const cells: Cell[] = [];
  if (ids.length > 0) {
    const placeholders = ids.map(() => "?").join(",");
    const rows = db
      .prepare(`SELECT * FROM orders WHERE id IN (${placeholders})`)
      .all(...ids) as OrderRow[];
    const orderMap = new Map(rows.map((r) => [r.id, rowToOrder(r)]));
    for (const id of ids) {
      const o = orderMap.get(id);
      if (!o) continue;
      for (const photo of o.photos) {
        cells.push({ photo, orderName: o.firstName });
      }
    }
  }
  while (cells.length < 9) cells.push({ photo: "", orderName: "" });

  return (
    <div className="print-root">
      <PrintControls />
      <div className="print-sheet">
        {cells.slice(0, 9).map((cell, i) => (
          <div className="print-cell" key={i}>
            {cell.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cell.photo} alt="" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
