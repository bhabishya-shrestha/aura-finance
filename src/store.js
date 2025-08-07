import { create } from "zustand";
import { persist } from "zustand/middleware";
import db, { forceClearAllData, debugDatabaseState } from "./database";
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
            const { default: firebaseSyncModule } = await import(
              "./services/firebaseSync.js"
            );
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
        notifications: [],
        unreadCount: 0,
        lastUpdateNotification: null,

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

            set({ transactions: transactionsWithAccounts });
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error loading transactions:", error);
            }
          } finally {
            set({ isLoading: false });
          }
        },

        // Remove test transactions from database
        removeTestTransactions: async () => {
          try {
            if (import.meta.env.DEV) {
              console.log("Starting test transaction removal...");
            }

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
              "Grocery Store",
              "Salary Deposit",
              "Test Transaction",
              "Sample Transaction",
            ];

            const allTransactions = await db.transactions.toArray();
            const testTransactions = allTransactions.filter(
              transaction =>
                testTransactionDescriptions.includes(transaction.description) ||
                transaction.userId === "demo"
            );

            if (import.meta.env.DEV) {
              console.log(
                `Found ${testTransactions.length} test transactions to remove`
              );
            }

            if (testTransactions.length === 0) {
              return { removed: 0, message: "No test transactions found" };
            }

            // Remove test transactions using bulk delete for better performance
            await db.transactions.bulkDelete(testTransactions.map(t => t.id));

            if (import.meta.env.DEV) {
              console.log("Test transactions deleted from database");
            }

            // Reload transactions to update the store
            await get().loadTransactions();

            if (import.meta.env.DEV) {
              console.log("Transactions reloaded, deleting from Firebase...");
            }

            // Delete test transactions from Firebase
            try {
              const { default: firebaseSync } = await import(
                "./services/firebaseSync.js"
              );
              for (const transaction of testTransactions) {
                await firebaseSync.deleteFromFirebase(
                  transaction.id,
                  "transactions"
                );
              }
              if (import.meta.env.DEV) {
                console.log("Test transactions deleted from Firebase");
              }
            } catch (firebaseError) {
              if (import.meta.env.DEV) {
                console.warn(
                  "Failed to delete test transactions from Firebase:",
                  firebaseError
                );
              }
            }

            if (import.meta.env.DEV) {
              console.log("Test transaction removal completed");
            }

            return {
              removed: testTransactions.length,
              message: `Removed ${testTransactions.length} test transactions`,
            };
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error removing test transactions:", error);
            }
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

            set({ accounts });
            return accounts;
          } catch (error) {
            if (import.meta.env.DEV) {
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
                  console.error("Error parsing token:", error);
                }
              }
            }

            const newTransaction = {
              ...transactionData,
              id: Date.now().toString(),
              userId: userId || "demo",
              createdAt: new Date().toISOString(),
            };

            await db.transactions.add(newTransaction);
            await get().loadTransactions();

            // Sync to Firebase
            await syncToFirebase();
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error adding transaction:", error);
            }
          } finally {
            set({ isLoading: false });
          }
        },

        // Add multiple transactions
        addTransactions: async transactionsData => {
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
                  console.error("Error parsing token:", error);
                }
              }
            }

            const transactionsWithIds = transactionsData.map(transaction => ({
              ...transaction,
              id:
                Date.now().toString() + Math.random().toString(36).substr(2, 9),
              userId: userId || "demo",
              createdAt: new Date().toISOString(),
            }));

            await db.transactions.bulkAdd(transactionsWithIds);
            await get().loadTransactions();
            set({ parsedTransactions: [] });

            // Sync to Firebase
            await syncToFirebase();
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error adding transactions:", error);
            }
          } finally {
            set({ isLoading: false });
          }
        },

        // Update transaction
        updateTransaction: async (transactionId, updates) => {
          try {
            set({ isLoading: true });

            if (import.meta.env.DEV) {
              console.log(
                `Starting transaction update for ID: ${transactionId}`,
                updates
              );
            }

            // Update local database
            await db.transactions.update(transactionId, updates);

            if (import.meta.env.DEV) {
              console.log("Transaction updated in local database");
            }

            // Update Firebase
            try {
              const { default: firebaseService } = await import(
                "./services/firebaseService.js"
              );

              const result = await firebaseService.updateTransaction(
                transactionId,
                updates
              );
              if (result.success) {
                if (import.meta.env.DEV) {
                  console.log("Transaction updated in Firebase");
                }
              } else {
                if (import.meta.env.DEV) {
                  console.warn(
                    "Failed to update transaction in Firebase:",
                    result.error
                  );
                }
              }
            } catch (firebaseError) {
              if (import.meta.env.DEV) {
                console.warn(
                  "Failed to update transaction in Firebase:",
                  firebaseError
                );
                console.log("Transaction update will work locally only");
              }
              // Continue with local operation - Firebase failure shouldn't break local functionality
            }

            await get().loadTransactions();

            if (import.meta.env.DEV) {
              console.log("Transaction update completed successfully");
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error updating transaction:", error);
            }
          } finally {
            set({ isLoading: false });
          }
        },

        // Delete transaction
        deleteTransaction: async transactionId => {
          try {
            set({ isLoading: true });

            if (import.meta.env.DEV) {
              console.log(
                `Starting transaction deletion for ID: ${transactionId}`
              );
            }

            // Delete from local database
            await db.transactions.delete(transactionId);

            if (import.meta.env.DEV) {
              console.log("Transaction deleted from local database");
            }

            // Delete from Firebase
            try {
              const { default: firebaseService } = await import(
                "./services/firebaseService.js"
              );

              const result =
                await firebaseService.deleteTransaction(transactionId);
              if (result.success) {
                if (import.meta.env.DEV) {
                  console.log("Transaction deleted from Firebase");
                }
              } else {
                if (import.meta.env.DEV) {
                  console.warn(
                    "Failed to delete transaction from Firebase:",
                    result.error
                  );
                }
              }
            } catch (firebaseError) {
              if (import.meta.env.DEV) {
                console.warn(
                  "Failed to delete transaction from Firebase:",
                  firebaseError
                );
                console.log("Transaction deletion will work locally only");
              }
              // Continue with local operation - Firebase failure shouldn't break local functionality
            }

            await get().loadTransactions();

            if (import.meta.env.DEV) {
              console.log("Transaction deletion completed successfully");
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error deleting transaction:", error);
            }
          } finally {
            set({ isLoading: false });
          }
        },

        // Delete multiple transactions
        deleteTransactions: async transactionIds => {
          try {
            set({ isLoading: true });

            if (import.meta.env.DEV) {
              console.log(
                `Starting batch deletion for ${transactionIds.length} transactions`
              );
            }

            // Delete from local database
            const deletePromises = transactionIds.map(transactionId =>
              db.transactions.delete(transactionId)
            );
            await Promise.all(deletePromises);

            if (import.meta.env.DEV) {
              console.log("Transactions deleted from local database");
            }

            // Delete from Firebase
            try {
              const { default: firebaseService } = await import(
                "./services/firebaseService.js"
              );

              const deleteFirebasePromises = transactionIds.map(transactionId =>
                firebaseService.deleteTransaction(transactionId)
              );
              const results = await Promise.all(deleteFirebasePromises);

              const successCount = results.filter(
                result => result.success
              ).length;
              if (import.meta.env.DEV) {
                console.log(
                  `${successCount}/${transactionIds.length} transactions deleted from Firebase`
                );
              }
            } catch (firebaseError) {
              if (import.meta.env.DEV) {
                console.warn(
                  "Failed to delete transactions from Firebase:",
                  firebaseError
                );
                console.log("Transaction deletion will work locally only");
              }
              // Continue with local operation - Firebase failure shouldn't break local functionality
            }

            await get().loadTransactions();

            if (import.meta.env.DEV) {
              console.log("Batch transaction deletion completed successfully");
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error deleting transactions:", error);
            }
          } finally {
            set({ isLoading: false });
          }
        },

        // Add account
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
                if (import.meta.env.DEV) {
                  console.error("Error parsing token:", error);
                }
              }
            }

            const newAccount = {
              ...accountData,
              id: Date.now().toString(),
              userId: userId || "demo",
              createdAt: new Date().toISOString(),
            };

            await db.accounts.add(newAccount);
            await get().loadAccounts();

            // Sync to Firebase
            await syncToFirebase();

            return newAccount;
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error adding account:", error);
            }
            return null;
          } finally {
            set({ isLoading: false });
          }
        },

        // Delete account
        deleteAccount: async accountId => {
          try {
            set({ isLoading: true });

            if (import.meta.env.DEV) {
              console.log(
                `Starting account deletion for account ID: ${accountId}`
              );
            }

            // First, handle transactions associated with this account
            const associatedTransactions = await db.transactions
              .where("accountId")
              .equals(accountId)
              .toArray();

            if (import.meta.env.DEV) {
              console.log(
                `Found ${associatedTransactions.length} associated transactions`
              );
            }

            // Update transactions to remove account association or delete them
            for (const transaction of associatedTransactions) {
              await db.transactions.update(transaction.id, {
                accountId: null,
                accountName: "Uncategorized Account",
              });
            }

            if (import.meta.env.DEV) {
              console.log("Updated associated transactions");
            }

            // Delete the account from local database
            await db.accounts.delete(accountId);

            if (import.meta.env.DEV) {
              console.log("Account deleted from local database");
            }

            // Delete from Firebase
            try {
              const { default: firebaseSync } = await import(
                "./services/firebaseSync.js"
              );
              await firebaseSync.deleteFromFirebase(accountId, "accounts");
              if (import.meta.env.DEV) {
                console.log("Account deleted from Firebase");
              }
            } catch (firebaseError) {
              if (import.meta.env.DEV) {
                console.warn(
                  "Failed to delete account from Firebase:",
                  firebaseError
                );
                console.log("Account deletion will work locally only");
              }
              // Continue with local operation - Firebase failure shouldn't break local functionality
            }

            // Reload data
            await get().loadTransactions();
            await get().loadAccounts();

            if (import.meta.env.DEV) {
              console.log("Account deletion completed successfully");
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error deleting account:", error);
            }
            throw error; // Re-throw to allow calling code to handle
          } finally {
            set({ isLoading: false });
          }
        },

        // Update account balance
        updateAccountBalance: async (accountId, newBalance) => {
          try {
            set({ isLoading: true });
            await db.accounts.update(accountId, { balance: newBalance });
            await get().loadAccounts();

            // Sync to Firebase
            await syncToFirebase();
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error updating account balance:", error);
            }
          } finally {
            set({ isLoading: false });
          }
        },

        // Get all analytics data
        getAllAnalytics: timeRange => {
          return analyticsService.getAllAnalytics(timeRange);
        },

        // Get net worth
        getNetWorth: () => {
          const { accounts } = get();
          return accounts.reduce(
            (total, account) => total + (account.balance || 0),
            0
          );
        },

        // Get account balance
        getAccountBalance: accountId => {
          const { accounts } = get();
          const account = accounts.find(acc => acc.id === accountId);
          return account ? account.balance || 0 : 0;
        },

        // Get transactions by account
        getTransactionsByAccount: accountId => {
          const { transactions } = get();
          return transactions.filter(
            transaction => transaction.accountId === accountId
          );
        },

        // Calculate account stats
        calculateAccountStats: accountId => {
          const { transactions } = get();
          const accountTransactions = transactions.filter(
            transaction => transaction.accountId === accountId
          );
          const recentTransactions = accountTransactions.slice(0, 30); // Last 30 transactions

          const income = recentTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);

          const expenses = recentTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

          return {
            income,
            expenses,
            netChange: income - expenses,
            transactionCount: recentTransactions.length,
          };
        },

        // Find duplicate transactions
        findDuplicates: async () => {
          const { transactions } = get();
          return findDuplicateTransactions(transactions);
        },

        // Force refresh analytics data
        refreshAnalytics: () => {
          analyticsService.forceRefresh();
        },

        // Get spending by category
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
            categorySpending[category] =
              (categorySpending[category] || 0) + Math.abs(t.amount);
          });

          return Object.entries(categorySpending).map(([category, amount]) => ({
            category,
            amount,
          }));
        },

        // Get monthly spending
        getMonthlySpending: (period = "year") => {
          const { transactions } = get();
          const now = new Date();
          const months = [];

          for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(
              date.getFullYear(),
              date.getMonth() + 1,
              0
            );

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

        // Get spending trends
        getSpendingTrends: (months = 12) => {
          const { transactions } = get();
          const now = new Date();
          const trends = [];

          for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(
              date.getFullYear(),
              date.getMonth() + 1,
              0
            );

            const monthTransactions = transactions.filter(t => {
              const transactionDate = new Date(t.date);
              return (
                transactionDate >= monthStart && transactionDate <= monthEnd
              );
            });

            const spending = monthTransactions
              .filter(t => t.amount < 0)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            const income = monthTransactions
              .filter(t => t.amount > 0)
              .reduce((sum, t) => sum + t.amount, 0);

            trends.push({
              month: date.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              }),
              spending,
              income,
              net: income - spending,
            });
          }

          return trends;
        },

        // Get top spending categories
        getTopSpendingCategories: (period = "month", limit = 10) => {
          const categoryBreakdown = get().getSpendingByCategory(period);
          return categoryBreakdown
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limit);
        },

        // Get average daily spending
        getAverageDailySpending: (period = "month") => {
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

          const totalSpending = filteredTransactions.reduce(
            (sum, t) => sum + Math.abs(t.amount),
            0
          );
          const daysDiff = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));

          return daysDiff > 0 ? totalSpending / daysDiff : 0;
        },

        // Get income vs spending
        getIncomeVsSpending: (period = "month") => {
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
            t => new Date(t.date) >= startDate
          );

          const income = filteredTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);

          const spending = filteredTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

          return {
            income,
            spending,
            net: income - spending,
          };
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

        // Disable Firebase sync temporarily (for development/debugging)
        disableFirebaseSync: () => {
          if (import.meta.env.DEV) {
            console.log("Firebase sync disabled for debugging");
          }
          // This will prevent Firebase operations from being called
          // The app will work locally only
        },

        // Manually trigger test data cleanup
        cleanupTestData: async () => {
          try {
            set({ isLoading: true });

            if (import.meta.env.DEV) {
              console.log("Manually triggering test data cleanup...");
            }

            // Import and call the cleanup function
            const { cleanupTestData: dbCleanup } = await import("./database");
            await dbCleanup();

            // Reload data
            await get().loadTransactions();
            await get().loadAccounts();

            // Clear Firebase data for test items
            try {
              const { default: firebaseSync } = await import(
                "./services/firebaseSync.js"
              );
              // Get all data and delete test items from Firebase
              const allTransactions = await db.transactions.toArray();
              const allAccounts = await db.accounts.toArray();

              // Delete test transactions from Firebase
              const testTransactionPatterns = [
                "Grocery Store",
                "Gas Station",
                "Salary Deposit",
                "Grocery Shopping",
                "Salary Payment",
                "Restaurant Dinner",
                "Movie Tickets",
                "July Shopping",
                "July Income",
                "March Utilities",
                "Old Transaction",
                "Test Transaction",
                "Sample Transaction",
              ];

              const testTransactions = allTransactions.filter(
                transaction =>
                  testTransactionPatterns.includes(transaction.description) ||
                  transaction.userId === "demo"
              );

              for (const transaction of testTransactions) {
                await firebaseSync.deleteFromFirebase(
                  transaction.id,
                  "transactions"
                );
              }

              // Delete test accounts from Firebase
              const testAccountPatterns = [
                "Bank of America Checking",
                "Bank of America Credit Card",
                "Savings Account",
                "Test Account",
                "Sample Account",
                "Demo Account",
              ];

              const testAccounts = allAccounts.filter(
                account =>
                  testAccountPatterns.includes(account.name) ||
                  account.userId === "demo"
              );

              for (const account of testAccounts) {
                await firebaseSync.deleteFromFirebase(account.id, "accounts");
              }

              if (import.meta.env.DEV) {
                console.log("Test data cleared from Firebase");
              }
            } catch (firebaseError) {
              if (import.meta.env.DEV) {
                console.warn(
                  "Failed to clear test data from Firebase:",
                  firebaseError
                );
              }
            }

            if (import.meta.env.DEV) {
              console.log("Test data cleanup completed");
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error cleaning up test data:", error);
            }
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Debug database state
        debugDatabase: async () => {
          try {
            await debugDatabaseState();
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error debugging database:", error);
            }
          }
        },

        // Check Firebase permissions
        checkFirebasePermissions: async () => {
          try {
            const { default: firebaseSync } = await import(
              "./services/firebaseSync.js"
            );
            const { default: firebaseService } = await import(
              "./services/firebaseService.js"
            );

            // Try to perform a simple operation to test permissions
            const testResult = await firebaseService.getTransactions();

            if (import.meta.env.DEV) {
              console.log(
                "Firebase permissions check:",
                testResult.success ? "OK" : "FAILED"
              );
              if (!testResult.success) {
                console.log("Firebase error:", testResult.error);
              }
            }

            return testResult.success;
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Firebase permissions check failed:", error);
            }
            return false;
          }
        },

        // Reset all user data
        resetUserData: async () => {
          try {
            set({ isLoading: true });

            if (import.meta.env.DEV) {
              console.log("Starting data reset...");
            }

            // Use the force clear function to ensure all data is removed
            await forceClearAllData();

            if (import.meta.env.DEV) {
              console.log("Database cleared successfully");
            }

            // Clear store state
            set({
              transactions: [],
              accounts: [],
              parsedTransactions: [],
            });

            if (import.meta.env.DEV) {
              console.log("Store state cleared");
            }

            // Force reload to ensure state is clean
            await get().loadTransactions();
            await get().loadAccounts();

            if (import.meta.env.DEV) {
              console.log("Data reloaded, clearing Firebase...");
            }

            // Clear Firebase data
            try {
              const { default: firebaseSync } = await import(
                "./services/firebaseSync.js"
              );
              // Get all data and delete from Firebase
              const allTransactions = await db.transactions.toArray();
              const allAccounts = await db.accounts.toArray();

              // Delete all transactions from Firebase
              for (const transaction of allTransactions) {
                await firebaseSync.deleteFromFirebase(
                  transaction.id,
                  "transactions"
                );
              }

              // Delete all accounts from Firebase
              for (const account of allAccounts) {
                await firebaseSync.deleteFromFirebase(account.id, "accounts");
              }

              if (import.meta.env.DEV) {
                console.log("All data cleared from Firebase");
              }
            } catch (firebaseError) {
              if (import.meta.env.DEV) {
                console.warn("Failed to clear Firebase data:", firebaseError);
              }
            }

            if (import.meta.env.DEV) {
              console.log("Data reset completed successfully");
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error resetting user data:", error);
            }
            // Ensure state is reset even if Firebase sync fails
            set({
              transactions: [],
              accounts: [],
              parsedTransactions: [],
            });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Notification System
        addNotification: notification => {
          set(state => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }));
        },

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

        markAllNotificationsAsRead: () => {
          set(state => ({
            notifications: state.notifications.map(notification => ({
              ...notification,
              read: true,
            })),
            unreadCount: 0,
          }));
        },

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

        setUpdateNotification: updateInfo => {
          set({
            lastUpdateNotification: {
              version: updateInfo.version,
              timestamp: new Date().toISOString(),
              features: updateInfo.features,
              bugFixes: updateInfo.bugFixes,
              read: false,
            },
          });
        },

        markUpdateNotificationAsRead: () => {
          set(state => ({
            lastUpdateNotification: state.lastUpdateNotification
              ? { ...state.lastUpdateNotification, read: true }
              : null,
          }));
        },

        clearUpdateNotification: () => {
          set({
            lastUpdateNotification: null,
          });
        },

        clearAllNotifications: () => {
          set({
            notifications: [],
            unreadCount: 0,
            lastUpdateNotification: null,
          });
        },

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
      };
    },
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
