import { create } from "zustand";
import db from "./database";
import { tokenManager } from "./services/localAuth";
import { findDuplicateTransactions } from "./utils/duplicateDetector";
import analyticsService from "./services/analyticsService";

const useStore = create((set, get) => ({
  // State
  transactions: [],
  accounts: [],
  isLoading: false,
  parsedTransactions: [],
  currentUser: null,

  // Actions
  setLoading: loading => set({ isLoading: loading }),

  setParsedTransactions: transactions =>
    set({ parsedTransactions: transactions }),

  // Load transactions from database
  loadTransactions: async () => {
    try {
      set({ isLoading: true });
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
          .reverse()
          .toArray();
      } else {
        // Fallback to all transactions for demo
        transactions = await db.transactions
          .orderBy("date")
          .reverse()
          .toArray();
      }

      // Clear analytics cache when transactions are loaded
      // analyticsService.forceRefresh(); // Removed - not needed with batch calculations
      set({ transactions });
    } catch (error) {
      // Error handling - in production, this would use a proper error notification system
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error loading transactions:", error);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // Load accounts from database
  loadAccounts: async () => {
    try {
      const token = tokenManager.getToken();
      let accounts = [];

      if (token) {
        // Get user ID from token
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.userId;

        accounts = await db.accounts.where("userId").equals(userId).toArray();
      } else {
        // Fallback to all accounts for demo
        accounts = await db.accounts.toArray();
      }

      // Clear analytics cache when accounts are loaded
      // analyticsService.forceRefresh(); // Removed - not needed with batch calculations
      set({ accounts });
    } catch (error) {
      // Error handling - in production, this would use a proper error notification system
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error loading accounts:", error);
      }
    }
  },

  // Add a single transaction
  addTransaction: async transactionData => {
    try {
      set({ isLoading: true });
      const token = tokenManager.getToken();
      let userId = null;

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          userId = payload.userId;
        } catch (error) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error("Error parsing token:", error);
          }
        }
      }

      const transactionWithUser = {
        ...transactionData,
        userId: userId || transactionData.userId || null,
        id: transactionData.id || Date.now(), // Ensure unique ID
      };

      await db.transactions.add(transactionWithUser);

      // Clear analytics cache to ensure fresh data
      analyticsService.forceRefresh();

      // Reload transactions to update the UI
      await get().loadTransactions();
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error adding transaction:", error);
      }
      throw error; // Re-throw to handle in component
    } finally {
      set({ isLoading: false });
    }
  },

  // Add transactions to database
  addTransactions: async transactions => {
    try {
      set({ isLoading: true });
      const token = tokenManager.getToken();
      let userId = null;

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          userId = payload.userId;
        } catch (error) {
          // Error handling - in production, this would use a proper error notification system
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error("Error parsing token:", error);
          }
        }
      }

      // Filter out $0 transactions that are likely fees, adjustments, or interest charges
      const filteredTransactions = transactions.filter(transaction => {
        const amount = parseFloat(transaction.amount) || 0;

        if (amount === 0) {
          const description = (transaction.description || "").toLowerCase();
          const skipPatterns = [
            "interest",
            "fee",
            "charge",
            "adjustment",
            "credit",
            "cash advance",
            "balance transfer",
            "finance charge",
            "late fee",
            "overdraft",
            "service charge",
          ];

          return !skipPatterns.some(pattern => description.includes(pattern));
        }

        return true;
      });

      // Add userId to transactions
      const transactionsWithUser = filteredTransactions.map(transaction => ({
        ...transaction,
        userId: userId || transaction.userId || null,
      }));

      await db.transactions.bulkAdd(transactionsWithUser);

      // Clear analytics cache to ensure fresh data
      analyticsService.forceRefresh();

      // Reload transactions to update the UI
      await get().loadTransactions();
      set({ parsedTransactions: [] });
    } catch (error) {
      // Error handling - in production, this would use a proper error notification system
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error adding transactions:", error);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // Check for duplicate transactions
  checkForDuplicates: async (newTransactions, options = {}) => {
    try {
      set({ isLoading: true });

      // Get current user's transactions
      const token = tokenManager.getToken();
      let existingTransactions = [];

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const userId = payload.userId;
          existingTransactions = await db.transactions
            .where("userId")
            .equals(userId)
            .toArray();
        } catch (error) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error("Error parsing token:", error);
          }
        }
      } else {
        // Fallback to all transactions for demo
        existingTransactions = await db.transactions.toArray();
      }

      // Find duplicates
      const duplicateResults = findDuplicateTransactions(
        newTransactions,
        existingTransactions,
        options
      );

      return duplicateResults;
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error checking for duplicates:", error);
      }
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Add transactions with duplicate handling
  addTransactionsWithDuplicateHandling: async (
    transactions,
    selectedDuplicates = []
  ) => {
    try {
      set({ isLoading: true });

      // Filter out duplicates that weren't selected
      const transactionsToAdd = transactions.filter(transaction => {
        // If it's a duplicate transaction object (has duplicate info), check if it was selected
        if (transaction.newTransaction) {
          return selectedDuplicates.includes(transaction.newTransaction);
        }
        // If it's a regular transaction, add it
        return true;
      });

      // Extract the actual transaction data
      const finalTransactions = transactionsToAdd.map(transaction => {
        return transaction.newTransaction || transaction;
      });

      await get().addTransactions(finalTransactions);

      return {
        success: true,
        addedCount: finalTransactions.length,
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error(
          "Error adding transactions with duplicate handling:",
          error
        );
      }
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Delete a single transaction
  deleteTransaction: async transactionId => {
    try {
      set({ isLoading: true });
      await db.transactions.delete(transactionId);
      // Reload transactions to update the UI
      await get().loadTransactions();
    } catch (error) {
      // Error handling - in production, this would use a proper error notification system
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error deleting transaction:", error);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // Update a single transaction
  updateTransaction: async (transactionId, updates) => {
    try {
      set({ isLoading: true });
      await db.transactions.update(transactionId, updates);
      // Reload transactions to update the UI
      await get().loadTransactions();
    } catch (error) {
      // Error handling - in production, this would use a proper error notification system
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error updating transaction:", error);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // Add a new account
  addAccount: async accountData => {
    try {
      set({ isLoading: true });
      const token = tokenManager.getToken();
      let userId = null;

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          userId = payload.userId;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error parsing token:", error);
        }
      }

      // Check for duplicate account names
      let existingAccounts = [];
      if (userId) {
        existingAccounts = await db.accounts.where("userId").equals(userId).toArray();
      } else {
        // If no userId, get all accounts (for demo/fallback)
        existingAccounts = await db.accounts.toArray();
      }
      
      const duplicateAccount = existingAccounts.find(account => 
        account.name.toLowerCase().trim() === accountData.name.toLowerCase().trim()
      );

      if (duplicateAccount) {
        throw new Error(`An account with the name "${accountData.name}" already exists. Please choose a different name.`);
      }

      const accountWithUser = {
        ...accountData,
        initialBalance: accountData.balance || 0,
        balance: accountData.balance || 0,
        lastBalanceUpdate: new Date().toISOString(),
        userId: userId || accountData.userId || null,
      };

      const newAccountId = await db.accounts.add(accountWithUser);
      
      // Get the created account with the generated ID
      const newAccount = await db.accounts.get(newAccountId);
      
      // Reload accounts to update the UI
      await get().loadAccounts();
      
      // Return the created account
      return newAccount;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error adding account:", error);
      throw error; // Re-throw the error so the calling function can handle it
    } finally {
      set({ isLoading: false });
    }
  },

  // Delete an account
  deleteAccount: async accountId => {
    try {
      set({ isLoading: true });
      // Delete all transactions associated with this account
      await db.transactions.where("accountId").equals(accountId).delete();
      // Delete the account
      await db.accounts.delete(accountId);
      // Reload both transactions and accounts to update the UI
      await get().loadTransactions();
      await get().loadAccounts();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting account:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Calculate net worth using analytics service
  getNetWorth: () => {
    const { transactions, accounts } = get();
    if (!transactions || !accounts) {
      return 0;
    }
    return analyticsService.calculateNetWorth(transactions, accounts);
  },

  // Get recent transactions (last 10)
  getRecentTransactions: () => {
    const { transactions } = get();
    return transactions.slice(0, 10);
  },

  // Get transactions by account
  getTransactionsByAccount: accountId => {
    const { transactions } = get();
    return transactions.filter(t => t.accountId === accountId);
  },

  // Calculate account balance (includes initial balance and manual adjustments)
  getAccountBalance: accountId => {
    const { transactions, accounts } = get();
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;

    // Get the base balance (initial balance + manual adjustments)
    const baseBalance = account.balance || account.initialBalance || 0;

    // Add transaction amounts
    const transactionBalance = transactions
      .filter(t => t.accountId === accountId)
      .reduce((total, transaction) => total + transaction.amount, 0);

    return baseBalance + transactionBalance;
  },

  // Update account balance manually
  updateAccountBalance: async (accountId, newBalance) => {
    try {
      set({ isLoading: true });

      // Get current account
      const account = get().accounts.find(a => a.id === accountId);
      if (!account) {
        throw new Error("Account not found");
      }

      // Calculate the adjustment needed
      const currentBalance = get().getAccountBalance(accountId);
      const adjustment = newBalance - currentBalance;

      // Update the account's base balance
      await db.accounts.update(accountId, {
        balance: (account.balance || account.initialBalance || 0) + adjustment,
        lastBalanceUpdate: new Date().toISOString(),
      });

      // Clear analytics cache to ensure fresh data
      analyticsService.forceRefresh();

      // Reload accounts to update the UI
      await get().loadAccounts();
    } catch (error) {
      if (import.meta.env.DEV) {
        // Error updating account balance
      }
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Analytics methods using the analytics service
  getQuickAnalytics: (timeRange = "month") => {
    const { transactions } = get();
    if (!transactions || transactions.length === 0) {
      return {
        income: 0,
        spending: 0,
        netSavings: 0,
        spendingTrend: 0,
        transactionCount: 0,
      };
    }
    return analyticsService.calculateQuickAnalytics(transactions, timeRange);
  },

  // Get all analytics data in a single batch calculation
  getAllAnalytics: (timeRange = "month") => {
    const { transactions } = get();
    if (!transactions || transactions.length === 0) {
      return {
        spendingByCategory: [],
        monthlySpending: [],
        incomeVsSpending: { income: 0, spending: 0, net: 0 },
        spendingTrends: [],
        topCategories: [],
        avgDailySpending: 0,
        quickAnalytics: { income: 0, spending: 0, net: 0 },
      };
    }
    return analyticsService.calculateAllAnalytics(transactions, timeRange);
  },

  getSpendingByCategory: (timeRange = "month") => {
    const { transactions } = get();
    if (!transactions || transactions.length === 0) {
      return [];
    }
    return analyticsService.calculateSpendingByCategory(
      transactions,
      timeRange
    );
  },

  getIncomeVsSpending: (timeRange = "month") => {
    const { transactions } = get();
    if (!transactions || transactions.length === 0) {
      return { income: 0, spending: 0, net: 0, data: [] };
    }
    return analyticsService.calculateIncomeVsSpending(transactions, timeRange);
  },

  getMonthlySpending: (timeRange = "year") => {
    const { transactions } = get();
    if (!transactions || transactions.length === 0) {
      return [];
    }
    return analyticsService.calculateMonthlySpending(transactions, timeRange);
  },

  getAccountAnalytics: (accountId, timeRange = "month") => {
    const { transactions } = get();
    if (!transactions || transactions.length === 0) {
      return {
        income: 0,
        spending: 0,
        net: 0,
        transactionCount: 0,
        categoryBreakdown: [],
      };
    }
    return analyticsService.calculateAccountAnalytics(
      transactions,
      accountId,
      timeRange
    );
  },

  getSpendingTrends: (timeRange = "month") => {
    const { transactions } = get();
    return analyticsService.calculateSpendingTrends(transactions, timeRange);
  },

  getTopSpendingCategories: (timeRange = "month", limit = 5) => {
    const { transactions } = get();
    if (!transactions || transactions.length === 0) {
      return [];
    }
    return analyticsService.getTopSpendingCategories(
      transactions,
      timeRange,
      limit
    );
  },

  getAverageDailySpending: (timeRange = "month") => {
    const { transactions } = get();
    if (!transactions || transactions.length === 0) {
      return 0;
    }
    return analyticsService.calculateAverageDailySpending(
      transactions,
      timeRange
    );
  },

  // Force refresh analytics data
  refreshAnalytics: () => {
    analyticsService.forceRefresh();
  },

  // Reset all user data
  resetUserData: async () => {
    try {
      set({ isLoading: true });
      const token = tokenManager.getToken();
      let userId = null;

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          userId = payload.userId;
        } catch (error) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error("Error parsing token:", error);
          }
        }
      }

      if (userId) {
        // Delete all user's transactions and accounts
        await db.transactions.where("userId").equals(userId).delete();
        await db.accounts.where("userId").equals(userId).delete();
      } else {
        // For demo mode, clear all data
        await db.transactions.clear();
        await db.accounts.clear();
      }

      // Reset store state
      set({ transactions: [], accounts: [] });
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error resetting user data:", error);
      }
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useStore;
