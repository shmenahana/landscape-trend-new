import { NextRequest, NextResponse } from "next/server";
import { db, type LibraryDesign } from "@/lib/db";
import { isOperator } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIBRARY_DIR_ABS = path.join(process.cwd(), "public", "uploads", "library");
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);
const MAX_FILES_PER_REQUEST = 50;
const MAX_BYTES_PER_FILE = 10 * 1024 * 1024; // 10 MB

function safeFilename(orig: string): string {
  const base = orig.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 80);
  return base || "design";
}

export async function GET(req: NextRequest) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId"); // empty string = uncategorized
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const sort = searchParams.get("sort") || "newest"; // newest | name
  const limit = Math.min(2000, Math.max(1, Number(searchParams.get("limit") || 1000)));

  const where: string[] = [];
  const params_: any[] = [];
  if (categoryId === "") {
    where.push("categoryId IS NULL");
  } else if (categoryId) {
    where.push("categoryId = ?");
    params_.push(categoryId);
  }
  if (search) {
    where.push("(LOWER(filename) LIKE ? OR LOWER(tags) LIKE ?)");
    params_.push(`%${search}%`, `%${search}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSql = sort === "name" ? "ORDER BY filename COLLATE NOCASE ASC" : "ORDER BY datetime(createdAt) DESC";

  const rows = db
    .prepare(`SELECT * FROM library_designs ${whereSql} ${orderSql} LIMIT ?`)
    .all(...params_, limit) as LibraryDesign[];
  return NextResponse.json({ designs: rows });
}

export async function POST(req: NextRequest) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await req.formData();
  const categoryIdRaw = form.get("categoryId");
  const categoryId = typeof categoryIdRaw === "string" && categoryIdRaw.trim() ? categoryIdRaw.trim() : null;

  // Validate category exists if provided
  if (categoryId) {
    const cat = db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId);
    if (!cat) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
  }

  const files = form.getAll("files").filter((v): v is File => v instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Too many files (max ${MAX_FILES_PER_REQUEST} per upload)` },
      { status: 400 }
    );
  }

  await fs.mkdir(LIBRARY_DIR_ABS, { recursive: true });

  const inserted: LibraryDesign[] = [];
  const rejected: { name: string; reason: string }[] = [];
  const insert = db.prepare(
    "INSERT INTO library_designs (id, filename, path, categoryId, tags) VALUES (?, ?, ?, ?, '')"
  );

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      rejected.push({ name: file.name, reason: `unsupported type ${file.type || "unknown"}` });
      continue;
    }
    if (file.size > MAX_BYTES_PER_FILE) {
      rejected.push({ name: file.name, reason: "file too large (>10 MB)" });
      continue;
    }
    const id = crypto.randomUUID();
    const extFromName = path.extname(file.name).toLowerCase().replace(".", "") || "jpg";
    const ext = extFromName.match(/^(jpe?g|png|webp|gif)$/) ? extFromName : "jpg";
    const filename = `${id}-${safeFilename(file.name)}`.replace(/\.(jpe?g|png|webp|gif)$/i, "") + `.${ext}`;
    const abs = path.join(LIBRARY_DIR_ABS, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(abs, buf);
    const relPath = `/uploads/library/${filename}`;
    insert.run(id, file.name.slice(0, 200), relPath, categoryId);
    const row = db.prepare("SELECT * FROM library_designs WHERE id = ?").get(id) as LibraryDesign;
    inserted.push(row);
  }

  return NextResponse.json({ inserted, rejected }, { status: 201 });
}
