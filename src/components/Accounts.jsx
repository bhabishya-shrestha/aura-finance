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
} from "lucide-react";
import useStore from "../store";

const Accounts = () => {
  const {
    accounts,
    addAccount,
    deleteAccount,
    getAccountBalance,
    updateAccountBalance,
  } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "checking",
    balance: 0,
  });
  const [editingBalance, setEditingBalance] = useState(null);
  const [newBalance, setNewBalance] = useState("");

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

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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
      if (import.meta.env.DEV) {
        console.error("Error adding account:", error);
      }
    }
  };

  const handleDeleteAccount = async (accountId, accountName) => {
    // Note: In a production app, this should use a proper confirmation dialog
    // For now, we'll keep the confirm but add proper error handling
    if (
      window.confirm(
        `Are you sure you want to delete "${accountName}"? This will also delete all associated transactions.`
      )
    ) {
      try {
        await deleteAccount(accountId);
      } catch (error) {
        // Error handling - in production, this would use a proper error notification system
        if (import.meta.env.DEV) {
          // Error deleting account
        }
      }
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

      await updateAccountBalance(accountId, balance);
      setEditingBalance(null);
      setNewBalance("");
    } catch (error) {
      alert("Error updating balance. Please try again.");
      if (import.meta.env.DEV) {
        console.error("Error updating balance:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingBalance(null);
    setNewBalance("");
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-shadow">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Accounts
        </h2>

        <div className="space-y-2 sm:space-y-3">
          {accounts.map(account => {
            const balance = getAccountBalance(account.id);
            return (
              <div
                key={account.id}
                className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="text-blue-600 dark:text-blue-400 flex-shrink-0">
                    {getAccountIcon(account.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-900 dark:text-white font-medium truncate text-sm sm:text-base">
                      {account.name}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm capitalize truncate">
                      {account.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {editingBalance === account.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={newBalance}
                        onChange={e => setNewBalance(e.target.value)}
                        className="w-20 sm:w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        onKeyPress={e => {
                          if (e.key === "Enter") {
                            handleSaveBalance(account.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleSaveBalance(account.id)}
                        className="p-1 sm:p-1.5 hover:bg-green-500/20 rounded transition-all duration-200 text-green-600 dark:text-green-400"
                      >
                        <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 sm:p-1.5 hover:bg-gray-500/20 rounded transition-all duration-200 text-gray-600 dark:text-gray-400"
                      >
                        <CloseIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="text-primary font-semibold text-sm sm:text-base">
                        {formatCurrency(balance)}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleEditBalance(account.id, balance)}
                    className="p-1 sm:p-1.5 hover:bg-blue-500/20 rounded transition-all duration-200 text-blue-600 dark:text-blue-400"
                    title="Edit Balance"
                  >
                    <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteAccount(account.id, account.name)
                    }
                    className="p-1 sm:p-1.5 hover:bg-apple-red/20 rounded-apple transition-all duration-200 icon-muted hover:icon-error backdrop-blur-apple-sm"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-2 px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2 font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Account
          </button>
        </div>
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

            <form
              onSubmit={e => {
                e.preventDefault();
                handleAddAccount();
              }}
              className="space-y-4"
            >
              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newAccount.name}
                    onChange={e =>
                      setNewAccount({ ...newAccount, name: e.target.value })
                    }
                    placeholder="e.g., Chase Checking"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Type
                </label>
                <div className="relative">
                  <select
                    value={newAccount.type}
                    onChange={e =>
                      setNewAccount({ ...newAccount, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                    required
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                  </select>
                </div>
              </div>

              {/* Initial Balance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Balance
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={newAccount.balance}
                    onChange={e =>
                      setNewAccount({ ...newAccount, balance: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
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
    </>
  );
};

export default Accounts;
