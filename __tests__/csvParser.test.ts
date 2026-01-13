import { detectColumnMapping, parseAmount } from '../src/services/csvParser';

describe('CSV Parser', () => {
  describe('detectColumnMapping', () => {
    it('should detect standard date/description/amount columns', () => {
      const headers = ['Date', 'Description', 'Amount'];
      const result = detectColumnMapping(headers);

      expect(result.needsManualMapping).toBe(false);
      expect(result.suggestedMapping).toBeTruthy();
      expect(result.suggestedMapping?.dateColumn).toBe('Date');
      expect(result.suggestedMapping?.descriptionColumn).toBe('Description');
      expect(result.suggestedMapping?.amountColumn).toBe('Amount');
    });

    it('should detect debit/credit columns', () => {
      const headers = ['Date', 'Payee', 'Debit', 'Credit'];
      const result = detectColumnMapping(headers);

      expect(result.needsManualMapping).toBe(false);
      expect(result.suggestedMapping).toBeTruthy();
      expect(result.suggestedMapping?.dateColumn).toBe('Date');
      expect(result.suggestedMapping?.descriptionColumn).toBe('Payee');
      expect(result.suggestedMapping?.debitColumn).toBe('Debit');
      expect(result.suggestedMapping?.creditColumn).toBe('Credit');
    });

    it('should handle case-insensitive headers', () => {
      const headers = ['DATE', 'DESCRIPTION', 'AMOUNT'];
      const result = detectColumnMapping(headers);

      expect(result.needsManualMapping).toBe(false);
      expect(result.suggestedMapping).toBeTruthy();
    });

    it('should detect transaction date variations', () => {
      const headers = ['Posted Date', 'Description', 'Amount'];
      const result = detectColumnMapping(headers);

      expect(result.suggestedMapping?.dateColumn).toBe('Posted Date');
    });

    it('should require manual mapping for unrecognized headers', () => {
      const headers = ['Col1', 'Col2', 'Col3'];
      const result = detectColumnMapping(headers);

      expect(result.needsManualMapping).toBe(true);
      expect(result.suggestedMapping).toBeNull();
    });
  });

  describe('parseAmount', () => {
    it('should parse simple numbers', () => {
      expect(parseAmount('123.45')).toBe(123.45);
    });

    it('should parse negative numbers', () => {
      expect(parseAmount('-123.45')).toBe(-123.45);
    });

    it('should remove currency symbols', () => {
      expect(parseAmount('$123.45')).toBe(123.45);
      expect(parseAmount('£100.00')).toBe(100.00);
    });

    it('should remove commas', () => {
      expect(parseAmount('1,234.56')).toBe(1234.56);
    });

    it('should handle parentheses as negative', () => {
      expect(parseAmount('(123.45)')).toBe(-123.45);
    });

    it('should return 0 for empty string', () => {
      expect(parseAmount('')).toBe(0);
    });

    it('should return 0 for invalid input', () => {
      expect(parseAmount('invalid')).toBe(0);
    });
  });
});
