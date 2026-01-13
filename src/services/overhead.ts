import {
  getAllTransactions,
  getAllCategories,
  getTransactionCategory,
} from '../database';
import { OverheadSummary, PeriodMode, Transaction, HourlyRateInputs, HourlyRateResults } from '../types';
import { getCalendarYearRange, getRolling12MonthRange, calculateCoverageMonths } from '../utils/date';

export const calculateOverhead = async (
  periodMode: PeriodMode
): Promise<OverheadSummary | null> => {
  const allTransactions = await getAllTransactions();
  if (allTransactions.length === 0) {
    return null;
  }

  // Determine date range based on period mode
  const range =
    periodMode === 'rolling'
      ? getRolling12MonthRange(allTransactions)
      : getCalendarYearRange(allTransactions);

  if (!range) return null;

  // Filter transactions by date range
  const filteredTransactions = allTransactions.filter(tx => {
    return tx.date >= range.start && tx.date <= range.end;
  });

  if (filteredTransactions.length === 0) {
    return null;
  }

  // Get all categories
  const categories = await getAllCategories();
  const categoryMap = new Map(categories.map(c => [c.id!, c]));

  // Calculate totals by category
  const byCategory: { [categoryName: string]: number } = {};
  let total = 0;

  for (const tx of filteredTransactions) {
    // Only count expenses (negative amounts)
    if (tx.amount_signed >= 0) continue;

    const expenseAmount = Math.abs(tx.amount_signed);

    const categorization = await getTransactionCategory(tx.id!);
    if (!categorization) continue;

    const category = categoryMap.get(categorization.category.id!);
    if (!category) continue;

    // Initialize category total if needed
    if (!byCategory[category.name]) {
      byCategory[category.name] = 0;
    }

    byCategory[category.name] += expenseAmount;

    // Add to total overhead only if category is included
    if (category.include_in_overhead) {
      total += expenseAmount;
    }
  }

  const coverageMonths = calculateCoverageMonths(range.start, range.end);

  return {
    total,
    byCategory,
    transactionCount: filteredTransactions.length,
    dateRange: range,
    coverageMonths,
  };
};

export const calculateHourlyRate = (
  overhead: number,
  inputs: HourlyRateInputs
): HourlyRateResults => {
  const totalBillableHours = inputs.employees * inputs.billableHoursPerEmployeePerYear;
  const overheadPerHour = totalBillableHours > 0 ? overhead / totalBillableHours : 0;

  let baseRate = overheadPerHour;
  if (inputs.includeDirectLaborCost) {
    baseRate += inputs.laborCostPerHour;
  }

  const profitMultiplier = 1 - inputs.desiredProfitPercent / 100;
  const targetRate = profitMultiplier > 0 ? baseRate / profitMultiplier : baseRate;

  // Calculate targets for 10%, 15%, 20%
  const targetRateWith10Percent = baseRate / (1 - 0.1);
  const targetRateWith15Percent = baseRate / (1 - 0.15);
  const targetRateWith20Percent = baseRate / (1 - 0.2);

  return {
    overheadPerHour,
    baseRate,
    targetRate,
    targetRateWith10Percent,
    targetRateWith15Percent,
    targetRateWith20Percent,
  };
};

export const generateShareableReport = (
  overhead: OverheadSummary,
  hourlyRate: HourlyRateResults,
  inputs: HourlyRateInputs,
  periodMode: PeriodMode
): string => {
  const periodLabel = periodMode === 'rolling' ? 'Last 12 Months (Rolling)' : 'Last Calendar Year';

  let report = `📊 Know Your Numbers Report\n\n`;
  report += `Period: ${periodLabel}\n`;
  report += `Date Range: ${overhead.dateRange.start} to ${overhead.dateRange.end}\n`;
  report += `Coverage: ${overhead.coverageMonths} months\n\n`;

  report += `💰 OVERHEAD SUMMARY\n`;
  report += `Annual Overhead: $${overhead.total.toFixed(2)}\n`;
  report += `Monthly Overhead: $${(overhead.total / 12).toFixed(2)}\n`;
  report += `Transactions: ${overhead.transactionCount}\n\n`;

  report += `📋 CATEGORY BREAKDOWN\n`;
  const sortedCategories = Object.entries(overhead.byCategory).sort((a, b) => b[1] - a[1]);
  for (const [category, amount] of sortedCategories) {
    const percentage = overhead.total > 0 ? (amount / overhead.total) * 100 : 0;
    report += `${category}: $${amount.toFixed(2)} (${percentage.toFixed(1)}%)\n`;
  }

  report += `\n⏱️ HOURLY RATE CALCULATOR\n`;
  report += `Employees: ${inputs.employees}\n`;
  report += `Billable Hours/Year: ${inputs.billableHoursPerEmployeePerYear}\n`;
  report += `Desired Profit: ${inputs.desiredProfitPercent}%\n`;
  if (inputs.includeDirectLaborCost) {
    report += `Labor Cost/Hour: $${inputs.laborCostPerHour.toFixed(2)}\n`;
  }
  report += `\n`;
  report += `Overhead per Hour: $${hourlyRate.overheadPerHour.toFixed(2)}\n`;
  report += `Base Rate (Break-even): $${hourlyRate.baseRate.toFixed(2)}\n`;
  report += `Target Rate (${inputs.desiredProfitPercent}% profit): $${hourlyRate.targetRate.toFixed(2)}\n\n`;

  report += `Quick Reference:\n`;
  report += `  10% profit: $${hourlyRate.targetRateWith10Percent.toFixed(2)}/hr\n`;
  report += `  15% profit: $${hourlyRate.targetRateWith15Percent.toFixed(2)}/hr\n`;
  report += `  20% profit: $${hourlyRate.targetRateWith20Percent.toFixed(2)}/hr\n`;

  return report;
};
