import { NextRequest, NextResponse } from "next/server";
import { isPackageKey, priceCents, shippedQuote } from "@/lib/pricing";
import { lookupPromo } from "@/lib/promo";
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
    // Promo codes are /shop only; market intents ignore any code. Unknown,
    // inactive, expired or used-up codes are null here → full price, no error.
    // The amount is ALWAYS recomputed here — no client amount is read.
    const promo = shipped ? lookupPromo(body?.promoCode) : null;
    const quote = shipped ? shippedQuote(pkg, promo?.percentOff ?? 0) : null;
    const amount = quote ? quote.totalCents : priceCents(pkg);
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      description: shipped
        ? `The Magnet Parlor — ${pkg}-pack (shipped)${promo ? ` · ${promo.code}` : ""}`
        : `The Magnet Parlor — ${pkg}-pack`,
      // The orders POST reads the promo back from HERE (server-written), so
      // the charge and the saved order can't disagree.
      metadata: {
        package: pkg,
        orderType: shipped ? "shipped" : "market",
        ...(promo && quote
          ? { promoCode: promo.code, promoPercent: String(promo.percentOff), discountCents: String(quote.discountCents) }
          : {}),
      },
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
