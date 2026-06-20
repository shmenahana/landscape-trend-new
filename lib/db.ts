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
export type OrderType = "market" | "shipped";

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
};

export type Order = Omit<OrderRow, "photos" | "smsConsent"> & {
  photos: string[];
  smsConsent: boolean;
};

export function rowToOrder(r: OrderRow): Order {
  return {
    ...r,
    photos: JSON.parse(r.photos || "[]"),
    smsConsent: Boolean(r.smsConsent),
  };
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
