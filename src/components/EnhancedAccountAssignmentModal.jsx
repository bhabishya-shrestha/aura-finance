import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Check,
  AlertCircle,
  Building2,
  CreditCard,
  PiggyBank,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from "lucide-react";
import useStore from "../store";

const EnhancedAccountAssignmentModal = ({
  isOpen,
  onClose,
  transactions,
  accounts = [],
  detectedAccountInfo = null,
  onComplete,
}) => {
  const { addAccount } = useStore();
  const [selectedAccounts, setSelectedAccounts] = useState({});
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    name: "",
    type: "checking",
    balance: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [expandedTransactions, setExpandedTransactions] = useState(new Set());

  // Initialize selected accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialSelection = {};
      transactions.forEach(transaction => {
        initialSelection[transaction.id] = transaction.accountId || null;
      });
      setSelectedAccounts(initialSelection);

      // Pre-fill new account data if account info was detected
      if (detectedAccountInfo) {
        setNewAccountData({
          name: detectedAccountInfo.name || "",
          type: detectedAccountInfo.type || "checking",
          balance: detectedAccountInfo.balance || 0,
        });
      }
    }
  }, [isOpen, transactions, detectedAccountInfo]);

  const suggestAccountForTransaction = (transaction, accounts) => {
    const description = transaction.description?.toLowerCase() || "";

    // Simple heuristic: look for account names in transaction description
    if (!accounts || !Array.isArray(accounts)) {
      return null;
    }

    for (const account of accounts) {
      const accountName = account.name.toLowerCase();
      if (
        description.includes(accountName) ||
        description.includes(account.type) ||
        (account.name.includes("Bank") && description.includes("bank"))
      ) {
        return account;
      }
    }

    return null;
  };

  // Filter accounts based on search and type
  const filteredAccounts = useMemo(() => {
    if (!accounts || !Array.isArray(accounts)) {
      return [];
    }
    return accounts.filter(account => {
      const matchesSearch = account.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || account.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [accounts, searchTerm, filterType]);

  // Group transactions by suggested account
  const groupedTransactions = useMemo(() => {
    const groups = {};

    transactions.forEach(transaction => {
      // Try to suggest account based on transaction description
      const suggestedAccount = suggestAccountForTransaction(
        transaction,
        accounts
      );
      const key = suggestedAccount ? suggestedAccount.id : "uncategorized";

      if (!groups[key]) {
        groups[key] = {
          account: suggestedAccount,
          transactions: [],
        };
      }
      groups[key].transactions.push(transaction);
    });

    return groups;
  }, [transactions, accounts]);

  const handleCreateAccount = async () => {
    try {
      const newAccount = await addAccount(newAccountData);

      // Assign all unassigned transactions to the new account
      const updatedSelection = { ...selectedAccounts };
      transactions.forEach(transaction => {
        if (!selectedAccounts[transaction.id]) {
          updatedSelection[transaction.id] = newAccount.id;
        }
      });
      setSelectedAccounts(updatedSelection);

      setShowCreateAccount(false);
    } catch (error) {
      console.error("Error creating account:", error);
    }
  };

  const handleComplete = () => {
    // Check if all transactions have been assigned
    const unassignedTransactions = transactions.filter(
      t => !selectedAccounts[t.id]
    );

    if (unassignedTransactions.length > 0) {
      alert(
        `Please assign all ${unassignedTransactions.length} remaining transactions to accounts.`
      );
      return;
    }

    // Update transactions with selected accounts
    const updatedTransactions = transactions.map(transaction => ({
      ...transaction,
      accountId: selectedAccounts[transaction.id],
    }));

    onComplete(updatedTransactions);
    onClose();
  };

  const toggleTransactionExpansion = transactionId => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedTransactions(newExpanded);
  };

  const assignGroupToAccount = accountId => {
    const updatedSelection = { ...selectedAccounts };
    transactions.forEach(transaction => {
      if (!selectedAccounts[transaction.id]) {
        updatedSelection[transaction.id] = accountId;
      }
    });
    setSelectedAccounts(updatedSelection);
  };

  const accountTypeIcons = {
    checking: Building2,
    savings: PiggyBank,
    credit: CreditCard,
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (!isOpen) return null;

  const assignedCount = Object.values(selectedAccounts).filter(
    id => id !== null
  ).length;
  const totalCount = transactions.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assign Transactions to Accounts
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {assignedCount} of {totalCount} transactions assigned
              </p>
            </div>
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
                    We found account information in your document. You can
                    create a new account or assign to existing ones.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Account Selection */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Available Accounts
              </h3>

              {/* Search and Filter */}
              <div className="mb-4 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>

              {/* Existing Accounts */}
              {filteredAccounts.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {filteredAccounts.map(account => {
                    const IconComponent =
                      accountTypeIcons[account.type] || Building2;
                    return (
                      <button
                        key={account.id}
                        onClick={() => assignGroupToAccount(account.id)}
                        className="w-full p-3 rounded-lg border transition-all duration-200 text-left hover:border-blue-300 dark:hover:border-blue-600 border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                            <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {account.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {account.type} • {account.balance >= 0 ? "+" : ""}
                              {formatCurrency(account.balance)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    No accounts found matching your search.
                  </p>
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

            {/* Right Column - Transaction Assignment */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Transactions to Import
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(groupedTransactions).map(([groupId, group]) => (
                  <div
                    key={groupId}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                  >
                    {/* Group Header */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {group.account
                              ? group.account.name
                              : "Uncategorized"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {group.transactions.length} transaction
                            {group.transactions.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        {group.account && (
                          <button
                            onClick={() =>
                              assignGroupToAccount(group.account.id)
                            }
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Assign All
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Transactions in Group */}
                    <div className="divide-y divide-gray-200 dark:divide-gray-600">
                      {group.transactions.map(transaction => (
                        <div key={transaction.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {transaction.description}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(
                                  transaction.date
                                ).toLocaleDateString()}{" "}
                                • {formatCurrency(transaction.amount)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <select
                                value={selectedAccounts[transaction.id] || ""}
                                onChange={e =>
                                  setSelectedAccounts({
                                    ...selectedAccounts,
                                    [transaction.id]: e.target.value || null,
                                  })
                                }
                                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select Account</option>
                                {accounts.map(account => (
                                  <option key={account.id} value={account.id}>
                                    {account.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() =>
                                  toggleTransactionExpansion(transaction.id)
                                }
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                              >
                                {expandedTransactions.has(transaction.id) ? (
                                  <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Transaction Details */}
                          {expandedTransactions.has(transaction.id) && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">
                                    Category
                                  </p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {transaction.category || "Uncategorized"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">
                                    Type
                                  </p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {transaction.amount > 0
                                      ? "Income"
                                      : "Expense"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={assignedCount < totalCount}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Import {assignedCount} Transaction{assignedCount !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAccountAssignmentModal;
