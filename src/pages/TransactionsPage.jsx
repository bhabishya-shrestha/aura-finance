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
} from "lucide-react";
import useStore from "../store";
import AddTransaction from "../components/AddTransaction";

const TransactionsPage = () => {
  const { transactions, loadTransactions, accounts, updateTransaction } =
    useStore();
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [showBulkYearAssignment, setShowBulkYearAssignment] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
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
      const updatePromises = Array.from(selectedTransactions).map(
        transactionId => {
          const transaction = transactions.find(t => t.id === transactionId);
          if (transaction) {
            return updateTransaction(transactionId, {
              ...transaction,
              accountId: selectedAccountId,
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
      // Error updating transactions
    }
  };

  const handleBulkYearAssignment = async year => {
    try {
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
              ...transaction,
              date: newDate,
            });
          }
          return Promise.resolve();
        }
      );

      await Promise.all(updatePromises);
      setShowBulkYearAssignment(false);
      setSelectedTransactions(new Set());
      await loadTransactions();
    } catch (error) {
      // Error updating transactions
    }
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
      ...filteredTransactions.map(transaction =>
        [
          formatDate(transaction.date),
          `"${transaction.description || ""}"`,
          transaction.category?.name || "Unknown",
          transaction.account?.name || "Uncategorized Account",
          transaction.amount,
          transaction.type || "expense",
        ].join(",")
      ),
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
          <span className="capitalize">
            {transaction.category?.name || "Uncategorized"}
          </span>
          <span>{transaction.account?.name || "Uncategorized Account"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header - Desktop only */}
      <div className="hidden lg:block mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Transactions
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and track all your financial transactions
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <AddTransaction />
          </div>
        </div>
      </div>

      {/* Mobile Header - Simple */}
      <div className="lg:hidden mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Transactions
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage and track all your financial transactions
        </p>
      </div>

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
                onClick={() => setShowBulkYearAssignment(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Assign to Year
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Transaction List */}
      <div className="lg:hidden space-y-3">
        {filteredTransactions.map(transaction => (
          <MobileTransactionCard
            key={transaction.id}
            transaction={transaction}
          />
        ))}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No transactions found
            </p>
          </div>
        )}
      </div>

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
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map(transaction => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.has(transaction.id)}
                        onChange={() => handleSelectTransaction(transaction.id)}
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
                      {transaction.category?.name || "Uncategorized"}
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
                  </tr>
                ))}
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
    </div>
  );
};

export default TransactionsPage;
