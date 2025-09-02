import React, { useState } from "react";
import {
  X,
  DollarSign,
  Calendar,
  FileText,
  Tag,
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import useProductionStore from "../store/productionStore";
import { useNotifications } from "../contexts/NotificationContext";
import { CATEGORIES } from "../utils/statementParser";
import {
  detectTransactionType,
  calculateAmountWithSign,
} from "../utils/transactionUtils";
import DatePicker from "./ui/DatePicker";

const AddTransaction = ({ isOpen, onClose, isMobile = false }) => {
  const {
    addTransaction,
    accounts,
    isLoading,
    error,
    initialize,
    isInitialized,
  } = useProductionStore();
  const { showSuccess, showError } = useNotifications();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Other",
    date: new Date().toISOString().split("T")[0],
    accountId: "", // Start empty, will be set by useEffect
    transactionType: "expense", // New field: "income" or "expense"
  });
  const [errors, setErrors] = useState({});

  // Initialize store if needed
  React.useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // Initialize form with first available account
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("🔄 AddTransaction useEffect triggered:", {
        accountsCount: accounts?.length,
        currentAccountId: formData.accountId,
        availableAccounts: accounts?.map(acc => ({
          id: acc.id,
          name: acc.name,
        })),
      });
    }

    if (accounts && accounts.length > 0) {
      // Always set to the first account if we have accounts and no accountId is set
      // or if the current accountId doesn't match any existing account
      const currentAccountExists = accounts.some(
        acc => acc.id.toString() === formData.accountId
      );

      if (import.meta.env.DEV) {
        console.log("🔍 Account assignment check:", {
          currentAccountExists,
          shouldUpdate: !formData.accountId || !currentAccountExists,
        });
      }

      if (!formData.accountId || !currentAccountExists) {
        const newAccountId = accounts[0].id.toString();
        if (import.meta.env.DEV) {
          console.log("✅ Setting accountId to:", newAccountId);
        }
        setFormData(prev => ({
          ...prev,
          accountId: newAccountId,
        }));
      }
    }
  }, [accounts, formData.accountId]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.amount || isNaN(parseFloat(formData.amount))) {
      newErrors.amount = "Valid amount is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.accountId) {
      newErrors.accountId = "Account is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Debug logging
    if (import.meta.env.DEV) {
      console.log("🔍 Adding transaction with data:", {
        formData,
        selectedAccountId: formData.accountId,
        availableAccounts: accounts?.map(acc => ({
          id: acc.id,
          name: acc.name,
        })),
        accountIdType: typeof formData.accountId,
      });
    }

    try {
      // Calculate final amount based on transaction type
      const baseAmount = parseFloat(formData.amount);
      const finalAmount = calculateAmountWithSign(
        baseAmount,
        formData.transactionType
      );

      // Ensure proper data types for production store
      const transactionData = {
        description: formData.description.trim(),
        amount: finalAmount,
        category: formData.category,
        accountId: formData.accountId.toString(), // Ensure string type
        date: new Date(formData.date).toISOString(),
      };

      const result = await addTransaction(transactionData);

      if (result.success) {
        showSuccess(result.message || "Transaction added successfully");

        // Reset form
        setFormData({
          description: "",
          amount: "",
          category: "Other",
          date: new Date().toISOString().split("T")[0],
          accountId:
            accounts && accounts.length > 0 ? accounts[0].id.toString() : "",
          transactionType: "expense",
        });
        setErrors({});

        if (onClose) {
          onClose();
        } else {
          setShowModal(false);
        }
      } else {
        showError(result.message || "Failed to add transaction");
      }
    } catch (error) {
      const errorMessage =
        error.message || "Failed to add transaction. Please try again.";
      showError(errorMessage);
      setErrors({ submit: errorMessage });
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Auto-detect transaction type when description changes
    if (name === "description") {
      const detectedType = detectTransactionType(value);
      setFormData(prev => ({
        ...prev,
        transactionType: detectedType,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleTransactionTypeChange = newType => {
    setFormData(prev => ({
      ...prev,
      transactionType: newType,
    }));
  };

  const handleCancel = () => {
    setFormData({
      description: "",
      amount: "",
      category: "Other",
      date: new Date().toISOString().split("T")[0],
      accountId:
        accounts && accounts.length > 0 ? accounts[0].id.toString() : "",
      transactionType: "expense",
    });
    setErrors({});
    if (onClose) {
      onClose();
    } else {
      setShowModal(false);
    }
  };

  // Determine if modal should be shown
  const shouldShowModal = isOpen !== undefined ? isOpen : showModal;

  return (
    <>
      {/* Standalone Button (when not controlled externally) */}
      {isOpen === undefined && (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        >
          <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div className="text-left">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Add Transaction
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Create a new transaction
            </p>
          </div>
        </button>
      )}

      {/* Modal */}
      {shouldShowModal && (
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${
            isMobile ? "" : "p-4"
          }`}
        >
          <div
            className={`bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 ${
              isMobile
                ? "w-full h-full rounded-none mx-0 p-4"
                : "rounded-lg max-w-md w-full mx-4 p-6"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Add New Transaction
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {errors.submit}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className={`w-full pl-10 px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                      errors.description
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                </div>
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Transaction Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction Type
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTransactionTypeChange("income")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 border ${
                      formData.transactionType === "income"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 mr-2 inline" />
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTransactionTypeChange("expense")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 border ${
                      formData.transactionType === "expense"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 mr-2 inline" />
                    Expense
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.transactionType === "income"
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
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={`w-full pl-10 px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                      errors.amount
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Enter amount (always positive)
                  </span>
                  {formData.amount && (
                    <span
                      className={`font-medium ${
                        formData.transactionType === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      Will be recorded as:{" "}
                      {formData.transactionType === "income" ? "+" : "-"}$
                      {parseFloat(formData.amount || 0).toFixed(2)}
                    </span>
                  )}
                </div>
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.amount}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full pl-10 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                  >
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <select
                    name="accountId"
                    value={formData.accountId}
                    onChange={handleInputChange}
                    className={`w-full pl-10 px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none ${
                      errors.accountId
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
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
                {errors.accountId && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.accountId}
                  </p>
                )}
              </div>

              

              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Date */}
              <div>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={ymd =>
                    setFormData(prev => ({ ...prev, date: ymd }))
                  }
                />
                {errors.date && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.date}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !isInitialized}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 font-medium text-sm shadow-sm"
                >
                  {isLoading
                    ? "Adding..."
                    : !isInitialized
                      ? "Initializing..."
                      : "Add Transaction"}
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
