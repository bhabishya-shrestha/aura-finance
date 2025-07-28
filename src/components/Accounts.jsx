import React, { useState } from "react";
import { CreditCard, Wallet, PiggyBank, Plus, Trash2, X } from "lucide-react";
import useStore from "../store";

const Accounts = () => {
  const { accounts, addAccount, deleteAccount, getAccountBalance } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "checking",
    balance: 0,
  });

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
      // Use a more user-friendly approach instead of alert
      setNewAccount({ ...newAccount, name: newAccount.name.trim() });
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
      // Error handling - in production, this would use a proper error notification system
      if (import.meta.env.DEV) {
        // Error adding account
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
                  <div className="text-right">
                    <p className="text-primary font-semibold text-sm sm:text-base">
                      {formatCurrency(balance)}
                    </p>
                  </div>

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

        <div className="mt-4 pt-3 sm:pt-4 border-t border-apple-glass-300/30">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-2 px-3 sm:px-4 bg-apple-glass-200/40 hover:bg-apple-glass-300/50 transition-all duration-200 rounded-apple-lg text-primary text-sm flex items-center justify-center gap-2 backdrop-blur-apple-sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Account
          </button>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-primary">
                Add New Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="icon-muted hover:icon-white transition-all duration-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1 sm:mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={e =>
                    setNewAccount({ ...newAccount, name: e.target.value })
                  }
                  placeholder="e.g., Chase Checking"
                  className="input-glass w-full text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1 sm:mb-2">
                  Account Type
                </label>
                <select
                  value={newAccount.type}
                  onChange={e =>
                    setNewAccount({ ...newAccount, type: e.target.value })
                  }
                  className="input-glass w-full text-sm sm:text-base"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1 sm:mb-2">
                  Initial Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newAccount.balance}
                  onChange={e =>
                    setNewAccount({ ...newAccount, balance: e.target.value })
                  }
                  placeholder="0.00"
                  className="input-glass w-full text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 btn-glass-outlined text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                className="flex-1 btn-glass-primary text-sm sm:text-base"
              >
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Accounts;
