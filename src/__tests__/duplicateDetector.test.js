import { describe, it, expect } from "vitest";
import {
  checkTransactionDuplicate,
  findDuplicateTransactions,
  groupDuplicatesByConfidence,
  getDuplicateReason,
} from "../utils/duplicateDetector";

describe("Duplicate Detector", () => {
  const mockExistingTransaction = {
    id: 1,
    date: "2024-01-15",
    description: "Grocery Store",
    amount: -85.5,
    category: "Groceries",
    userId: 1,
  };

  const mockNewTransaction = {
    date: "2024-01-15",
    description: "Grocery Store",
    amount: -85.5,
    category: "Groceries",
  };

  describe("checkTransactionDuplicate", () => {
    it("should identify exact duplicates", () => {
      const result = checkTransactionDuplicate(
        mockNewTransaction,
        mockExistingTransaction
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.matches.date).toBe(true);
      expect(result.matches.amount).toBe(true);
      expect(result.matches.description).toBe(true);
      expect(result.matches.category).toBe(true);
    });

    it("should identify duplicates with slight date differences", () => {
      const newTransaction = {
        ...mockNewTransaction,
        date: "2024-01-16", // 1 day difference
      };

      const result = checkTransactionDuplicate(
        newTransaction,
        mockExistingTransaction
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.matches.date).toBe(true);
    });

    it("should identify duplicates with slight amount differences", () => {
      const newTransaction = {
        ...mockNewTransaction,
        amount: -85.501, // Very small difference (0.001)
      };

      const result = checkTransactionDuplicate(
        newTransaction,
        mockExistingTransaction
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.matches.amount).toBe(true);
    });

    it("should identify duplicates with similar descriptions", () => {
      const newTransaction = {
        ...mockNewTransaction,
        description: "GROCERY STORE", // Different case
      };

      const result = checkTransactionDuplicate(
        newTransaction,
        mockExistingTransaction
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.matches.description).toBe(true);
    });

    it("should not identify non-duplicates", () => {
      const newTransaction = {
        ...mockNewTransaction,
        date: "2024-02-15", // Different month
        amount: -100.0, // Different amount
        description: "Gas Station", // Different description
      };

      const result = checkTransactionDuplicate(
        newTransaction,
        mockExistingTransaction
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.confidence).toBeLessThan(1.0);
    });

    it("should handle missing fields gracefully", () => {
      const incompleteTransaction = {
        date: "2024-01-15",
        amount: -85.5,
        // Missing description and category
      };

      const result = checkTransactionDuplicate(
        incompleteTransaction,
        mockExistingTransaction
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.matches.description).toBe(false);
      // Category match is true because requireExactCategory defaults to false
      expect(result.matches.category).toBe(true);
    });
  });

  describe("findDuplicateTransactions", () => {
    const existingTransactions = [
      mockExistingTransaction,
      {
        id: 2,
        date: "2024-01-14",
        description: "Gas Station",
        amount: -45.0,
        category: "Transport",
        userId: 1,
      },
    ];

    it("should find duplicates in a set of transactions", () => {
      const newTransactions = [
        mockNewTransaction, // Should be duplicate
        {
          date: "2024-01-20",
          description: "Restaurant",
          amount: -25.0,
          category: "Restaurants",
        }, // Should not be duplicate
      ];

      const result = findDuplicateTransactions(
        newTransactions,
        existingTransactions
      );

      expect(result.duplicates).toHaveLength(1);
      expect(result.nonDuplicates).toHaveLength(1);
      expect(result.summary.total).toBe(2);
      expect(result.summary.duplicates).toBe(1);
      expect(result.summary.nonDuplicates).toBe(1);
      expect(result.summary.duplicatePercentage).toBe(50);
    });

    it("should handle empty arrays", () => {
      const result = findDuplicateTransactions([], existingTransactions);

      expect(result.duplicates).toHaveLength(0);
      expect(result.nonDuplicates).toHaveLength(0);
      expect(result.summary.total).toBe(0);
    });

    it("should handle no duplicates", () => {
      const newTransactions = [
        {
          date: "2024-02-01",
          description: "New Store",
          amount: -50.0,
          category: "Shopping",
        },
      ];

      const result = findDuplicateTransactions(
        newTransactions,
        existingTransactions
      );

      expect(result.duplicates).toHaveLength(0);
      expect(result.nonDuplicates).toHaveLength(1);
      expect(result.summary.duplicatePercentage).toBe(0);
    });
  });

  describe("groupDuplicatesByConfidence", () => {
    it("should group duplicates by confidence level", () => {
      const duplicates = [
        {
          confidence: 0.95,
          newTransaction: { description: "High confidence" },
        },
        {
          confidence: 0.85,
          newTransaction: { description: "Medium confidence" },
        },
        { confidence: 0.65, newTransaction: { description: "Low confidence" } },
        {
          confidence: 0.92,
          newTransaction: { description: "Another high confidence" },
        },
      ];

      const result = groupDuplicatesByConfidence(duplicates);

      expect(result.high).toHaveLength(2);
      expect(result.medium).toHaveLength(1);
      expect(result.low).toHaveLength(1);
      expect(result.all).toHaveLength(4);
    });

    it("should handle empty array", () => {
      const result = groupDuplicatesByConfidence([]);

      expect(result.high).toHaveLength(0);
      expect(result.medium).toHaveLength(0);
      expect(result.low).toHaveLength(0);
      expect(result.all).toHaveLength(0);
    });
  });

  describe("getDuplicateReason", () => {
    it("should return human-readable reason for duplicate", () => {
      const duplicateResult = {
        matches: {
          date: true,
          amount: true,
          description: true,
          category: false,
        },
        confidence: 0.9,
      };

      const reason = getDuplicateReason(duplicateResult);

      expect(reason).toContain("same date");
      expect(reason).toContain("same amount");
      expect(reason).toContain("similar description");
      expect(reason).toContain("high confidence");
    });

    it("should handle partial matches", () => {
      const duplicateResult = {
        matches: {
          date: true,
          amount: false,
          description: true,
          category: false,
        },
        confidence: 0.6,
      };

      const reason = getDuplicateReason(duplicateResult);

      expect(reason).toContain("same date");
      expect(reason).toContain("similar description");
      expect(reason).not.toContain("same amount");
      expect(reason).toContain("low confidence");
    });

    it("should handle no matches", () => {
      const duplicateResult = {
        matches: {
          date: false,
          amount: false,
          description: false,
          category: false,
        },
        confidence: 0.0,
      };

      const reason = getDuplicateReason(duplicateResult);

      expect(reason).toBe("Unknown reason");
    });
  });
});
