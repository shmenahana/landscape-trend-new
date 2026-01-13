import {
  getAllRules,
  getCategoryByName,
  assignTransactionCategory,
  getTransactionCategory,
} from '../database';
import { CategorizationRule, Category } from '../types';
import { isRefund } from '../utils/merchant';

export interface CategorizationResult {
  categoryId: number;
  confidence: 'high' | 'medium' | 'low';
}

const matchesRule = (
  merchantNorm: string,
  rule: CategorizationRule
): boolean => {
  const pattern = rule.pattern.toLowerCase();
  const merchant = merchantNorm.toLowerCase();

  switch (rule.match_type) {
    case 'exact':
      return merchant === pattern;
    case 'contains':
      return merchant.includes(pattern);
    case 'regex':
      try {
        const regex = new RegExp(pattern, 'i');
        return regex.test(merchant);
      } catch (error) {
        console.error('Invalid regex pattern:', pattern);
        return false;
      }
    default:
      return false;
  }
};

export const categorizeTransaction = async (
  merchantNorm: string,
  description: string
): Promise<CategorizationResult | null> => {
  // Get all rules (includes both user-created and seed rules)
  const rules = await getAllRules();

  // First, check for special exclusions
  if (isRefund(description)) {
    const excludedCategory = await getCategoryByName('Excluded');
    if (excludedCategory) {
      return {
        categoryId: excludedCategory.id!,
        confidence: 'high',
      };
    }
  }

  // Apply rules in reverse order (most recent first, which means user rules first)
  for (const rule of rules) {
    if (matchesRule(merchantNorm, rule)) {
      // Determine confidence based on rule age
      // User-created rules (more recent) get high confidence
      // Seed rules get medium confidence
      const ruleAge = rule.created_at ? new Date(rule.created_at).getTime() : 0;
      const now = new Date().getTime();
      const ageInDays = (now - ruleAge) / (1000 * 60 * 60 * 24);

      // If rule is very recent (< 1 day), it's likely user-created
      const confidence = ageInDays < 1 ? 'high' : 'medium';

      return {
        categoryId: rule.category_id,
        confidence,
      };
    }
  }

  // No match found
  return null;
};

export const categorizeBatch = async (
  transactions: Array<{ id: number; merchant_norm: string; description: string }>
): Promise<void> => {
  for (const tx of transactions) {
    // Skip if already categorized
    const existing = await getTransactionCategory(tx.id);
    if (existing) continue;

    const result = await categorizeTransaction(tx.merchant_norm, tx.description);

    if (result) {
      await assignTransactionCategory(tx.id, result.categoryId, result.confidence);
    } else {
      // Assign to "Other" with low confidence
      const otherCategory = await getCategoryByName('Other');
      if (otherCategory) {
        await assignTransactionCategory(tx.id, otherCategory.id!, 'low');
      }
    }
  }
};

export const getUncategorizedMerchants = async (
  transactions: Array<{ id: number; merchant_norm: string; amount_signed: number }>
): Promise<
  Array<{
    merchant_norm: string;
    count: number;
    total_amount: number;
    transaction_ids: number[];
    confidence: string;
  }>
> => {
  const merchantMap = new Map<
    string,
    {
      count: number;
      total_amount: number;
      transaction_ids: number[];
      confidence: string;
    }
  >();

  for (const tx of transactions) {
    const category = await getTransactionCategory(tx.id);

    // Only include low confidence or uncategorized
    if (!category || category.confidence === 'low') {
      const existing = merchantMap.get(tx.merchant_norm);
      if (existing) {
        existing.count++;
        existing.total_amount += tx.amount_signed;
        existing.transaction_ids.push(tx.id);
      } else {
        merchantMap.set(tx.merchant_norm, {
          count: 1,
          total_amount: tx.amount_signed,
          transaction_ids: [tx.id],
          confidence: category?.confidence || 'low',
        });
      }
    }
  }

  return Array.from(merchantMap.entries()).map(([merchant_norm, data]) => ({
    merchant_norm,
    ...data,
  }));
};

export const applyCategoryToMerchant = async (
  merchantNorm: string,
  categoryId: number,
  transactionIds: number[]
): Promise<void> => {
  // Create a user rule for this merchant
  const rule: CategorizationRule = {
    match_type: 'exact',
    pattern: merchantNorm.toLowerCase(),
    category_id: categoryId,
  };

  // Import the insertRule function
  const { insertRule } = await import('../database');
  await insertRule(rule);

  // Update all matching transactions
  for (const txId of transactionIds) {
    await assignTransactionCategory(txId, categoryId, 'high');
  }
};
