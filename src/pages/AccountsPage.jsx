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
  } = useProductionStore();
  const { showSuccess, showError, showWarning } = useNotifications();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [editingBalance, setEditingBalance] = useState(null);
  const [newBalance, setNewBalance] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "checking",
    balance: "",
  });

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

  const handleEditBalance = (accountId, currentBalance) => {
    setEditingBalance(accountId);
    setNewBalance(currentBalance.toString());
  };

  const handleSaveBalance = async accountId => {
    if (!newBalance || isNaN(parseFloat(newBalance))) return;

    try {
      const result = await updateAccount(accountId, {
        balance: parseFloat(newBalance),
      });

      if (result.success) {
        showSuccess(result.message || "Account balance updated successfully");
        setEditingBalance(null);
        setNewBalance("");
      } else {
        showError(result.message || "Failed to update account balance");
      }
    } catch (error) {
      showError(error.message || "Failed to update account balance");
    }
  };

  const handleCancelEdit = () => {
    setEditingBalance(null);
    setNewBalance("");
  };

  const handleDeleteAccount = account => {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async (deleteTransactions = false) => {
    if (!accountToDelete) return;

    try {
      const options = deleteTransactions ? { deleteTransactions: true } : {};
      const result = await deleteAccount(accountToDelete.id, options);

      if (result.success) {
        showSuccess(result.message || "Account deleted successfully");
        setShowDeleteConfirm(false);
        setAccountToDelete(null);
      } else {
        showError(result.message || "Failed to delete account");
      }
    } catch (error) {
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
                handleEditBalance(account.id, balance);
              }}
              className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
              title="Edit Balance"
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
              {editingBalance === account.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newBalance}
                    onChange={e => {
                      const value = e.target.value;
                      if (
                        value.includes(".") &&
                        value.split(".")[1]?.length > 2
                      ) {
                        return;
                      }
                      setNewBalance(value);
                    }}
                    className="w-24 px-2 py-1 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={e => {
                      if (e.key === "Enter") {
                        handleSaveBalance(account.id);
                      }
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleSaveBalance(account.id);
                    }}
                    className="p-1 hover:bg-green-500/20 rounded transition-colors text-green-600 dark:text-green-400"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="p-1 hover:bg-gray-500/20 rounded transition-colors text-gray-600 dark:text-gray-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(balance)}
                </p>
              )}
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
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 5);

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
                            {new Date(transaction.date).toLocaleDateString()}
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
                  handleEditBalance(account.id, balance);
                }}
                className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
                title="Edit Balance"
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
              {editingBalance === account.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newBalance}
                    onChange={e => {
                      const value = e.target.value;
                      if (
                        value.includes(".") &&
                        value.split(".")[1]?.length > 2
                      ) {
                        return;
                      }
                      setNewBalance(value);
                    }}
                    className="w-32 px-3 py-2 text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={e => {
                      if (e.key === "Enter") {
                        handleSaveBalance(account.id);
                      }
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleSaveBalance(account.id);
                    }}
                    className="p-1.5 hover:bg-green-500/20 rounded transition-colors text-green-600 dark:text-green-400"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="p-1.5 hover:bg-gray-500/20 rounded transition-colors text-gray-600 dark:text-gray-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(balance)}
                  </p>
                </div>
              )}
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
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 8);

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
                            {new Date(transaction.date).toLocaleDateString()} •{" "}
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

      {/* Accounts Grid */}
      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
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
