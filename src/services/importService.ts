import {
  insertTransaction,
  transactionExists,
  insertImport,
  getTransactionCount,
  getSetting,
} from '../database';
import { ColumnMapping, ParsedTransaction } from '../types';
import {
  parseCSVContent,
  detectColumnMapping,
  parseTransactionsFromRows,
  DetectedMapping,
} from './csvParser';
import { normalizeMerchant } from '../utils/merchant';
import { formatDate } from '../utils/date';
import { categorizeBatch } from './categorization';

export interface ImportResult {
  success: boolean;
  message: string;
  rowCount: number;
  dedupedCount: number;
  needsColumnMapping?: boolean;
  detectedMapping?: DetectedMapping;
}

export const checkImportLimit = async (
  newTransactionCount: number
): Promise<{ allowed: boolean; message?: string }> => {
  const isPurchased = await getSetting('purchase_unlocked');
  if (isPurchased === 'true') {
    return { allowed: true };
  }

  const currentCount = await getTransactionCount();
  const totalAfterImport = currentCount + newTransactionCount;

  if (totalAfterImport > 100) {
    return {
      allowed: false,
      message: `Free plan limit is 100 transactions. You have ${currentCount} and are trying to import ${newTransactionCount} more. Unlock to import more.`,
    };
  }

  return { allowed: true };
};

export const importCSV = async (
  content: string,
  filename: string,
  mapping?: ColumnMapping
): Promise<ImportResult> => {
  try {
    // Parse CSV
    const rows = parseCSVContent(content);
    if (rows.length === 0) {
      return {
        success: false,
        message: 'CSV file is empty or invalid',
        rowCount: 0,
        dedupedCount: 0,
      };
    }

    // Detect or use provided mapping
    let columnMapping: ColumnMapping;
    if (mapping) {
      columnMapping = mapping;
    } else {
      const headers = Object.keys(rows[0]);
      const detection = detectColumnMapping(headers);

      if (detection.needsManualMapping || !detection.suggestedMapping) {
        return {
          success: false,
          message: 'Could not auto-detect columns. Manual mapping required.',
          rowCount: rows.length,
          dedupedCount: 0,
          needsColumnMapping: true,
          detectedMapping: detection,
        };
      }

      columnMapping = detection.suggestedMapping;
    }

    // Parse transactions
    const parsedTransactions = parseTransactionsFromRows(rows, columnMapping);

    if (parsedTransactions.length === 0) {
      return {
        success: false,
        message: 'No valid transactions found in CSV',
        rowCount: rows.length,
        dedupedCount: 0,
      };
    }

    // Check import limit
    const limitCheck = await checkImportLimit(parsedTransactions.length);
    if (!limitCheck.allowed) {
      return {
        success: false,
        message: limitCheck.message!,
        rowCount: parsedTransactions.length,
        dedupedCount: 0,
      };
    }

    // Import transactions with deduplication
    let importedCount = 0;
    const transactionIds: number[] = [];

    for (const parsed of parsedTransactions) {
      const dateStr = formatDate(parsed.date);
      const merchantNorm = normalizeMerchant(parsed.description);

      // Check for duplicate
      const exists = await transactionExists(dateStr, parsed.amount, merchantNorm);
      if (exists) {
        continue;
      }

      const txId = await insertTransaction({
        date: dateStr,
        description: parsed.description,
        merchant_norm: merchantNorm,
        amount_signed: parsed.amount,
        source_file: filename,
      });

      transactionIds.push(txId);
      importedCount++;
    }

    // Record import
    await insertImport({
      filename,
      row_count: parsedTransactions.length,
      deduped_count: importedCount,
      imported_at: new Date().toISOString(),
    });

    // Categorize newly imported transactions
    const newTransactions = await Promise.all(
      transactionIds.map(async id => {
        const { getTransactionById } = await import('../database');
        return getTransactionById(id);
      })
    );

    const validTransactions = newTransactions.filter((tx): tx is NonNullable<typeof tx> => tx !== null);

    await categorizeBatch(
      validTransactions.map(tx => ({
        id: tx.id!,
        merchant_norm: tx.merchant_norm,
        description: tx.description,
      }))
    );

    return {
      success: true,
      message: `Imported ${importedCount} transactions (${parsedTransactions.length - importedCount} duplicates skipped)`,
      rowCount: parsedTransactions.length,
      dedupedCount: importedCount,
    };
  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      rowCount: 0,
      dedupedCount: 0,
    };
  }
};
