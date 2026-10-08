import { NextRequest, NextResponse } from "next/server";
import { db, rowToGallery, isGalleryExpired, type GalleryRow } from "@/lib/db";
import { photosToZipFiles } from "@/lib/gallery";
import { zipResponse } from "@/lib/zip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public — streams a ZIP of the gallery's original photos. Expiry-gated.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = db.prepare("SELECT * FROM galleries WHERE id = ?").get(params.id) as
    | GalleryRow
    | undefined;
  if (!row) return NextResponse.json({ error: "Gallery not found" }, { status: 404 });

  const gallery = rowToGallery(row);
  if (isGalleryExpired(gallery)) {
    return NextResponse.json({ error: "This gallery has expired." }, { status: 410 });
  }
  if (gallery.photos.length === 0) {
    return NextResponse.json({ error: "This gallery has no photos." }, { status: 404 });
  }
  return zipResponse(photosToZipFiles(gallery.photos), "wedding-photos.zip");
}
