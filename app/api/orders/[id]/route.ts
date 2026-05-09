import { NextRequest, NextResponse } from "next/server";
import { db, rowToOrder, type OrderRow } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID = new Set(["pending", "batched", "printing", "ready", "picked_up"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const fields: string[] = [];
  const values: any[] = [];

  if (typeof body.status === "string") {
    if (!VALID.has(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    fields.push("status = ?");
    values.push(body.status);
  }
  if (body.batchId === null || typeof body.batchId === "string") {
    fields.push("batchId = ?");
    values.push(body.batchId);
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  fields.push("updatedAt = datetime('now')");
  values.push(params.id);

  const result = db
    .prepare(`UPDATE orders SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(params.id) as OrderRow;
  return NextResponse.json({ order: rowToOrder(row) });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(params.id) as
    | OrderRow
    | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order: rowToOrder(row) });
}
