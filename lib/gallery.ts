// Shared helpers for the wedding gallery / export features. Node runtime only
// (touches the DB and filesystem).

import path from "path";
import { db, rowToOrder, type OrderRow } from "@/lib/db";
import type { ZipFile } from "@/lib/zip";

function getSetting(key: string): string | null {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

/**
 * Wedding orders belonging to the CURRENT event, newest first. Scoped to the
 * event window (see weddingEventStartedAt). If no window is recorded (an event
 * predating this feature), every wedding order is treated as current.
 */
export function currentWeddingOrders() {
  const startedAt = getSetting("weddingEventStartedAt");
  const rows = startedAt
    ? (db
        .prepare(
          "SELECT * FROM orders WHERE orderType = 'wedding' AND datetime(createdAt) >= datetime(?) ORDER BY datetime(createdAt) DESC"
        )
        .all(startedAt) as OrderRow[])
    : (db
        .prepare(
          "SELECT * FROM orders WHERE orderType = 'wedding' ORDER BY datetime(createdAt) DESC"
        )
        .all() as OrderRow[]);
  return rows.map(rowToOrder);
}

/**
 * The gallery photo for an order: the uncropped original when we have it, else
 * the square crop (legacy wedding orders). One entry per photo.
 */
export function galleryPhotosForOrder(o: { originalPhotos: string[]; photos: string[] }): string[] {
  return o.originalPhotos.length > 0 ? o.originalPhotos : o.photos;
}

/** All current-event original (or fallback) photo URLs, oldest first. */
export function currentWeddingPhotos(): string[] {
  const orders = currentWeddingOrders().slice().reverse(); // oldest first for stable order
  return orders.flatMap(galleryPhotosForOrder);
}

/** Map a public /uploads URL to its on-disk path under public/. */
export function publicUrlToFsPath(url: string): string {
  const clean = url.replace(/^\/+/, "").replace(/\.\./g, "");
  return path.join(process.cwd(), "public", clean);
}

/** Build ZIP entries with friendly, unique, sequential names. */
export function photosToZipFiles(photos: string[]): ZipFile[] {
  return photos.map((url, i) => {
    const ext = (url.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const n = String(i + 1).padStart(3, "0");
    return { name: `magnet-parlor-photo-${n}.${ext}`, path: publicUrlToFsPath(url) };
  });
}
