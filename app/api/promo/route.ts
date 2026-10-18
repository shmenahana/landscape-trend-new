import { NextRequest, NextResponse } from "next/server";
import { lookupPromo } from "@/lib/promo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Does this code apply right now? For the /shop totals DISPLAY only — the
// charge is recomputed by create-payment-intent. Anything that doesn't apply
// (unknown, inactive, expired, used up) is { code: null }: no error, no hint
// about why, and no limits exposed.
export async function GET(req: NextRequest) {
  const promo = lookupPromo(req.nextUrl.searchParams.get("code"));
  return NextResponse.json(promo ?? { code: null }, { headers: { "Cache-Control": "no-store" } });
}
