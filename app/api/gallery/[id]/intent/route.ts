import { NextRequest, NextResponse } from "next/server";
import { db, rowToGallery, isGalleryExpired, type GalleryRow } from "@/lib/db";
import { galleryOrderTotalCents } from "@/lib/pricing";
import { validateGalleryCustomer } from "@/lib/shipping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST — create a Stripe PaymentIntent for `count` magnets from this gallery.
// Total = auto-best magnet pricing ($8 each / 3 for $20) + flat shipping.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const row = db.prepare("SELECT * FROM galleries WHERE id = ?").get(params.id) as
    | GalleryRow
    | undefined;
  if (!row) return NextResponse.json({ error: "Gallery not found" }, { status: 404 });

  const gallery = rowToGallery(row);
  if (isGalleryExpired(gallery)) {
    return NextResponse.json({ error: "This gallery has expired." }, { status: 410 });
  }

  const body = await req.json().catch(() => ({}));
  const count = Math.floor(Number(body?.count));
  if (!Number.isFinite(count) || count < 1 || count > gallery.photos.length) {
    return NextResponse.json({ error: "Invalid magnet count" }, { status: 400 });
  }
  // The order is saved only after the charge succeeds, so the shipping details
  // must pass the order route's exact rules BEFORE an intent can exist —
  // otherwise a rejected address means charged with no order.
  const customer = validateGalleryCustomer({
    name: body?.name,
    email: body?.email,
    shippingAddress: body?.shippingAddress,
  });
  if (!customer.ok) return NextResponse.json({ error: customer.error }, { status: 400 });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Stripe is not configured on this server" }, { status: 503 });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secret);
    const amount = galleryOrderTotalCents(count);
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      description: `The Magnet Parlor — ${count} gallery magnet${count === 1 ? "" : "s"} (shipped)`,
      metadata: { kind: "gallery_order", galleryId: gallery.id, count: String(count) },
    });
    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: intent.amount,
    });
  } catch (e: any) {
    console.error("[POST /api/gallery/:id/intent]", e?.message || e);
    return NextResponse.json({ error: e?.message || "Could not create payment" }, { status: 502 });
  }
}
