import { NextRequest, NextResponse } from "next/server";
import { db, type LibraryDesign } from "@/lib/db";
import { isOperator } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const count = Math.min(20, Math.max(1, Number(searchParams.get("count") || 1)));
  const excludeIds = (searchParams.get("exclude") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // categoryId precedence: explicit param > preferredAutoFillCategory setting > none (all)
  let categoryId = searchParams.get("categoryId");
  if (categoryId === null) {
    const pref = db
      .prepare("SELECT value FROM settings WHERE key = 'preferredAutoFillCategory'")
      .get() as { value: string } | undefined;
    if (pref?.value) categoryId = pref.value;
  }

  const where: string[] = [];
  const params_: any[] = [];
  if (categoryId && categoryId !== "all") {
    where.push("categoryId = ?");
    params_.push(categoryId);
  }
  if (excludeIds.length) {
    where.push(`id NOT IN (${excludeIds.map(() => "?").join(",")})`);
    params_.push(...excludeIds);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // RANDOM() on the filtered set, then LIMIT.
  const rows = db
    .prepare(`SELECT * FROM library_designs ${whereSql} ORDER BY RANDOM() LIMIT ?`)
    .all(...params_, count) as LibraryDesign[];
  return NextResponse.json({ designs: rows });
}
