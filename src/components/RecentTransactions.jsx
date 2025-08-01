import React, { useState } from "react";
import {
  Calendar,
  DollarSign,
  Edit3,
  Trash2,
  Save,
  X,
  Tag,
  ArrowRight,
} from "lucide-react";
import useStore from "../store";
import { CATEGORIES } from "../utils/statementParser";

const RecentTransactions = ({ onViewAllTransactions }) => {
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
          recentTransactions.map(transaction => (
            <div
              key={transaction.id}
              className="p-3 sm:p-4 apple-glass-light rounded-apple-lg border border-apple-glass-200/30 hover:bg-apple-glass-200/40 transition-all duration-200 backdrop-blur-apple-sm"
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
                        className="input-glass w-full mt-1 text-sm"
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
                        className="input-glass w-full mt-1 text-sm"
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
                      className="input-glass w-full mt-1 text-sm"
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
                        className="input-glass w-full mt-1 text-sm"
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
                        className="p-2 bg-apple-green/20 hover:bg-apple-green/30 border border-apple-green/30 rounded-apple-lg icon-success transition-all duration-200 backdrop-blur-apple-sm"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-2 bg-apple-glass-200/40 hover:bg-apple-glass-300/50 border border-apple-glass-300/30 rounded-apple-lg icon-muted transition-all duration-200 backdrop-blur-apple-sm"
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
                        className="p-1.5 hover:bg-apple-glass-200/40 rounded-apple transition-all duration-200 icon-muted hover:icon-white backdrop-blur-apple-sm"
                      >
                        <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-1.5 hover:bg-apple-red/20 rounded-apple transition-all duration-200 icon-muted hover:icon-error backdrop-blur-apple-sm"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {recentTransactions.length > 0 && (
        <div className="mt-4 pt-3 sm:pt-4 border-t border-apple-glass-300/30">
          <button
            onClick={onViewAllTransactions}
            className="w-full py-2 px-3 sm:px-4 bg-apple-glass-200/40 hover:bg-apple-glass-300/50 transition-all duration-200 rounded-apple-lg text-primary text-sm backdrop-blur-apple-sm flex items-center justify-center gap-2"
          >
            <span>View All Transactions</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
