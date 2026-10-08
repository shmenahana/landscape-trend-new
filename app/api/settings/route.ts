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
// The /wedding page reads the wedding fields to render the couple header, so
// these are intentionally public. preferredAutoFillCategory is harmless if public.
export async function GET() {
  const activeMagnetSize = (getSetting("activeMagnetSize") as MagnetSize) || "2x2";
  const preferredAutoFillCategory = getSetting("preferredAutoFillCategory") || "";
  return NextResponse.json({
    activeMagnetSize,
    preferredAutoFillCategory,
    weddingModeActive: getSetting("weddingModeActive") === "true",
    coupleDisplayText: getSetting("coupleDisplayText") || "",
    eventDate: getSetting("eventDate") || "",
    customSubtitle: getSetting("customSubtitle") || "",
    coupleEmail: getSetting("coupleEmail") || "",
  });
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

  // Wedding event settings. All optional; only the keys present are updated.
  if ("weddingModeActive" in body) {
    const next = body.weddingModeActive ? "true" : "false";
    const prev = getSetting("weddingModeActive");
    // Turning the event ON (from off) starts a new event window. Everything the
    // export/gallery features count is scoped to orders since this timestamp, so
    // a fresh wedding never mixes with a previous event's photos.
    if (next === "true" && prev !== "true") {
      setSetting("weddingEventStartedAt", new Date().toISOString().replace("T", " ").slice(0, 19));
    }
    setSetting("weddingModeActive", next);
  }
  if ("coupleDisplayText" in body) {
    setSetting("coupleDisplayText", String(body.coupleDisplayText ?? "").slice(0, 200));
  }
  if ("eventDate" in body) {
    setSetting("eventDate", String(body.eventDate ?? "").slice(0, 60));
  }
  if ("customSubtitle" in body) {
    setSetting("customSubtitle", String(body.customSubtitle ?? "").slice(0, 200));
  }
  if ("coupleEmail" in body) {
    setSetting("coupleEmail", String(body.coupleEmail ?? "").trim().slice(0, 200));
  }

  return NextResponse.json({
    activeMagnetSize: getSetting("activeMagnetSize") || "2x2",
    preferredAutoFillCategory: getSetting("preferredAutoFillCategory") || "",
    weddingModeActive: getSetting("weddingModeActive") === "true",
    coupleDisplayText: getSetting("coupleDisplayText") || "",
    eventDate: getSetting("eventDate") || "",
    customSubtitle: getSetting("customSubtitle") || "",
    coupleEmail: getSetting("coupleEmail") || "",
  });
}
