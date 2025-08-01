import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Plus, X, ArrowRight } from "lucide-react";
import { processTransactions } from "../utils/transactionProcessor";
import useStore from "../store";

const SmartTransactionReview = ({
  transactions = [],
  onConfirm,
  onCancel,
  onAddAccount,
}) => {
  const { accounts, loadAccounts } = useStore();
  const [processedData, setProcessedData] = useState(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "checking",
    last4Digits: "",
    bankName: "",
  });

  useEffect(() => {
    if (loadAccounts) {
      loadAccounts();
    }
  }, [loadAccounts]);

  useEffect(() => {
    if (transactions.length > 0) {
      const processed = processTransactions(transactions, accounts || []);
      setProcessedData(processed);
    }
  }, [transactions, accounts]);

  const handleSuggestionSelect = (suggestion, selected) => {
    if (selected) {
      setSelectedSuggestions(prev => [...prev, suggestion]);
    } else {
      setSelectedSuggestions(prev =>
        prev.filter(s => s.transaction.id !== suggestion.transaction.id)
      );
    }
  };

  const handleAddAccount = () => {
    if (newAccount.name && newAccount.type) {
      onAddAccount(newAccount);
      setNewAccount({
        name: "",
        type: "checking",
        last4Digits: "",
        bankName: "",
      });
    }
  };

  const handleConfirm = () => {
    const finalTransactions = [
      ...processedData.processed,
      ...selectedSuggestions.map(s => ({
        ...s.transaction,
        accountId: "new", // Will be assigned when account is created
        accountName: s.suggestedAccountName,
      })),
      ...processedData.unmatched,
    ];

    onConfirm(finalTransactions);
  };

  if (!processedData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Smart Transaction Review
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We&apos;ve detected potential duplicate transactions. Please review
          and select which ones to import.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800 dark:text-green-200">
              {processedData.processed.length}
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            Auto-matched
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800 dark:text-blue-200">
              {processedData.suggestions.length}
            </span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Account suggestions
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold text-yellow-800 dark:text-yellow-200">
              {processedData.unmatched.length}
            </span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            Need review
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {processedData.summary.skipped}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            Skipped
          </p>
        </div>
      </div>

      {/* Auto-matched Transactions */}
      {processedData.processed.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Auto-matched Transactions ({processedData.processed.length})
          </h3>
          <div className="space-y-3">
            {processedData.processed.map((transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.description}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {transaction.accountName} • {transaction.category}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${transaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {transaction.amount >= 0 ? "+" : ""}
                    {transaction.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Suggestions */}
      {processedData.suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Account Suggestions ({processedData.suggestions.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We found transactions that might belong to new accounts. Select
            which ones you&apos;d like to create:
          </p>

          <div className="space-y-3">
            {processedData.suggestions.map((suggestion, index) => {
              const isSelected = selectedSuggestions.some(
                s => s.transaction.id === suggestion.transaction.id
              );
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-colors ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e =>
                        handleSuggestionSelect(suggestion, e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {suggestion.transaction.description}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Suggested: {suggestion.suggestedAccountName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Bank: {suggestion.bankInfo.bankName} • Category:{" "}
                        {suggestion.transaction.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${suggestion.transaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {suggestion.transaction.amount >= 0 ? "+" : ""}
                        {suggestion.transaction.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Add Account Form */}
          {selectedSuggestions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Quick Add Account
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Account name"
                  value={newAccount.name}
                  onChange={e =>
                    setNewAccount(prev => ({ ...prev, name: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <select
                  value={newAccount.type}
                  onChange={e =>
                    setNewAccount(prev => ({ ...prev, type: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                </select>
                <input
                  type="text"
                  placeholder="Last 4 digits (optional)"
                  value={newAccount.last4Digits}
                  onChange={e =>
                    setNewAccount(prev => ({
                      ...prev,
                      last4Digits: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  maxLength="4"
                />
              </div>
              <button
                onClick={handleAddAccount}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Account
              </button>
            </div>
          )}
        </div>
      )}

      {/* Unmatched Transactions */}
      {processedData.unmatched.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Transactions Needing Review ({processedData.unmatched.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            These transactions couldn&apos;t be automatically categorized.
            They&apos;ll be added to &quot;Unknown&quot; category.
          </p>
          <div className="space-y-3">
            {processedData.unmatched.map((transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.description}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Category: {transaction.category} • Account: Unknown
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${transaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {transaction.amount >= 0 ? "+" : ""}
                    {transaction.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>
            Import{" "}
            {processedData.processed.length +
              selectedSuggestions.length +
              processedData.unmatched.length}{" "}
            Transactions
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SmartTransactionReview;
