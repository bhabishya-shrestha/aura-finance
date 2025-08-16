/**
 * Unified Store Index
 * Combines all domain-specific stores for backward compatibility
 * This provides a clean migration path from the monolithic store
 */

import useTransactionStore from "./transactionStore";
import useAccountStore from "./accountStore";
import useUserStore from "./userStore";

/**
 * Unified Store Hook
 * Provides access to all stores in a single hook for backward compatibility
 */
const useUnifiedStore = () => {
  const transactionStore = useTransactionStore();
  const accountStore = useAccountStore();
  const userStore = useUserStore();

  return {
    // Transaction-related state and actions
    transactions: transactionStore.transactions,
    parsedTransactions: transactionStore.parsedTransactions,
    transactionFilters: transactionStore.filters,
    transactionSortBy: transactionStore.sortBy,
    transactionPagination: transactionStore.pagination,
    loadTransactions: transactionStore.loadTransactions,
    addTransaction: transactionStore.addTransaction,
    updateTransaction: transactionStore.updateTransaction,
    deleteTransaction: transactionStore.deleteTransaction,
    bulkDeleteTransactions: transactionStore.bulkDeleteTransactions,
    findDuplicates: transactionStore.findDuplicates,
    getTransactionStats: transactionStore.getTransactionStats,
    setTransactionFilters: transactionStore.setFilters,
    setTransactionSortBy: transactionStore.setSortBy,
    setTransactionPagination: transactionStore.setPagination,
    getPaginatedTransactions: transactionStore.getPaginatedTransactions,
    clearAllTransactions: transactionStore.clearAllTransactions,

    // Account-related state and actions
    accounts: accountStore.accounts,
    selectedAccountId: accountStore.selectedAccountId,
    loadAccounts: accountStore.loadAccounts,
    addAccount: accountStore.addAccount,
    updateAccount: accountStore.updateAccount,
    deleteAccount: accountStore.deleteAccount,
    getAccountById: accountStore.getAccountById,
    getAccountsByType: accountStore.getAccountsByType,
    getAccountStats: accountStore.getAccountStats,
    validateAccount: accountStore.validateAccount,
    setSelectedAccount: accountStore.setSelectedAccount,
    clearAllAccounts: accountStore.clearAllAccounts,

    // User-related state and actions
    currentUser: userStore.currentUser,
    userPreferences: userStore.userPreferences,
    notifications: userStore.notifications,
    unreadCount: userStore.unreadCount,
    lastUpdateNotification: userStore.lastUpdateNotification,
    setCurrentUser: userStore.setCurrentUser,
    setUserPreferences: userStore.setUserPreferences,
    updatePreference: userStore.updatePreference,
    addNotification: userStore.addNotification,
    markNotificationAsRead: userStore.markNotificationAsRead,
    markAllNotificationsAsRead: userStore.markAllNotificationsAsRead,
    removeNotification: userStore.removeNotification,
    setUpdateNotification: userStore.setUpdateNotification,
    clearUpdateNotification: userStore.clearUpdateNotification,
    markUpdateNotificationAsRead: userStore.markUpdateNotificationAsRead,
    getUserStats: userStore.getUserStats,
    exportUserData: userStore.exportUserData,
    importUserData: userStore.importUserData,
    clearUserData: userStore.clearUserData,
    validatePreferences: userStore.validatePreferences,
    getNotificationById: userStore.getNotificationById,
    getNotificationsByType: userStore.getNotificationsByType,
    getUnreadNotifications: userStore.getUnreadNotifications,
    getRecentNotifications: userStore.getRecentNotifications,

    // Loading states
    isLoading: transactionStore.isLoading || accountStore.isLoading,

    // Legacy compatibility methods
    setLoading: loading => {
      transactionStore.setLoading(loading);
      accountStore.setLoading(loading);
    },

    setParsedTransactions: transactionStore.setParsedTransactions,

    // Data reset functionality
    resetAllData: async () => {
      try {
        await Promise.all([
          transactionStore.clearAllTransactions(),
          accountStore.clearAllAccounts(),
          userStore.clearUserData(),
        ]);
      } catch (error) {
        console.error("Failed to reset all data:", error);
        throw error;
      }
    },

    // Initialize all stores
    initializeStores: async () => {
      try {
        await Promise.all([
          transactionStore.loadTransactions(),
          accountStore.loadAccounts(),
        ]);
      } catch (error) {
        console.error("Failed to initialize stores:", error);
        throw error;
      }
    },
  };
};

// Export individual stores for direct access
export { useTransactionStore, useAccountStore, useUserStore };

// Export unified store as default for backward compatibility
export default useUnifiedStore;
