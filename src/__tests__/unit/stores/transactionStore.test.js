import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useTransactionStore from "../../../../store/transactionStore";

// Mock dependencies
vi.mock("../../../../database", () => ({
  default: {
    transactions: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      bulkDelete: vi.fn(),
      clear: vi.fn(),
    },
  },
}));

vi.mock("../../../../services/localAuth", () => ({
  tokenManager: {
    getToken: vi.fn(),
  },
}));

vi.mock("../../../../services/performanceService", () => ({
  performanceMonitor: {
    measureFunction: vi.fn((name, fn) => fn()),
    recordMetric: vi.fn(),
  },
}));

vi.mock("../../../../utils/duplicateDetector", () => ({
  findDuplicateTransactions: vi.fn(),
}));

describe("Transaction Store", () => {
  beforeEach(() => {
    // Clear all stores before each test
    act(() => {
      useTransactionStore.getState().clearAllTransactions();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("has correct initial state", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      expect(result.current.transactions).toEqual([]);
      expect(result.current.parsedTransactions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.filters).toEqual({
        search: "",
        dateRange: null,
        accounts: [],
        categories: [],
        amountRange: null,
      });
      expect(result.current.sortBy).toEqual({
        field: "date",
        direction: "desc",
      });
      expect(result.current.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 0,
      });
    });
  });

  describe("Loading Transactions", () => {
    it("loads transactions successfully", async () => {
      const mockTransactions = [
        { id: 1, description: "Test 1", amount: 100, date: "2024-01-01" },
        { id: 2, description: "Test 2", amount: -50, date: "2024-01-02" },
      ];

      const { default: db } = await import("../../../../database");
      db.transactions.toArray.mockResolvedValue(mockTransactions);

      const { result } = renderHook(() => useTransactionStore());

      await act(async () => {
        await result.current.loadTransactions();
      });

      expect(result.current.transactions).toEqual(mockTransactions.reverse());
      expect(result.current.isLoading).toBe(false);
    });

    it("handles loading errors gracefully", async () => {
      const { default: db } = await import("../../../../database");
      db.transactions.toArray.mockRejectedValue(new Error("Database error"));

      const { result } = renderHook(() => useTransactionStore());

      await act(async () => {
        try {
          await result.current.loadTransactions();
        } catch (error) {
          expect(error.message).toBe("Database error");
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("sets loading state correctly", async () => {
      const { default: db } = await import("../../../../database");
      db.transactions.toArray.mockResolvedValue([]);

      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.setLoading(true);
      });
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await result.current.loadTransactions();
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Filtering", () => {
    it("applies search filter correctly", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const transactions = [
        { id: 1, description: "Coffee shop", amount: 5, category: "Food" },
        { id: 2, description: "Gas station", amount: 30, category: "Transport" },
        { id: 3, description: "Grocery store", amount: 50, category: "Food" },
      ];

      act(() => {
        result.current.setFilters({ search: "coffee" });
      });

      const filtered = result.current.applyFilters(transactions);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].description).toBe("Coffee shop");
    });

    it("applies date range filter correctly", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const transactions = [
        { id: 1, description: "Test 1", amount: 100, date: "2024-01-01" },
        { id: 2, description: "Test 2", amount: 200, date: "2024-01-15" },
        { id: 3, description: "Test 3", amount: 300, date: "2024-02-01" },
      ];

      act(() => {
        result.current.setFilters({
          dateRange: {
            start: new Date("2024-01-01"),
            end: new Date("2024-01-31"),
          },
        });
      });

      const filtered = result.current.applyFilters(transactions);
      expect(filtered).toHaveLength(2);
    });

    it("applies account filter correctly", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const transactions = [
        { id: 1, description: "Test 1", amount: 100, accountId: "acc1" },
        { id: 2, description: "Test 2", amount: 200, accountId: "acc2" },
        { id: 3, description: "Test 3", amount: 300, accountId: "acc1" },
      ];

      act(() => {
        result.current.setFilters({ accounts: ["acc1"] });
      });

      const filtered = result.current.applyFilters(transactions);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(t => t.accountId === "acc1")).toBe(true);
    });

    it("applies category filter correctly", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const transactions = [
        { id: 1, description: "Test 1", amount: 100, category: "Food" },
        { id: 2, description: "Test 2", amount: 200, category: "Transport" },
        { id: 3, description: "Test 3", amount: 300, category: "Food" },
      ];

      act(() => {
        result.current.setFilters({ categories: ["Food"] });
      });

      const filtered = result.current.applyFilters(transactions);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(t => t.category === "Food")).toBe(true);
    });

    it("applies amount range filter correctly", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const transactions = [
        { id: 1, description: "Test 1", amount: 50, date: "2024-01-01" },
        { id: 2, description: "Test 2", amount: 150, date: "2024-01-02" },
        { id: 3, description: "Test 3", amount: 250, date: "2024-01-03" },
      ];

      act(() => {
        result.current.setFilters({
          amountRange: { min: 100, max: 200 },
        });
      });

      const filtered = result.current.applyFilters(transactions);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].amount).toBe(150);
    });

    it("resets pagination when filters change", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      act(() => {
        result.current.setPagination({ page: 3, pageSize: 20, total: 100 });
      });
      expect(result.current.pagination.page).toBe(3);

      act(() => {
        result.current.setFilters({ search: "test" });
      });
      expect(result.current.pagination.page).toBe(1);
    });
  });

  describe("Sorting", () => {
    it("sorts by date correctly", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const transactions = [
        { id: 1, description: "Test 1", amount: 100, date: "2024-01-03" },
        { id: 2, description: "Test 2", amount: 200, date: "2024-01-01" },
        { id: 3, description: "Test 3", amount: 300, date: "2024-01-02" },
      ];

      act(() => {
        result.current.setSortBy({ field: "date", direction: "asc" });
      });

      const sorted = result.current.applySorting(transactions);
      expect(sorted[0].date).toBe("2024-01-01");
      expect(sorted[2].date).toBe("2024-01-03");
    });

    it("sorts by amount correctly", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const transactions = [
        { id: 1, description: "Test 1", amount: 300, date: "2024-01-01" },
        { id: 2, description: "Test 2", amount: 100, date: "2024-01-02" },
        { id: 3, description: "Test 3", amount: 200, date: "2024-01-03" },
      ];

      act(() => {
        result.current.setSortBy({ field: "amount", direction: "desc" });
      });

      const sorted = result.current.applySorting(transactions);
      expect(sorted[0].amount).toBe(300);
      expect(sorted[2].amount).toBe(100);
    });

    it("sorts by description correctly", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const transactions = [
        { id: 1, description: "Zebra", amount: 100, date: "2024-01-01" },
        { id: 2, description: "Apple", amount: 200, date: "2024-01-02" },
        { id: 3, description: "Banana", amount: 300, date: "2024-01-03" },
      ];

      act(() => {
        result.current.setSortBy({ field: "description", direction: "asc" });
      });

      const sorted = result.current.applySorting(transactions);
      expect(sorted[0].description).toBe("Apple");
      expect(sorted[2].description).toBe("Zebra");
    });
  });

  describe("Pagination", () => {
    it("returns correct paginated transactions", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const transactions = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        description: `Test ${i + 1}`,
        amount: (i + 1) * 10,
        date: "2024-01-01",
      }));

      act(() => {
        result.current.setPagination({ page: 2, pageSize: 10, total: 50 });
      });

      const paginated = result.current.getPaginatedTransactions(transactions);
      expect(paginated).toHaveLength(10);
      expect(paginated[0].id).toBe(11);
      expect(paginated[9].id).toBe(20);
    });

    it("handles empty transactions correctly", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const paginated = result.current.getPaginatedTransactions([]);
      expect(paginated).toEqual([]);
    });
  });

  describe("CRUD Operations", () => {
    it("adds transaction successfully", async () => {
      const { default: db } = await import("../../../../database");
      db.transactions.add.mockResolvedValue(1);

      const { result } = renderHook(() => useTransactionStore());
      
      const newTransaction = {
        description: "New Transaction",
        amount: 100,
        date: "2024-01-01",
      };

      await act(async () => {
        const id = await result.current.addTransaction(newTransaction);
        expect(id).toBe(1);
      });

      expect(db.transactions.add).toHaveBeenCalledWith(newTransaction);
    });

    it("updates transaction successfully", async () => {
      const { default: db } = await import("../../../../database");
      db.transactions.update.mockResolvedValue(1);

      const { result } = renderHook(() => useTransactionStore());
      
      const updates = { description: "Updated Transaction" };

      await act(async () => {
        const id = await result.current.updateTransaction(1, updates);
        expect(id).toBe(1);
      });

      expect(db.transactions.update).toHaveBeenCalledWith(1, updates);
    });

    it("deletes transaction successfully", async () => {
      const { default: db } = await import("../../../../database");
      db.transactions.delete.mockResolvedValue(1);

      const { result } = renderHook(() => useTransactionStore());

      await act(async () => {
        const id = await result.current.deleteTransaction(1);
        expect(id).toBe(1);
      });

      expect(db.transactions.delete).toHaveBeenCalledWith(1);
    });

    it("bulk deletes transactions successfully", async () => {
      const { default: db } = await import("../../../../database");
      db.transactions.bulkDelete.mockResolvedValue([1, 2, 3]);

      const { result } = renderHook(() => useTransactionStore());

      await act(async () => {
        const ids = await result.current.bulkDeleteTransactions([1, 2, 3]);
        expect(ids).toEqual([1, 2, 3]);
      });

      expect(db.transactions.bulkDelete).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe("Analytics", () => {
    it("calculates transaction statistics correctly", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const transactions = [
        { id: 1, description: "Income", amount: 1000, category: "Salary", accountName: "Checking" },
        { id: 2, description: "Expense", amount: -100, category: "Food", accountName: "Checking" },
        { id: 3, description: "Expense", amount: -200, category: "Transport", accountName: "Credit" },
        { id: 4, description: "Income", amount: 500, category: "Freelance", accountName: "Savings" },
      ];

      const stats = result.current.getTransactionStats(transactions);
      
      expect(stats.total).toBe(4);
      expect(stats.totalAmount).toBe(1200);
      expect(stats.income).toBe(1500);
      expect(stats.expenses).toBe(300);
      expect(stats.byCategory.Salary.count).toBe(1);
      expect(stats.byCategory.Salary.amount).toBe(1000);
      expect(stats.byAccount.Checking.count).toBe(2);
      expect(stats.byAccount.Checking.amount).toBe(900);
    });

    it("handles empty transactions for statistics", () => {
      const { result } = renderHook(() => useTransactionStore());
      
      const stats = result.current.getTransactionStats([]);
      
      expect(stats.total).toBe(0);
      expect(stats.totalAmount).toBe(0);
      expect(stats.income).toBe(0);
      expect(stats.expenses).toBe(0);
    });
  });

  describe("Duplicate Detection", () => {
    it("finds duplicates successfully", async () => {
      const { findDuplicateTransactions } = await import("../../../../utils/duplicateDetector");
      findDuplicateTransactions.mockReturnValue([
        { id: 1, description: "Duplicate", amount: 100 },
        { id: 2, description: "Duplicate", amount: 100 },
      ]);

      const { result } = renderHook(() => useTransactionStore());

      await act(async () => {
        const duplicates = await result.current.findDuplicates();
        expect(duplicates).toHaveLength(2);
      });

      expect(findDuplicateTransactions).toHaveBeenCalled();
    });
  });

  describe("Data Management", () => {
    it("clears all transactions successfully", async () => {
      const { default: db } = await import("../../../../database");
      db.transactions.clear.mockResolvedValue();

      const { result } = renderHook(() => useTransactionStore());

      await act(async () => {
        await result.current.clearAllTransactions();
      });

      expect(db.transactions.clear).toHaveBeenCalled();
      expect(result.current.transactions).toEqual([]);
      expect(result.current.pagination.total).toBe(0);
    });
  });
});
