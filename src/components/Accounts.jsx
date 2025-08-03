import React, { useState } from "react";
import {
  CreditCard,
  Wallet,
  PiggyBank,
  Plus,
  Trash2,
  X,
  Edit3,
  Save,
  X as CloseIcon,
  Eye,
  EyeOff,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import useStore from "../store";

const Accounts = () => {
  const {
    accounts,
    addAccount,
    deleteAccount,
    getAccountBalance,
    updateAccountBalance,
    getTransactionsByAccount,
  } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "checking",
    balance: 0,
  });
  const [editingBalance, setEditingBalance] = useState(null);
  const [newBalance, setNewBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateAccountStats = accountId => {
    const transactions = getTransactionsByAccount(accountId);
    const recentTransactions = transactions.slice(0, 30); // Last 30 days

    const income = recentTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = recentTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netFlow = income - expenses;

    return {
      income,
      expenses,
      netFlow,
      transactionCount: recentTransactions.length,
    };
  };

  const handleAddAccount = async () => {
    if (!newAccount.name.trim()) {
      alert("Please enter an account name");
      return;
    }

    if (isNaN(parseFloat(newAccount.balance))) {
      alert("Please enter a valid initial balance");
      return;
    }

    setIsLoading(true);
    try {
      await addAccount({
        ...newAccount,
        name: newAccount.name.trim(),
        balance: parseFloat(newAccount.balance) || 0,
      });
      setNewAccount({ name: "", type: "checking", balance: 0 });
      setShowAddModal(false);
    } catch (error) {
      alert("Error adding account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = account => {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;

    setIsLoading(true);
    try {
      await deleteAccount(accountToDelete.id);
      setShowDeleteConfirm(false);
      setAccountToDelete(null);
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBalance = (accountId, currentBalance) => {
    setEditingBalance(accountId);
    setNewBalance(currentBalance.toString());
  };

  const handleSaveBalance = async accountId => {
    try {
      const balance = parseFloat(newBalance);
      if (isNaN(balance)) {
        alert("Please enter a valid balance amount");
        return;
      }

      // Round to 2 decimal places
      const roundedBalance = Math.round(balance * 100) / 100;

      await updateAccountBalance(accountId, roundedBalance);
      setEditingBalance(null);
      setNewBalance("");
    } catch (error) {
      alert("Error updating balance. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingBalance(null);
    setNewBalance("");
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Accounts
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
            title="Add Account"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {accounts.map(account => {
            const balance = getAccountBalance(account.id);
            const stats = calculateAccountStats(account.id);

            return (
              <div
                key={account.id}
                className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${getAccountTypeBgColor(
                  account.type
                )} border-gray-200 dark:border-gray-600`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm ${getAccountTypeColor(account.type)}`}
                    >
                      {getAccountIcon(account.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-900 dark:text-white font-medium truncate text-sm sm:text-base">
                        {account.name}
                      </p>
                      <p
                        className={`text-xs sm:text-sm capitalize truncate ${getAccountTypeColor(account.type)}`}
                      >
                        {account.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
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
                          className="w-20 sm:w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          onKeyPress={e => {
                            if (e.key === "Enter") {
                              handleSaveBalance(account.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleSaveBalance(account.id)}
                          className="p-1 hover:bg-green-500/20 rounded transition-colors text-green-600 dark:text-green-400"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 hover:bg-gray-500/20 rounded transition-colors text-gray-600 dark:text-gray-400"
                        >
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-primary font-semibold text-sm sm:text-base">
                          {formatCurrency(balance)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <BarChart3 className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {stats.transactionCount}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleEditBalance(account.id, balance)}
                      className="p-1 hover:bg-blue-500/20 rounded transition-colors text-blue-600 dark:text-blue-400"
                      title="Edit Balance"
                    >
                      <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteAccount(account)}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-600 dark:text-red-400"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">
                      Income
                    </p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(stats.income)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">
                      Expenses
                    </p>
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(stats.expenses)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Net</p>
                    <p
                      className={`font-semibold ${
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
            );
          })}
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-6">
            <Wallet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No accounts yet
            </p>
          </div>
        )}
      </div>

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
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={e =>
                    setNewAccount(prev => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="e.g., Chase Checking"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Type
                </label>
                <select
                  value={newAccount.type}
                  onChange={e =>
                    setNewAccount(prev => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAccount.balance}
                  onChange={e => {
                    const value = e.target.value;
                    if (
                      value.includes(".") &&
                      value.split(".")[1]?.length > 2
                    ) {
                      return;
                    }
                    setNewAccount(prev => ({ ...prev, balance: value }));
                  }}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAccount}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Adding..." : "Add Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && accountToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Account
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{accountToDelete.name}"? This
              will also delete all associated transactions and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Accounts;
