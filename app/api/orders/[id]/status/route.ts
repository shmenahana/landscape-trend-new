import { NextRequest, NextResponse } from "next/server";
import { db, type OrderRow } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public endpoint — the customer's cash waiting screen polls this with
// their order ID (a UUID, unguessable in practice) to learn when the
// operator has confirmed cash payment. Returns only the bare minimum.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const row = db
    .prepare(
      "SELECT id, status, paymentMethod, paymentStatus, orderCode FROM orders WHERE id = ?"
    )
    .get(params.id) as
    | Pick<OrderRow, "id" | "status" | "paymentMethod" | "paymentStatus" | "orderCode">
    | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}
