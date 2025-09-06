import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Wallet,
  PiggyBank,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  DollarSign,
} from "lucide-react";
import useProductionStore from "../store/productionStore";
import { useNotifications } from "../contexts/NotificationContext";

const AccountsPage = () => {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccountBalance,
    calculateAccountStats,
    getTransactionsByAccount,
    isLoading,
    initialize,
    isInitialized,
    forceRefreshAccounts,
    removeAccountFromState,
  } = useProductionStore();
  const { showSuccess, showError, showWarning } = useNotifications();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "checking",
    balance: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    type: "checking",
    balance: "",
  });

  // Normalize various date shapes to milliseconds since epoch
  const toMs = value => {
    if (!value) return 0;
    try {
      if (
        typeof value === "object" &&
        value !== null &&
        ("seconds" in value || "nanoseconds" in value)
      ) {
        const seconds = Number(value.seconds || 0);
        const nanos = Number(value.nanoseconds || 0);
        return seconds * 1000 + Math.floor(nanos / 1e6);
      }
      if (value instanceof Date && !isNaN(value)) {
        return value.getTime();
      }
      const parsed = new Date(value);
      const ms = parsed.getTime();
      return isNaN(ms) ? 0 : ms;
    } catch (_) {
      return 0;
    }
  };

  const getTransactionMs = t => {
    // Prefer most recent activity: updatedAt -> createdAt -> date
    return toMs(t?.updatedAt) || toMs(t?.createdAt) || toMs(t?.date) || 0;
  };

  // Initialize store if needed
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  const getAccountIcon = type => {
    switch (type) {
      case "credit":
        return <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "checking":
        return <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "savings":
        return <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5" />;
      default:
        return <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getAccountTypeColor = type => {
    switch (type) {
      case "credit":
        return "text-purple-600 dark:text-purple-400";
      case "checking":
        return "text-blue-600 dark:text-blue-400";
      case "savings":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getAccountTypeBgColor = type => {
    switch (type) {
      case "credit":
        return "bg-purple-50 dark:bg-purple-900/20";
      case "checking":
        return "bg-blue-50 dark:bg-blue-900/20";
      case "savings":
        return "bg-green-50 dark:bg-green-900/20";
      default:
        return "bg-gray-50 dark:bg-gray-700";
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateUTC = dateValue =>
    new Date(dateValue).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });

  const handleAddAccount = async () => {
    if (!formData.name || !formData.balance) return;

    try {
      const result = await addAccount({
        name: formData.name,
        type: formData.type,
        balance: parseFloat(formData.balance),
      });

      if (result.success) {
        showSuccess(result.message || "Account added successfully");
        setFormData({ name: "", type: "checking", balance: "" });
        setShowAddModal(false);
      } else {
        showError(result.message || "Failed to add account");
      }
    } catch (error) {
      showError(error.message || "Failed to add account");
    }
  };

  const handleEditAccount = account => {
    setAccountToEdit(account);
    setEditFormData({
      name: account.name,
      type: account.type,
      balance: getAccountBalance(account.id).toString(),
    });
    setShowEditModal(true);
  };

  const handleSaveAccountEdit = async () => {
    if (!accountToEdit || !editFormData.name || !editFormData.balance) return;

    try {
      const result = await updateAccount(accountToEdit.id, {
        name: editFormData.name,
        type: editFormData.type,
        balance: parseFloat(editFormData.balance),
      });

      if (result.success) {
        showSuccess(result.message || "Account updated successfully");
        setShowEditModal(false);
        setAccountToEdit(null);
        setEditFormData({ name: "", type: "checking", balance: "" });
      } else {
        showError(result.message || "Failed to update account");
      }
    } catch (error) {
      showError(error.message || "Failed to update account");
    }
  };

  const handleCancelAccountEdit = () => {
    setShowEditModal(false);
    setAccountToEdit(null);
    setEditFormData({ name: "", type: "checking", balance: "" });
  };

  const handleDeleteAccount = account => {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async (deleteTransactions = false) => {
    if (!accountToDelete) return;

    try {
      const options = deleteTransactions ? { deleteTransactions: true } : {};
      console.log("🗑️ Attempting to delete account with options:", options);

      const result = await deleteAccount(accountToDelete.id, options);

      if (result.success) {
        console.log("✅ Account deletion succeeded:", result);
        showSuccess(result.message || "Account deleted successfully");
        setShowDeleteConfirm(false);
        setAccountToDelete(null);

        // Force refresh accounts to ensure UI is in sync
        console.log("🔄 Force refreshing accounts after deletion...");
        try {
          await forceRefreshAccounts();
          console.log("✅ Accounts refreshed successfully");
        } catch (refreshError) {
          console.warn("⚠️ Failed to refresh accounts:", refreshError);
          // Fallback: manually remove from state
          console.log("🔄 Using fallback: manually removing from state");
          removeAccountFromState(accountToDelete.id);
        }
      } else {
        console.error("❌ Account deletion failed:", result);
        showError(result.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("❌ Account deletion error:", error);
      if (error.message.includes("existing transactions")) {
        // Show a more helpful error with options
        showWarning(
          `${error.message}\n\nYou can:\n1. Delete the account and all its transactions\n2. Reassign transactions to another account first`
        );
      } else {
        showError(error.message || "Failed to delete account");
      }
      setShowDeleteConfirm(false);
      setAccountToDelete(null);
    }
  };

  // Mobile Account Card - Simplified for mobile
  const MobileAccountCard = ({ account }) => {
    const balance = getAccountBalance(account.id);
    const stats = calculateAccountStats(account.id);
    const isSelected = selectedAccount?.id === account.id;

    return (
      <div
        onClick={() => setSelectedAccount(isSelected ? null : account)}
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 cursor-pointer ${
          isSelected
            ? "ring-2 ring-blue-500 shadow-lg"
            : "hover:shadow-md active:scale-95"
        }`}
      >
        {/* Header */}
        <div className={`p-4 ${getAccountTypeBgColor(account.type)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm ${getAccountTypeColor(account.type)}`}
              >
                {getAccountIcon(account.type)}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {account.name}
                </h3>
                <p
                  className={`text-xs font-medium capitalize ${getAccountTypeColor(account.type)}`}
                >
                  {account.type} Account
                </p>
              </div>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                handleEditAccount(account);
              }}
              className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
              title="Edit Account"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>

          {/* Balance Section */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Current Balance
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <BarChart3 className="w-3 h-3" />
                <span>{stats.transactionCount} transactions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Income
              </p>
              <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(stats.income)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Expenses
              </p>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(stats.expenses)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Net Flow
              </p>
              <p
                className={`text-xs font-semibold ${
                  stats.netFlow >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(stats.netFlow)}
              </p>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isSelected && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Recent Transactions
              </h4>
              {(() => {
                const recentTransactions = getTransactionsByAccount(account.id)
                  .sort((a, b) => getTransactionMs(b) - getTransactionMs(a))
                  .slice(0, 3);

                if (recentTransactions.length === 0) {
                  return (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <DollarSign className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">No transactions yet</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {recentTransactions.map(transaction => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-white truncate">
                            {transaction.description || "No description"}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">
                            {formatDateUTC(transaction.date)}
                          </p>
                        </div>
                        <span
                          className={`ml-2 font-medium ${
                            transaction.amount > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <DollarSign className="w-3 h-3" />
              <span>
                Updated:{" "}
                {/* Assuming account has a lastBalanceUpdate property */}
                {/* In a real app, this would be fetched from the store */}
                {/* For now, we'll just show a placeholder */}
                {new Date(Date.now()).toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                handleDeleteAccount(account);
              }}
              className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-600 dark:text-red-400"
              title="Delete Account"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Desktop Account Card - Enhanced for better information hierarchy
  const DesktopAccountCard = ({ account }) => {
    const balance = getAccountBalance(account.id);
    const stats = calculateAccountStats(account.id);
    const isSelected = selectedAccount?.id === account.id;

    return (
      <div
        onClick={() => setSelectedAccount(isSelected ? null : account)}
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 cursor-pointer ${
          isSelected ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
        }`}
      >
        {/* Header */}
        <div className={`p-6 ${getAccountTypeBgColor(account.type)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-lg bg-white dark:bg-gray-700 shadow-sm ${getAccountTypeColor(account.type)}`}
              >
                {getAccountIcon(account.type)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {account.name}
                </h3>
                <p
                  className={`text-sm font-medium capitalize ${getAccountTypeColor(account.type)}`}
                >
                  {account.type} Account
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleEditAccount(account);
                }}
                className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
                title="Edit Account"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Balance Section */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Current Balance
              </p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <BarChart3 className="w-4 h-4" />
                <span>{stats.transactionCount} transactions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Income (30d)
              </p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(stats.income)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Expenses (30d)
              </p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(stats.expenses)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Net Flow
              </p>
              <p
                className={`text-sm font-semibold ${
                  stats.netFlow >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(stats.netFlow)}
              </p>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isSelected && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Transactions
              </h4>
              {(() => {
                const recentTransactions = getTransactionsByAccount(account.id)
                  .sort((a, b) => getTransactionMs(b) - getTransactionMs(a))
                  .slice(0, 3);

                if (recentTransactions.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No transactions yet</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {recentTransactions.map(transaction => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {transaction.description || "No description"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateUTC(transaction.date)} •{" "}
                            {transaction.category || "Uncategorized"}
                          </p>
                        </div>
                        <span
                          className={`ml-3 text-sm font-semibold ${
                            transaction.amount > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <DollarSign className="w-4 h-4" />
              <span>
                Last updated:{" "}
                {/* Assuming account has a lastBalanceUpdate property */}
                {/* In a real app, this would be fetched from the store */}
                {/* For now, we'll just show a placeholder */}
                {new Date(Date.now()).toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                handleDeleteAccount(account);
              }}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
              title="Delete Account"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* Mobile Add Account Button */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-4 flex items-center justify-center gap-3 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 active:scale-95 shadow-lg"
        >
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-lg">Add New Account</p>
            <p className="text-sm text-blue-100">
              Connect your bank or credit card
            </p>
          </div>
        </button>
      </div>

      {/* Desktop Add Account Button - Only show when accounts exist */}
      {accounts.length > 0 && (
        <div className="hidden lg:flex justify-end mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-6 py-3 flex items-center gap-3 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 active:scale-95 shadow-lg"
          >
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Add Account</span>
          </button>
        </div>
      )}

      {/* Accounts Grid */}
      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 lg:gap-6">
          {accounts.map(account => (
            <div key={account.id} className="lg:hidden">
              <MobileAccountCard account={account} />
            </div>
          ))}
          {accounts.map(account => (
            <div key={account.id} className="hidden lg:block">
              <DesktopAccountCard account={account} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No accounts yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get started by adding your first financial account
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-glass-primary px-6 py-3 flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add Your First Account
          </button>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New Account
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-500 transform rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Chase Checking"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Type
                </label>
                <select
                  value={formData.type}
                  onChange={e =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={e =>
                    setFormData({ ...formData, balance: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                disabled={!formData.name || !formData.balance || isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Adding..." : "Add Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Account
              </h2>
              <button
                onClick={handleCancelAccountEdit}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-500 transform rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={e =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  placeholder="e.g., Chase Checking"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Type
                </label>
                <select
                  value={editFormData.type}
                  onChange={e =>
                    setEditFormData({ ...editFormData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.balance}
                  onChange={e =>
                    setEditFormData({
                      ...editFormData,
                      balance: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelAccountEdit}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAccountEdit}
                disabled={
                  !editFormData.name || !editFormData.balance || isLoading
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Delete Account
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete &quot;{accountToDelete?.name}
              &quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
