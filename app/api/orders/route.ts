import { NextRequest, NextResponse } from "next/server";
import { db, rowToOrder, type OrderRow, type ShippingAddress } from "@/lib/db";
import { toE164 } from "@/lib/phone";
import { isOperator } from "@/lib/auth";
import { generateOrderCode, isPackageKey, priceCents, shippedTotalCents, SHIPPING_CENTS, type PackageKey } from "@/lib/pricing";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = db
    .prepare("SELECT * FROM orders ORDER BY datetime(createdAt) DESC")
    .all() as OrderRow[];
  return NextResponse.json({
    orders: rows.map((r) => {
      const o = rowToOrder(r);
      return { ...o, sourcePhotos: o.photos.map(sourcePathFor) };
    }),
  });
}

// The uncropped "source" copy of a photo lives next to its crop by filename
// convention: /uploads/<id>/photo-N.jpg -> photo-N-source.jpg. Orders placed
// before sources existed have none, so this returns null unless it's on disk.
function sourcePathFor(photoUrl: string): string | null {
  const m = /^\/uploads\/([0-9a-f-]+)\/photo-(\d+)\.(?:jpg|png)$/.exec(photoUrl);
  if (!m) return null;
  const name = `photo-${m[2]}-source.jpg`;
  return existsSync(path.join(process.cwd(), "public", "uploads", m[1], name))
    ? `/uploads/${m[1]}/${name}`
    : null;
}

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV",
  "WI","WY","DC",
]);

function parseShippingAddress(raw: string): { ok: true; value: ShippingAddress } | { ok: false; error: string } {
  let obj: any;
  try {
    obj = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Invalid shipping address" };
  }
  const street = String(obj?.street || "").trim().slice(0, 200);
  const city = String(obj?.city || "").trim().slice(0, 120);
  const state = String(obj?.state || "").trim().toUpperCase().slice(0, 2);
  const zip = String(obj?.zip || "").trim().slice(0, 10);
  if (!street) return { ok: false, error: "Street address is required" };
  if (!city) return { ok: false, error: "City is required" };
  if (!US_STATES.has(state)) return { ok: false, error: "A valid US state is required" };
  if (!/^\d{5}(-\d{4})?$/.test(zip)) return { ok: false, error: "A valid ZIP code is required" };
  return { ok: true, value: { street, city, state, zip } };
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const orderType = String(form.get("orderType") || "market");
  if (orderType !== "market" && orderType !== "shipped" && orderType !== "wedding") {
    return NextResponse.json({ error: "Invalid order type" }, { status: 400 });
  }
  const isShipped = orderType === "shipped";
  const isWedding = orderType === "wedding";

  const firstName = String(form.get("firstName") || "").trim();
  const lastName = String(form.get("lastName") || "").trim();
  const email = String(form.get("email") || "").trim().slice(0, 200);
  const phoneRaw = String(form.get("phone") || "").trim();
  // Wedding guests don't choose a package — one photo, one magnet, prepaid by
  // the couple. Everyone else picks a 3- or 9-pack.
  const pkg = isWedding ? "1" : String(form.get("package") || "");
  // Shipped + wedding orders always use the square crop tool (2x2).
  const magnetSize = isShipped || isWedding ? "2x2" : String(form.get("magnetSize") || "2x2");
  const paymentMethod = isShipped ? "stripe" : isWedding ? "cash" : String(form.get("paymentMethod") || "");
  const smsConsent = String(form.get("smsConsent") || "") === "true" ? 1 : 0;
  const paymentIntentIdRaw = form.get("paymentIntentId");
  const paymentIntentId =
    typeof paymentIntentIdRaw === "string" && paymentIntentIdRaw ? paymentIntentIdRaw : null;

  if (magnetSize !== "2x2" && magnetSize !== "2x3") {
    return NextResponse.json({ error: "Invalid magnet size" }, { status: 400 });
  }
  if (!firstName) return NextResponse.json({ error: "firstName required" }, { status: 400 });
  if (!isWedding && !isPackageKey(pkg)) {
    return NextResponse.json({ error: "Invalid package" }, { status: 400 });
  }

  // Phone: required (and normalized) for market; optional for shipped + wedding.
  let phone = "";
  if (isShipped || isWedding) {
    if (phoneRaw) {
      const norm = toE164(phoneRaw);
      if (!norm) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      phone = norm;
    }
  } else {
    const norm = toE164(phoneRaw);
    if (!norm) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    phone = norm;
  }

  // Shipped-only required fields.
  let shippingAddressJson: string | null = null;
  let shippingRate: number | null = null;
  if (isShipped) {
    if (!lastName) return NextResponse.json({ error: "lastName required" }, { status: 400 });
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    const addr = parseShippingAddress(String(form.get("shippingAddress") || ""));
    if (!addr.ok) return NextResponse.json({ error: addr.error }, { status: 400 });
    shippingAddressJson = JSON.stringify(addr.value);
    shippingRate = SHIPPING_CENTS / 100;
  }

  if (paymentMethod !== "stripe" && paymentMethod !== "cash") {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }
  if (paymentMethod === "stripe" && !paymentIntentId) {
    return NextResponse.json({ error: "Payment intent required for card payment" }, { status: 400 });
  }

  // For Stripe orders: verify the PaymentIntent with Stripe before accepting.
  // This blocks spoofed paymentIntentId values from creating a print-queue order.
  if (paymentMethod === "stripe") {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Stripe is not configured on this server" }, { status: 503 });
    }
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(secret);
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId!);
      if (intent.status !== "succeeded") {
        return NextResponse.json(
          { error: `Payment not completed (status: ${intent.status})` },
          { status: 402 }
        );
      }
      // Shipped orders must cover package price + flat shipping. Only market/
      // shipped orders reach this Stripe branch, so pkg is a valid PackageKey.
      const pkgKey = pkg as PackageKey;
      const expected = isShipped ? shippedTotalCents(pkgKey) : priceCents(pkgKey);
      if (intent.amount !== expected || intent.currency !== "usd") {
        return NextResponse.json(
          { error: "Payment amount mismatch" },
          { status: 402 }
        );
      }
      // Make sure this intent hasn't already been used for another order.
      const reused = db
        .prepare("SELECT id FROM orders WHERE stripePaymentIntentId = ?")
        .get(paymentIntentId);
      if (reused) {
        return NextResponse.json({ error: "Payment already used for an order" }, { status: 409 });
      }
    } catch (e: any) {
      console.error("[POST /api/orders] stripe verify failed:", e?.message || e);
      return NextResponse.json({ error: "Could not verify payment" }, { status: 502 });
    }
  }

  const photoFiles = form.getAll("photos").filter((v): v is File => v instanceof File);
  const expected = isWedding ? 1 : pkg === "3" ? 3 : 9;
  if (photoFiles.length !== expected) {
    return NextResponse.json(
      { error: `Expected ${expected} photos, got ${photoFiles.length}` },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  const uploadDir = path.join(process.cwd(), "public", "uploads", id);
  await fs.mkdir(uploadDir, { recursive: true });

  const photoPaths: string[] = [];
  for (let i = 0; i < photoFiles.length; i++) {
    const file = photoFiles[i];
    const ext = file.type === "image/png" ? "png" : "jpg";
    const name = `photo-${i + 1}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadDir, name), buf);
    photoPaths.push(`/uploads/${id}/${name}`);

    // Optional uncropped copy (client-downscaled JPEG) for redoing a bad crop.
    // Keyed by index so a missing one can't shift the rest; anything absent or
    // unexpected is skipped — the order never depends on it.
    const source = form.get(`source-${i}`);
    if (source instanceof File && source.type === "image/jpeg" && source.size > 0 && source.size <= MAX_SOURCE_BYTES) {
      const sbuf = Buffer.from(await source.arrayBuffer());
      await fs.writeFile(path.join(uploadDir, `photo-${i + 1}-source.jpg`), sbuf);
    }
  }

  // Wedding orders also keep the ORIGINAL uncropped photo for the couple's
  // gallery. Cropped copies above still drive printing; these originals live in
  // an /originals subfolder and are optional (older clients may not send them).
  let originalPhotosJson: string | null = null;
  if (isWedding) {
    const originalFiles = form.getAll("originals").filter((v): v is File => v instanceof File);
    if (originalFiles.length > 0) {
      const originalsDir = path.join(uploadDir, "originals");
      await fs.mkdir(originalsDir, { recursive: true });
      const originalPaths: string[] = [];
      for (let i = 0; i < originalFiles.length; i++) {
        const file = originalFiles[i];
        const ext = file.type === "image/png" ? "png"
          : file.type === "image/webp" ? "webp"
          : "jpg";
        const name = `original-${i + 1}.${ext}`;
        const buf = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(path.join(originalsDir, name), buf);
        originalPaths.push(`/uploads/${id}/originals/${name}`);
      }
      originalPhotosJson = JSON.stringify(originalPaths);
    }
  }

  // Wedding orders are prepaid by the couple — always "paid", with no cash code.
  const paymentStatus = paymentMethod === "stripe" || isWedding ? "paid" : "cash_pending";
  const orderCode = paymentMethod === "cash" && !isWedding ? generateOrderCode() : "";

  // Wait-time estimate (market only): how many market orders are already in the
  // active queue ahead of this one. Counted BEFORE inserting so the new order
  // isn't included. Archived/ready/picked-up and all shipped orders are excluded.
  const aheadRow = db
    .prepare(
      "SELECT COUNT(*) AS n FROM orders WHERE orderType = 'market' AND status IN ('pending','printing')"
    )
    .get() as { n: number };
  const ordersAhead = aheadRow.n;

  db.prepare(
    `INSERT INTO orders
       (id, firstName, phone, package, status, photos, magnetSize,
        paymentMethod, paymentStatus, stripePaymentIntentId, orderCode,
        smsConsent, orderType, lastName, email, shippingAddress, shippingRate,
        originalPhotos)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, firstName, phone, pkg, JSON.stringify(photoPaths), magnetSize,
    paymentMethod, paymentStatus, paymentIntentId, orderCode,
    smsConsent, orderType, lastName || null, email || null, shippingAddressJson, shippingRate,
    originalPhotosJson
  );

  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as OrderRow;
  return NextResponse.json({ order: rowToOrder(row), ordersAhead }, { status: 201 });
}
