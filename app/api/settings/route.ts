import { NextRequest, NextResponse } from "next/server";
import { db, type MagnetSize } from "@/lib/db";
import { isOperator } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SIZES = new Set<MagnetSize>(["2x2", "2x3"]);

function getSetting(key: string): string | null {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

function setSetting(key: string, value: string): void {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}

// Public: customer order page reads the active magnet size to set crop aspect.
// preferredAutoFillCategory is also returned for the dashboard's convenience but is harmless if public.
export async function GET() {
  const activeMagnetSize = (getSetting("activeMagnetSize") as MagnetSize) || "2x2";
  const preferredAutoFillCategory = getSetting("preferredAutoFillCategory") || "";
  return NextResponse.json({ activeMagnetSize, preferredAutoFillCategory });
}

export async function PATCH(req: NextRequest) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));

  if ("activeMagnetSize" in body) {
    const size = body.activeMagnetSize as MagnetSize;
    if (!VALID_SIZES.has(size)) {
      return NextResponse.json({ error: "Invalid magnet size" }, { status: 400 });
    }
    setSetting("activeMagnetSize", size);
  }
  if ("preferredAutoFillCategory" in body) {
    // empty string means "no preference (random from all)"
    const v = body.preferredAutoFillCategory === null ? "" : String(body.preferredAutoFillCategory);
    if (v) {
      const exists = db.prepare("SELECT id FROM categories WHERE id = ?").get(v);
      if (!exists) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
    }
    setSetting("preferredAutoFillCategory", v);
  }

  return NextResponse.json({
    activeMagnetSize: getSetting("activeMagnetSize") || "2x2",
    preferredAutoFillCategory: getSetting("preferredAutoFillCategory") || "",
  });
}
