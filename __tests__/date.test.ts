import { parseDate, formatDate, calculateCoverageMonths } from '../src/utils/date';

describe('Date Utils', () => {
  describe('parseDate', () => {
    it('should parse ISO format (YYYY-MM-DD)', () => {
      const date = parseDate('2024-01-15');
      expect(date).toBeTruthy();
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(0); // January is 0
      expect(date?.getDate()).toBe(15);
    });

    it('should parse US format (MM/DD/YYYY)', () => {
      const date = parseDate('01/15/2024');
      expect(date).toBeTruthy();
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(0);
      expect(date?.getDate()).toBe(15);
    });

    it('should parse single digit dates (M/D/YYYY)', () => {
      const date = parseDate('1/5/2024');
      expect(date).toBeTruthy();
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(0);
      expect(date?.getDate()).toBe(5);
    });

    it('should handle empty string', () => {
      const date = parseDate('');
      expect(date).toBeNull();
    });

    it('should handle invalid date', () => {
      const date = parseDate('invalid-date');
      expect(date).toBeTruthy(); // May parse via native Date
    });
  });

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should pad single digit months and days', () => {
      const date = new Date(2024, 0, 5); // January 5, 2024
      expect(formatDate(date)).toBe('2024-01-05');
    });
  });

  describe('calculateCoverageMonths', () => {
    it('should calculate months between dates', () => {
      const months = calculateCoverageMonths('2024-01-01', '2024-12-31');
      expect(months).toBeGreaterThanOrEqual(11);
      expect(months).toBeLessThanOrEqual(12);
    });

    it('should handle 12 month period', () => {
      const months = calculateCoverageMonths('2024-01-01', '2025-01-01');
      expect(months).toBeGreaterThanOrEqual(12);
    });

    it('should return 0 for invalid dates', () => {
      const months = calculateCoverageMonths('invalid', '2024-12-31');
      expect(months).toBe(0);
    });
  });
});
