// Promo code lookup — SERVER ONLY (reads the DB). The money math lives in
// lib/pricing.ts (shippedQuote); this only answers "which code, what %".
import { db } from "@/lib/db";

export type Promo = { code: string; percentOff: number };

type PromoRow = {
  code: string;
  percentOff: number;
  active: number;
  expiresAt: string | null;
  maxRedemptions: number | null;
  redemptionCount: number;
};

// "newday10 " → "NEWDAY10". Anything that isn't a plausible code → null.
export function normalizePromoCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9_-]{1,40}$/.test(code) ? code : null;
}

// Why a code row doesn't apply right now, or null if it does.
function unusableReason(r: PromoRow, now: Date): string | null {
  if (!r.active) return "inactive";
  if (!Number.isInteger(r.percentOff) || r.percentOff <= 0 || r.percentOff > 100) return "bad percent";
  if (r.expiresAt) {
    const t = Date.parse(r.expiresAt);
    if (!Number.isFinite(t) || now.getTime() >= t) return "expired";
  }
  if (r.maxRedemptions != null && r.redemptionCount >= r.maxRedemptions) return "used up";
  return null;
}

// The promo that applies right now, or null. Unknown, inactive, expired and
// used-up codes all come back null — callers charge full price, no error.
export function lookupPromo(raw: unknown, now = new Date()): Promo | null {
  const code = normalizePromoCode(raw);
  if (!code) return null;
  const r = db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(code) as PromoRow | undefined;
  if (!r || unusableReason(r, now)) return null;
  return { code: r.code, percentOff: r.percentOff };
}

// One redemption, called inside the transaction that saves a PAID order.
// Unconditional on purpose: the customer was already charged the discounted
// price when the intent was made, so a checkout that started before the cap
// was hit still counts (the count can end slightly above the max).
export function recordRedemption(code: string): void {
  db.prepare("UPDATE promo_codes SET redemptionCount = redemptionCount + 1 WHERE code = ?").run(code);
}

// Dashboard summary: every code, its limits, and what the orders show.
export type PromoStats = PromoRow & {
  status: "live" | "inactive" | "expired" | "used up";
  remaining: number | null;
  orders: number;
  discountTotal: number; // dollars
};

export function promoStats(now = new Date()): PromoStats[] {
  const rows = db.prepare("SELECT * FROM promo_codes ORDER BY createdAt DESC, code").all() as PromoRow[];
  const usage = db
    .prepare(
      "SELECT promoCode AS code, COUNT(*) AS n, COALESCE(SUM(discountAmount), 0) AS d FROM orders WHERE promoCode IS NOT NULL GROUP BY promoCode"
    )
    .all() as { code: string; n: number; d: number }[];
  return rows.map((r) => {
    const u = usage.find((x) => x.code === r.code);
    const why = unusableReason(r, now);
    return {
      ...r,
      status: why === null ? "live" : why === "bad percent" ? "inactive" : (why as PromoStats["status"]),
      remaining: r.maxRedemptions == null ? null : Math.max(0, r.maxRedemptions - r.redemptionCount),
      orders: u?.n ?? 0,
      discountTotal: Math.round((u?.d ?? 0) * 100) / 100,
    };
  });
}
