import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Check,
  AlertCircle,
  Building2,
  CreditCard,
  PiggyBank,
} from "lucide-react";
import useStore from "../store";

const AccountAssignmentModal = ({
  isOpen,
  onClose,
  transactions,
  detectedAccountInfo = null,
  onComplete,
}) => {
  const { accounts, addAccount } = useStore();
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    name: "",
    type: "checking",
    balance: 0,
  });

  useEffect(() => {
    if (isOpen && detectedAccountInfo) {
      // Pre-fill new account data if account info was detected
      setNewAccountData({
        name: detectedAccountInfo.name || "",
        type: detectedAccountInfo.type || "checking",
        balance: detectedAccountInfo.balance || 0,
      });
    }
  }, [isOpen, detectedAccountInfo]);

  const handleCreateAccount = async () => {
    try {
      const newAccount = await addAccount(newAccountData);
      setSelectedAccountId(newAccount.id);
      setShowCreateAccount(false);
    } catch (error) {
      // Error creating account
    }
  };

  const handleComplete = () => {
    if (selectedAccountId) {
      // Assign all transactions to the selected account
      const updatedTransactions = transactions.map(transaction => ({
        ...transaction,
        accountId: selectedAccountId,
      }));

      onComplete(updatedTransactions);
      onClose();
    }
  };

  const accountTypeIcons = {
    checking: Building2,
    savings: PiggyBank,
    credit: CreditCard,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Assign Account
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Detected Account Info */}
          {detectedAccountInfo && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Account Detected
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    We found account information in your document. Would you
                    like to create a new account or assign to an existing one?
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Summary */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Transactions to Import
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{transactions.length}</span>{" "}
                transactions ready to import
              </p>
            </div>
          </div>

          {/* Account Selection */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Choose Account
            </h3>

            {/* Existing Accounts */}
            {accounts.length > 0 ? (
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Existing Accounts:
                </p>
                {accounts.map(account => {
                  const IconComponent =
                    accountTypeIcons[account.type] || Building2;
                  return (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                        selectedAccountId === account.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedAccountId === account.id
                              ? "bg-blue-100 dark:bg-blue-900/40"
                              : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {account.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {account.type} • {account.balance >= 0 ? "+" : ""}$
                            {account.balance.toFixed(2)}
                          </p>
                        </div>
                        {selectedAccountId === account.id && (
                          <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      No Existing Accounts
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      You don&apos;t have any accounts yet. Let&apos;s create
                      one for your transactions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Create New Account */}
            {!showCreateAccount ? (
              <button
                onClick={() => setShowCreateAccount(true)}
                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <div className="flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Create New Account</span>
                </div>
              </button>
            ) : (
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  New Account Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={newAccountData.name}
                      onChange={e =>
                        setNewAccountData({
                          ...newAccountData,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Bank of America Checking"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account Type
                    </label>
                    <select
                      value={newAccountData.type}
                      onChange={e =>
                        setNewAccountData({
                          ...newAccountData,
                          type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="credit">Credit Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Balance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAccountData.balance}
                      onChange={e =>
                        setNewAccountData({
                          ...newAccountData,
                          balance: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleCreateAccount}
                    disabled={!newAccountData.name.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => setShowCreateAccount(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={!selectedAccountId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Import Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountAssignmentModal;
