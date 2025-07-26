import { create } from "zustand";
import db from "./database";

const useStore = create((set, get) => ({
  // State
  transactions: [],
  accounts: [],
  isLoading: false,
  isModalOpen: false,
  parsedTransactions: [],

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),

  setModalOpen: (open) => set({ isModalOpen: open }),

  setParsedTransactions: (transactions) =>
    set({ parsedTransactions: transactions }),

  // Load transactions from database
  loadTransactions: async () => {
    try {
      set({ isLoading: true });
      const transactions = await db.transactions
        .orderBy("date")
        .reverse()
        .toArray();
      set({ transactions });
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Load accounts from database
  loadAccounts: async () => {
    try {
      const accounts = await db.accounts.toArray();
      set({ accounts });
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  },

  // Add transactions to database
  addTransactions: async (transactions) => {
    try {
      set({ isLoading: true });
      await db.transactions.bulkAdd(transactions);
      // Reload transactions to update the UI
      await get().loadTransactions();
      set({ isModalOpen: false, parsedTransactions: [] });
    } catch (error) {
      console.error("Error adding transactions:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Delete a single transaction
  deleteTransaction: async (transactionId) => {
    try {
      set({ isLoading: true });
      await db.transactions.delete(transactionId);
      // Reload transactions to update the UI
      await get().loadTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
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
      console.error("Error updating transaction:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Add a new account
  addAccount: async (accountData) => {
    try {
      set({ isLoading: true });
      await db.accounts.add(accountData);
      // Reload accounts to update the UI
      await get().loadAccounts();
    } catch (error) {
      console.error("Error adding account:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Delete an account
  deleteAccount: async (accountId) => {
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
  getTransactionsByAccount: (accountId) => {
    const { transactions } = get();
    return transactions.filter((t) => t.accountId === accountId);
  },

  // Calculate account balance
  getAccountBalance: (accountId) => {
    const { transactions } = get();
    return transactions
      .filter((t) => t.accountId === accountId)
      .reduce((total, transaction) => total + transaction.amount, 0);
  },
}));

export default useStore;
