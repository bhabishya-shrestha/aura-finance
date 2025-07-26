import React, { useState } from "react";
import { Calendar, DollarSign, Edit3, Trash2, Save, X } from "lucide-react";
import useStore from "../store";
import { CATEGORIES } from "../utils/statementParser";

const RecentTransactions = () => {
  const { getRecentTransactions, deleteTransaction, updateTransaction } =
    useStore();
  const recentTransactions = getRecentTransactions();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const formatDateForInput = (date) => {
    return new Date(date).toISOString().split("T")[0];
  };

  const getCategoryColor = (category) => {
    const colors = {
      Groceries: "text-success",
      Restaurants: "text-warning",
      Transport: "icon-primary",
      Shopping: "icon-secondary",
      Income: "text-success",
      Utilities: "text-warning",
      Entertainment: "icon-secondary",
      Healthcare: "text-error",
      Other: "text-muted",
    };
    return colors[category] || colors["Other"];
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditData({
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      date: formatDateForInput(transaction.date),
    });
  };

  const handleSave = async (transactionId) => {
    try {
      await updateTransaction(transactionId, {
        ...editData,
        date: new Date(editData.date),
        amount: parseFloat(editData.amount),
      });
      setEditingId(null);
      setEditData({});
    } catch (error) {
      // Log error for development, could be replaced with proper error handling
      if (import.meta.env.DEV) {
        console.error("Error updating transaction:", error);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (transactionId) => {
    // Note: In a production app, this should use a proper confirmation dialog
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(transactionId);
      } catch (error) {
        // Log error for development, could be replaced with proper error handling
        if (import.meta.env.DEV) {
          console.error("Error deleting transaction:", error);
        }
      }
    }
  };

  return (
    <div className="glass-card-hover p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-primary mb-4">
        Recent Transactions
      </h2>

      <div className="space-y-2 sm:space-y-3">
        {recentTransactions.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted">
            <DollarSign className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm sm:text-base">No transactions yet</p>
            <p className="text-xs sm:text-sm">
              Import a statement to get started
            </p>
          </div>
        ) : (
          recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-2 sm:p-3 apple-glass-light rounded-apple-lg border border-apple-glass-200/30 hover:bg-apple-glass-200/40 transition-all duration-200 backdrop-blur-apple-sm"
            >
              {editingId === transaction.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    <div>
                      <label className="text-xs text-muted uppercase tracking-wide">
                        Date
                      </label>
                      <input
                        type="date"
                        value={editData.date}
                        onChange={(e) =>
                          setEditData({ ...editData, date: e.target.value })
                        }
                        className="input-glass w-full mt-1 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted uppercase tracking-wide">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editData.description}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            description: e.target.value,
                          })
                        }
                        className="input-glass w-full mt-1 text-xs sm:text-sm"
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
                        onChange={(e) =>
                          setEditData({ ...editData, amount: e.target.value })
                        }
                        className="input-glass w-full mt-1 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-xs text-muted uppercase tracking-wide">
                        Category
                      </label>
                      <select
                        value={editData.category}
                        onChange={(e) =>
                          setEditData({ ...editData, category: e.target.value })
                        }
                        className="input-glass w-full mt-1 text-xs sm:text-sm"
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-1 sm:gap-2 ml-2 sm:ml-4">
                      <button
                        onClick={() => handleSave(transaction.id)}
                        className="p-1.5 sm:p-2 bg-apple-green/20 hover:bg-apple-green/30 border border-apple-green/30 rounded-apple-lg icon-success transition-all duration-200 backdrop-blur-apple-sm"
                      >
                        <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1.5 sm:p-2 bg-apple-glass-200/40 hover:bg-apple-glass-300/50 border border-apple-glass-300/30 rounded-apple-lg icon-muted transition-all duration-200 backdrop-blur-apple-sm"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 text-muted text-xs sm:text-sm flex-shrink-0">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      {formatDate(transaction.date)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-primary font-medium truncate text-sm sm:text-base">
                        {transaction.description}
                      </p>
                      <p
                        className={`text-xs sm:text-sm ${getCategoryColor(
                          transaction.category
                        )}`}
                      >
                        {transaction.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
                        className="p-1 sm:p-1.5 hover:bg-apple-glass-200/40 rounded-apple transition-all duration-200 icon-muted hover:icon-white backdrop-blur-apple-sm"
                      >
                        <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-1 sm:p-1.5 hover:bg-apple-red/20 rounded-apple transition-all duration-200 icon-muted hover:icon-error backdrop-blur-apple-sm"
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
          <button className="w-full py-2 px-3 sm:px-4 bg-apple-glass-200/40 hover:bg-apple-glass-300/50 transition-all duration-200 rounded-apple-lg text-primary text-sm backdrop-blur-apple-sm">
            View All Transactions
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
