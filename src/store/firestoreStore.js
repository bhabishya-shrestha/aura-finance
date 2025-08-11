import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import firebaseService from "../services/firebaseService";

// Create a Firestore-first store with real-time subscriptions
const useFirestoreStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    transactions: [],
    accounts: [],
    isLoading: false,
    error: null,
    isOnline: navigator.onLine,
    lastSyncTime: null,

    // Actions
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // Initialize store and set up real-time listeners
    initialize: async () => {
      try {
        set({ isLoading: true, error: null });

        // Check if user is authenticated
        const user = await firebaseService.getCurrentUser();
        if (!user) {
          set({ isLoading: false, error: "User not authenticated" });
          return;
        }

        // Set up real-time listeners for transactions and accounts
        await get().setupRealtimeListeners();

        set({ isLoading: false });
      } catch (error) {
        set({ isLoading: false, error: error.message });
      }
    },

    // Set up real-time listeners for Firestore
    setupRealtimeListeners: async () => {
      try {
        // Listen for transaction changes
        firebaseService.subscribeToTransactions((transactions) => {
          set({ transactions: transactions || [] });
        });

        // Listen for account changes
        firebaseService.subscribeToAccounts((accounts) => {
          set({ accounts: accounts || [] });
        });

        // Listen for online/offline changes
        window.addEventListener("online", () => set({ isOnline: true }));
        window.addEventListener("offline", () => set({ isOnline: false }));

      } catch (error) {
        set({ error: `Failed to setup listeners: ${error.message}` });
      }
    },

    // Transaction actions
    addTransaction: async (transactionData) => {
      try {
        set({ isLoading: true, error: null });

        const result = await firebaseService.addTransaction(transactionData);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false });
        return result.data;
      } catch (error) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },

    updateTransaction: async (transactionId, updates) => {
      try {
        set({ isLoading: true, error: null });

        const result = await firebaseService.updateTransaction(transactionId, updates);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false });
        return result.data;
      } catch (error) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },

    deleteTransaction: async (transactionId) => {
      try {
        set({ isLoading: true, error: null });

        const result = await firebaseService.deleteTransaction(transactionId);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false });
      } catch (error) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },

    addTransactions: async (transactionsData) => {
      try {
        set({ isLoading: true, error: null });

        // Add transactions one by one (Firestore doesn't have bulk add)
        const results = [];
        for (const transaction of transactionsData) {
          const result = await firebaseService.addTransaction(transaction);
          if (result.success) {
            results.push(result.data);
          }
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false });
        return results;
      } catch (error) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },

    // Account actions
    addAccount: async (accountData) => {
      try {
        set({ isLoading: true, error: null });

        const result = await firebaseService.addAccount(accountData);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false });
        return result.data;
      } catch (error) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },

    updateAccount: async (accountId, updates) => {
      try {
        set({ isLoading: true, error: null });

        const result = await firebaseService.updateAccount(accountId, updates);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false });
        return result.data;
      } catch (error) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },

    deleteAccount: async (accountId) => {
      try {
        set({ isLoading: true, error: null });

        const result = await firebaseService.deleteAccount(accountId);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false });
      } catch (error) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },

    // Computed values and selectors
    getRecentTransactions: (limit = 5) => {
      const { transactions } = get();
      return transactions.slice(0, limit);
    },

    getTransactionsByAccount: (accountId) => {
      const { transactions } = get();
      return transactions.filter(transaction => transaction.accountId === accountId);
    },

    getAccountBalance: (accountId) => {
      const { accounts } = get();
      const account = accounts.find(acc => acc.id === accountId);
      return account ? account.balance || 0 : 0;
    },

    getNetWorth: () => {
      const { accounts } = get();
      return accounts.reduce((total, account) => total + (account.balance || 0), 0);
    },

    calculateAccountStats: (accountId) => {
      const { transactions } = get();
      const accountTransactions = transactions.filter(
        transaction => transaction.accountId === accountId
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

    // Analytics methods
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
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const filteredTransactions = transactions.filter(
        t => t.amount < 0 && new Date(t.date) >= startDate
      );

      const categorySpending = {};
      filteredTransactions.forEach(t => {
        const category = t.category || "Uncategorized";
        categorySpending[category] = (categorySpending[category] || 0) + Math.abs(t.amount);
      });

      return Object.entries(categorySpending).map(([category, amount]) => ({
        category,
        amount,
      }));
    },

    // Cleanup
    cleanup: () => {
      // Unsubscribe from Firestore listeners
      firebaseService.unsubscribeFromTransactions();
      firebaseService.unsubscribeFromAccounts();
    },
  }))
);

export default useFirestoreStore;
