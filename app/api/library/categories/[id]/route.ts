import { NextRequest, NextResponse } from "next/server";
import { db, type Category } from "@/lib/db";
import { isOperator } from "@/lib/auth";

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
  const name = String(body?.name || "").trim().slice(0, 80);
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const dupe = db.prepare("SELECT id FROM categories WHERE name = ? AND id != ?").get(name, params.id);
  if (dupe) {
    return NextResponse.json({ error: "A category with that name already exists" }, { status: 409 });
  }
  const res = db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, params.id);
  if (res.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const row = db.prepare("SELECT id, name, createdAt FROM categories WHERE id = ?").get(params.id) as Category;
  return NextResponse.json({ category: row });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // FK ON DELETE SET NULL — designs become uncategorized rather than disappearing.
  const res = db.prepare("DELETE FROM categories WHERE id = ?").run(params.id);
  if (res.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
