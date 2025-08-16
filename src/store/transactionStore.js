import { create } from "zustand";
import { persist } from "zustand/middleware";
import db from "../database";
import { tokenManager } from "../services/localAuth";
import { findDuplicateTransactions } from "../utils/duplicateDetector";
import { performanceMonitor } from "../services/performanceService";

/**
 * Transaction Store
 * Manages all transaction-related state and operations
 */
const useTransactionStore = create(
  persist(
    (set, get) => ({
      // State
      transactions: [],
      parsedTransactions: [],
      isLoading: false,
      filters: {
        search: "",
        dateRange: null,
        accounts: [],
        categories: [],
        amountRange: null,
      },
      sortBy: {
        field: "date",
        direction: "desc",
      },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
      },

      // Actions
      setLoading: loading => set({ isLoading: loading }),

      setParsedTransactions: transactions =>
        set({ parsedTransactions: transactions }),

      setFilters: filters =>
        set(state => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 }, // Reset to first page
        })),

      setSortBy: sortBy => set({ sortBy }),

      setPagination: pagination => set({ pagination }),

      // Load transactions from database
      loadTransactions: async () => {
        return performanceMonitor.measureFunction(
          "loadTransactions",
          async () => {
            try {
              const { setLoading } = get();
              setLoading(true);

              const token = tokenManager.getToken();
              let transactions = [];

              if (token) {
                // Get user ID from token
                const payload = JSON.parse(atob(token.split(".")[1]));
                const userId = payload.userId;

                transactions = await db.transactions
                  .where("userId")
                  .equals(userId)
                  .orderBy("date")
                  .toArray()
                  .then(arr => arr.reverse());
              } else {
                // Fallback to all transactions for demo
                transactions = await db.transactions
                  .orderBy("date")
                  .toArray()
                  .then(arr => arr.reverse());
              }

              // Apply filters and sorting
              const filteredTransactions = get().applyFilters(transactions);
              const sortedTransactions =
                get().applySorting(filteredTransactions);

              set({
                transactions: sortedTransactions,
                pagination: {
                  ...get().pagination,
                  total: filteredTransactions.length,
                },
              });

              return sortedTransactions;
            } catch (error) {
              console.error("Failed to load transactions:", error);
              performanceMonitor.recordMetric("transaction_load_error", {
                error: error.message,
              });
              throw error;
            } finally {
              set({ isLoading: false });
            }
          }
        );
      },

      // Apply filters to transactions
      applyFilters: transactions => {
        const { filters } = get();
        let filtered = [...transactions];

        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(
            transaction =>
              transaction.description.toLowerCase().includes(searchLower) ||
              transaction.category?.toLowerCase().includes(searchLower) ||
              transaction.accountName?.toLowerCase().includes(searchLower)
          );
        }

        // Date range filter
        if (filters.dateRange?.start && filters.dateRange?.end) {
          filtered = filtered.filter(
            transaction =>
              new Date(transaction.date) >= filters.dateRange.start &&
              new Date(transaction.date) <= filters.dateRange.end
          );
        }

        // Account filter
        if (filters.accounts.length > 0) {
          filtered = filtered.filter(transaction =>
            filters.accounts.includes(transaction.accountId)
          );
        }

        // Category filter
        if (filters.categories.length > 0) {
          filtered = filtered.filter(transaction =>
            filters.categories.includes(transaction.category)
          );
        }

        // Amount range filter
        if (
          filters.amountRange?.min !== null ||
          filters.amountRange?.max !== null
        ) {
          filtered = filtered.filter(transaction => {
            const amount = Math.abs(transaction.amount);
            const min = filters.amountRange.min ?? 0;
            const max = filters.amountRange.max ?? Infinity;
            return amount >= min && amount <= max;
          });
        }

        return filtered;
      },

      // Apply sorting to transactions
      applySorting: transactions => {
        const { sortBy } = get();
        const sorted = [...transactions];

        sorted.sort((a, b) => {
          let aValue = a[sortBy.field];
          let bValue = b[sortBy.field];

          // Handle date sorting
          if (sortBy.field === "date") {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
          }

          // Handle amount sorting (use absolute values)
          if (sortBy.field === "amount") {
            aValue = Math.abs(aValue);
            bValue = Math.abs(bValue);
          }

          // Handle string sorting
          if (typeof aValue === "string") {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
          }

          if (sortBy.direction === "asc") {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        return sorted;
      },

      // Get paginated transactions
      getPaginatedTransactions: () => {
        const { transactions, pagination } = get();
        const startIndex = (pagination.page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        return transactions.slice(startIndex, endIndex);
      },

      // Add transaction
      addTransaction: async transaction => {
        return performanceMonitor.measureFunction(
          "addTransaction",
          async () => {
            try {
              const { loadTransactions } = get();

              // Add to database
              const id = await db.transactions.add(transaction);

              // Reload transactions to get updated list
              await loadTransactions();

              performanceMonitor.recordMetric("transaction_added", {
                id,
                amount: transaction.amount,
              });

              return id;
            } catch (error) {
              console.error("Failed to add transaction:", error);
              performanceMonitor.recordMetric("transaction_add_error", {
                error: error.message,
              });
              throw error;
            }
          }
        );
      },

      // Update transaction
      updateTransaction: async (id, updates) => {
        return performanceMonitor.measureFunction(
          "updateTransaction",
          async () => {
            try {
              const { loadTransactions } = get();

              // Update in database
              await db.transactions.update(id, updates);

              // Reload transactions to get updated list
              await loadTransactions();

              performanceMonitor.recordMetric("transaction_updated", {
                id,
                updates: Object.keys(updates),
              });

              return id;
            } catch (error) {
              console.error("Failed to update transaction:", error);
              performanceMonitor.recordMetric("transaction_update_error", {
                error: error.message,
              });
              throw error;
            }
          }
        );
      },

      // Delete transaction
      deleteTransaction: async id => {
        return performanceMonitor.measureFunction(
          "deleteTransaction",
          async () => {
            try {
              const { loadTransactions } = get();

              // Delete from database
              await db.transactions.delete(id);

              // Reload transactions to get updated list
              await loadTransactions();

              performanceMonitor.recordMetric("transaction_deleted", { id });

              return id;
            } catch (error) {
              console.error("Failed to delete transaction:", error);
              performanceMonitor.recordMetric("transaction_delete_error", {
                error: error.message,
              });
              throw error;
            }
          }
        );
      },

      // Bulk operations
      bulkDeleteTransactions: async ids => {
        return performanceMonitor.measureFunction(
          "bulkDeleteTransactions",
          async () => {
            try {
              const { loadTransactions } = get();

              // Delete from database
              await db.transactions.bulkDelete(ids);

              // Reload transactions to get updated list
              await loadTransactions();

              performanceMonitor.recordMetric("bulk_transactions_deleted", {
                count: ids.length,
              });

              return ids;
            } catch (error) {
              console.error("Failed to bulk delete transactions:", error);
              performanceMonitor.recordMetric(
                "bulk_transactions_delete_error",
                {
                  error: error.message,
                }
              );
              throw error;
            }
          }
        );
      },

      // Duplicate detection
      findDuplicates: async () => {
        return performanceMonitor.measureFunction(
          "findDuplicates",
          async () => {
            try {
              const { transactions } = get();
              const duplicates = findDuplicateTransactions(transactions);

              performanceMonitor.recordMetric("duplicates_found", {
                count: duplicates.length,
              });

              return duplicates;
            } catch (error) {
              console.error("Failed to find duplicates:", error);
              performanceMonitor.recordMetric("duplicates_find_error", {
                error: error.message,
              });
              throw error;
            }
          }
        );
      },

      // Analytics and reporting
      getTransactionStats: () => {
        const { transactions } = get();

        const stats = {
          total: transactions.length,
          totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
          income: transactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0),
          expenses: transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0),
          byCategory: {},
          byAccount: {},
          byMonth: {},
        };

        // Calculate category breakdown
        transactions.forEach(transaction => {
          const category = transaction.category || "Uncategorized";
          if (!stats.byCategory[category]) {
            stats.byCategory[category] = { count: 0, amount: 0 };
          }
          stats.byCategory[category].count++;
          stats.byCategory[category].amount += transaction.amount;
        });

        // Calculate account breakdown
        transactions.forEach(transaction => {
          const account = transaction.accountName || "Unknown Account";
          if (!stats.byAccount[account]) {
            stats.byAccount[account] = { count: 0, amount: 0 };
          }
          stats.byAccount[account].count++;
          stats.byAccount[account].amount += transaction.amount;
        });

        // Calculate monthly breakdown
        transactions.forEach(transaction => {
          const month = new Date(transaction.date).toISOString().slice(0, 7);
          if (!stats.byMonth[month]) {
            stats.byMonth[month] = { count: 0, amount: 0 };
          }
          stats.byMonth[month].count++;
          stats.byMonth[month].amount += transaction.amount;
        });

        return stats;
      },

      // Clear all data
      clearAllTransactions: async () => {
        return performanceMonitor.measureFunction(
          "clearAllTransactions",
          async () => {
            try {
              await db.transactions.clear();
              set({
                transactions: [],
                parsedTransactions: [],
                pagination: { ...get().pagination, total: 0 },
              });

              performanceMonitor.recordMetric("all_transactions_cleared");
            } catch (error) {
              console.error("Failed to clear transactions:", error);
              performanceMonitor.recordMetric("clear_transactions_error", {
                error: error.message,
              });
              throw error;
            }
          }
        );
      },
    }),
    {
      name: "aura-transaction-store",
      partialize: state => ({
        filters: state.filters,
        sortBy: state.sortBy,
        pagination: state.pagination,
      }),
    }
  )
);

export default useTransactionStore;
