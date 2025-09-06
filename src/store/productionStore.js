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
        // Prevent multiple initializations
        const currentState = get();
        if (currentState.isInitialized) {
          console.log("ℹ️ Store already initialized, skipping...");
          return;
        }

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

        // Clean up any existing listeners first
        firebaseService.unsubscribeFromTransactions();
        firebaseService.unsubscribeFromAccounts();

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
          // Process transactions with account information
          const processedTransactions = get().processTransactionsWithAccounts(
            transactionsResult.data || [],
            accountsResult.data || []
          );

          set({
            transactions: processedTransactions,
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

    // Force refresh accounts only (useful after deletions)
    forceRefreshAccounts: async () => {
      try {
        console.log("🔄 Force refreshing accounts from Firebase...");

        const accountsResult = await firebaseService.getAccounts();
        if (accountsResult.success) {
          const currentState = get();
          const updatedAccounts = accountsResult.data || [];

          console.log("📊 Accounts refresh results:");
          console.log("  - Previous count:", currentState.accounts.length);
          console.log("  - New count:", updatedAccounts.length);

          set({
            accounts: updatedAccounts,
            lastSyncTime: new Date(),
          });

          return { success: true, accounts: updatedAccounts };
        } else {
          throw new Error("Failed to fetch accounts from Firebase");
        }
      } catch (error) {
        console.error("❌ Force refresh accounts error:", error);
        throw error;
      }
    },

    // Clear local database and refresh from Firebase
    clearLocalData: async () => {
      try {
        console.log("🧹 Clearing local database...");

        // Import the database module
        const { default: db } = await import("../database.js");

        // Clear all local data
        await db.transactions.clear();
        await db.accounts.clear();

        console.log("✅ Local database cleared");

        // Force refresh from Firebase
        await get().forceRefresh();

        console.log("🎉 Local data cleared and refreshed from Firebase");
      } catch (error) {
        console.error("❌ Error clearing local data:", error);
      }
    },

    // Reset store state and listeners (useful for debugging)
    resetStore: () => {
      console.log("🔄 Resetting store state...");

      // Clean up listeners
      firebaseService.unsubscribeFromTransactions();
      firebaseService.unsubscribeFromAccounts();

      // Reset state
      set({
        transactions: [],
        accounts: [],
        isLoading: false,
        error: null,
        isInitialized: false,
        lastSyncTime: null,
        syncStatus: "idle",
      });

      console.log("✅ Store reset completed");
    },

    // Manually remove account from store state (fallback method)
    removeAccountFromState: accountId => {
      const currentState = get();
      const updatedAccounts = currentState.accounts.filter(
        acc => acc.id !== accountId
      );
      const updatedTransactions = currentState.transactions.filter(
        trans => trans.accountId !== accountId
      );

      console.log("🗑️ Manually removing account from state:", accountId);
      console.log("  - Accounts before:", currentState.accounts.length);
      console.log("  - Accounts after:", updatedAccounts.length);
      console.log("  - Transactions before:", currentState.transactions.length);
      console.log("  - Transactions after:", updatedTransactions.length);

      set({
        accounts: updatedAccounts,
        transactions: updatedTransactions,
        lastSyncTime: new Date(),
      });

      return {
        success: true,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
      };
    },

    // Helper function to process transactions with account information
    processTransactionsWithAccounts: (transactions, accounts) => {
      if (!Array.isArray(transactions) || !Array.isArray(accounts)) {
        return transactions || [];
      }

      return transactions.map(transaction => {
        const account = accounts.find(
          acc =>
            acc.id === transaction.accountId ||
            acc.id === transaction.accountId?.toString()
        );

        return {
          ...transaction,
          account: account || null,
        };
      });
    },

    // Set up real-time listeners for Firestore
    setupRealtimeListeners: async () => {
      try {
        console.log("🔧 Setting up real-time listeners...");

        let currentAccounts = [];

        // Listen for transaction changes
        const transactionUnsubscribe = firebaseService.subscribeToTransactions(
          transactions => {
            if (import.meta.env.DEV) {
              console.log(
                "🔄 Real-time transaction update:",
                transactions.length,
                "transactions"
              );
            }

            // Ensure we're getting valid data
            if (Array.isArray(transactions)) {
              // Process transactions with account information
              const processedTransactions =
                get().processTransactionsWithAccounts(
                  transactions,
                  currentAccounts
                );

              set({
                transactions: processedTransactions,
                lastSyncTime: new Date(),
                syncStatus: "success",
              });
            } else {
              console.warn(
                "⚠️ Received invalid transaction data:",
                transactions
              );
              set({
                transactions: [],
                lastSyncTime: new Date(),
                syncStatus: "error",
              });
            }
          }
        );

        // Listen for account changes
        const accountUnsubscribe = firebaseService.subscribeToAccounts(
          accounts => {
            if (import.meta.env.DEV) {
              console.log(
                "🔄 Real-time account update:",
                accounts.length,
                "accounts"
              );
            }

            // Ensure we're getting valid data
            if (Array.isArray(accounts)) {
              currentAccounts = accounts;

              // Re-process existing transactions with new account data
              const currentTransactions = get().transactions;
              const processedTransactions =
                get().processTransactionsWithAccounts(
                  currentTransactions,
                  accounts
                );

              set({
                accounts: accounts,
                transactions: processedTransactions,
                lastSyncTime: new Date(),
                syncStatus: "success",
              });
            } else {
              console.warn("⚠️ Received invalid account data:", accounts);
              set({
                accounts: [],
                lastSyncTime: new Date(),
                syncStatus: "error",
              });
            }
          }
        );

        // Verify listeners were set up
        if (!transactionUnsubscribe || !accountUnsubscribe) {
          throw new Error("Failed to set up real-time listeners");
        }

        console.log("✅ Real-time listeners set up successfully");

        // Listen for online/offline changes
        window.addEventListener("online", () => set({ isOnline: true }));
        window.addEventListener("offline", () => set({ isOnline: false }));
      } catch (error) {
        console.error("❌ Error setting up real-time listeners:", error);
        set({
          error: `Failed to setup listeners: ${error.message}`,
          syncStatus: "error",
        });
        throw error;
      }
    },

    // Transaction actions
    addTransaction: async transactionData => {
      try {
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        // Validate required fields
        if (!transactionData.description?.trim()) {
          throw new Error("Transaction description is required");
        }
        if (
          !transactionData.amount ||
          isNaN(parseFloat(transactionData.amount))
        ) {
          throw new Error("Valid transaction amount is required");
        }
        if (!transactionData.date) {
          throw new Error("Transaction date is required");
        }
        if (!transactionData.accountId) {
          throw new Error("Account is required");
        }

        // Ensure proper data formatting
        const sanitizedData = {
          ...transactionData,
          description: transactionData.description.trim(),
          accountId: transactionData.accountId?.toString(),
          amount: parseFloat(transactionData.amount),
          date: new Date(transactionData.date).toISOString(),
          category: transactionData.category || "Uncategorized",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const result = await firebaseService.addTransaction(sanitizedData);

        if (!result.success) {
          throw new Error(result.error || "Failed to add transaction");
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false, syncStatus: "success" });

        // Return success with transaction data
        return {
          success: true,
          data: result.data,
          message: "Transaction added successfully",
        };
      } catch (error) {
        const errorMessage = error.message || "Failed to add transaction";
        set({
          isLoading: false,
          error: errorMessage,
          syncStatus: "error",
        });
        throw new Error(errorMessage);
      }
    },

    updateTransaction: async (transactionId, updates) => {
      try {
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        // Validate transaction exists
        const existingTransaction = get().transactions.find(
          t => t.id === transactionId
        );
        if (!existingTransaction) {
          throw new Error("Transaction not found");
        }

        // Ensure proper data formatting
        const sanitizedUpdates = {
          ...updates,
          description: updates.description?.trim(),
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
          throw new Error(result.error || "Failed to update transaction");
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false, syncStatus: "success" });

        return {
          success: true,
          data: result.data,
          message: "Transaction updated successfully",
        };
      } catch (error) {
        const errorMessage = error.message || "Failed to update transaction";
        set({
          isLoading: false,
          error: errorMessage,
          syncStatus: "error",
        });
        throw new Error(errorMessage);
      }
    },

    deleteTransaction: async transactionId => {
      try {
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        // Validate transaction exists
        const existingTransaction = get().transactions.find(
          t => t.id === transactionId
        );
        if (!existingTransaction) {
          throw new Error("Transaction not found");
        }

        const result = await firebaseService.deleteTransaction(transactionId);

        if (!result.success) {
          throw new Error(result.error || "Failed to delete transaction");
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false, syncStatus: "success" });

        return {
          success: true,
          message: "Transaction deleted successfully",
        };
      } catch (error) {
        const errorMessage = error.message || "Failed to delete transaction";
        set({
          isLoading: false,
          error: errorMessage,
          syncStatus: "error",
        });
        throw new Error(errorMessage);
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

        // Validate required fields
        if (!accountData.name?.trim()) {
          throw new Error("Account name is required");
        }
        if (!accountData.type) {
          throw new Error("Account type is required");
        }
        if (
          accountData.balance === undefined ||
          accountData.balance === null ||
          isNaN(parseFloat(accountData.balance))
        ) {
          throw new Error("Valid account balance is required");
        }

        // Ensure proper data formatting
        const sanitizedData = {
          ...accountData,
          name: accountData.name.trim(),
          balance: parseFloat(accountData.balance),
          type: accountData.type.toLowerCase(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const result = await firebaseService.addAccount(sanitizedData);

        if (!result.success) {
          throw new Error(result.error || "Failed to add account");
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false, syncStatus: "success" });

        return {
          success: true,
          data: result.data,
          message: "Account added successfully",
        };
      } catch (error) {
        const errorMessage = error.message || "Failed to add account";
        set({
          isLoading: false,
          error: errorMessage,
          syncStatus: "error",
        });
        throw new Error(errorMessage);
      }
    },

    updateAccount: async (accountId, updates) => {
      try {
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        // Validate account exists
        const existingAccount = get().accounts.find(a => a.id === accountId);
        if (!existingAccount) {
          throw new Error("Account not found");
        }

        // Ensure proper data formatting - only include fields that are being updated
        const sanitizedUpdates = {
          updatedAt: new Date().toISOString(),
        };

        // Only add fields that are actually being updated
        if (updates.name !== undefined) {
          sanitizedUpdates.name = updates.name.trim();
        }
        if (updates.balance !== undefined) {
          sanitizedUpdates.balance = parseFloat(updates.balance);
        }
        if (updates.type !== undefined) {
          sanitizedUpdates.type = updates.type.toLowerCase();
        }

        const result = await firebaseService.updateAccount(
          accountId,
          sanitizedUpdates
        );

        if (!result.success) {
          throw new Error(result.error || "Failed to update account");
        }

        // The real-time listener will automatically update the store
        set({ isLoading: false, syncStatus: "success" });

        return {
          success: true,
          data: result.data,
          message: "Account updated successfully",
        };
      } catch (error) {
        const errorMessage = error.message || "Failed to update account";
        set({
          isLoading: false,
          error: errorMessage,
          syncStatus: "error",
        });
        throw new Error(errorMessage);
      }
    },

    deleteAccount: async (accountId, options = {}) => {
      try {
        console.log("🔍 productionStore.deleteAccount called with:", {
          accountId,
          options,
        });
        set({ isLoading: true, error: null, syncStatus: "syncing" });

        // Validate account exists
        const existingAccount = get().accounts.find(a => a.id === accountId);
        if (!existingAccount) {
          console.error("❌ Account not found in store:", accountId);
          throw new Error("Account not found");
        }
        console.log("✅ Account found in store:", existingAccount);

        // Check if account has transactions
        const accountTransactions = get().transactions.filter(
          t => t.accountId === accountId
        );

        if (accountTransactions.length > 0) {
          if (options.deleteTransactions) {
            // Delete all transactions for this account
            console.log(
              `🗑️ Deleting ${accountTransactions.length} transactions for account ${accountId}`
            );

            const deletePromises = accountTransactions.map(transaction =>
              firebaseService.deleteTransaction(transaction.id)
            );

            const deleteResults = await Promise.all(deletePromises);
            const failedDeletes = deleteResults.filter(
              result => !result.success
            );

            if (failedDeletes.length > 0) {
              throw new Error(
                `Failed to delete ${failedDeletes.length} transactions`
              );
            }

            console.log(
              `✅ Deleted ${accountTransactions.length} transactions`
            );
          } else if (options.reassignToAccountId) {
            // Reassign transactions to another account
            console.log(
              `🔄 Reassigning ${accountTransactions.length} transactions to account ${options.reassignToAccountId}`
            );

            const reassignPromises = accountTransactions.map(transaction =>
              firebaseService.updateTransaction(transaction.id, {
                accountId: options.reassignToAccountId,
                updatedAt: new Date().toISOString(),
              })
            );

            const reassignResults = await Promise.all(reassignPromises);
            const failedReassigns = reassignResults.filter(
              result => !result.success
            );

            if (failedReassigns.length > 0) {
              throw new Error(
                `Failed to reassign ${failedReassigns.length} transactions`
              );
            }

            console.log(
              `✅ Reassigned ${accountTransactions.length} transactions`
            );
          } else {
            // Default behavior: prevent deletion
            throw new Error(
              `Cannot delete account with ${accountTransactions.length} existing transactions. ` +
                `Use options.deleteTransactions: true to delete transactions, or ` +
                `options.reassignToAccountId to reassign them to another account.`
            );
          }
        }

        // Now delete the account from Firebase
        console.log(
          "🗑️ Calling firebaseService.deleteAccount with accountId:",
          accountId
        );

        // Ensure Firebase service is ready
        if (!firebaseService.authInitialized) {
          console.log("⏳ Waiting for Firebase service to be ready...");
          await firebaseService.waitForAuth();
        }

        const result = await firebaseService.deleteAccount(accountId);
        console.log("📊 firebaseService.deleteAccount result:", result);

        if (!result.success) {
          console.error(
            "❌ firebaseService.deleteAccount failed:",
            result.error
          );
          throw new Error(result.error || "Failed to delete account");
        }
        console.log("✅ firebaseService.deleteAccount succeeded");

        // CRITICAL: Update local state immediately to reflect the deletion
        // This ensures the UI updates immediately, regardless of real-time listener timing
        const currentState = get();
        const updatedAccounts = currentState.accounts.filter(
          acc => acc.id !== accountId
        );
        const updatedTransactions = currentState.transactions.filter(
          trans => trans.accountId !== accountId
        );

        console.log("🔄 Updating local state after deletion:");
        console.log("  - Accounts before:", currentState.accounts.length);
        console.log("  - Accounts after:", updatedAccounts.length);
        console.log(
          "  - Transactions before:",
          currentState.transactions.length
        );
        console.log("  - Transactions after:", updatedTransactions.length);

        set({
          accounts: updatedAccounts,
          transactions: updatedTransactions,
          isLoading: false,
          syncStatus: "success",
          lastSyncTime: new Date(),
        });

        // Force a refresh of real-time listeners to ensure consistency
        console.log("🔄 Refreshing real-time listeners...");
        firebaseService.unsubscribeFromTransactions();
        firebaseService.unsubscribeFromAccounts();

        // Set up listeners again
        await get().setupRealtimeListeners();

        return {
          success: true,
          message: `Account deleted successfully${accountTransactions.length > 0 ? ` (${accountTransactions.length} transactions ${options.deleteTransactions ? "deleted" : "reassigned"})` : ""}`,
        };
      } catch (error) {
        const errorMessage = error.message || "Failed to delete account";
        console.error("❌ deleteAccount error:", error);
        set({
          isLoading: false,
          error: errorMessage,
          syncStatus: "error",
        });
        throw new Error(errorMessage);
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

      // Categorize transactions based on type, with fallback to amount sign
      const income = recentTransactions
        .filter(t => {
          // If type is explicitly set, use it
          if (t.type === "income") return true;
          if (t.type === "expense") return false;
          // Fallback to amount sign for backward compatibility
          return t.amount > 0;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const expenses = recentTransactions
        .filter(t => {
          // If type is explicitly set, use it
          if (t.type === "expense") return true;
          if (t.type === "income") return false;
          // Fallback to amount sign for backward compatibility
          return t.amount < 0;
        })
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
        const isExpense =
          t.type === "expense" || (t.type !== "income" && t.amount < 0);
        return (
          isExpense && transactionDate >= startDate && transactionDate <= now
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
          const isExpense =
            t.type === "expense" || (t.type !== "income" && t.amount < 0);
          
          // Normalize transaction date to start of day to avoid timezone issues
          const normalizedTransactionDate = new Date(
            transactionDate.getFullYear(),
            transactionDate.getMonth(),
            transactionDate.getDate()
          );
          
          return (
            isExpense &&
            normalizedTransactionDate >= monthStart &&
            normalizedTransactionDate <= monthEnd
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
          .filter(t => {
            // If type is explicitly set, use it
            if (t.type === "income") return true;
            if (t.type === "expense") return false;
            // Fallback to amount sign for backward compatibility
            return t.amount > 0;
          })
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const expenses = accountTransactions
          .filter(t => {
            // If type is explicitly set, use it
            if (t.type === "expense") return true;
            if (t.type === "income") return false;
            // Fallback to amount sign for backward compatibility
            return t.amount < 0;
          })
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
