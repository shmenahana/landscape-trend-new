import { NextRequest, NextResponse } from "next/server";
import { isPackageKey, priceCents, shippedTotalCents } from "@/lib/pricing";
import { validateShippedCustomer } from "@/lib/shipping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pkg = body?.package;
  if (!isPackageKey(pkg)) {
    return NextResponse.json({ error: "Invalid package" }, { status: 400 });
  }
  // Online shop orders include flat-rate shipping on top of the package price.
  const shipped = body?.orderType === "shipped" || body?.shipping === true;
  // A shipped order is saved only after the charge succeeds, so its customer
  // + address must pass the orders route's exact rules BEFORE an intent can
  // exist — otherwise a rejected address means charged with no order.
  if (shipped) {
    const customer = validateShippedCustomer({
      firstName: body?.firstName,
      lastName: body?.lastName,
      email: body?.email,
      shippingAddress: body?.shippingAddress,
    });
    if (!customer.ok) return NextResponse.json({ error: customer.error }, { status: 400 });
  }
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Stripe is not configured on this server" },
      { status: 503 }
    );
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secret);
    const amount = shipped ? shippedTotalCents(pkg) : priceCents(pkg);
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      description: shipped
        ? `The Magnet Parlor — ${pkg}-pack (shipped)`
        : `The Magnet Parlor — ${pkg}-pack`,
      metadata: { package: pkg, orderType: shipped ? "shipped" : "market" },
    });
    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: intent.amount,
    });
  } catch (e: any) {
    console.error("[create-payment-intent]", e?.message || e);
    return NextResponse.json(
      { error: e?.message || "Could not create payment" },
      { status: 502 }
    );
  }
}
