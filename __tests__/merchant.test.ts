import { normalizeMerchant, isRefund, isTransferOrExclusion } from '../src/utils/merchant';

describe('Merchant Utils', () => {
  describe('normalizeMerchant', () => {
    it('should lowercase and trim merchant names', () => {
      expect(normalizeMerchant('  HOME DEPOT  ')).toBe('home depot');
    });

    it('should collapse multiple whitespaces', () => {
      expect(normalizeMerchant('HOME    DEPOT')).toBe('home depot');
    });

    it('should remove trailing card numbers with X', () => {
      expect(normalizeMerchant('HOME DEPOT XXXX1234')).toBe('home depot');
    });

    it('should remove trailing card numbers with asterisks', () => {
      expect(normalizeMerchant('HOME DEPOT ****5678')).toBe('home depot');
    });

    it('should remove noise tokens', () => {
      expect(normalizeMerchant('POS HOME DEPOT DEBIT CARD')).toBe('home depot');
    });

    it('should preserve meaningful content', () => {
      expect(normalizeMerchant('Home Depot #2341 Purchase')).toBe('home depot #2341');
    });
  });

  describe('isRefund', () => {
    it('should detect refund keyword', () => {
      expect(isRefund('Refund - Home Depot')).toBe(true);
      expect(isRefund('HOME DEPOT REFUND')).toBe(true);
    });

    it('should detect reversal keyword', () => {
      expect(isRefund('Reversal - Payment')).toBe(true);
    });

    it('should detect return keyword', () => {
      expect(isRefund('Return to store')).toBe(true);
    });

    it('should return false for normal transactions', () => {
      expect(isRefund('Home Depot Purchase')).toBe(false);
    });
  });

  describe('isTransferOrExclusion', () => {
    it('should detect transfers', () => {
      expect(isTransferOrExclusion('Transfer to savings')).toBe(true);
      expect(isTransferOrExclusion('Internal Transfer')).toBe(true);
    });

    it('should detect credit card payments', () => {
      expect(isTransferOrExclusion('CC Payment Thank You')).toBe(true);
      expect(isTransferOrExclusion('Credit Card Payment')).toBe(true);
    });

    it('should detect owner draws', () => {
      expect(isTransferOrExclusion('Owner Draw')).toBe(true);
      expect(isTransferOrExclusion('Distribution to owner')).toBe(true);
    });

    it('should return false for normal expenses', () => {
      expect(isTransferOrExclusion('Home Depot Purchase')).toBe(false);
    });
  });
});
