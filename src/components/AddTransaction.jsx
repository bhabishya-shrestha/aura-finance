import React, { useState } from "react";
import { Plus, X, DollarSign, Calendar, FileText, Tag } from "lucide-react";
import useStore from "../store";
import { CATEGORIES } from "../utils/statementParser";

const AddTransaction = () => {
  const { addTransaction } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Other",
    date: new Date().toISOString().split("T")[0],
    accountId: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description.trim() || !formData.amount) {
      // Use a more user-friendly approach instead of alert
      return;
    }

    try {
      await addTransaction({
        ...formData,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
      });

      // Reset form
      setFormData({
        description: "",
        amount: "",
        category: "Other",
        date: new Date().toISOString().split("T")[0],
        accountId: "",
      });

      setShowModal(false);
    } catch (error) {
      // Log error for development, could be replaced with proper error handling
      if (import.meta.env.DEV) {
        console.error("Error adding transaction:", error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setShowModal(true)}
        className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 hover:scale-105 transition-all duration-200 group text-sm sm:text-base shadow-sm"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-all duration-200" />
        <span className="font-medium">Add Transaction</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Add New Transaction
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter transaction description"
                    className="w-full pl-10 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1 sm:mb-2">
                  Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 icon-muted" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="input-glass w-full pl-10 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1 sm:mb-2">
                  Category
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 icon-muted" />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input-glass w-full pl-10 text-sm sm:text-base"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1 sm:mb-2">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 icon-muted" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="input-glass w-full pl-10 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-glass-outlined text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-glass-primary text-sm sm:text-base"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddTransaction;
