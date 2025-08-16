import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import firebaseService from "../services/firebaseService";

// Production-ready store with unified data management
const useProductionStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    transactions: [],
    accounts: [],
    isLoading: false,
    error: null,
    isOnline: navigator.onLine,
    isInitialized: false,
    lastSyncTime: null,
    syncStatus: "idle", // idle, syncing, error, success

    // Actions
    setLoading: loading => set({ isLoading: loading }),
    setError: error => set({ error }),
    clearError: () => set({ error: null }),
    setSyncStatus: status => set({ syncStatus: status }),

    // Initialize store and set up real-time listeners
    initialize: async () => {
      try {
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        // Check if user is authenticated
        const user = firebaseService.getCurrentUser();
        if (!user) {
          console.log(
            "❌ User not authenticated, skipping store initialization"
          );
          set({
            isLoading: false,
            error: "User not authenticated",
            syncStatus: "error",
          });
          return;
        }

        console.log("✅ User authenticated:", user.email);

        // Set up real-time listeners for transactions and accounts
        await get().setupRealtimeListeners();

        set({
          isLoading: false,
          isInitialized: true,
          syncStatus: "success",
          lastSyncTime: new Date(),
        });
      } catch (error) {
        console.error("❌ Store initialization error:", error);
        set({
          isLoading: false,
          error: error.message,
          syncStatus: "error",
        });
      }
    },

    // Force refresh data from Firebase (useful for debugging sync issues)
    forceRefresh: async () => {
      try {
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        // Check if user is authenticated
        const user = firebaseService.getCurrentUser();
        if (!user) {
          throw new Error("User not authenticated");
        }

        console.log("🔄 Force refreshing data from Firebase...");

        // Manually fetch fresh data from Firebase
        const [transactionsResult, accountsResult] = await Promise.all([
          firebaseService.getTransactions(),
          firebaseService.getAccounts(),
        ]);

        if (transactionsResult.success && accountsResult.success) {
          set({
            transactions: transactionsResult.data || [],
            accounts: accountsResult.data || [],
            isLoading: false,
            syncStatus: "success",
            lastSyncTime: new Date(),
          });
          console.log("✅ Force refresh completed successfully");
        } else {
          throw new Error("Failed to fetch data from Firebase");
        }
      } catch (error) {
        console.error("❌ Force refresh error:", error);
        set({
          isLoading: false,
          error: error.message,
          syncStatus: "error",
        });
      }
    },

    // Set up real-time listeners for Firestore
    setupRealtimeListeners: async () => {
      try {
        // Listen for transaction changes
        firebaseService.subscribeToTransactions(transactions => {
          if (import.meta.env.DEV) {
            console.log(
              "🔄 Real-time transaction update:",
              transactions.length,
              "transactions"
            );
          }
          set({
            transactions: transactions || [],
            lastSyncTime: new Date(),
            syncStatus: "success",
          });
        });

        // Listen for account changes
        firebaseService.subscribeToAccounts(accounts => {
          if (import.meta.env.DEV) {
            console.log(
              "🔄 Real-time account update:",
              accounts.length,
              "accounts"
            );
          }
          set({
            accounts: accounts || [],
            lastSyncTime: new Date(),
            syncStatus: "success",
          });
        });

        // Listen for online/offline changes
        window.addEventListener("online", () => set({ isOnline: true }));
        window.addEventListener("offline", () => set({ isOnline: false }));
      } catch (error) {
        set({
          error: `Failed to setup listeners: ${error.message}`,
          syncStatus: "error",
        });
      }
    },

    // Transaction actions with enhanced error handling
    addTransaction: async transactionData => {
      try {
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        // Ensure consistent data types
        const sanitizedData = {
          ...transactionData,
          accountId: transactionData.accountId?.toString(),
          amount: parseFloat(transactionData.amount),
          date: new Date(transactionData.date).toISOString(),
          category: transactionData.category || "Uncategorized",
        };

        const result = await firebaseService.addTransaction(sanitizedData);

        if (!result.success) {
          throw new Error(result.error);
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false, syncStatus: "success" });
        return result.data;
      } catch (error) {
        set({
          isLoading: false,
          error: error.message,
          syncStatus: "error",
        });
        throw error;
      }
    },

    updateTransaction: async (transactionId, updates) => {
      try {
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        // Ensure consistent data types for updates
        const sanitizedUpdates = {
          ...updates,
          accountId: updates.accountId?.toString(),
          amount: updates.amount ? parseFloat(updates.amount) : undefined,
          date: updates.date ? new Date(updates.date).toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };

        const result = await firebaseService.updateTransaction(
          transactionId,
          sanitizedUpdates
        );

        if (!result.success) {
          throw new Error(result.error);
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false, syncStatus: "success" });
        return result.data;
      } catch (error) {
        set({
          isLoading: false,
          error: error.message,
          syncStatus: "error",
        });
        throw error;
      }
    },

    deleteTransaction: async transactionId => {
      try {
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        const result = await firebaseService.deleteTransaction(transactionId);

        if (!result.success) {
          throw new Error(result.error);
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false, syncStatus: "success" });
      } catch (error) {
        set({
          isLoading: false,
          error: error.message,
          syncStatus: "error",
        });
        throw error;
      }
    },

    // Bulk transaction operations with proper error handling
    addTransactions: async transactionsData => {
      try {
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        const results = [];
        const errors = [];

        // Process transactions one by one to handle individual failures
        for (const transaction of transactionsData) {
          try {
            // Ensure proper data formatting
            const sanitizedData = {
              ...transaction,
              accountId: transaction.accountId?.toString(),
              amount: parseFloat(transaction.amount),
              date: new Date(transaction.date).toISOString(),
              category: transaction.category || "Uncategorized",
            };

            const result = await firebaseService.addTransaction(sanitizedData);
            results.push(result);
          } catch (error) {
            console.error("Failed to add transaction:", error);
            errors.push({ transaction, error: error.message });
            // Continue with other transactions
          }
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false, syncStatus: "success" });

        // Return results with error information
        return {
          success: results.length,
          failed: errors.length,
          results,
          errors,
        };
      } catch (error) {
        set({
          isLoading: false,
          error: error.message,
          syncStatus: "error",
        });
        throw error;
      }
    },

    // Account actions
    addAccount: async accountData => {
      try {
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        const result = await firebaseService.addAccount(accountData);

        if (!result.success) {
          throw new Error(result.error);
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false, syncStatus: "success" });
        return result.data;
      } catch (error) {
        set({
          isLoading: false,
          error: error.message,
          syncStatus: "error",
        });
        throw error;
      }
    },

    updateAccount: async (accountId, updates) => {
      try {
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        const result = await firebaseService.updateAccount(accountId, updates);

        if (!result.success) {
          throw new Error(result.error);
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false, syncStatus: "success" });
        return result.data;
      } catch (error) {
        set({
          isLoading: false,
          error: error.message,
          syncStatus: "error",
        });
        throw error;
      }
    },

    deleteAccount: async accountId => {
      try {
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        const result = await firebaseService.deleteAccount(accountId);

        if (!result.success) {
          throw new Error(result.error);
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false, syncStatus: "success" });
      } catch (error) {
        set({
          isLoading: false,
          error: error.message,
          syncStatus: "error",
        });
        throw error;
      }
    },

    // Computed values and selectors with proper type handling
    getRecentTransactions: (limit = 5) => {
      const { transactions } = get();
      return transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    },

    getTransactionsByAccount: accountId => {
      const { transactions } = get();
      // Ensure consistent string comparison
      return transactions.filter(
        t => t.accountId && t.accountId.toString() === accountId.toString()
      );
    },

    getAccountBalance: accountId => {
      const { accounts } = get();
      const account = accounts.find(acc => acc.id === accountId);
      return account ? account.balance || 0 : 0;
    },

    getNetWorth: () => {
      const { accounts } = get();
      return accounts.reduce(
        (total, account) => total + (account.balance || 0),
        0
      );
    },

    calculateAccountStats: accountId => {
      const { transactions } = get();
      const accountTransactions = transactions.filter(
        transaction =>
          transaction.accountId &&
          transaction.accountId.toString() === accountId.toString()
      );
      const recentTransactions = accountTransactions.slice(0, 30);

      const income = recentTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = recentTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const netFlow = income - expenses;

      return {
        income,
        expenses,
        netFlow,
        netChange: netFlow, // Keep for backward compatibility
        transactionCount: recentTransactions.length,
      };
    },

    // Enhanced analytics methods with proper time period filtering
    getSpendingByCategory: (period = "month") => {
      const { transactions } = get();
      const now = new Date();
      let startDate;

      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter": {
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        }
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return (
          t.amount < 0 && transactionDate >= startDate && transactionDate <= now
        );
      });

      const categorySpending = {};
      filteredTransactions.forEach(t => {
        const category = t.category || "Uncategorized";
        categorySpending[category] =
          (categorySpending[category] || 0) + Math.abs(t.amount);
      });

      return Object.entries(categorySpending)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
    },

    getMonthlySpending: () => {
      const { transactions } = get();
      const now = new Date();
      const months = [];

      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return (
            t.amount < 0 &&
            transactionDate >= monthStart &&
            transactionDate <= monthEnd
          );
        });

        const totalSpending = monthTransactions.reduce(
          (sum, t) => sum + Math.abs(t.amount),
          0
        );

        months.push({
          month: date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          amount: totalSpending,
        });
      }

      return months;
    },

    // Enhanced account analytics
    getAccountAnalytics: (period = "month") => {
      const { transactions, accounts } = get();
      const now = new Date();
      let startDate;

      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter": {
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        }
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= now;
      });

      return accounts.map(account => {
        const accountTransactions = filteredTransactions.filter(
          t => t.accountId && t.accountId.toString() === account.id.toString()
        );

        const income = accountTransactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = accountTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
          accountId: account.id,
          accountName: account.name,
          income,
          expenses,
          netFlow: income - expenses,
          transactionCount: accountTransactions.length,
        };
      });
    },

    // Utility methods
    getSyncStatus: () => {
      const { isOnline, lastSyncTime, isInitialized, syncStatus } = get();
      return {
        isOnline,
        lastSyncTime,
        isInitialized,
        syncStatus,
        status: isInitialized
          ? isOnline
            ? syncStatus
            : "offline"
          : "initializing",
      };
    },

    // Cleanup
    cleanup: () => {
      // Unsubscribe from Firestore listeners
      firebaseService.unsubscribeFromTransactions();
      firebaseService.unsubscribeFromAccounts();
      set({ isInitialized: false });
    },

    // Reset store (for testing or data reset)
    reset: () => {
      get().cleanup();
      set({
        transactions: [],
        accounts: [],
        isLoading: false,
        error: null,
        isOnline: navigator.onLine,
        isInitialized: false,
        lastSyncTime: null,
        syncStatus: "idle",
      });
    },

    // Force refresh data
    refresh: async () => {
      try {
        set({ syncStatus: "syncing" });
        await get().initialize();
      } catch (error) {
        set({ error: error.message, syncStatus: "error" });
      }
    },
  }))
);

export default useProductionStore;
