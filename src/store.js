import { create } from "zustand";
import db from "./database";
import { tokenManager } from "./services/localAuth";

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
      await db.accounts.delete(accountId);
      // Reload accounts to update the UI
      await get().loadAccounts();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting account:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Update an account
  updateAccount: async (accountId, updates) => {
    try {
      set({ isLoading: true });
      await db.accounts.update(accountId, updates);
      // Reload accounts to update the UI
      await get().loadAccounts();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating account:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Clear all data for the current user
  clearUserData: async () => {
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
        // Delete all transactions for the user
        await db.transactions.where("userId").equals(userId).delete();
        // Delete all accounts for the user
        await db.accounts.where("userId").equals(userId).delete();
      } else {
        // For demo mode, clear all data
        await db.transactions.clear();
        await db.accounts.clear();
      }

      // Reset state
      set({ 
        transactions: [], 
        accounts: [], 
        parsedTransactions: [] 
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error clearing user data:", error);
      }
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Clear all data (admin function - use with caution)
  clearAllData: async () => {
    try {
      set({ isLoading: true });
      
      // Clear all data from the database
      await db.transactions.clear();
      await db.accounts.clear();
      
      // Reset state
      set({ 
        transactions: [], 
        accounts: [], 
        parsedTransactions: [] 
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error clearing all data:", error);
      }
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Export user data
  exportUserData: async () => {
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

      let userTransactions = [];
      let userAccounts = [];

      if (userId) {
        userTransactions = await db.transactions.where("userId").equals(userId).toArray();
        userAccounts = await db.accounts.where("userId").equals(userId).toArray();
      } else {
        // For demo mode, export all data
        userTransactions = await db.transactions.toArray();
        userAccounts = await db.accounts.toArray();
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        transactions: userTransactions,
        accounts: userAccounts,
        version: "1.0"
      };

      return exportData;
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error exporting user data:", error);
      }
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Import user data
  importUserData: async (importData) => {
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

      // Validate import data
      if (!importData.transactions || !importData.accounts) {
        throw new Error("Invalid import data format");
      }

      // Add userId to imported data
      const transactionsWithUser = importData.transactions.map(transaction => ({
        ...transaction,
        userId: userId || transaction.userId || null,
      }));

      const accountsWithUser = importData.accounts.map(account => ({
        ...account,
        userId: userId || account.userId || null,
      }));

      // Import the data
      await db.transactions.bulkAdd(transactionsWithUser);
      await db.accounts.bulkAdd(accountsWithUser);

      // Reload data to update the UI
      await get().loadTransactions();
      await get().loadAccounts();
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error importing user data:", error);
      }
      throw error;
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
}));

export default useStore;
