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
      Groceries: "text-green-400",
      Restaurants: "text-orange-400",
      Transport: "text-blue-400",
      Shopping: "text-purple-400",
      Income: "text-green-500",
      Utilities: "text-yellow-400",
      Entertainment: "text-pink-400",
      Healthcare: "text-red-400",
      Other: "text-gray-400",
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
      console.error("Error updating transaction:", error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (transactionId) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(transactionId);
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold text-soft-white mb-4">
        Recent Transactions
      </h2>

      <div className="space-y-3">
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-gray">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm">Import a statement to get started</p>
          </div>
        ) : (
          recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            >
              {editingId === transaction.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-muted-gray uppercase tracking-wide">
                        Date
                      </label>
                      <input
                        type="date"
                        value={editData.date}
                        onChange={(e) =>
                          setEditData({ ...editData, date: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs text-muted-gray uppercase tracking-wide">
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
                        className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-gray uppercase tracking-wide">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.amount}
                        onChange={(e) =>
                          setEditData({ ...editData, amount: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-xs text-muted-gray uppercase tracking-wide">
                        Category
                      </label>
                      <select
                        value={editData.category}
                        onChange={(e) =>
                          setEditData({ ...editData, category: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal text-sm"
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleSave(transaction.id)}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-muted-gray transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2 text-muted-gray text-sm">
                      <Calendar className="w-4 h-4" />
                      {formatDate(transaction.date)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-soft-white font-medium truncate">
                        {transaction.description}
                      </p>
                      <p
                        className={`text-sm ${getCategoryColor(
                          transaction.category
                        )}`}
                      >
                        {transaction.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.amount >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {transaction.amount >= 0 ? "+" : ""}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-muted-gray hover:text-soft-white"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-muted-gray hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <div className="mt-4 pt-4 border-t border-white/10">
          <button className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-soft-white text-sm">
            View All Transactions
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
