import { NextRequest, NextResponse } from "next/server";
import { db, rowToGallery, type GalleryRow } from "@/lib/db";
import { isOperator } from "@/lib/auth";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { currentWeddingPhotos, photosToZipFiles } from "@/lib/gallery";
import { zipResponse } from "@/lib/zip";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GALLERY_DAYS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSetting(key: string): string {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? "";
}

// GET — operator downloads a ZIP of every original photo from the current event.
// With ?meta=1 it returns just the photo count (for the settings page) instead.
export async function GET(req: NextRequest) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const photos = currentWeddingPhotos();
  if (new URL(req.url).searchParams.get("meta")) {
    return NextResponse.json({ photoCount: photos.length });
  }
  if (photos.length === 0) {
    return NextResponse.json({ error: "No guest photos to download yet." }, { status: 404 });
  }
  return zipResponse(photosToZipFiles(photos), "wedding-guest-photos.zip");
}

// POST — create a shareable gallery from the current event and email the couple.
export async function POST(req: NextRequest) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const coupleEmail = String(body?.coupleEmail ?? "").trim().slice(0, 200);
  if (coupleEmail && !EMAIL_RE.test(coupleEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const photos = currentWeddingPhotos();
  if (photos.length === 0) {
    return NextResponse.json(
      { error: "There are no guest photos to include yet." },
      { status: 400 }
    );
  }

  // Snapshot the current wedding header text so the gallery keeps its identity
  // even after the operator closes the event and clears these fields.
  const coupleDisplayText = getSetting("coupleDisplayText");
  const eventDate = getSetting("eventDate");
  const customSubtitle = getSetting("customSubtitle");

  const id = crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + GALLERY_DAYS * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace("T", " ").slice(0, 19);

  db.prepare(
    `INSERT INTO galleries
       (id, coupleDisplayText, eventDate, customSubtitle, photos, coupleEmail, createdAt, expiresAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    coupleDisplayText,
    eventDate,
    customSubtitle,
    JSON.stringify(photos),
    coupleEmail || null,
    fmt(now),
    fmt(expires)
  );

  // Persist the couple's email for next time (prefill).
  if (coupleEmail) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('coupleEmail', ?)").run(coupleEmail);
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "") || new URL(req.url).origin;
  const galleryUrl = `${base}/gallery/${id}`;

  // Best-effort warm email to the couple. Falls back to "copy link manually"
  // (email status "skipped") when SendGrid isn't configured.
  let emailStatus: "sent" | "skipped" | "failed" = "skipped";
  let emailError: string | null = null;
  if (coupleEmail) {
    const text =
      `Thank you for letting us be part of your beautiful celebration!\n\n` +
      `Here are all the photos your guests uploaded throughout the evening. You can ` +
      `browse them online or download them all:\n\n${galleryUrl}\n\n` +
      `And if any of them make you smile, we can turn your favorites into custom ` +
      `magnets delivered to your door.\n\n` +
      `This gallery will be available for 30 days.\n\n` +
      `Congratulations again!\n— The Magnet Parlor`;
    const html = galleryEmailHtml(coupleDisplayText, galleryUrl);
    const result = await sendEmail({
      to: coupleEmail,
      subject: "Your Wedding Photos from The Magnet Parlor ♥",
      text,
      html,
    });
    emailStatus = result.status;
    emailError = result.error;
  }

  const row = db.prepare("SELECT * FROM galleries WHERE id = ?").get(id) as GalleryRow;
  return NextResponse.json(
    {
      gallery: rowToGallery(row),
      url: galleryUrl,
      photoCount: photos.length,
      email: { status: emailStatus, error: emailError, configured: isEmailConfigured() },
    },
    { status: 201 }
  );
}

function galleryEmailHtml(coupleText: string, url: string): string {
  const heading = (coupleText || "Congratulations!").replace(/</g, "&lt;");
  return `<!doctype html>
<html><body style="margin:0;background:#FDF6EE;font-family:Georgia,serif;color:#3A3632;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDF6EE;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFAF4;border:1px solid #E8DDD0;border-radius:8px;padding:36px 32px;">
        <tr><td align="center" style="font-size:14px;letter-spacing:0.3em;text-transform:uppercase;color:#A07848;">The Magnet Parlor</td></tr>
        <tr><td align="center" style="padding-top:14px;font-size:30px;color:#2B3856;font-family:'Great Vibes',cursive;">${heading}</td></tr>
        <tr><td style="padding-top:22px;font-size:16px;line-height:1.7;color:#3A3632;">
          Thank you for letting us be part of your beautiful celebration! Here are all
          the photos your guests uploaded throughout the evening. You can browse them
          online or download them all &mdash; and if any of them make you smile, we can
          turn your favorites into custom magnets delivered to your door.
        </td></tr>
        <tr><td align="center" style="padding:28px 0;">
          <a href="${url}" style="background:#2B3856;color:#FFFAF4;text-decoration:none;padding:14px 30px;border-radius:4px;font-size:16px;letter-spacing:0.05em;">View Your Gallery &#9829;</a>
        </td></tr>
        <tr><td align="center" style="font-size:13px;color:#6B6058;">This gallery will be available for 30 days.</td></tr>
        <tr><td align="center" style="padding-top:24px;font-size:22px;color:#8B5E3C;font-family:'Great Vibes',cursive;">Congratulations again! &mdash; The Magnet Parlor</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
