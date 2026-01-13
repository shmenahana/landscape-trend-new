import * as SQLite from 'expo-sqlite';
import {
  Transaction,
  Category,
  TransactionCategory,
  CategorizationRule,
  Setting,
  Import,
} from '../types';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { SEED_MAPPINGS } from '../constants/seedMappings';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<void> => {
  db = await SQLite.openDatabaseAsync('know_your_numbers.db');

  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      merchant_norm TEXT NOT NULL,
      amount_signed REAL NOT NULL,
      source_file TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      include_in_overhead INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tx_category (
      tx_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      confidence TEXT NOT NULL CHECK(confidence IN ('high', 'medium', 'low')),
      PRIMARY KEY (tx_id, category_id),
      FOREIGN KEY (tx_id) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_type TEXT NOT NULL CHECK(match_type IN ('contains', 'exact', 'regex')),
      pattern TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS imports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      imported_at TEXT DEFAULT CURRENT_TIMESTAMP,
      row_count INTEGER NOT NULL,
      deduped_count INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_merchant_norm ON transactions(merchant_norm);
    CREATE INDEX IF NOT EXISTS idx_tx_category_tx_id ON tx_category(tx_id);
    CREATE INDEX IF NOT EXISTS idx_tx_category_category_id ON tx_category(category_id);
  `);

  // Initialize categories if not exists
  const categoriesCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );

  if (categoriesCount?.count === 0) {
    for (const category of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'INSERT INTO categories (name, include_in_overhead) VALUES (?, ?)',
        [category.name, category.include_in_overhead ? 1 : 0]
      );
    }

    // Initialize seed rules
    for (const [pattern, categoryName, matchType] of SEED_MAPPINGS) {
      const category = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM categories WHERE name = ?',
        [categoryName]
      );
      if (category) {
        await db.runAsync(
          'INSERT INTO rules (match_type, pattern, category_id) VALUES (?, ?, ?)',
          [matchType, pattern.toLowerCase(), category.id]
        );
      }
    }
  }
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// Settings operations
export const getSetting = async (key: string): Promise<string | null> => {
  const database = getDatabase();
  const result = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return result?.value || null;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  const database = getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
};

// Transaction operations
export const insertTransaction = async (tx: Transaction): Promise<number> => {
  const database = getDatabase();
  const result = await database.runAsync(
    'INSERT INTO transactions (date, description, merchant_norm, amount_signed, source_file) VALUES (?, ?, ?, ?, ?)',
    [tx.date, tx.description, tx.merchant_norm, tx.amount_signed, tx.source_file]
  );
  return result.lastInsertRowId;
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const database = getDatabase();
  return await database.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC');
};

export const getTransactionById = async (id: number): Promise<Transaction | null> => {
  const database = getDatabase();
  return await database.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', [id]);
};

export const getTransactionCount = async (): Promise<number> => {
  const database = getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions'
  );
  return result?.count || 0;
};

export const transactionExists = async (
  date: string,
  amount: number,
  merchantNorm: string
): Promise<boolean> => {
  const database = getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions WHERE date = ? AND amount_signed = ? AND merchant_norm = ?',
    [date, amount, merchantNorm]
  );
  return (result?.count || 0) > 0;
};

// Category operations
export const getAllCategories = async (): Promise<Category[]> => {
  const database = getDatabase();
  const results = await database.getAllAsync<any>(
    'SELECT id, name, include_in_overhead FROM categories ORDER BY name'
  );
  return results.map(r => ({
    id: r.id,
    name: r.name,
    include_in_overhead: r.include_in_overhead === 1,
  }));
};

export const getCategoryById = async (id: number): Promise<Category | null> => {
  const database = getDatabase();
  const result = await database.getFirstAsync<any>(
    'SELECT id, name, include_in_overhead FROM categories WHERE id = ?',
    [id]
  );
  if (!result) return null;
  return {
    id: result.id,
    name: result.name,
    include_in_overhead: result.include_in_overhead === 1,
  };
};

export const getCategoryByName = async (name: string): Promise<Category | null> => {
  const database = getDatabase();
  const result = await database.getFirstAsync<any>(
    'SELECT id, name, include_in_overhead FROM categories WHERE name = ?',
    [name]
  );
  if (!result) return null;
  return {
    id: result.id,
    name: result.name,
    include_in_overhead: result.include_in_overhead === 1,
  };
};

export const updateCategoryIncludeOverhead = async (
  id: number,
  include: boolean
): Promise<void> => {
  const database = getDatabase();
  await database.runAsync(
    'UPDATE categories SET include_in_overhead = ? WHERE id = ?',
    [include ? 1 : 0, id]
  );
};

// Transaction-Category operations
export const assignTransactionCategory = async (
  txId: number,
  categoryId: number,
  confidence: 'high' | 'medium' | 'low'
): Promise<void> => {
  const database = getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO tx_category (tx_id, category_id, confidence) VALUES (?, ?, ?)',
    [txId, categoryId, confidence]
  );
};

export const getTransactionCategory = async (
  txId: number
): Promise<{ category: Category; confidence: string } | null> => {
  const database = getDatabase();
  const result = await database.getFirstAsync<any>(
    `SELECT c.id, c.name, c.include_in_overhead, tc.confidence
     FROM tx_category tc
     JOIN categories c ON tc.category_id = c.id
     WHERE tc.tx_id = ?`,
    [txId]
  );
  if (!result) return null;
  return {
    category: {
      id: result.id,
      name: result.name,
      include_in_overhead: result.include_in_overhead === 1,
    },
    confidence: result.confidence,
  };
};

// Rules operations
export const insertRule = async (rule: CategorizationRule): Promise<number> => {
  const database = getDatabase();
  const result = await database.runAsync(
    'INSERT INTO rules (match_type, pattern, category_id) VALUES (?, ?, ?)',
    [rule.match_type, rule.pattern, rule.category_id]
  );
  return result.lastInsertRowId;
};

export const getAllRules = async (): Promise<CategorizationRule[]> => {
  const database = getDatabase();
  return await database.getAllAsync<CategorizationRule>(
    'SELECT * FROM rules ORDER BY created_at DESC'
  );
};

// Import operations
export const insertImport = async (imp: Import): Promise<number> => {
  const database = getDatabase();
  const result = await database.runAsync(
    'INSERT INTO imports (filename, row_count, deduped_count) VALUES (?, ?, ?)',
    [imp.filename, imp.row_count, imp.deduped_count]
  );
  return result.lastInsertRowId;
};

export const getAllImports = async (): Promise<Import[]> => {
  const database = getDatabase();
  return await database.getAllAsync<Import>('SELECT * FROM imports ORDER BY imported_at DESC');
};

// Reset all data
export const resetAllData = async (): Promise<void> => {
  const database = getDatabase();
  await database.execAsync(`
    DELETE FROM tx_category;
    DELETE FROM transactions;
    DELETE FROM imports;
    DELETE FROM rules WHERE id NOT IN (SELECT id FROM rules LIMIT ${SEED_MAPPINGS.length});
    DELETE FROM settings;
  `);
};
