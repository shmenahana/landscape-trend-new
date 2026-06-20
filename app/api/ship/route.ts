import { NextRequest, NextResponse } from "next/server";
import { db, rowToOrder, type OrderRow, type ShippingAddress } from "@/lib/db";
import { isOperator } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Operator marks a shipped/online order as shipped and records the USPS
// tracking number. If SendGrid is configured we email the customer the
// tracking number; otherwise we just store it (email status "skipped").
export async function POST(req: NextRequest) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { orderId, trackingNumber } = await req.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
  const tracking = String(trackingNumber || "").trim().slice(0, 100);
  if (!tracking) return NextResponse.json({ error: "Tracking number required" }, { status: 400 });

  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as
    | OrderRow
    | undefined;
  if (!row) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (row.orderType !== "shipped") {
    return NextResponse.json({ error: "Order is not a shipped order" }, { status: 400 });
  }

  db.prepare(
    "UPDATE orders SET trackingNumber = ?, status = 'shipped', updatedAt = datetime('now') WHERE id = ?"
  ).run(tracking, orderId);

  // Best-effort email to the customer with the tracking number.
  const sgKey = process.env.SENDGRID_API_KEY;
  const sgFrom = process.env.SENDGRID_FROM_EMAIL;
  let emailStatus: "sent" | "skipped" | "failed" = "skipped";
  let emailError: string | null = null;

  const to = (row.email || "").trim();
  if (sgKey && sgFrom && to) {
    let addr: ShippingAddress | null = null;
    try {
      addr = row.shippingAddress ? JSON.parse(row.shippingAddress) : null;
    } catch {
      addr = null;
    }
    const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || "there";
    const addrLine = addr
      ? `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`
      : "your address on file";
    const text =
      `Hi ${name},\n\n` +
      `Great news — your magnets from The Magnet Parlor are on their way! 🧲\n\n` +
      `USPS Tracking Number: ${tracking}\n` +
      `Track it here: https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tracking)}\n\n` +
      `Shipping to:\n${addrLine}\n\n` +
      `Thanks for ordering with us!\n— The Magnet Parlor`;
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sgKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: sgFrom, name: "The Magnet Parlor" },
          subject: "Your Magnet Parlor order has shipped! 🧲",
          content: [{ type: "text/plain", value: text }],
        }),
      });
      if (res.ok) {
        emailStatus = "sent";
      } else {
        emailStatus = "failed";
        emailError = `SendGrid ${res.status}: ${(await res.text()).slice(0, 200)}`;
        console.error("[ship] SendGrid send failed:", emailError);
      }
    } catch (e: any) {
      emailStatus = "failed";
      emailError = e?.message || "fetch failed";
      console.error("[ship] SendGrid send threw:", emailError);
    }
  }

  const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as OrderRow;
  return NextResponse.json({
    order: rowToOrder(updated),
    email: { status: emailStatus, error: emailError },
  });
}
