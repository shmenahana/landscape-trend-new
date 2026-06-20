import { NextRequest, NextResponse } from "next/server";
import { db, rowToOrder, type OrderRow } from "@/lib/db";
import { isOperator } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUS = new Set(["pending", "batched", "printing", "ready", "picked_up", "shipped"]);
const VALID_PAYMENT_STATUS = new Set(["paid", "cash_pending", "cash_confirmed"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const fields: string[] = [];
  const values: any[] = [];

  if (typeof body.status === "string") {
    if (!VALID_STATUS.has(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    fields.push("status = ?");
    values.push(body.status);
  }
  if (body.batchId === null || typeof body.batchId === "string") {
    fields.push("batchId = ?");
    values.push(body.batchId);
  }
  if (typeof body.paymentStatus === "string") {
    if (!VALID_PAYMENT_STATUS.has(body.paymentStatus)) {
      return NextResponse.json({ error: "Invalid paymentStatus" }, { status: 400 });
    }
    // Only allow cash_pending → cash_confirmed (the operator confirming receipt).
    // Block other transitions to avoid backwards moves or accidental edits.
    const existing = db
      .prepare("SELECT paymentMethod, paymentStatus FROM orders WHERE id = ?")
      .get(params.id) as
      | { paymentMethod: string; paymentStatus: string }
      | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (body.paymentStatus === "cash_confirmed") {
      if (existing.paymentMethod !== "cash" || existing.paymentStatus !== "cash_pending") {
        return NextResponse.json(
          { error: "Order is not awaiting cash confirmation" },
          { status: 409 }
        );
      }
    } else {
      // Reject any other PATCH-driven paymentStatus change.
      return NextResponse.json(
        { error: "Only cash_pending → cash_confirmed is allowed via PATCH" },
        { status: 400 }
      );
    }
    fields.push("paymentStatus = ?");
    values.push(body.paymentStatus);
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
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(params.id) as
    | OrderRow
    | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order: rowToOrder(row) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const row = db.prepare("SELECT id, status, photos FROM orders WHERE id = ?").get(params.id) as
    | { id: string; status: string; photos: string }
    | undefined;
  if (!row) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Block deletion if the order is currently mid-print. "batched" / "printing"
  // are the server-side signals that a sheet is in flight.
  if (row.status === "batched" || row.status === "printing") {
    return NextResponse.json(
      { error: "Order is on an active print sheet — remove it from the sheet first." },
      { status: 409 }
    );
  }

  db.prepare("DELETE FROM orders WHERE id = ?").run(params.id);

  // Best-effort cleanup of the photo directory. A failure here doesn't undo
  // the DB delete — orphan files are recoverable, but reviving a row isn't.
  try {
    const dir = path.join(process.cwd(), "public", "uploads", params.id);
    await fs.rm(dir, { recursive: true, force: true });
  } catch (e) {
    console.warn("[DELETE /api/orders/:id] file cleanup failed:", e);
  }

  return NextResponse.json({ ok: true });
}
