import { create } from "zustand";
import { persist } from "zustand/middleware";
import db from "../database";
import { tokenManager } from "../services/localAuth";
import { performanceMonitor } from "../services/performanceService";

/**
 * Account Store
 * Manages all account-related state and operations
 */
const useAccountStore = create(
  persist(
    (set, get) => ({
      // State
      accounts: [],
      isLoading: false,
      selectedAccountId: null,

      // Actions
      setLoading: loading => set({ isLoading: loading }),

      setSelectedAccount: accountId => set({ selectedAccountId: accountId }),

      // Load accounts from database
      loadAccounts: async () => {
        return performanceMonitor.measureFunction("loadAccounts", async () => {
          try {
            const { setLoading } = get();
            setLoading(true);

            const token = tokenManager.getToken();
            let accounts = [];

            if (token) {
              // Get user ID from token
              const payload = JSON.parse(atob(token.split(".")[1]));
              const userId = payload.userId;

              accounts = await db.accounts
                .where("userId")
                .equals(userId)
                .orderBy("name")
                .toArray();
            } else {
              // Fallback to all accounts for demo
              accounts = await db.accounts.orderBy("name").toArray();
            }

            // Calculate account balances
            const accountsWithBalances =
              await get().calculateAccountBalances(accounts);

            set({ accounts: accountsWithBalances });

            return accountsWithBalances;
          } catch (error) {
            console.error("Failed to load accounts:", error);
            performanceMonitor.recordMetric("account_load_error", {
              error: error.message,
            });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        });
      },

      // Calculate account balances
      calculateAccountBalances: async accounts => {
        return performanceMonitor.measureFunction(
          "calculateAccountBalances",
          async () => {
            try {
              const accountsWithBalances = await Promise.all(
                accounts.map(async account => {
                  const transactions = await db.transactions
                    .where("accountId")
                    .equals(account.id)
                    .toArray();

                  const balance = transactions.reduce((sum, transaction) => {
                    return sum + transaction.amount;
                  }, account.initialBalance || 0);

                  return {
                    ...account,
                    balance,
                    transactionCount: transactions.length,
                  };
                })
              );

              return accountsWithBalances;
            } catch (error) {
              console.error("Failed to calculate account balances:", error);
              performanceMonitor.recordMetric("balance_calculation_error", {
                error: error.message,
              });
              throw error;
            }
          }
        );
      },

      // Add account
      addAccount: async account => {
        return performanceMonitor.measureFunction("addAccount", async () => {
          try {
            const { loadAccounts } = get();

            // Add to database
            const id = await db.accounts.add(account);

            // Reload accounts to get updated list
            await loadAccounts();

            performanceMonitor.recordMetric("account_added", {
              id,
              type: account.type,
            });

            return id;
          } catch (error) {
            console.error("Failed to add account:", error);
            performanceMonitor.recordMetric("account_add_error", {
              error: error.message,
            });
            throw error;
          }
        });
      },

      // Update account
      updateAccount: async (id, updates) => {
        return performanceMonitor.measureFunction("updateAccount", async () => {
          try {
            const { loadAccounts } = get();

            // Update in database
            await db.accounts.update(id, updates);

            // Reload accounts to get updated list
            await loadAccounts();

            performanceMonitor.recordMetric("account_updated", {
              id,
              updates: Object.keys(updates),
            });

            return id;
          } catch (error) {
            console.error("Failed to update account:", error);
            performanceMonitor.recordMetric("account_update_error", {
              error: error.message,
            });
            throw error;
          }
        });
      },

      // Delete account
      deleteAccount: async id => {
        return performanceMonitor.measureFunction("deleteAccount", async () => {
          try {
            const { loadAccounts } = get();

            // Check if account has transactions
            const transactions = await db.transactions
              .where("accountId")
              .equals(id)
              .count();

            if (transactions > 0) {
              throw new Error(
                `Cannot delete account with ${transactions} associated transactions`
              );
            }

            // Delete from database
            await db.accounts.delete(id);

            // Reload accounts to get updated list
            await loadAccounts();

            performanceMonitor.recordMetric("account_deleted", { id });

            return id;
          } catch (error) {
            console.error("Failed to delete account:", error);
            performanceMonitor.recordMetric("account_delete_error", {
              error: error.message,
            });
            throw error;
          }
        });
      },

      // Get account by ID
      getAccountById: id => {
        const { accounts } = get();
        return accounts.find(account => account.id === id);
      },

      // Get accounts by type
      getAccountsByType: type => {
        const { accounts } = get();
        return accounts.filter(account => account.type === type);
      },

      // Get account statistics
      getAccountStats: () => {
        const { accounts } = get();

        const stats = {
          total: accounts.length,
          totalBalance: accounts.reduce(
            (sum, account) => sum + account.balance,
            0
          ),
          byType: {},
          byBalance: {
            positive: accounts.filter(account => account.balance > 0).length,
            negative: accounts.filter(account => account.balance < 0).length,
            zero: accounts.filter(account => account.balance === 0).length,
          },
        };

        // Calculate breakdown by type
        accounts.forEach(account => {
          const type = account.type || "Unknown";
          if (!stats.byType[type]) {
            stats.byType[type] = {
              count: 0,
              totalBalance: 0,
              accounts: [],
            };
          }
          stats.byType[type].count++;
          stats.byType[type].totalBalance += account.balance;
          stats.byType[type].accounts.push(account);
        });

        return stats;
      },

      // Validate account data
      validateAccount: account => {
        const errors = [];

        if (!account.name || account.name.trim().length === 0) {
          errors.push("Account name is required");
        }

        if (account.name && account.name.length > 100) {
          errors.push("Account name must be less than 100 characters");
        }

        if (!account.type) {
          errors.push("Account type is required");
        }

        if (
          !["checking", "savings", "credit", "investment", "loan"].includes(
            account.type
          )
        ) {
          errors.push("Invalid account type");
        }

        if (
          account.initialBalance &&
          typeof account.initialBalance !== "number"
        ) {
          errors.push("Initial balance must be a number");
        }

        if (
          account.initialBalance &&
          (account.initialBalance < -1000000 ||
            account.initialBalance > 1000000)
        ) {
          errors.push(
            "Initial balance must be between -$1,000,000 and $1,000,000"
          );
        }

        return {
          isValid: errors.length === 0,
          errors,
        };
      },

      // Clear all accounts
      clearAllAccounts: async () => {
        return performanceMonitor.measureFunction(
          "clearAllAccounts",
          async () => {
            try {
              await db.accounts.clear();
              set({ accounts: [], selectedAccountId: null });

              performanceMonitor.recordMetric("all_accounts_cleared");
            } catch (error) {
              console.error("Failed to clear accounts:", error);
              performanceMonitor.recordMetric("clear_accounts_error", {
                error: error.message,
              });
              throw error;
            }
          }
        );
      },
    }),
    {
      name: "aura-account-store",
      partialize: state => ({
        selectedAccountId: state.selectedAccountId,
      }),
    }
  )
);

export default useAccountStore;
