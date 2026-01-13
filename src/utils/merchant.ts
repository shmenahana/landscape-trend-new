// Simple hash function for React Native (replaces crypto.createHash)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

const NOISE_TOKENS = [
  'pos',
  'ach',
  'debit',
  'card',
  'purchase',
  'payment',
  'pymt',
  'visa',
  'mastercard',
  'mc',
  'discover',
  'amex',
];

export const normalizeMerchant = (description: string): string => {
  let normalized = description.toLowerCase().trim();

  // Collapse multiple whitespaces
  normalized = normalized.replace(/\s+/g, ' ');

  // Remove obvious trailing card numbers (last 4 digits)
  normalized = normalized.replace(/\s*x+\d{4}\s*$/i, '');
  normalized = normalized.replace(/\s*\*+\d{4}\s*$/i, '');
  normalized = normalized.replace(/\s+\d{4}$/, '');

  // Remove noise tokens conservatively (only if they appear as separate words)
  const words = normalized.split(' ');
  const filteredWords = words.filter(word => !NOISE_TOKENS.includes(word));

  // Only apply filter if we have at least one word left
  if (filteredWords.length > 0) {
    normalized = filteredWords.join(' ');
  }

  // Remove common prefixes
  normalized = normalized.replace(/^(sq\s+\*|tst\s+\*|sp\s+\*)\s*/i, '');

  return normalized.trim();
};

export const generateTransactionHash = (
  date: string,
  amount: number,
  description: string
): string => {
  const data = `${date}|${amount}|${normalizeMerchant(description)}`;
  return simpleHash(data);
};

export const isTransferOrExclusion = (description: string): boolean => {
  const lower = description.toLowerCase();
  const exclusionPatterns = [
    'transfer',
    'internal transfer',
    'to savings',
    'from savings',
    'payment thank you',
    'cc payment',
    'credit card payment',
    'owner draw',
    'distribution',
    'loan payment',
    'principal payment',
    'deposit',
  ];

  return exclusionPatterns.some(pattern => lower.includes(pattern));
};

export const isRefund = (description: string): boolean => {
  const lower = description.toLowerCase();
  return lower.includes('refund') || lower.includes('reversal') || lower.includes('return');
};
