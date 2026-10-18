import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "magnet-parlor.db");

declare global {
  // eslint-disable-next-line no-var
  var __mp_db: Database.Database | undefined;
}

export const db = global.__mp_db ?? new Database(dbPath);
if (!global.__mp_db) {
  db.pragma("journal_mode = WAL");
  global.__mp_db = db;
}

// Schema init is idempotent — safe to run on every module load (hot reload, etc.).
{
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      phone TEXT NOT NULL,
      package TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      photos TEXT NOT NULL,
      magnetSize TEXT NOT NULL DEFAULT '2x2',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      batchId TEXT
    );
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      orders TEXT NOT NULL DEFAULT '[]',
      slots INTEGER NOT NULL DEFAULT 0,
      printed INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO settings (key, value) VALUES ('activeMagnetSize', '2x2');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('weddingModeActive', 'false');
    -- Wedding photo galleries. Each gallery is a 30-day snapshot of a finished
    -- event: the couple's header text and the original (uncropped) guest photos.
    -- The id is a non-guessable uuid used as the public /gallery/[id] slug.
    CREATE TABLE IF NOT EXISTS galleries (
      id TEXT PRIMARY KEY,
      coupleDisplayText TEXT NOT NULL DEFAULT '',
      eventDate TEXT NOT NULL DEFAULT '',
      customSubtitle TEXT NOT NULL DEFAULT '',
      photos TEXT NOT NULL DEFAULT '[]',
      coupleEmail TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      expiresAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_galleries_createdAt ON galleries(createdAt);
    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      eventType TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS library_designs (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      path TEXT NOT NULL,
      categoryId TEXT,
      tags TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders(createdAt);
    CREATE INDEX IF NOT EXISTS idx_inquiries_createdAt ON inquiries(createdAt);
    CREATE INDEX IF NOT EXISTS idx_library_categoryId ON library_designs(categoryId);
    CREATE INDEX IF NOT EXISTS idx_library_createdAt ON library_designs(createdAt);
  `);
  // Migrate: add columns to orders table if missing (existing DBs)
  const cols = db.prepare("PRAGMA table_info(orders)").all() as { name: string }[];
  const has = (n: string) => cols.some((c) => c.name === n);
  if (!has("magnetSize")) {
    db.exec(`ALTER TABLE orders ADD COLUMN magnetSize TEXT NOT NULL DEFAULT '2x2'`);
  }
  // Payment fields. Existing orders are treated as legacy cash/paid so they
  // stay in the regular print queue and display a CASH badge.
  if (!has("paymentMethod")) {
    db.exec(`ALTER TABLE orders ADD COLUMN paymentMethod TEXT NOT NULL DEFAULT 'cash'`);
  }
  if (!has("paymentStatus")) {
    db.exec(`ALTER TABLE orders ADD COLUMN paymentStatus TEXT NOT NULL DEFAULT 'paid'`);
  }
  if (!has("stripePaymentIntentId")) {
    db.exec(`ALTER TABLE orders ADD COLUMN stripePaymentIntentId TEXT`);
  }
  if (!has("orderCode")) {
    db.exec(`ALTER TABLE orders ADD COLUMN orderCode TEXT NOT NULL DEFAULT ''`);
  }
  // SMS pickup consent (market orders). Stored as 0/1. Legacy rows default to 0.
  if (!has("smsConsent")) {
    db.exec(`ALTER TABLE orders ADD COLUMN smsConsent INTEGER NOT NULL DEFAULT 0`);
  }
  // Online shop / shipped-order fields. Existing rows are 'market'.
  if (!has("orderType")) {
    db.exec(`ALTER TABLE orders ADD COLUMN orderType TEXT NOT NULL DEFAULT 'market'`);
  }
  if (!has("lastName")) {
    db.exec(`ALTER TABLE orders ADD COLUMN lastName TEXT`);
  }
  if (!has("email")) {
    db.exec(`ALTER TABLE orders ADD COLUMN email TEXT`);
  }
  if (!has("shippingAddress")) {
    // JSON: { street, city, state, zip }
    db.exec(`ALTER TABLE orders ADD COLUMN shippingAddress TEXT`);
  }
  if (!has("shippingRate")) {
    db.exec(`ALTER TABLE orders ADD COLUMN shippingRate REAL`);
  }
  if (!has("trackingNumber")) {
    db.exec(`ALTER TABLE orders ADD COLUMN trackingNumber TEXT`);
  }
  // Optional tip left by a wedding guest for their magnet maker. tipAmount is in
  // dollars (nullable = no tip); tipPaymentIntentId is the Stripe intent.
  if (!has("tipAmount")) {
    db.exec(`ALTER TABLE orders ADD COLUMN tipAmount REAL`);
  }
  if (!has("tipPaymentIntentId")) {
    db.exec(`ALTER TABLE orders ADD COLUMN tipPaymentIntentId TEXT`);
  }
  // Gallery upsell orders link back to the gallery they were placed from.
  if (!has("galleryId")) {
    db.exec(`ALTER TABLE orders ADD COLUMN galleryId TEXT`);
  }
  // Wedding uploads keep BOTH the square crop (in `photos`, used for printing)
  // and the original uncropped photo (here, used for the couple's gallery).
  // JSON array of paths; null for non-wedding and legacy wedding orders.
  if (!has("originalPhotos")) {
    db.exec(`ALTER TABLE orders ADD COLUMN originalPhotos TEXT`);
  }
  // Short side of each photo's crop in SOURCE px (index-aligned with
  // `photos`; null entry = FIT or unknown). Under 720 means the crop was
  // upscaled to print — the dashboard flags it "low res". JSON; null on
  // orders placed before this existed.
  if (!has("cropPx")) {
    db.exec(`ALTER TABLE orders ADD COLUMN cropPx TEXT`);
  }
  // Seed default categories on first init
  const catCount = (db.prepare("SELECT COUNT(*) as n FROM categories").get() as { n: number }).n;
  if (catCount === 0) {
    const seed = [
      "Funny",
      "Faith/Religious",
      "Nature/Animals",
      "Quotes & Sayings",
      "Sports",
      "Holidays",
      "Patriotic",
      "Kids",
      "Vintage/Retro",
      "Custom/Misc",
    ];
    const insert = db.prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
    const tx = db.transaction((names: string[]) => {
      for (const n of names) {
        insert.run(cryptoRandom(), n);
      }
    });
    tx(seed);
  }
}

// Lightweight uuid without pulling crypto into the global type surface
function cryptoRandom(): string {
  // Node 16+ has globalThis.crypto.randomUUID
  return (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
}

export type MagnetSize = "2x2" | "2x3";

export type PaymentMethod = "stripe" | "cash";
export type PaymentStatus = "paid" | "cash_pending" | "cash_confirmed";
export type OrderType = "market" | "shipped" | "wedding" | "gallery_order";

export type ShippingAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type OrderRow = {
  id: string;
  firstName: string;
  phone: string;
  package: string;
  status: string;
  photos: string;
  magnetSize: MagnetSize;
  createdAt: string;
  updatedAt: string;
  batchId: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  stripePaymentIntentId: string | null;
  orderCode: string;
  smsConsent: number;
  orderType: OrderType;
  lastName: string | null;
  email: string | null;
  shippingAddress: string | null;
  shippingRate: number | null;
  trackingNumber: string | null;
  tipAmount: number | null;
  tipPaymentIntentId: string | null;
  galleryId: string | null;
  originalPhotos: string | null;
  cropPx: string | null;
};

export type Order = Omit<OrderRow, "photos" | "smsConsent" | "originalPhotos" | "cropPx"> & {
  photos: string[];
  originalPhotos: string[];
  cropPx: (number | null)[];
  smsConsent: boolean;
};

export function rowToOrder(r: OrderRow): Order {
  return {
    ...r,
    photos: JSON.parse(r.photos || "[]"),
    originalPhotos: JSON.parse(r.originalPhotos || "[]"),
    cropPx: JSON.parse(r.cropPx || "[]"),
    smsConsent: Boolean(r.smsConsent),
  };
}

// ── Wedding photo galleries ──────────────────────────────────────────────────
export type GalleryRow = {
  id: string;
  coupleDisplayText: string;
  eventDate: string;
  customSubtitle: string;
  photos: string;
  coupleEmail: string | null;
  createdAt: string;
  expiresAt: string;
};

export type Gallery = Omit<GalleryRow, "photos"> & { photos: string[] };

export function rowToGallery(r: GalleryRow): Gallery {
  return { ...r, photos: JSON.parse(r.photos || "[]") };
}

/** A gallery is live for 30 days from creation, then inaccessible. */
export function isGalleryExpired(g: { expiresAt: string }): boolean {
  const exp = new Date(g.expiresAt.replace(" ", "T") + "Z").getTime();
  return Number.isFinite(exp) ? Date.now() > exp : false;
}

export type Category = {
  id: string;
  name: string;
  createdAt: string;
};

export type LibraryDesign = {
  id: string;
  filename: string;
  path: string;
  categoryId: string | null;
  tags: string;
  createdAt: string;
};
