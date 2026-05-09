import { NextRequest, NextResponse } from "next/server";
import { db, rowToOrder, type OrderRow } from "@/lib/db";
import { toE164 } from "@/lib/phone";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = db
    .prepare("SELECT * FROM orders ORDER BY datetime(createdAt) DESC")
    .all() as OrderRow[];
  return NextResponse.json({ orders: rows.map(rowToOrder) });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const firstName = String(form.get("firstName") || "").trim();
  const phoneRaw = String(form.get("phone") || "").trim();
  const pkg = String(form.get("package") || "");

  if (!firstName) return NextResponse.json({ error: "firstName required" }, { status: 400 });
  const phone = toE164(phoneRaw);
  if (!phone) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  if (pkg !== "3" && pkg !== "9") {
    return NextResponse.json({ error: "Invalid package" }, { status: 400 });
  }

  const photoFiles = form.getAll("photos").filter((v): v is File => v instanceof File);
  const expected = pkg === "3" ? 3 : 9;
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
  }

  db.prepare(
    `INSERT INTO orders (id, firstName, phone, package, status, photos)
     VALUES (?, ?, ?, ?, 'pending', ?)`
  ).run(id, firstName, phone, pkg, JSON.stringify(photoPaths));

  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as OrderRow;
  return NextResponse.json({ order: rowToOrder(row) }, { status: 201 });
}
