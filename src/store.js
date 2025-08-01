import { create } from "zustand";
import db from "./database";
import { tokenManager } from "./services/localAuth";
import { findDuplicateTransactions } from "./utils/duplicateDetector";

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

      // Add userId to transactions
      const transactionsWithUser = transactions.map(transaction => ({
        ...transaction,
        userId: userId || transaction.userId || null,
      }));

      await db.transactions.bulkAdd(transactionsWithUser);
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

      const accountWithUser = {
        ...accountData,
        userId: userId || accountData.userId || null,
      };

      await db.accounts.add(accountWithUser);
      // Reload accounts to update the UI
      await get().loadAccounts();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error adding account:", error);
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

  // Calculate net worth
  getNetWorth: () => {
    const { transactions } = get();
    return transactions.reduce(
      (total, transaction) => total + transaction.amount,
      0
    );
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

  // Calculate account balance
  getAccountBalance: accountId => {
    const { transactions } = get();
    return transactions
      .filter(t => t.accountId === accountId)
      .reduce((total, transaction) => total + transaction.amount, 0);
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
