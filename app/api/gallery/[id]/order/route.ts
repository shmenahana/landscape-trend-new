import { NextRequest, NextResponse } from "next/server";
import { db, rowToOrder, isGalleryExpired, type GalleryRow, type OrderRow } from "@/lib/db";
import { galleryOrderTotalCents, SHIPPING_CENTS } from "@/lib/pricing";
import { validateGalleryCustomer } from "@/lib/shipping";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST — finalize a gallery magnet order after Stripe payment succeeds.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const row = db.prepare("SELECT * FROM galleries WHERE id = ?").get(params.id) as
    | GalleryRow
    | undefined;
  if (!row) return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  const gallery = { ...row, photos: JSON.parse(row.photos || "[]") as string[] };
  if (isGalleryExpired(gallery)) {
    return NextResponse.json({ error: "This gallery has expired." }, { status: 410 });
  }

  const body = await req.json().catch(() => ({}));
  // Same shared rules the gallery intent route already enforced before the
  // charge — kept here as the backstop.
  const customer = validateGalleryCustomer({
    name: body?.name,
    email: body?.email,
    shippingAddress: body?.shippingAddress,
  });
  if (!customer.ok) return NextResponse.json({ error: customer.error }, { status: 400 });
  const { name, email, address } = customer.value;
  const paymentIntentId = typeof body?.paymentIntentId === "string" ? body.paymentIntentId : "";

  // Selected photo indexes into the gallery snapshot.
  const rawSel = Array.isArray(body?.selected) ? body.selected : [];
  const selected = Array.from(
    new Set(
      rawSel
        .map((v: any) => Math.floor(Number(v)))
        .filter((n: number) => Number.isInteger(n) && n >= 0 && n < gallery.photos.length)
    )
  ) as number[];

  if (selected.length === 0) {
    return NextResponse.json({ error: "Select at least one photo." }, { status: 400 });
  }
  if (!paymentIntentId) {
    return NextResponse.json({ error: "Payment intent required" }, { status: 400 });
  }

  const count = selected.length;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Stripe is not configured on this server" }, { status: 503 });
  }

  // Verify the payment with Stripe before creating an order — blocks spoofed
  // intents and amount tampering, mirroring /api/orders.
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secret);
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== "succeeded") {
      return NextResponse.json(
        { error: `Payment not completed (status: ${intent.status})` },
        { status: 402 }
      );
    }
    const expected = galleryOrderTotalCents(count);
    if (intent.amount !== expected || intent.currency !== "usd") {
      return NextResponse.json({ error: "Payment amount mismatch" }, { status: 402 });
    }
    const reused = db.prepare("SELECT id FROM orders WHERE stripePaymentIntentId = ?").get(paymentIntentId);
    if (reused) {
      return NextResponse.json({ error: "Payment already used for an order" }, { status: 409 });
    }
  } catch (e: any) {
    console.error("[POST /api/gallery/:id/order] stripe verify failed:", e?.message || e);
    return NextResponse.json({ error: "Could not verify payment" }, { status: 502 });
  }

  const photos = selected.map((i) => gallery.photos[i]);
  const parts = name.split(/\s+/);
  const firstName = parts[0] || name;
  const lastName = parts.slice(1).join(" ") || null;

  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO orders
       (id, firstName, phone, package, status, photos, magnetSize,
        paymentMethod, paymentStatus, stripePaymentIntentId, orderCode,
        smsConsent, orderType, lastName, email, shippingAddress, shippingRate, galleryId)
     VALUES (?, ?, '', ?, 'pending', ?, '2x2', 'stripe', 'paid', ?, '', 0, 'gallery_order', ?, ?, ?, ?, ?)`
  ).run(
    id,
    firstName,
    String(count),
    JSON.stringify(photos),
    paymentIntentId,
    lastName,
    email,
    JSON.stringify(address),
    SHIPPING_CENTS / 100,
    gallery.id
  );

  const created = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as OrderRow;
  return NextResponse.json({ order: rowToOrder(created), email }, { status: 201 });
}
