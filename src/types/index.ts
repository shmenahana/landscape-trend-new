export interface Transaction {
  id?: number;
  date: string; // ISO date string
  description: string;
  merchant_norm: string;
  amount_signed: number; // negative for expenses, positive for income
  source_file: string;
  created_at?: string;
}

export interface Category {
  id?: number;
  name: string;
  include_in_overhead: boolean;
}

export interface TransactionCategory {
  tx_id: number;
  category_id: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface CategorizationRule {
  id?: number;
  match_type: 'contains' | 'exact' | 'regex';
  pattern: string;
  category_id: number;
  created_at?: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Import {
  id?: number;
  filename: string;
  imported_at: string;
  row_count: number;
  deduped_count: number;
}

export interface ColumnMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
}

export interface CSVRow {
  [key: string]: string;
}

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
}

export interface OverheadSummary {
  total: number;
  byCategory: { [categoryName: string]: number };
  transactionCount: number;
  dateRange: { start: string; end: string };
  coverageMonths: number;
}

export interface HourlyRateInputs {
  employees: number;
  billableHoursPerEmployeePerYear: number;
  desiredProfitPercent: number;
  includeDirectLaborCost: boolean;
  laborCostPerHour: number;
}

export interface HourlyRateResults {
  overheadPerHour: number;
  baseRate: number;
  targetRate: number;
  targetRateWith10Percent: number;
  targetRateWith15Percent: number;
  targetRateWith20Percent: number;
}

export type PeriodMode = 'rolling' | 'calendar';

export interface UncategorizedMerchant {
  merchant_norm: string;
  count: number;
  total_amount: number;
  transaction_ids: number[];
}
