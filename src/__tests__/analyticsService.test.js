import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import analyticsService from "../services/analyticsService";

// Mock Date to ensure consistent testing
const mockDate = new Date("2025-08-03T12:00:00.000Z");
const originalDate = global.Date;

beforeAll(() => {
  global.Date = class extends originalDate {
    constructor(...args) {
      if (args.length === 0) {
        return mockDate;
      }
      return new originalDate(...args);
    }
  };
});

afterAll(() => {
  global.Date = originalDate;
});

describe("AnalyticsService - Date Filtering", () => {
  // Sample transactions for testing
  const sampleTransactions = [
    {
      id: 1,
      description: "Grocery Shopping",
      amount: -150.0,
      category: "Food & Dining",
      date: new Date("2025-08-01T10:00:00.000Z"), // This week
      accountId: 1,
    },
    {
      id: 2,
      description: "Salary",
      amount: 5000.0,
      category: "Income",
      date: new Date("2025-08-02T09:00:00.000Z"), // This week
      accountId: 1,
    },
    {
      id: 3,
      description: "Gas Station",
      amount: -45.0,
      category: "Transportation",
      date: new Date("2025-07-15T14:00:00.000Z"), // This month
      accountId: 1,
    },
    {
      id: 4,
      description: "Restaurant",
      amount: -85.0,
      category: "Food & Dining",
      date: new Date("2025-07-20T19:00:00.000Z"), // This month
      accountId: 1,
    },
    {
      id: 5,
      description: "Movie Tickets",
      amount: -25.0,
      category: "Entertainment",
      date: new Date("2025-03-15T20:00:00.000Z"), // This year
      accountId: 1,
    },
    {
      id: 6,
      description: "Old Transaction",
      amount: -100.0,
      category: "Shopping",
      date: new Date("2024-12-15T12:00:00.000Z"), // Last year
      accountId: 1,
    },
  ];

  beforeEach(() => {
    analyticsService.clearCache();
  });

  describe("filterTransactionsByTimeRange", () => {
    test('should filter transactions for "week" correctly', () => {
      const filtered = analyticsService.filterTransactionsByTimeRange(
        sampleTransactions,
        "week"
      );

      // Should only include transactions from Aug 1-3, 2025
      expect(filtered).toHaveLength(2);
      expect(filtered.map(t => t.description)).toEqual([
        "Grocery Shopping",
        "Salary",
      ]);
    });

    test('should filter transactions for "month" correctly', () => {
      const filtered = analyticsService.filterTransactionsByTimeRange(
        sampleTransactions,
        "month"
      );

      // Should include transactions from last 30 days (July 15, July 20, Aug 1, Aug 2)
      expect(filtered).toHaveLength(4);
      expect(filtered.map(t => t.description)).toEqual([
        "Grocery Shopping",
        "Salary",
        "Gas Station",
        "Restaurant",
      ]);
    });

    test('should filter transactions for "year" correctly', () => {
      const filtered = analyticsService.filterTransactionsByTimeRange(
        sampleTransactions,
        "year"
      );

      // Should include all transactions from last 365 days (all 2025 transactions)
      expect(filtered).toHaveLength(6);
      expect(filtered.map(t => t.description)).toEqual([
        "Grocery Shopping",
        "Salary",
        "Gas Station",
        "Restaurant",
        "Movie Tickets",
        "Old Transaction",
      ]);
    });

    test('should return all transactions for "all"', () => {
      const filtered = analyticsService.filterTransactionsByTimeRange(
        sampleTransactions,
        "all"
      );

      expect(filtered).toHaveLength(6);
      expect(filtered).toEqual(sampleTransactions);
    });

    test("should handle empty transactions array", () => {
      const filtered = analyticsService.filterTransactionsByTimeRange(
        [],
        "week"
      );
      expect(filtered).toHaveLength(0);
    });

    test("should handle invalid timeRange", () => {
      const filtered = analyticsService.filterTransactionsByTimeRange(
        sampleTransactions,
        "invalid"
      );
      expect(filtered).toEqual(sampleTransactions);
    });
  });

  describe("calculateAllAnalytics", () => {
    test("should calculate analytics for week correctly", () => {
      const analytics = analyticsService.calculateAllAnalytics(
        sampleTransactions,
        "week"
      );

      expect(analytics.quickAnalytics.transactionCount).toBe(2);
      expect(analytics.quickAnalytics.income).toBe(5000.0);
      expect(analytics.quickAnalytics.spending).toBe(150.0);
      expect(analytics.quickAnalytics.netSavings).toBe(4850.0);
    });

    test("should calculate analytics for month correctly", () => {
      const analytics = analyticsService.calculateAllAnalytics(
        sampleTransactions,
        "month"
      );

      expect(analytics.quickAnalytics.transactionCount).toBe(4);
      expect(analytics.quickAnalytics.income).toBe(5000.0);
      expect(analytics.quickAnalytics.spending).toBe(280.0); // 150 + 45 + 85
      expect(analytics.quickAnalytics.netSavings).toBe(4720.0);
    });

    test("should calculate analytics for year correctly", () => {
      const analytics = analyticsService.calculateAllAnalytics(
        sampleTransactions,
        "year"
      );

      expect(analytics.quickAnalytics.transactionCount).toBe(6);
      expect(analytics.quickAnalytics.income).toBe(5000.0);
      expect(analytics.quickAnalytics.spending).toBe(405.0); // 150 + 45 + 85 + 25 + 100
      expect(analytics.quickAnalytics.netSavings).toBe(4595.0);
    });
  });

  describe("Date handling", () => {
    test("should handle different date formats", () => {
      const transactionsWithDifferentFormats = [
        {
          id: 1,
          description: "String Date",
          amount: -50.0,
          category: "Food",
          date: "2025-08-01T10:00:00.000Z",
          accountId: 1,
        },
        {
          id: 2,
          description: "Date Object",
          amount: -30.0,
          category: "Food",
          date: new Date("2025-08-02T10:00:00.000Z"),
          accountId: 1,
        },
      ];

      const filtered = analyticsService.filterTransactionsByTimeRange(
        transactionsWithDifferentFormats,
        "week"
      );
      expect(filtered).toHaveLength(2);
    });

    test("should handle invalid dates gracefully", () => {
      const transactionsWithInvalidDates = [
        {
          id: 1,
          description: "Valid Date",
          amount: -50.0,
          category: "Food",
          date: new Date("2025-08-01T10:00:00.000Z"),
          accountId: 1,
        },
        {
          id: 2,
          description: "Invalid Date",
          amount: -30.0,
          category: "Food",
          date: "invalid-date",
          accountId: 1,
        },
      ];

      const filtered = analyticsService.filterTransactionsByTimeRange(
        transactionsWithInvalidDates,
        "week"
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].description).toBe("Valid Date");
    });
  });
});
