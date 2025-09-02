import React, { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  FileText,
  ArrowUpDown,
  Filter,
  SortAsc,
  SortDesc,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import useProductionStore from "../store/productionStore";
import { CATEGORIES } from "../utils/statementParser";

const TransactionsPage = () => {
  const {
    transactions,
    accounts,
    updateTransaction,
    deleteTransaction,
    initialize,
    isInitialized,
  } = useProductionStore();
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [showBulkYearAssignment, setShowBulkYearAssignment] = useState(false);
  const [showBulkCategoryAssignment, setShowBulkCategoryAssignment] =
    useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [editTransactionData, setEditTransactionData] = useState({});

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  useEffect(() => {
    // Deduplicate transactions by ID to prevent React key conflicts
    const uniqueTransactions = transactions.reduce((acc, transaction) => {
      if (!acc.find(t => t.id === transaction.id)) {
        acc.push(transaction);
      }
      return acc;
    }, []);

    // Debug: Log if duplicates were found
    if (
      import.meta.env.DEV &&
      uniqueTransactions.length !== transactions.length
    ) {
      console.warn(
        `Found ${transactions.length - uniqueTransactions.length} duplicate transactions`
      );
      console.warn(
        "Original count:",
        transactions.length,
        "Unique count:",
        uniqueTransactions.length
      );
    }

    let filtered = [...uniqueTransactions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        transaction =>
          transaction.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.category
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.accountName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedFilter === "income") {
      filtered = filtered.filter(transaction => transaction.type === "income");
    } else if (selectedFilter === "expense") {
      filtered = filtered.filter(transaction => transaction.type === "expense");
    }

    // Apply account filter
    if (selectedAccountId && selectedAccountId !== "all") {
      filtered = filtered.filter(
        transaction =>
          transaction.accountId &&
          transaction.accountId.toString() === selectedAccountId.toString()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          // Compare by UTC epoch to avoid timezone day drift
          aValue = aValue.getTime();
          bValue = bValue.getTime();
          break;
        case "amount":
          aValue = Math.abs(a.amount);
          bValue = Math.abs(b.amount);
          break;
        case "description":
          aValue = a.description?.toLowerCase() || "";
          bValue = b.description?.toLowerCase() || "";
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTransactions(filtered);
  }, [
    transactions,
    searchTerm,
    selectedFilter,
    selectedAccountId,
    sortBy,
    sortOrder,
  ]);

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = date => {
    // Render using UTC to avoid off-by-one due to timezone shifts
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(
        new Set(
          Array.isArray(filteredTransactions)
            ? filteredTransactions.map(t => t.id)
            : []
        )
      );
    }
  };

  const handleSelectTransaction = transactionId => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleBulkAccountAssignment = async selectedAccountId => {
    try {
      // Get the account name for the selected account
      const selectedAccount = accounts.find(
        acc => acc.id === selectedAccountId
      );
      const accountName = selectedAccount
        ? selectedAccount.name
        : "Uncategorized Account";

      const updatePromises = Array.from(selectedTransactions).map(
        transactionId => {
          const transaction = transactions.find(t => t.id === transactionId);
          if (transaction) {
            return updateTransaction(transactionId, {
              accountId: selectedAccountId,
              accountName: accountName,
            });
          }
          return Promise.resolve();
        }
      );

      await Promise.all(updatePromises);
      setShowBulkAssignment(false);
      setSelectedTransactions(new Set());
      // Transactions will be updated automatically via real-time listeners
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error in bulk account assignment:", error);
      }
    }
  };

  const handleBulkYearAssignment = async year => {
    try {
      if (import.meta.env.DEV) {
        console.log(
          `Starting bulk year assignment for ${selectedTransactions.size} transactions to year ${year}`
        );
      }

      const updatePromises = Array.from(selectedTransactions).map(
        transactionId => {
          const transaction = transactions.find(t => t.id === transactionId);
          if (transaction) {
            // Create a new date with the selected year, keeping the same month and day
            const currentDate = new Date(transaction.date);

            if (import.meta.env.DEV) {
              console.log(`Processing transaction ${transactionId}:`, {
                originalDate: transaction.date,
                currentDate: currentDate,
                currentMonth: currentDate.getMonth(),
                currentDay: currentDate.getDate(),
                targetYear: year,
              });
            }

            // Handle edge cases like February 29th in non-leap years
            let newDate;
            try {
              // First try: create date with same month and day
              newDate = new Date(
                year,
                currentDate.getMonth(),
                currentDate.getDate()
              );

              if (import.meta.env.DEV) {
                console.log(`First attempt - newDate:`, newDate);
              }

              // Check if the date is valid (handles cases like Feb 29 in non-leap years)
              if (
                newDate.getFullYear() !== year ||
                newDate.getMonth() !== currentDate.getMonth() ||
                isNaN(newDate.getTime())
              ) {
                if (import.meta.env.DEV) {
                  console.log(`Invalid date detected, trying fallback...`);
                }

                // If the date is invalid, use the last day of the month
                newDate = new Date(year, currentDate.getMonth() + 1, 0);

                if (import.meta.env.DEV) {
                  console.log(`Fallback date:`, newDate);
                }

                // Final validation
                if (isNaN(newDate.getTime())) {
                  if (import.meta.env.DEV) {
                    console.log(
                      `Fallback also failed, using January 1st of target year`
                    );
                  }
                  // Ultimate fallback: January 1st of the target year
                  newDate = new Date(year, 0, 1);
                }
              }
            } catch (error) {
              if (import.meta.env.DEV) {
                console.log(`Exception in date creation:`, error);
              }
              // Ultimate fallback: January 1st of the target year
              newDate = new Date(year, 0, 1);
            }

            // Final validation before toISOString
            if (isNaN(newDate.getTime())) {
              if (import.meta.env.DEV) {
                console.error(
                  `All date creation attempts failed for transaction ${transactionId}`
                );
              }
              // Skip this transaction if we can't create a valid date
              return Promise.resolve();
            }

            if (import.meta.env.DEV) {
              console.log(
                `Final valid date for transaction ${transactionId}:`,
                newDate
              );
            }

            return updateTransaction(transactionId, {
              date: newDate.toISOString(),
            });
          }
          return Promise.resolve();
        }
      );

      await Promise.all(updatePromises);
      setShowBulkYearAssignment(false);
      setSelectedTransactions(new Set());
      // Transactions will be updated automatically via real-time listeners

      if (import.meta.env.DEV) {
        console.log("Bulk year assignment completed successfully");
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error in bulk year assignment:", error);
      }
    }
  };

  const handleBulkCategoryAssignment = async selectedCategory => {
    try {
      if (import.meta.env.DEV) {
        console.log(
          `Starting bulk category assignment for ${selectedTransactions.size} transactions to category ${selectedCategory}`
        );
      }

      const updatePromises = Array.from(selectedTransactions).map(
        transactionId => {
          const transaction = transactions.find(t => t.id === transactionId);
          if (transaction) {
            return updateTransaction(transactionId, {
              category: selectedCategory,
            });
          }
          return Promise.resolve();
        }
      );

      await Promise.all(updatePromises);
      setShowBulkCategoryAssignment(false);
      setSelectedTransactions(new Set());
      // Transactions will be updated automatically via real-time listeners

      if (import.meta.env.DEV) {
        console.log("Bulk category assignment completed successfully");
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error in bulk category assignment:", error);
      }
    }
  };

  const handleEditTransactionFull = transaction => {
    setEditingTransaction(transaction);
    setEditTransactionData({
      description: transaction.description || "",
      amount: Math.abs(transaction.amount),
      category: transaction.category || "Other",
      date: new Date(transaction.date).toISOString().split("T")[0],
      accountId: transaction.accountId?.toString() || "",
      transactionType: transaction.amount > 0 ? "income" : "expense",
    });
    setShowEditModal(true);
  };

  const handleUpdateTransactionFull = async () => {
    if (!editingTransaction) return;

    try {
      // Calculate final amount based on transaction type
      const baseAmount = parseFloat(editTransactionData.amount);
      const finalAmount =
        editTransactionData.transactionType === "expense"
          ? -Math.abs(baseAmount)
          : Math.abs(baseAmount);

      await updateTransaction(editingTransaction.id, {
        description: editTransactionData.description.trim(),
        amount: finalAmount,
        category: editTransactionData.category,
        date: new Date(editTransactionData.date).toISOString(),
        accountId: editTransactionData.accountId,
      });

      setShowEditModal(false);
      setEditingTransaction(null);
      setEditTransactionData({});
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error updating transaction:", error);
      }
    }
  };

  const handleDeleteTransaction = async transactionId => {
    try {
      await deleteTransaction(transactionId);
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
      // Transactions will be updated automatically via real-time listeners
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  const handleBatchDelete = async () => {
    try {
      if (import.meta.env.DEV) {
        console.log(
          `Starting batch delete for ${selectedTransactions.size} transactions`
        );
      }

      // Delete transactions one by one since we don't have a batch delete function
      const deletePromises = Array.from(selectedTransactions).map(
        transactionId => deleteTransaction(transactionId)
      );
      await Promise.all(deletePromises);
      setSelectedTransactions(new Set());
      // Transactions will be updated automatically via real-time listeners

      if (import.meta.env.DEV) {
        console.log("Batch delete completed successfully");
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error in batch delete:", error);
      }
    }
  };

  const confirmDelete = transaction => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
  };

  const getTransactionIcon = type => {
    return type === "income" ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const handleSort = field => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Mobile-specific components
  const MobileFilterModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filters & Sort
          </h3>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Section */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Filter by Type
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "all", label: "All", color: "gray" },
              { id: "income", label: "Income", color: "green" },
              { id: "expense", label: "Expense", color: "red" },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter.id
                    ? `bg-${filter.color}-600 text-white`
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Account Filter Section */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Filter by Account
          </h4>
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Sort by</h4>
          <div className="space-y-2">
            {[
              { value: "date-desc", label: "Date (Newest First)" },
              { value: "date-asc", label: "Date (Oldest First)" },
              { value: "amount-desc", label: "Amount (High to Low)" },
              { value: "amount-asc", label: "Amount (Low to High)" },
              { value: "description-asc", label: "Description (A-Z)" },
              { value: "description-desc", label: "Description (Z-A)" },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => {
                  const [field, order] = option.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                  setShowMobileFilters(false);
                }}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  `${sortBy}-${sortOrder}` === option.value
                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const MobileTransactionCard = ({ transaction }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedTransactions.has(transaction.id)}
            onChange={() => handleSelectTransaction(transaction.id)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            {getTransactionIcon(transaction.type)}
          </div>
        </div>
        <div className="text-right">
          <p
            className={`font-semibold text-lg ${
              transaction.amount > 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(transaction.amount)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(transaction.date)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {transaction.description || "No description"}
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="capitalize">
              {transaction.category || "Uncategorized"}
            </span>

            <button
              onClick={() => confirmDelete(transaction)}
              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete transaction"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <span>{transaction.account?.name || "Uncategorized Account"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Mobile Search and Filters */}
      <div className="lg:hidden space-y-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowMobileFilters(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filters & Sort</span>
          <div className="flex items-center gap-1">
            {sortOrder === "asc" ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </div>
        </button>
      </div>

      {/* Desktop Filters and Search */}
      <div className="hidden lg:block mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                selectedFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter("income")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                selectedFilter === "income"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setSelectedFilter("expense")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                selectedFilter === "expense"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              Expenses
            </button>
          </div>

          {/* Account Filter */}
          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={e => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
              <option value="description-asc">Description (A-Z)</option>
              <option value="description-desc">Description (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="hidden lg:block mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              Showing {filteredTransactions.length} of {transactions.length}{" "}
              transactions
            </span>
            {selectedAccountId !== "all" && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md">
                Account:{" "}
                {accounts.find(acc => acc.id === selectedAccountId)?.name ||
                  "Unknown"}
              </span>
            )}
            {selectedFilter !== "all" && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md capitalize">
                Type: {selectedFilter}
              </span>
            )}
          </div>
          {searchTerm && (
            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md">
              Search: &quot;{searchTerm}&quot;
            </span>
          )}
        </div>
      </div>

      {/* Desktop Bulk Actions Bar */}
      {selectedTransactions.size > 0 && (
        <div className="hidden lg:block bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedTransactions.size} transaction
                {selectedTransactions.size !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowBulkAssignment(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Assign to Account
              </button>
              <button
                onClick={() => setShowBulkCategoryAssignment(true)}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Assign Category
              </button>
              <button
                onClick={() => setShowBulkYearAssignment(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Assign to Year
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Select All Button */}
      {Array.isArray(filteredTransactions) &&
        filteredTransactions.length > 0 && (
          <div className="lg:hidden flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredTransactions.length} transaction
              {filteredTransactions.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              {selectedTransactions.size === filteredTransactions.length &&
              filteredTransactions.length > 0
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>
        )}

      {/* Mobile Transaction List */}
      <div className="lg:hidden space-y-3">
        {Array.isArray(filteredTransactions)
          ? filteredTransactions.map(transaction => (
              <MobileTransactionCard
                key={transaction.id}
                transaction={transaction}
              />
            ))
          : null}
        {(!Array.isArray(filteredTransactions) ||
          filteredTransactions.length === 0) && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No transactions found
            </p>
          </div>
        )}
      </div>

      {/* Mobile Batch Actions */}
      {selectedTransactions.size > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedTransactions.size} transaction
                {selectedTransactions.size !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setSelectedTransactions(new Set())}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowBulkAssignment(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Assign Account
              </button>
              <button
                onClick={() => setShowBulkCategoryAssignment(true)}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Assign Category
              </button>
              <button
                onClick={() => setShowBulkYearAssignment(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Assign Year
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Transaction Table */}
      <div className="hidden lg:block">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedTransactions.size ===
                          filteredTransactions.length &&
                        filteredTransactions.length > 0
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("date")}
                      className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      Date
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("description")}
                      className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      Description
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("amount")}
                      className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      Amount
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {Array.isArray(filteredTransactions)
                  ? filteredTransactions.map(transaction => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(transaction.id)}
                            onChange={() =>
                              handleSelectTransaction(transaction.id)
                            }
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {transaction.description || "No description"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span>{transaction.category || "Uncategorized"}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {transaction.account?.name || "Uncategorized Account"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span
                            className={
                              transaction.amount > 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }
                          >
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleEditTransactionFull(transaction)
                              }
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              title="Edit transaction"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => confirmDelete(transaction)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilters && <MobileFilterModal />}

      {/* Account Assignment Modal */}
      {showBulkAssignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Assign to Account
            </h3>
            <div className="space-y-2 mb-6">
              {accounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => handleBulkAccountAssignment(account.id)}
                  className="w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {account.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {account.type}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowBulkAssignment(false)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Assignment Modal */}
      {showBulkCategoryAssignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Assign Category
            </h3>
            <div className="space-y-2 mb-6">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => handleBulkCategoryAssignment(category)}
                  className="w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {category}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowBulkCategoryAssignment(false)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Full Transaction Edit Modal */}
      {showEditModal && editingTransaction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Transaction
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTransaction(null);
                  setEditTransactionData({});
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleUpdateTransactionFull();
              }}
              className="space-y-4"
            >
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={editTransactionData.description}
                  onChange={e =>
                    setEditTransactionData({
                      ...editTransactionData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter transaction description"
                />
              </div>

              {/* Transaction Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction Type
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditTransactionData({
                        ...editTransactionData,
                        transactionType: "income",
                      })
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 border ${
                      editTransactionData.transactionType === "income"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 mr-2 inline" />
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditTransactionData({
                        ...editTransactionData,
                        transactionType: "expense",
                      })
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 border ${
                      editTransactionData.transactionType === "expense"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 mr-2 inline" />
                    Expense
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {editTransactionData.transactionType === "income"
                    ? "Amount will be recorded as positive (increases balance)"
                    : "Amount will be recorded as negative (decreases balance)"}
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={editTransactionData.amount}
                    onChange={e =>
                      setEditTransactionData({
                        ...editTransactionData,
                        amount: e.target.value,
                      })
                    }
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Enter amount (always positive)
                  </span>
                  {editTransactionData.amount && (
                    <span
                      className={`font-medium ${
                        editTransactionData.transactionType === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      Will be recorded as:{" "}
                      {editTransactionData.transactionType === "income"
                        ? "+"
                        : "-"}
                      ${parseFloat(editTransactionData.amount || 0).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={editTransactionData.category}
                  onChange={e =>
                    setEditTransactionData({
                      ...editTransactionData,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account
                </label>
                <select
                  value={editTransactionData.accountId}
                  onChange={e =>
                    setEditTransactionData({
                      ...editTransactionData,
                      accountId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                >
                  <option value="">Select an account...</option>
                  {accounts && accounts.length > 0 ? (
                    accounts.map(account => (
                      <option key={account.id} value={account.id.toString()}>
                        {account.name} ({account.type})
                      </option>
                    ))
                  ) : (
                    <option value="">No accounts available</option>
                  )}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={editTransactionData.date}
                  onChange={e =>
                    setEditTransactionData({
                      ...editTransactionData,
                      date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTransaction(null);
                    setEditTransactionData({});
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Year Assignment Modal */}
      {showBulkYearAssignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Assign to Year
            </h3>
            <div className="space-y-2 mb-6">
              {(() => {
                const currentYear = new Date().getFullYear();
                const years = [];
                // Generate years from current year back to 2020
                for (let year = currentYear; year >= 2020; year--) {
                  years.push(year);
                }
                return years.map(year => (
                  <button
                    key={year}
                    onClick={() => handleBulkYearAssignment(year)}
                    className="w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {year}
                    </div>
                  </button>
                ));
              })()}
            </div>
            <button
              onClick={() => setShowBulkYearAssignment(false)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && transactionToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Transaction
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Are you sure you want to delete this transaction?
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="font-medium text-gray-900 dark:text-white">
                  {transactionToDelete.description || "No description"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatCurrency(transactionToDelete.amount)} •{" "}
                  {formatDate(transactionToDelete.date)}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setTransactionToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTransaction(transactionToDelete.id)}
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

export default TransactionsPage;
