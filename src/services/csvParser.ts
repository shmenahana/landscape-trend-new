import Papa from 'papaparse';
import { CSVRow, ColumnMapping, ParsedTransaction } from '../types';
import { parseDate, formatDate } from '../utils/date';

export interface DetectedMapping {
  headers: string[];
  suggestedMapping: ColumnMapping | null;
  needsManualMapping: boolean;
}

export const parseCSVContent = (content: string): CSVRow[] => {
  const result = Papa.parse<CSVRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing errors:', result.errors);
  }

  return result.data;
};

export const detectColumnMapping = (headers: string[]): DetectedMapping => {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  let dateColumn: string | null = null;
  let descriptionColumn: string | null = null;
  let amountColumn: string | null = null;
  let debitColumn: string | null = null;
  let creditColumn: string | null = null;

  // Detect date column
  for (let i = 0; i < headers.length; i++) {
    const lower = lowerHeaders[i];
    if (
      lower.includes('date') ||
      lower === 'posted' ||
      lower === 'transaction date' ||
      lower === 'post date'
    ) {
      dateColumn = headers[i];
      break;
    }
  }

  // Detect description column
  for (let i = 0; i < headers.length; i++) {
    const lower = lowerHeaders[i];
    if (
      lower.includes('description') ||
      lower.includes('memo') ||
      lower.includes('payee') ||
      lower.includes('merchant') ||
      lower === 'name'
    ) {
      descriptionColumn = headers[i];
      break;
    }
  }

  // Detect amount columns
  for (let i = 0; i < headers.length; i++) {
    const lower = lowerHeaders[i];
    if (lower === 'amount' || lower === 'transaction amount') {
      amountColumn = headers[i];
      break;
    }
  }

  // Detect debit/credit columns
  for (let i = 0; i < headers.length; i++) {
    const lower = lowerHeaders[i];
    if (lower.includes('debit') || lower.includes('outflow') || lower === 'withdrawal') {
      debitColumn = headers[i];
    }
    if (lower.includes('credit') || lower.includes('inflow') || lower === 'deposit') {
      creditColumn = headers[i];
    }
  }

  const hasValidMapping =
    dateColumn &&
    descriptionColumn &&
    (amountColumn || (debitColumn && creditColumn));

  const suggestedMapping: ColumnMapping | null = hasValidMapping
    ? {
        dateColumn: dateColumn!,
        descriptionColumn: descriptionColumn!,
        amountColumn: amountColumn || undefined,
        debitColumn: debitColumn || undefined,
        creditColumn: creditColumn || undefined,
      }
    : null;

  return {
    headers,
    suggestedMapping,
    needsManualMapping: !hasValidMapping,
  };
};

export const parseAmount = (value: string): number => {
  if (!value) return 0;

  // Remove currency symbols and commas
  const cleaned = value
    .replace(/[$£€,]/g, '')
    .replace(/[()]/g, '-') // Handle parentheses as negative
    .trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const parseTransactionsFromRows = (
  rows: CSVRow[],
  mapping: ColumnMapping
): ParsedTransaction[] => {
  const transactions: ParsedTransaction[] = [];

  for (const row of rows) {
    try {
      // Parse date
      const dateString = row[mapping.dateColumn];
      const date = parseDate(dateString);
      if (!date) {
        console.warn('Invalid date:', dateString);
        continue;
      }

      // Parse description
      const description = row[mapping.descriptionColumn]?.trim() || 'Unknown';

      // Parse amount
      let amount: number;
      if (mapping.amountColumn) {
        amount = parseAmount(row[mapping.amountColumn]);
      } else if (mapping.debitColumn && mapping.creditColumn) {
        const debit = parseAmount(row[mapping.debitColumn]);
        const credit = parseAmount(row[mapping.creditColumn]);
        // Debits are negative (expenses), credits are positive (income)
        amount = credit - debit;
      } else {
        console.warn('No valid amount mapping');
        continue;
      }

      transactions.push({
        date,
        description,
        amount,
      });
    } catch (error) {
      console.error('Error parsing row:', row, error);
    }
  }

  return transactions;
};

export const getHeaderSignature = (headers: string[]): string => {
  return headers.map(h => h.toLowerCase().trim()).sort().join('|');
};
