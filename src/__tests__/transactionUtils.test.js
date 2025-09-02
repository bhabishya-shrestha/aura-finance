import { describe, it, expect } from 'vitest';
import {
  detectTransactionType,
  calculateAmountWithSign,
  parseAmountAndType,
  validateTransaction,
  formatAmountForDisplay,
  getTransactionTypeInfo
} from '../utils/transactionUtils';

describe('Transaction Utils', () => {
  describe('detectTransactionType', () => {
    it('should detect income transactions correctly', () => {
      expect(detectTransactionType('Salary deposit')).toBe('income');
      expect(detectTransactionType('Payroll payment')).toBe('income');
      expect(detectTransactionType('Refund from store')).toBe('income');
      expect(detectTransactionType('Bonus payment')).toBe('income');
      expect(detectTransactionType('Commission earned')).toBe('income');
    });

    it('should detect expense transactions correctly', () => {
      expect(detectTransactionType('Grocery purchase')).toBe('expense');
      expect(detectTransactionType('Restaurant payment')).toBe('expense');
      expect(detectTransactionType('ATM withdrawal')).toBe('expense');
      expect(detectTransactionType('Utility bill')).toBe('expense');
      expect(detectTransactionType('Insurance payment')).toBe('expense');
    });

    it('should default to expense for unknown descriptions', () => {
      expect(detectTransactionType('Random transaction')).toBe('expense');
      expect(detectTransactionType('')).toBe('expense');
    });

    it('should consider amount sign when description is unclear', () => {
      expect(detectTransactionType('Unknown transaction', 100)).toBe('income');
      expect(detectTransactionType('Unknown transaction', -100)).toBe('expense');
    });
  });

  describe('calculateAmountWithSign', () => {
    it('should return negative amount for expenses', () => {
      expect(calculateAmountWithSign(100, 'expense')).toBe(-100);
      expect(calculateAmountWithSign(50.50, 'expense')).toBe(-50.50);
      expect(calculateAmountWithSign(0, 'expense')).toBe(0);
    });

    it('should return positive amount for income', () => {
      expect(calculateAmountWithSign(100, 'income')).toBe(100);
      expect(calculateAmountWithSign(50.50, 'income')).toBe(50.50);
      expect(calculateAmountWithSign(0, 'income')).toBe(0);
    });

    it('should handle string inputs', () => {
      expect(calculateAmountWithSign('100', 'expense')).toBe(-100);
      expect(calculateAmountWithSign('50.50', 'income')).toBe(50.50);
    });

    it('should handle negative inputs', () => {
      expect(calculateAmountWithSign(-100, 'expense')).toBe(-100);
      expect(calculateAmountWithSign(-50.50, 'income')).toBe(50.50);
    });
  });

  describe('parseAmountAndType', () => {
    it('should parse positive amounts correctly', () => {
      const result = parseAmountAndType(100);
      expect(result.absoluteAmount).toBe(100);
      expect(result.transactionType).toBe('income');
    });

    it('should parse negative amounts correctly', () => {
      const result = parseAmountAndType(-100);
      expect(result.absoluteAmount).toBe(100);
      expect(result.transactionType).toBe('expense');
    });

    it('should handle zero amounts', () => {
      const result = parseAmountAndType(0);
      expect(result.absoluteAmount).toBe(0);
      expect(result.transactionType).toBe('income'); // 0 is considered positive
    });
  });

  describe('validateTransaction', () => {
    it('should validate correct transactions', () => {
      const transaction = {
        description: 'Salary deposit',
        amount: 1000,
        category: 'Income'
      };
      const result = validateTransaction(transaction);
      expect(result.isValid).toBe(true);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should detect amount sign mismatches', () => {
      const transaction = {
        description: 'Salary deposit',
        amount: -1000, // Should be positive
        category: 'Income'
      };
      const result = validateTransaction(transaction);
      expect(result.isValid).toBe(false);
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].type).toBe('amount_sign');
    });

    it('should detect missing categories', () => {
      const transaction = {
        description: 'Grocery purchase',
        amount: -50,
        category: 'Other'
      };
      const result = validateTransaction(transaction);
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].type).toBe('category');
    });

    it('should warn about large amounts', () => {
      const transaction = {
        description: 'Large purchase',
        amount: -15000,
        category: 'Shopping'
      };
      const result = validateTransaction(transaction);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('large_amount');
    });
  });

  describe('formatAmountForDisplay', () => {
    it('should format positive amounts correctly', () => {
      const result = formatAmountForDisplay(100);
      expect(result.formattedAmount).toBe('+100.00');
      expect(result.colorClass).toBe('text-green-600 dark:text-green-400');
      expect(result.isPositive).toBe(true);
    });

    it('should format negative amounts correctly', () => {
      const result = formatAmountForDisplay(-100);
      expect(result.formattedAmount).toBe('-100.00');
      expect(result.colorClass).toBe('text-red-600 dark:text-red-400');
      expect(result.isPositive).toBe(false);
    });

    it('should handle showSign parameter', () => {
      const result = formatAmountForDisplay(100, false);
      expect(result.formattedAmount).toBe('100.00');
    });

    it('should handle decimal amounts', () => {
      const result = formatAmountForDisplay(99.99);
      expect(result.formattedAmount).toBe('+99.99');
    });
  });

  describe('getTransactionTypeInfo', () => {
    it('should return correct info for income', () => {
      const result = getTransactionTypeInfo('income');
      expect(result.icon).toBe('TrendingUp');
      expect(result.colorClass).toBe('text-green-600 dark:text-green-400');
      expect(result.label).toBe('Income');
    });

    it('should return correct info for expense', () => {
      const result = getTransactionTypeInfo('expense');
      expect(result.icon).toBe('TrendingDown');
      expect(result.colorClass).toBe('text-red-600 dark:text-red-400');
      expect(result.label).toBe('Expense');
    });

    it('should default to expense for unknown types', () => {
      const result = getTransactionTypeInfo('unknown');
      expect(result.icon).toBe('TrendingDown');
      expect(result.label).toBe('Expense');
    });
  });
});
