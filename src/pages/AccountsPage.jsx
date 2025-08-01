import React, { useState } from "react";
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
} from "lucide-react";
import useStore from "../store";

const AccountsPage = () => {
  const { accounts, getAccountBalance, getTransactionsByAccount, addAccount } =
    useStore();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "checking",
    balance: "",
  });

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
        return "text-purple-400";
      case "checking":
        return "text-blue-400";
      case "savings":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const getAccountTransactions = accountId => {
    return getTransactionsByAccount(accountId).slice(0, 5); // Last 5 transactions
  };

  const handleAddAccount = async e => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.balance) {
      return;
    }

    try {
      await addAccount({
        name: formData.name.trim(),
        type: formData.type,
        balance: parseFloat(formData.balance),
        id: Date.now(),
      });

      // Reset form and close modal
      setFormData({
        name: "",
        type: "checking",
        balance: "",
      });
      setShowAddModal(false);
    } catch (error) {
      // Error handled silently - user can try again
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text">
            Accounts
          </h1>
          <p className="text-muted-gray mt-1 text-sm lg:text-base">
            Manage your financial accounts
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="glass-card px-4 sm:px-6 py-3 flex items-center gap-2 hover:bg-white/20 transition-all duration-200 group w-full lg:w-auto justify-center"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Add Account</span>
        </button>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Add New Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter account name"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>

              {/* Initial Balance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Balance
                </label>
                <input
                  type="number"
                  name="balance"
                  value={formData.balance}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm shadow-sm"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content - Improved for portrait desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Accounts List */}
        <div className="xl:col-span-1">
          <div className="glass-card p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-soft-white mb-4 lg:mb-6">
              Your Accounts
            </h2>
            <div className="space-y-3 lg:space-y-4">
              {accounts.map(account => {
                const balance = getAccountBalance(account.id);
                const isSelected = selectedAccount?.id === account.id;

                return (
                  <div
                    key={account.id}
                    onClick={() => setSelectedAccount(account)}
                    className={`p-3 sm:p-4 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white/15 border-white/30 shadow-lg"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`${getAccountTypeColor(account.type)}`}>
                          {getAccountIcon(account.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-soft-white font-medium truncate">
                            {account.name}
                          </p>
                          <p className="text-muted-gray text-sm capitalize">
                            {account.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`font-semibold text-sm lg:text-base ${
                            balance >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {formatCurrency(balance)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {balance >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-400" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="xl:col-span-2">
          {selectedAccount ? (
            <div className="space-y-6 lg:space-y-8">
              {/* Account Overview */}
              <div className="glass-card p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 lg:mb-8">
                  <div className="flex items-center gap-3">
                    <div
                      className={`${getAccountTypeColor(selectedAccount.type)}`}
                    >
                      {getAccountIcon(selectedAccount.type)}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-soft-white">
                        {selectedAccount.name}
                      </h2>
                      <p className="text-muted-gray capitalize text-sm lg:text-base">
                        {selectedAccount.type} Account
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text">
                      {formatCurrency(getAccountBalance(selectedAccount.id))}
                    </div>
                    <p className="text-muted-gray text-sm">Current Balance</p>
                  </div>
                </div>

                {/* Account Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                  <div className="text-center p-4 lg:p-6 bg-white/5 rounded-lg">
                    <DollarSign className="w-6 h-6 lg:w-8 lg:h-8 mx-auto text-teal mb-2" />
                    <div className="text-lg lg:text-xl font-bold text-soft-white">
                      {getTransactionsByAccount(selectedAccount.id).length}
                    </div>
                    <div className="text-muted-gray text-sm">
                      Total Transactions
                    </div>
                  </div>
                  <div className="text-center p-4 lg:p-6 bg-white/5 rounded-lg">
                    <Calendar className="w-6 h-6 lg:w-8 lg:h-8 mx-auto text-purple-400 mb-2" />
                    <div className="text-lg lg:text-xl font-bold text-soft-white">
                      {
                        getTransactionsByAccount(selectedAccount.id).filter(
                          t =>
                            new Date(t.date).getMonth() ===
                            new Date().getMonth()
                        ).length
                      }
                    </div>
                    <div className="text-muted-gray text-sm">This Month</div>
                  </div>
                  <div className="text-center p-4 lg:p-6 bg-white/5 rounded-lg">
                    <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 mx-auto text-green-400 mb-2" />
                    <div className="text-lg lg:text-xl font-bold text-soft-white">
                      {formatCurrency(
                        getTransactionsByAccount(selectedAccount.id)
                          .filter(t => t.amount > 0)
                          .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </div>
                    <div className="text-muted-gray text-sm">Total Income</div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="glass-card p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-soft-white mb-4 lg:mb-6">
                  Recent Transactions
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  {getAccountTransactions(selectedAccount.id).length > 0 ? (
                    getAccountTransactions(selectedAccount.id).map(
                      transaction => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 lg:p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-muted-gray text-sm flex-shrink-0">
                              <Calendar className="w-4 h-4" />
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-soft-white font-medium truncate">
                                {transaction.description}
                              </p>
                              <p className="text-muted-gray text-sm">
                                {transaction.category}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p
                              className={`font-semibold text-sm lg:text-base ${
                                transaction.amount >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {transaction.amount >= 0 ? "+" : ""}
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-8 lg:py-12 text-muted-gray">
                      <DollarSign className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-3 opacity-50" />
                      <p className="text-lg lg:text-xl">No transactions yet</p>
                      <p className="text-sm lg:text-base">
                        Import a statement to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 lg:p-12 text-center">
              <Wallet className="w-16 h-16 lg:w-20 lg:h-20 mx-auto text-muted-gray mb-4 lg:mb-6" />
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-soft-white mb-2 lg:mb-4">
                Select an Account
              </h3>
              <p className="text-muted-gray text-sm lg:text-base">
                Choose an account from the list to view details and transactions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountsPage;
