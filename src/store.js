import { create } from "zustand";
import { persist } from "zustand/middleware";
import db from "./database";
import { tokenManager } from "./services/localAuth";
import { findDuplicateTransactions } from "./utils/duplicateDetector";
import analyticsService from "./services/analyticsService";

// Firebase sync service (loaded dynamically)
let firebaseSync = null;

const useStore = create(
  persist(
    (set, get) => {
      // Helper function to sync data to Firebase
      const syncToFirebase = async () => {
        if (!firebaseSync) {
          try {
            const { default: firebaseSyncModule } = await import("./services/firebaseSync.js");
            firebaseSync = firebaseSyncModule;
          } catch (error) {
            console.log("Firebase sync not available:", error.message);
            return;
          }
        }
        
        try {
          await firebaseSync.syncData();
        } catch (error) {
          console.log("Firebase sync failed:", error.message);
        }
      };

      return {
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
              .toArray()
              .then(arr => arr.reverse());
          } else {
            // Fallback to all transactions for demo
            transactions = await db.transactions
              .orderBy("date")
              .toArray()
              .then(arr => arr.reverse());
          }

          // Load accounts to establish relationships
          const accounts = await get().loadAccounts();

          // Join transactions with account information
          const transactionsWithAccounts = transactions.map(transaction => {
            const account = accounts.find(
              acc => acc.id === transaction.accountId
            );
            return {
              ...transaction,
              account: account || null,
              accountName:
                account?.name ||
                transaction.accountName ||
                "Uncategorized Account",
            };
          });

          // Clear analytics cache when transactions are loaded
          // analyticsService.forceRefresh(); // Removed - not needed with batch calculations

          set({ transactions: transactionsWithAccounts });
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

      // Remove test transactions from database
      removeTestTransactions: async () => {
        try {
          const testTransactionDescriptions = [
            "Grocery Shopping",
            "Salary Payment",
            "Gas Station",
            "Restaurant Dinner",
            "Movie Tickets",
            "July Shopping",
            "July Income",
            "March Utilities",
            "Old Transaction",
          ];

          const allTransactions = await db.transactions.toArray();
          const testTransactions = allTransactions.filter(transaction =>
            testTransactionDescriptions.includes(transaction.description)
          );

          if (testTransactions.length === 0) {
            return { removed: 0, message: "No test transactions found" };
          }

          // Remove test transactions
          for (const transaction of testTransactions) {
            await db.transactions.delete(transaction.id);
          }

          // Reload transactions to update the store
          await get().loadTransactions();

          return {
            removed: testTransactions.length,
            message: `Removed ${testTransactions.length} test transactions`,
          };
        } catch (error) {
          console.error("Error removing test transactions:", error);
          return { removed: 0, message: "Error removing test transactions" };
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

            accounts = await db.accounts
              .where("userId")
              .equals(userId)
              .toArray();
          } else {
            // Fallback to all accounts for demo
            accounts = await db.accounts.toArray();
          }

          // Clear analytics cache when accounts are loaded
          // analyticsService.forceRefresh(); // Removed - not needed with batch calculations
          set({ accounts });
          return accounts;
        } catch (error) {
          // Error handling - in production, this would use a proper error notification system
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error("Error loading accounts:", error);
          }
          return [];
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

              return !skipPatterns.some(pattern =>
                description.includes(pattern)
              );
            }

            return true;
          });

          // Add userId to transactions
          const transactionsWithUser = filteredTransactions.map(
            transaction => ({
              ...transaction,
              userId: userId || transaction.userId || null,
            })
          );

          await db.transactions.bulkAdd(transactionsWithUser);

          // Clear analytics cache to ensure fresh data
          analyticsService.forceRefresh();

          // Reload transactions to update the UI
          await get().loadTransactions();
          set({ parsedTransactions: [] });
          
          // Sync to Firebase
          await syncToFirebase();
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
          
          // Sync to Firebase
          await syncToFirebase();
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
            existingAccounts = await db.accounts
              .where("userId")
              .equals(userId)
              .toArray();
          } else {
            // If no userId, get all accounts (for demo/fallback)
            existingAccounts = await db.accounts.toArray();
          }

          const duplicateAccount = existingAccounts.find(
            account =>
              account.name.toLowerCase().trim() ===
              accountData.name.toLowerCase().trim()
          );

          if (duplicateAccount) {
            throw new Error(
              `An account with the name "${accountData.name}" already exists. Please choose a different name.`
            );
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
          
          // Sync to Firebase
          await syncToFirebase();

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
          
          // Sync to Firebase
          await syncToFirebase();
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
            balance:
              (account.balance || account.initialBalance || 0) + adjustment,
            lastBalanceUpdate: new Date().toISOString(),
          });

          // Clear analytics cache to ensure fresh data
          analyticsService.forceRefresh();

          // Reload accounts to update the UI
          await get().loadAccounts();
          
          // Sync to Firebase
          await syncToFirebase();
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
        return analyticsService.calculateQuickAnalytics(
          transactions,
          timeRange
        );
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
        return analyticsService.calculateIncomeVsSpending(
          transactions,
          timeRange
        );
      },

      getMonthlySpending: (timeRange = "year") => {
        const { transactions } = get();
        if (!transactions || transactions.length === 0) {
          return [];
        }
        return analyticsService.calculateMonthlySpending(
          transactions,
          timeRange
        );
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
        return analyticsService.calculateSpendingTrends(
          transactions,
          timeRange
        );
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

      // Manual sync to Firebase
      syncToFirebase: async () => {
        try {
          set({ isLoading: true });
          await syncToFirebase();
        } catch (error) {
          console.error("Manual sync failed:", error);
        } finally {
          set({ isLoading: false });
        }
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

      // Notification System
      notifications: [],
      unreadCount: 0,
      lastUpdateNotification: null,

      // Add notification
      addNotification: notification => {
        const newNotification = {
          id: Date.now(),
          title: notification.title,
          message: notification.message,
          type: notification.type || "info", // 'info', 'success', 'warning', 'error'
          timestamp: new Date().toISOString(),
          read: false,
          action: notification.action || null,
        };

        set(state => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
          unreadCount: state.unreadCount + 1,
        }));
      },

      // Mark notification as read
      markNotificationAsRead: notificationId => {
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      // Mark all notifications as read
      markAllNotificationsAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(notification => ({
            ...notification,
            read: true,
          })),
          unreadCount: 0,
        }));
      },

      // Clear notification
      clearNotification: notificationId => {
        set(state => {
          const notification = state.notifications.find(
            n => n.id === notificationId
          );
          return {
            notifications: state.notifications.filter(
              n => n.id !== notificationId
            ),
            unreadCount:
              notification && !notification.read
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount,
          };
        });
      },

      // Set update notification
      setUpdateNotification: updateInfo => {
        set({
          lastUpdateNotification: {
            version: updateInfo.version,
            timestamp: new Date().toISOString(),
            features: updateInfo.features,
            bugFixes: updateInfo.bugFixes,
            read: false, // Add read state
          },
        });
      },

      // Mark update notification as read
      markUpdateNotificationAsRead: () => {
        set(state => ({
          lastUpdateNotification: state.lastUpdateNotification
            ? { ...state.lastUpdateNotification, read: true }
            : null,
        }));
      },

      // Clear update notification
      clearUpdateNotification: () => {
        set({
          lastUpdateNotification: null,
        });
      },

      // Clear all notifications (useful for removing test notifications)
      clearAllNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
          lastUpdateNotification: null,
        });
      },

      // Manually trigger device-specific update notification
      triggerUpdateNotification: () => {
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
          set({
            lastUpdateNotification: {
              version: "1.1.0",
              timestamp: new Date().toISOString(),
              features: [
                "Enhanced mobile navigation with improved sidebar design",
                "Better mobile header with proper notification indicators",
                "Improved mobile statement import process",
                "Enhanced mobile layout for accounts and transactions",
                "Professional mobile add account button design",
                "Better mobile viewport handling and responsive design",
              ],
              bugFixes: [
                "Fixed mobile browser compatibility issues",
                "Resolved notification dropdown alignment on mobile",
                "Fixed hamburger menu functionality",
                "Improved icon centering in mobile header",
                "Enhanced mobile scroll behavior and touch interactions",
              ],
              read: false,
            },
          });
        } else {
          set({
            lastUpdateNotification: {
              version: "1.1.0",
              timestamp: new Date().toISOString(),
              features: [
                "Completely redesigned Analytics page with Fortune 500 standards",
                "Enhanced AI-powered account detection and assignment",
                "Professional transaction editing capabilities",
                "Improved statement processing with better error handling",
                "Enhanced account assignment modal with modern design",
                "Better data visualization and chart improvements",
              ],
              bugFixes: [
                "Fixed analytics data display and chart rendering issues",
                "Resolved transaction import and account assignment bugs",
                "Improved overall app stability and performance",
                "Fixed UI layout and responsive design issues",
              ],
              read: false,
            },
          });
        }
      },
    }),
    {
      name: "aura-finance-store",
      partialize: state => ({
        transactions: state.transactions,
        accounts: state.accounts,
        isLoading: state.isLoading,
        parsedTransactions: state.parsedTransactions,
        currentUser: state.currentUser,
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        lastUpdateNotification: state.lastUpdateNotification,
      }),
    }
  )
);

export default useStore;
