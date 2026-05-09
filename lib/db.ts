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
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      phone TEXT NOT NULL,
      package TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      photos TEXT NOT NULL,
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
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders(createdAt);
  `);
  global.__mp_db = db;
}

export type OrderRow = {
  id: string;
  firstName: string;
  phone: string;
  package: string;
  status: string;
  photos: string;
  createdAt: string;
  updatedAt: string;
  batchId: string | null;
};

export type Order = Omit<OrderRow, "photos"> & { photos: string[] };

export function rowToOrder(r: OrderRow): Order {
  return { ...r, photos: JSON.parse(r.photos || "[]") };
}
