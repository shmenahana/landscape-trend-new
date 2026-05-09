import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BatchRow = {
  id: string;
  orders: string;
  slots: number;
  printed: number;
  createdAt: string;
};

function rowToBatch(r: BatchRow) {
  return { ...r, orders: JSON.parse(r.orders || "[]"), printed: !!r.printed };
}

export async function GET() {
  const row = db
    .prepare("SELECT * FROM batches WHERE printed = 0 ORDER BY datetime(createdAt) DESC LIMIT 1")
    .get() as BatchRow | undefined;
  if (!row) return NextResponse.json({ batch: null });
  return NextResponse.json({ batch: rowToBatch(row) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { id, orderIds, slots, printed } = body as {
    id?: string;
    orderIds?: string[];
    slots?: number;
    printed?: boolean;
  };

  if (id) {
    const existing = db.prepare("SELECT * FROM batches WHERE id = ?").get(id) as
      | BatchRow
      | undefined;
    if (!existing) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    db.prepare(
      `UPDATE batches SET orders = ?, slots = ?, printed = ? WHERE id = ?`
    ).run(
      JSON.stringify(orderIds ?? JSON.parse(existing.orders)),
      slots ?? existing.slots,
      printed ? 1 : existing.printed,
      id
    );
    const updated = db.prepare("SELECT * FROM batches WHERE id = ?").get(id) as BatchRow;
    return NextResponse.json({ batch: rowToBatch(updated) });
  }

  const newId = crypto.randomUUID();
  db.prepare(
    `INSERT INTO batches (id, orders, slots, printed) VALUES (?, ?, ?, 0)`
  ).run(newId, JSON.stringify(orderIds ?? []), slots ?? 0);

  if (orderIds && orderIds.length) {
    const stmt = db.prepare(
      "UPDATE orders SET batchId = ?, status = 'batched', updatedAt = datetime('now') WHERE id = ?"
    );
    const tx = db.transaction((ids: string[]) => ids.forEach((oid) => stmt.run(newId, oid)));
    tx(orderIds);
  }

  const created = db.prepare("SELECT * FROM batches WHERE id = ?").get(newId) as BatchRow;
  return NextResponse.json({ batch: rowToBatch(created) }, { status: 201 });
}
