import React, { useState } from "react";
import {
  Calendar,
  DollarSign,
  Edit3,
  Trash2,
  Save,
  X,
  Tag,
} from "lucide-react";
import useStore from "../store";
import { CATEGORIES } from "../utils/statementParser";

const RecentTransactions = ({ onPageChange }) => {
  const { getRecentTransactions, deleteTransaction, updateTransaction } =
    useStore();
  const recentTransactions = getRecentTransactions();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = date => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const formatDateForInput = date => {
    return new Date(date).toISOString().split("T")[0];
  };

  const getCategoryColor = category => {
    const colors = {
      Groceries: "text-green-600 dark:text-green-400",
      Restaurants: "text-yellow-600 dark:text-yellow-400",
      Transport: "text-blue-600 dark:text-blue-400",
      Shopping: "text-purple-600 dark:text-purple-400",
      Income: "text-green-600 dark:text-green-400",
      Utilities: "text-orange-600 dark:text-orange-400",
      Entertainment: "text-pink-600 dark:text-pink-400",
      Healthcare: "text-red-600 dark:text-red-400",
      Other: "text-gray-500 dark:text-gray-400",
    };
    return colors[category] || colors["Other"];
  };

  const handleEdit = transaction => {
    setEditingId(transaction.id);
    setEditData({
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      date: formatDateForInput(transaction.date),
    });
  };

  const handleSave = async transactionId => {
    try {
      await updateTransaction(transactionId, {
        ...editData,
        date: new Date(editData.date),
        amount: parseFloat(editData.amount),
      });
      setEditingId(null);
      setEditData({});
    } catch (error) {
      // Error handling - in production, this would use a proper error notification system
      // Silent fail for now, could be replaced with toast notification
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async transactionId => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(transactionId);
      } catch (error) {
        // Handle error silently or show user notification
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Recent Transactions
      </h2>

      <div className="space-y-3">
        {recentTransactions.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
            <DollarSign className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm sm:text-base">No transactions yet</p>
            <p className="text-xs sm:text-sm">
              Import a statement to get started
            </p>
          </div>
        ) : (
          Array.isArray(recentTransactions) ? recentTransactions.map(transaction => (
            <div
              key={transaction.id}
              className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
            >
              {editingId === transaction.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted uppercase tracking-wide">
                        Date
                      </label>
                      <input
                        type="date"
                        value={editData.date}
                        onChange={e =>
                          setEditData({ ...editData, date: e.target.value })
                        }
                        className="w-full mt-1 text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted uppercase tracking-wide">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.amount}
                        onChange={e =>
                          setEditData({ ...editData, amount: e.target.value })
                        }
                        className="w-full mt-1 text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted uppercase tracking-wide">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editData.description}
                      onChange={e =>
                        setEditData({
                          ...editData,
                          description: e.target.value,
                        })
                      }
                      className="w-full mt-1 text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-xs text-muted uppercase tracking-wide">
                        Category
                      </label>
                      <select
                        value={editData.category}
                        onChange={e =>
                          setEditData({ ...editData, category: e.target.value })
                        }
                        className="w-full mt-1 text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {CATEGORIES.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleSave(transaction.id)}
                        className="p-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 border border-green-300 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 transition-all duration-200"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode - Cleaner Layout
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Main transaction info */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2 text-muted text-xs">
                        <Calendar className="w-3 h-3" />
                        {formatDate(transaction.date)}
                      </div>
                      <div className="flex items-center gap-1 text-muted text-xs">
                        <Tag className="w-3 h-3" />
                        <span
                          className={getCategoryColor(transaction.category)}
                        >
                          {transaction.category}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-primary font-medium text-sm sm:text-base truncate">
                      {transaction.description}
                    </p>
                  </div>

                  {/* Amount and Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right">
                      <p
                        className={`font-semibold text-sm sm:text-base ${
                          transaction.amount >= 0
                            ? "text-success"
                            : "text-error"
                        }`}
                      >
                        {transaction.amount >= 0 ? "+" : ""}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                      >
                        <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )) : null
        )}
      </div>

      {recentTransactions.length > 0 && (
        <div className="mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => onPageChange && onPageChange("transactions")}
            className="w-full py-2 px-3 sm:px-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700 transition-all duration-200 rounded-lg text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 text-sm font-medium"
          >
            View All Transactions
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
