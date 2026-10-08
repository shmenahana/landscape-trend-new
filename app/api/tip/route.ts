import { NextRequest, NextResponse } from "next/server";
import { db, type OrderRow } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Optional tip from a wedding guest for their magnet maker. Uses the same Stripe
// account as the rest of the app. Tips are attached to the guest's wedding order
// so the dashboard can total them up.
const MIN_TIP_CENTS = 100; // $1
const MAX_TIP_CENTS = 50000; // $500

// POST — create a PaymentIntent for the tip amount (in cents).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const amount = Math.round(Number(body?.amountCents));
  if (!Number.isFinite(amount) || amount < MIN_TIP_CENTS || amount > MAX_TIP_CENTS) {
    return NextResponse.json(
      { error: `Tip must be between $${MIN_TIP_CENTS / 100} and $${MAX_TIP_CENTS / 100}` },
      { status: 400 }
    );
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Stripe is not configured on this server" }, { status: 503 });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secret);
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      description: "The Magnet Parlor — wedding tip",
      metadata: { kind: "wedding_tip" },
    });
    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: intent.amount,
    });
  } catch (e: any) {
    console.error("[POST /api/tip]", e?.message || e);
    return NextResponse.json({ error: e?.message || "Could not create tip payment" }, { status: 502 });
  }
}

// PATCH — verify a succeeded tip PaymentIntent and attach it to the guest's order.
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const paymentIntentId = typeof body?.paymentIntentId === "string" ? body.paymentIntentId : "";
  if (!orderId || !paymentIntentId) {
    return NextResponse.json({ error: "orderId and paymentIntentId required" }, { status: 400 });
  }

  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as OrderRow | undefined;
  if (!row) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (row.orderType !== "wedding") {
    return NextResponse.json({ error: "Tips are only for wedding orders" }, { status: 400 });
  }

  // Block re-using the same tip intent across orders.
  const reused = db
    .prepare("SELECT id FROM orders WHERE tipPaymentIntentId = ?")
    .get(paymentIntentId) as { id: string } | undefined;
  if (reused && reused.id !== orderId) {
    return NextResponse.json({ error: "Tip already recorded" }, { status: 409 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Stripe is not configured on this server" }, { status: 503 });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secret);
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== "succeeded") {
      return NextResponse.json({ error: `Tip not completed (status: ${intent.status})` }, { status: 402 });
    }
    if (intent.currency !== "usd" || intent.amount < MIN_TIP_CENTS) {
      return NextResponse.json({ error: "Invalid tip amount" }, { status: 402 });
    }
    db.prepare(
      "UPDATE orders SET tipAmount = ?, tipPaymentIntentId = ?, updatedAt = datetime('now') WHERE id = ?"
    ).run(intent.amount / 100, paymentIntentId, orderId);
    return NextResponse.json({ ok: true, tipAmount: intent.amount / 100 });
  } catch (e: any) {
    console.error("[PATCH /api/tip]", e?.message || e);
    return NextResponse.json({ error: "Could not verify tip" }, { status: 502 });
  }
}
