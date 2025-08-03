import React, { useState, useEffect } from "react";
import {
  Plus,
  CreditCard,
  Wallet,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  X,
  Edit3,
  Save,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import useStore from "../store";

const AccountsPage = () => {
  const {
    accounts,
    getAccountBalance,
    getTransactionsByAccount,
    addAccount,
    updateAccountBalance,
    deleteAccount,
  } = useStore();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "checking",
    balance: "",
  });
  const [editingBalance, setEditingBalance] = useState(null);
  const [newBalance, setNewBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getAccountIcon = type => {
    switch (type) {
      case "credit":
        return <CreditCard className="w-6 h-6" />;
      case "checking":
        return <Wallet className="w-6 h-6" />;
      case "savings":
        return <PiggyBank className="w-6 h-6" />;
      default:
        return <Wallet className="w-6 h-6" />;
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

  const getAccountTransactions = accountId => {
    return getTransactionsByAccount(accountId).slice(0, 5); // Last 5 transactions
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

  const handleAddAccount = async e => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.balance) {
      return;
    }

    setIsLoading(true);
    try {
      await addAccount({
        name: formData.name.trim(),
        type: formData.type,
        balance: parseFloat(formData.balance),
      });

      // Reset form and close modal
      setFormData({
        name: "",
        type: "checking",
        balance: "",
      });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    if (name === "balance") {
      // Limit to 2 decimal places
      if (value.includes('.') && value.split('.')[1]?.length > 2) {
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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

  const handleDeleteAccount = (account) => {
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

  const AccountCard = ({ account }) => {
    const balance = getAccountBalance(account.id);
    const stats = calculateAccountStats(account.id);
    const transactions = getAccountTransactions(account.id);
    const isSelected = selectedAccount?.id === account.id;

    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      }`}>
        {/* Header */}
        <div className={`p-6 ${getAccountTypeBgColor(account.type)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg bg-white dark:bg-gray-700 shadow-sm ${getAccountTypeColor(account.type)}`}>
                {getAccountIcon(account.type)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {account.name}
                </h3>
                <p className={`text-sm font-medium capitalize ${getAccountTypeColor(account.type)}`}>
                  {account.type} Account
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedAccount(isSelected ? null : account)}
                className={`p-2 rounded-lg transition-colors ${
                  isSelected 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={isSelected ? "Hide details" : "Show details"}
              >
                {isSelected ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Balance Section */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Balance</p>
              {editingBalance === account.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newBalance}
                    onChange={e => {
                      const value = e.target.value;
                      if (value.includes('.') && value.split('.')[1]?.length > 2) {
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
                  />
                  <button
                    onClick={() => handleSaveBalance(account.id)}
                    className="p-1.5 hover:bg-green-500/20 rounded transition-colors text-green-600 dark:text-green-400"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1.5 hover:bg-gray-500/20 rounded transition-colors text-gray-600 dark:text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(balance)}
                  </p>
                  <button
                    onClick={() => handleEditBalance(account.id, balance)}
                    className="p-1.5 hover:bg-blue-500/20 rounded transition-colors text-blue-600 dark:text-blue-400"
                    title="Edit Balance"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Income (30d)</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(stats.income)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expenses (30d)</p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(stats.expenses)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Net Flow</p>
              <p className={`text-sm font-semibold ${
                stats.netFlow >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
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
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          transaction.amount > 0 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.amount > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm font-semibold ${
                        transaction.amount > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No recent transactions</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Last updated: {new Date(account.lastBalanceUpdate || Date.now()).toLocaleDateString()}</span>
            </div>
            <button
              onClick={() => handleDeleteAccount(account)}
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
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-2">
            Accounts
          </h1>
          <p className="text-muted text-sm sm:text-base lg:text-lg">
            Manage your financial accounts and track their performance
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-glass-primary px-4 sm:px-6 py-3 flex items-center justify-center gap-2 hover:scale-105 transition-all duration-200 group text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Add Account</span>
        </button>
      </div>

      {/* Accounts Grid */}
      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {accounts.map(account => (
            <AccountCard key={account.id} account={account} />
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
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="e.g., Chase Checking"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
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
                  name="balance"
                  step="0.01"
                  min="0"
                  value={formData.balance}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Adding..." : "Add Account"}
                </button>
              </div>
            </form>
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
              Are you sure you want to delete "{accountToDelete.name}"? This will also delete all associated transactions and cannot be undone.
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
    </div>
  );
};

export default AccountsPage;
