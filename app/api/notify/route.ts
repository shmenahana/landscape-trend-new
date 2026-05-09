import { NextRequest, NextResponse } from "next/server";
import { db, rowToOrder, type OrderRow } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PICKUP_MESSAGE =
  "Your magnets are ready! 🧲 Swing by The Magnet Parlor table to pick them up.";

export async function POST(req: NextRequest) {
  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as
    | OrderRow
    | undefined;
  if (!row) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  let smsStatus: "sent" | "skipped" | "failed" = "skipped";
  let smsError: string | null = null;

  if (sid && token && from) {
    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(sid, token);
      await client.messages.create({
        to: row.phone,
        from,
        body: PICKUP_MESSAGE,
      });
      smsStatus = "sent";
    } catch (e: any) {
      smsStatus = "failed";
      smsError = e?.message || "twilio error";
    }
  }

  db.prepare(
    "UPDATE orders SET status = 'ready', updatedAt = datetime('now') WHERE id = ?"
  ).run(orderId);

  const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as OrderRow;

  return NextResponse.json({
    order: rowToOrder(updated),
    sms: { status: smsStatus, error: smsError },
  });
}
