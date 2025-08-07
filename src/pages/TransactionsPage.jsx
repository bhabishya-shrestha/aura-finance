import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  FileText,
  ArrowUpDown,
  Filter,
  SortAsc,
  SortDesc,
  X,
  Tag,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import useStore from "../store";
import AddTransaction from "../components/AddTransaction";
import { CATEGORIES } from "../utils/statementParser";

const TransactionsPage = () => {
  const {
    transactions,
    loadTransactions,
    accounts,
    updateTransaction,
    deleteTransaction,
    deleteTransactions,
  } = useStore();
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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [showMobileBatchActions, setShowMobileBatchActions] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    let filtered = [...transactions];

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

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
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
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, selectedFilter, sortBy, sortOrder]);

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = date => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
      await loadTransactions();
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
            const newDate = new Date(
              year,
              currentDate.getMonth(),
              currentDate.getDate()
            );

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
      await loadTransactions();

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
      await loadTransactions();

      if (import.meta.env.DEV) {
        console.log("Bulk category assignment completed successfully");
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error in bulk category assignment:", error);
      }
    }
  };

  const handleEditTransaction = transaction => {
    setEditingTransaction(transaction);
    setShowCategoryModal(true);
  };

  const handleUpdateTransactionCategory = async (
    transactionId,
    newCategory
  ) => {
    try {
      if (import.meta.env.DEV) {
        console.log(
          `Updating transaction ${transactionId} category to ${newCategory}`
        );
      }

      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        await updateTransaction(transactionId, {
          category: newCategory,
        });
        setShowCategoryModal(false);
        setEditingTransaction(null);
        await loadTransactions();

        if (import.meta.env.DEV) {
          console.log("Transaction category updated successfully");
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error updating transaction category:", error);
      }
    }
  };

  const handleDeleteTransaction = async transactionId => {
    try {
      await deleteTransaction(transactionId);
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
      await loadTransactions();
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

      await deleteTransactions(Array.from(selectedTransactions));
      setSelectedTransactions(new Set());
      setShowMobileBatchActions(false);
      await loadTransactions();

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

  const handleExport = () => {
    // Create CSV content
    const headers = [
      "Date",
      "Description",
      "Category",
      "Account",
      "Amount",
      "Type",
    ];
    const csvContent = [
      headers.join(","),
      ...(Array.isArray(filteredTransactions)
        ? filteredTransactions.map(transaction =>
            [
              formatDate(transaction.date),
              `"${transaction.description || ""}"`,
              transaction.category?.name || "Unknown",
              transaction.account?.name || "Uncategorized Account",
              transaction.amount,
              transaction.type || "expense",
            ].join(",")
          )
        : []),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
              onClick={() => handleEditTransaction(transaction)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Edit category"
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

      {/* Bulk Actions Bar */}
      {selectedTransactions.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
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
                Delete
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
                          <div className="flex items-center justify-between">
                            <span>
                              {transaction.category || "Uncategorized"}
                            </span>
                            <button
                              onClick={() => handleEditTransaction(transaction)}
                              className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              title="Edit category"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
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
                              onClick={() => handleEditTransaction(transaction)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              title="Edit category"
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

      {/* Individual Category Edit Modal */}
      {showCategoryModal && editingTransaction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Transaction Category
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Transaction: {editingTransaction.description}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current Category:{" "}
                {editingTransaction.category || "Uncategorized"}
              </p>
            </div>
            <div className="space-y-2 mb-6">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() =>
                    handleUpdateTransactionCategory(
                      editingTransaction.id,
                      category
                    )
                  }
                  className="w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {category}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowCategoryModal(false);
                setEditingTransaction(null);
              }}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
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
              {[2024, 2023, 2022, 2021, 2020].map(year => (
                <button
                  key={year}
                  onClick={() => handleBulkYearAssignment(year)}
                  className="w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {year}
                  </div>
                </button>
              ))}
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
                  {formatCurrency(transactionToDelete.amount)} • {formatDate(transactionToDelete.date)}
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
