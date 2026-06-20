import { NextRequest, NextResponse } from "next/server";
import { db, type Category } from "@/lib/db";
import { isOperator } from "@/lib/auth";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CountedCategory = Category & { designCount: number };

export async function GET(req: NextRequest) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.createdAt,
              (SELECT COUNT(*) FROM library_designs d WHERE d.categoryId = c.id) AS designCount
       FROM categories c
       ORDER BY c.name COLLATE NOCASE ASC`
    )
    .all() as CountedCategory[];
  const totalDesigns = (
    db.prepare("SELECT COUNT(*) AS n FROM library_designs").get() as { n: number }
  ).n;
  const uncategorized = (
    db
      .prepare("SELECT COUNT(*) AS n FROM library_designs WHERE categoryId IS NULL")
      .get() as { n: number }
  ).n;
  return NextResponse.json({ categories: rows, totalDesigns, uncategorized });
}

export async function POST(req: NextRequest) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim().slice(0, 80);
  if (!name) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }
  const existing = db.prepare("SELECT id FROM categories WHERE name = ?").get(name);
  if (existing) {
    return NextResponse.json({ error: "A category with that name already exists" }, { status: 409 });
  }
  const id = crypto.randomUUID();
  db.prepare("INSERT INTO categories (id, name) VALUES (?, ?)").run(id, name);
  const row = db.prepare("SELECT id, name, createdAt FROM categories WHERE id = ?").get(id);
  return NextResponse.json({ category: { ...(row as Category), designCount: 0 } }, { status: 201 });
}
