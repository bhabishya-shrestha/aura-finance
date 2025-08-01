import React, { useState, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle,
  X,
  Info,
  Clock,
  Tag,
  Eye,
  EyeOff,
  SkipForward,
  Check,
} from "lucide-react";
import { getDuplicateReason } from "../utils/duplicateDetector";

const DuplicateReviewModal = ({
  isOpen,
  onClose,
  duplicates,
  nonDuplicates,
  onConfirm,
  onSkipAll,
}) => {
  const [selectedDuplicates, setSelectedDuplicates] = useState(new Set());
  const [showDetails, setShowDetails] = useState(false);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedDuplicates(new Set());
      setShowDetails(false);
    }
  }, [isOpen]);

  const handleSelectDuplicate = useCallback(index => {
    setSelectedDuplicates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedDuplicates(new Set(duplicates.map((_, index) => index)));
  }, [duplicates]);

  const handleSelectNone = useCallback(() => {
    setSelectedDuplicates(new Set());
  }, []);

  const handleConfirm = useCallback(() => {
    const selectedTransactions = duplicates
      .filter((_, index) => selectedDuplicates.has(index))
      .map(d => d.newTransaction);

    const allTransactions = [...nonDuplicates, ...selectedTransactions];
    onConfirm(allTransactions);
  }, [selectedDuplicates, duplicates, nonDuplicates, onConfirm]);

  const handleSkipAll = useCallback(() => {
    onSkipAll(nonDuplicates);
  }, [nonDuplicates, onSkipAll]);

  const formatDate = useCallback(date => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const formatAmount = useCallback(amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }, []);

  const getConfidenceColor = useCallback(confidence => {
    if (confidence >= 0.9) return "text-green-600 bg-green-50";
    if (confidence >= 0.7) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  }, []);

  const getConfidenceText = useCallback(confidence => {
    if (confidence >= 0.9) return "High";
    if (confidence >= 0.7) return "Medium";
    return "Low";
  }, []);

  if (!isOpen) return null;

  const totalDuplicates = duplicates?.length || 0;
  const selectedCount = selectedDuplicates.size;
  const nonDuplicateCount = nonDuplicates?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Review Duplicate Transactions
              </h2>
              <p className="text-sm text-gray-600">
                {totalDuplicates} potential duplicates found
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600">
                  Non-duplicates
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {nonDuplicateCount}
              </p>
              <p className="text-xs text-gray-500">
                Will be added automatically
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-600">
                  Duplicates
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalDuplicates}
              </p>
              <p className="text-xs text-gray-500">Need your review</p>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">
                  Selected
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {selectedCount}
              </p>
              <p className="text-xs text-gray-500">Will be added</p>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <SkipForward className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">
                  Skipped
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-600">
                {totalDuplicates - selectedCount}
              </p>
              <p className="text-xs text-gray-500">Will be ignored</p>
            </div>
          </div>
        </div>

        {/* Duplicate List */}
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {totalDuplicates === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Duplicates Found
              </h3>
              <p className="text-gray-600">
                All {nonDuplicateCount} transactions will be added
                automatically.
              </p>
            </div>
          ) : (
            <div className="p-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={handleSelectNone}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Select None
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-1"
                >
                  {showDetails ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span>{showDetails ? "Hide" : "Show"} Details</span>
                </button>
              </div>

              {/* Duplicates List */}
              <div className="space-y-4">
                {duplicates.map((duplicate, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedDuplicates.has(index)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedDuplicates.has(index)}
                        onChange={() => handleSelectDuplicate(index)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />

                      {/* Transaction Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {duplicate.newTransaction.description}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(duplicate.confidence)}`}
                            >
                              {getConfidenceText(duplicate.confidence)}{" "}
                              Confidence
                            </span>
                            <span
                              className={`font-medium ${
                                duplicate.newTransaction.amount >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatAmount(duplicate.newTransaction.amount)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatDate(duplicate.newTransaction.date)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Tag className="w-3 h-3" />
                            <span>
                              {duplicate.newTransaction.category ||
                                "Uncategorized"}
                            </span>
                          </div>
                        </div>

                        {/* Duplicate Reason */}
                        <div className="flex items-center space-x-1 text-xs text-yellow-600">
                          <Info className="w-3 h-3" />
                          <span>{getDuplicateReason(duplicate)}</span>
                        </div>

                        {/* Detailed Comparison */}
                        {showDetails && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <h5 className="font-medium text-gray-700 mb-2">
                                  New Transaction
                                </h5>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Date:</span>
                                    <span>
                                      {formatDate(
                                        duplicate.newTransaction.date
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Amount:
                                    </span>
                                    <span>
                                      {formatAmount(
                                        duplicate.newTransaction.amount
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Description:
                                    </span>
                                    <span className="truncate">
                                      {duplicate.newTransaction.description}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h5 className="font-medium text-gray-700 mb-2">
                                  Existing Transaction
                                </h5>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Date:</span>
                                    <span>
                                      {formatDate(
                                        duplicate.existingTransaction.date
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Amount:
                                    </span>
                                    <span>
                                      {formatAmount(
                                        duplicate.existingTransaction.amount
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Description:
                                    </span>
                                    <span className="truncate">
                                      {
                                        duplicate.existingTransaction
                                          .description
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSkipAll}
                className="px-6 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip All Duplicates
              </button>
              <span className="text-sm text-gray-500">
                Add {nonDuplicateCount} non-duplicates only
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedCount === 0 && nonDuplicateCount === 0}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Import {selectedCount + nonDuplicateCount} Transactions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateReviewModal;
