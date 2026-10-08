import { NextRequest, NextResponse } from "next/server";
import { db, rowToGallery, isGalleryExpired, type GalleryRow } from "@/lib/db";
import {
  GALLERY_MAGNET_CENTS,
  GALLERY_BUNDLE_3_CENTS,
  GALLERY_EXPIRED_EACH_CENTS,
  SHIPPING_CENTS,
} from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public — no auth. Returns the gallery for /gallery/[id]. Expired galleries are
// intentionally inaccessible (410) so the shared link stops working after 30 days.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = db.prepare("SELECT * FROM galleries WHERE id = ?").get(params.id) as
    | GalleryRow
    | undefined;
  if (!row) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }
  const gallery = rowToGallery(row);
  if (isGalleryExpired(gallery)) {
    return NextResponse.json({ expired: true }, { status: 410 });
  }

  return NextResponse.json({
    id: gallery.id,
    coupleDisplayText: gallery.coupleDisplayText,
    eventDate: gallery.eventDate,
    customSubtitle: gallery.customSubtitle,
    photos: gallery.photos,
    photoCount: gallery.photos.length,
    coupleEmail: gallery.coupleEmail || "",
    expiresAt: gallery.expiresAt,
    expired: false,
    pricing: {
      each: GALLERY_MAGNET_CENTS,
      bundle3: GALLERY_BUNDLE_3_CENTS,
      expiredEach: GALLERY_EXPIRED_EACH_CENTS,
      shipping: SHIPPING_CENTS,
    },
  });
}
