/**
 * Security Tests for Firebase Setup
 * Tests user isolation, input validation, rate limiting, and security features
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import SecurityMiddleware from '../services/securityMiddleware.js';

describe('Firebase Security Tests', () => {
  const mockUserId = 'test-user-123';
  const mockOtherUserId = 'other-user-456';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('Input Validation', () => {
    test('should validate transaction data correctly', () => {
      const validTransaction = {
        description: 'Grocery shopping',
        amount: 50.00,
        date: new Date(),
        category: 'groceries',
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateTransaction(validTransaction);
      expect(errors).toHaveLength(0);
    });

    test('should reject invalid transaction amounts', () => {
      const invalidTransaction = {
        description: 'Test transaction',
        amount: -10, // Negative amount
        date: new Date(),
        category: 'shopping',
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateTransaction(invalidTransaction);
      expect(errors).toContain('Amount must be a positive number');
    });

    test('should reject transactions with excessive amounts', () => {
      const largeTransaction = {
        description: 'Large transaction',
        amount: 2000000, // Over $1M limit
        date: new Date(),
        category: 'transfer',
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateTransaction(largeTransaction);
      expect(errors).toContain('Amount cannot exceed $1,000,000');
    });

    test('should reject future transactions', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

      const futureTransaction = {
        description: 'Future transaction',
        amount: 100,
        date: futureDate,
        category: 'shopping',
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateTransaction(futureTransaction);
      expect(errors).toContain('Cannot create future transactions');
    });

    test('should reject very old transactions', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 15); // 15 years ago

      const oldTransaction = {
        description: 'Old transaction',
        amount: 100,
        date: oldDate,
        category: 'shopping',
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateTransaction(oldTransaction);
      expect(errors).toContain('Cannot create transactions older than 10 years');
    });

    test('should reject invalid categories', () => {
      const invalidCategoryTransaction = {
        description: 'Test transaction',
        amount: 100,
        date: new Date(),
        category: 'invalid_category',
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateTransaction(invalidCategoryTransaction);
      expect(errors).toContain('Invalid category');
    });

    test('should reject empty descriptions', () => {
      const emptyDescriptionTransaction = {
        description: '',
        amount: 100,
        date: new Date(),
        category: 'shopping',
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateTransaction(emptyDescriptionTransaction);
      expect(errors).toContain('Description is required');
    });

    test('should reject overly long descriptions', () => {
      const longDescription = 'A'.repeat(501); // 501 characters
      const longDescriptionTransaction = {
        description: longDescription,
        amount: 100,
        date: new Date(),
        category: 'shopping',
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateTransaction(longDescriptionTransaction);
      expect(errors).toContain('Description too long (max 500 characters)');
    });
  });

  describe('Account Validation', () => {
    test('should validate account data correctly', () => {
      const validAccount = {
        name: 'Bank of America Checking',
        type: 'checking',
        balance: 1000.00,
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateAccount(validAccount);
      expect(errors).toHaveLength(0);
    });

    test('should reject invalid account types', () => {
      const invalidAccount = {
        name: 'Test Account',
        type: 'invalid_type',
        balance: 1000,
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateAccount(invalidAccount);
      expect(errors).toContain('Invalid account type');
    });

    test('should reject accounts with excessive balances', () => {
      const largeBalanceAccount = {
        name: 'Large Account',
        type: 'checking',
        balance: 2000000, // Over $1M limit
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateAccount(largeBalanceAccount);
      expect(errors).toContain('Balance must be between -$1,000,000 and $1,000,000');
    });

    test('should reject empty account names', () => {
      const emptyNameAccount = {
        name: '',
        type: 'checking',
        balance: 1000,
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateAccount(emptyNameAccount);
      expect(errors).toContain('Account name is required');
    });
  });

  describe('User Validation', () => {
    test('should validate user data correctly', () => {
      const validUser = {
        email: 'test@example.com',
        name: 'John Doe',
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateUser(validUser);
      expect(errors).toHaveLength(0);
    });

    test('should reject invalid email formats', () => {
      const invalidEmailUser = {
        email: 'invalid-email',
        name: 'John Doe',
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateUser(invalidEmailUser);
      expect(errors).toContain('Invalid email format');
    });

    test('should reject empty names', () => {
      const emptyNameUser = {
        email: 'test@example.com',
        name: '',
        userId: mockUserId
      };

      const errors = SecurityMiddleware.validateUser(emptyNameUser);
      expect(errors).toContain('Name is required');
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = SecurityMiddleware.sanitizeInput(maliciousInput);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    test('should remove javascript protocol', () => {
      const maliciousInput = 'javascript:alert("xss")';
      const sanitized = SecurityMiddleware.sanitizeInput(maliciousInput);
      expect(sanitized).not.toContain('javascript:');
    });

    test('should remove event handlers', () => {
      const maliciousInput = 'onclick="alert(\'xss\')"';
      const sanitized = SecurityMiddleware.sanitizeInput(maliciousInput);
      expect(sanitized).not.toContain('onclick=');
    });

    test('should limit input length', () => {
      const longInput = 'A'.repeat(2000);
      const sanitized = SecurityMiddleware.sanitizeInput(longInput);
      expect(sanitized.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('User Ownership Validation', () => {
    test('should validate user ownership correctly', () => {
      const isValid = SecurityMiddleware.validateUserOwnership(mockUserId, mockUserId);
      expect(isValid).toBe(true);
    });

    test('should reject cross-user access', () => {
      const isValid = SecurityMiddleware.validateUserOwnership(mockOtherUserId, mockUserId);
      expect(isValid).toBe(false);
    });

    test('should check resource permissions', () => {
      const resource = { userId: mockUserId };
      const hasPermission = SecurityMiddleware.hasPermission(resource, mockUserId);
      expect(hasPermission).toBe(true);
    });

    test('should reject unauthorized resource access', () => {
      const resource = { userId: mockOtherUserId };
      const hasPermission = SecurityMiddleware.hasPermission(resource, mockUserId);
      expect(hasPermission).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within rate limits', () => {
      // Make 50 requests (under the 100 limit)
      for (let i = 0; i < 50; i++) {
        const canMakeRequest = SecurityMiddleware.checkRateLimit(mockUserId, 'transactions');
        expect(canMakeRequest).toBe(true);
      }
    });

    test('should block requests exceeding rate limits', () => {
      // Make 101 requests (over the 100 limit)
      for (let i = 0; i < 100; i++) {
        SecurityMiddleware.checkRateLimit(mockUserId, 'transactions');
      }
      
      const canMakeRequest = SecurityMiddleware.checkRateLimit(mockUserId, 'transactions');
      expect(canMakeRequest).toBe(false);
    });

    test('should reset rate limits after time window', () => {
      // Make 50 requests
      for (let i = 0; i < 50; i++) {
        SecurityMiddleware.checkRateLimit(mockUserId, 'transactions');
      }

      // Simulate time passing by manually clearing the rate limit
      const key = `rate_limit:${mockUserId}:transactions`;
      localStorage.removeItem(key);

      // Should be able to make requests again
      const canMakeRequest = SecurityMiddleware.checkRateLimit(mockUserId, 'transactions');
      expect(canMakeRequest).toBe(true);
    });

    test('should have different limits for different operations', () => {
      // Auth has lower limit (10)
      for (let i = 0; i < 10; i++) {
        SecurityMiddleware.checkRateLimit(mockUserId, 'auth');
      }
      
      const canMakeAuthRequest = SecurityMiddleware.checkRateLimit(mockUserId, 'auth');
      expect(canMakeAuthRequest).toBe(false);

      // But transactions should still work (different counter)
      const canMakeTransactionRequest = SecurityMiddleware.checkRateLimit(mockUserId, 'transactions');
      expect(canMakeTransactionRequest).toBe(true);
    });
  });

  describe('Suspicious Activity Detection', () => {
    test('should detect large amounts as suspicious', async () => {
      const largeTransaction = {
        amount: 150000, // Over $100K threshold
        category: 'transfer'
      };

      const isSuspicious = await SecurityMiddleware.checkSuspiciousActivity(
        mockUserId,
        'addTransaction',
        largeTransaction
      );

      expect(isSuspicious).toBe(true);
    });

    test('should detect unusual categories as suspicious', async () => {
      const suspiciousTransaction = {
        amount: 100,
        category: 'test' // Unusual category
      };

      const isSuspicious = await SecurityMiddleware.checkSuspiciousActivity(
        mockUserId,
        'addTransaction',
        suspiciousTransaction
      );

      expect(isSuspicious).toBe(true);
    });

    test('should detect future dates as suspicious', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const suspiciousTransaction = {
        amount: 100,
        category: 'shopping',
        date: futureDate
      };

      const isSuspicious = await SecurityMiddleware.checkSuspiciousActivity(
        mockUserId,
        'addTransaction',
        suspiciousTransaction
      );

      expect(isSuspicious).toBe(true);
    });

    test('should not flag normal transactions as suspicious', async () => {
      const normalTransaction = {
        amount: 50,
        category: 'groceries',
        date: new Date()
      };

      const isSuspicious = await SecurityMiddleware.checkSuspiciousActivity(
        mockUserId,
        'addTransaction',
        normalTransaction
      );

      expect(isSuspicious).toBe(false);
    });
  });

  describe('Data Validation and Sanitization', () => {
    test('should validate and sanitize transaction data', async () => {
      const rawTransaction = {
        description: '  Grocery shopping  ', // Extra spaces
        amount: 50.00,
        date: new Date(),
        category: 'groceries',
        userId: mockUserId
      };

      const sanitizedData = await SecurityMiddleware.validateAndSanitize(
        rawTransaction,
        'transaction',
        mockUserId
      );

      expect(sanitizedData.description).toBe('Grocery shopping'); // Trimmed
      expect(sanitizedData.amount).toBe(50.00);
      expect(sanitizedData.category).toBe('groceries');
    });

    test('should reject unauthorized user data access', async () => {
      const transaction = {
        description: 'Test transaction',
        amount: 100,
        date: new Date(),
        category: 'shopping',
        userId: mockOtherUserId // Different user
      };

      await expect(
        SecurityMiddleware.validateAndSanitize(transaction, 'transaction', mockUserId)
      ).rejects.toThrow('Unauthorized access to user data');
    });

    test('should reject invalid data types', async () => {
      const invalidData = {
        description: 'Test',
        amount: 100,
        date: new Date(),
        category: 'shopping',
        userId: mockUserId
      };

      await expect(
        SecurityMiddleware.validateAndSanitize(invalidData, 'invalid_type', mockUserId)
      ).rejects.toThrow('Invalid data type');
    });
  });
});
