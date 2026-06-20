import { NextRequest, NextResponse } from "next/server";
import { db, type LibraryDesign } from "@/lib/db";
import { isOperator } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const updates: string[] = [];
  const values: any[] = [];

  if ("categoryId" in body) {
    const newCat = body.categoryId === null || body.categoryId === ""
      ? null
      : String(body.categoryId);
    if (newCat) {
      const exists = db.prepare("SELECT id FROM categories WHERE id = ?").get(newCat);
      if (!exists) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
    }
    updates.push("categoryId = ?");
    values.push(newCat);
  }
  if (typeof body.tags === "string") {
    updates.push("tags = ?");
    values.push(body.tags.trim().slice(0, 500));
  }
  if (typeof body.filename === "string") {
    updates.push("filename = ?");
    values.push(body.filename.trim().slice(0, 200));
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  values.push(params.id);

  const res = db
    .prepare(`UPDATE library_designs SET ${updates.join(", ")} WHERE id = ?`)
    .run(...values);
  if (res.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const row = db.prepare("SELECT * FROM library_designs WHERE id = ?").get(params.id) as LibraryDesign;
  return NextResponse.json({ design: row });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const row = db.prepare("SELECT * FROM library_designs WHERE id = ?").get(params.id) as
    | LibraryDesign
    | undefined;
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  db.prepare("DELETE FROM library_designs WHERE id = ?").run(params.id);
  // Best-effort file removal; missing file is fine.
  try {
    const abs = path.join(process.cwd(), "public", row.path.replace(/^\//, ""));
    await fs.unlink(abs);
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
