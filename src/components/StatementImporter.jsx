import React, { useState, useRef } from "react";
import {
  Upload,
  AlertCircle,
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
  Image,
  FileSpreadsheet,
} from "lucide-react";
import { parseStatement } from "../utils/statementParser";
import geminiService from "../services/geminiService";
import useStore from "../store";

const StatementImporter = ({ isOpen, onClose }) => {
  const { addTransactions, transactions } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const [parsedTransactions, setParsedTransactions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const fileInputRef = useRef(null);

  // Don't render if not open
  if (!isOpen) return null;

  // Check for duplicate transactions
  const checkDuplicates = newTransactions => {
    const duplicates = [];

    newTransactions.forEach(newTransaction => {
      const existingDuplicates = transactions.filter(existing => {
        // Check for exact matches on date, description, and amount
        const sameDate =
          new Date(existing.date).toDateString() ===
          new Date(newTransaction.date).toDateString();
        const sameDescription =
          existing.description.toLowerCase() ===
          newTransaction.description.toLowerCase();
        const sameAmount =
          Math.abs(existing.amount - newTransaction.amount) < 0.01; // Allow for small rounding differences

        return sameDate && sameDescription && sameAmount;
      });

      if (existingDuplicates.length > 0) {
        duplicates.push({
          new: newTransaction,
          existing: existingDuplicates,
        });
      }
    });

    return duplicates;
  };

  const handleFileUpload = async event => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError("");
    setProcessingStep("Processing file...");
    setParsedTransactions([]);
    setDocumentInfo(null);
    setDuplicates([]);
    setSelectedTransactions([]);

    try {
      let transactions = [];
      let docInfo = null;

      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setProcessingStep("Parsing CSV file...");
        transactions = await parseStatement(file);
        docInfo = {
          type: "CSV Statement",
          source: file.name,
          confidence: "high",
        };
      } else if (
        file.type === "application/pdf" ||
        file.name.endsWith(".pdf")
      ) {
        setProcessingStep("Processing PDF with OCR...");
        transactions = await parseStatement(file);
        docInfo = {
          type: "PDF Statement",
          source: file.name,
          confidence: "medium",
        };
      } else if (file.type.startsWith("image/")) {
        setProcessingStep("Analyzing image with AI...");

        // Use Gemini for image analysis
        const result = await geminiService.analyzeImage(file);

        if (result.transactions && result.transactions.length > 0) {
          transactions = geminiService.convertToTransactions(result);
          docInfo = {
            type: result.documentType || "Image Document",
            source: result.source || file.name,
            confidence: result.confidence || "low",
            notes: result.notes,
          };
        } else {
          throw new Error(
            "No transactions found in the image. Please try a clearer image or different document."
          );
        }
      } else {
        throw new Error(
          "Unsupported file format. Please upload a CSV, PDF, or image file (JPG, PNG, etc.)."
        );
      }

      if (transactions.length === 0) {
        throw new Error("No transactions found in the file.");
      }

      // Check for duplicates
      const duplicateResults = checkDuplicates(transactions);
      setDuplicates(duplicateResults);

      // Set all transactions as selected by default
      setSelectedTransactions(transactions.map(t => t.id));
      setParsedTransactions(transactions);
      setDocumentInfo(docInfo);
      setShowPreview(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportSelected = async () => {
    if (selectedTransactions.length === 0) {
      setError("Please select at least one transaction to import.");
      return;
    }

    setIsProcessing(true);
    setProcessingStep("Importing transactions...");

    try {
      const transactionsToImport = parsedTransactions.filter(t =>
        selectedTransactions.includes(t.id)
      );

      await addTransactions(transactionsToImport);
      setProcessingStep("Import completed successfully!");

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Close modal after successful import
      setTimeout(() => {
        onClose();
        setError("");
        setProcessingStep("");
        setShowPreview(false);
        setParsedTransactions([]);
        setDocumentInfo(null);
        setDuplicates([]);
        setSelectedTransactions([]);
      }, 1500);
    } catch (err) {
      setError(`Failed to import transactions: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransactionToggle = transactionId => {
    setSelectedTransactions(prev =>
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTransactions(parsedTransactions.map(t => t.id));
  };

  const handleSelectNone = () => {
    setSelectedTransactions([]);
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setError("");
      setProcessingStep("");
      setShowPreview(false);
      setParsedTransactions([]);
      setDocumentInfo(null);
      setDuplicates([]);
      setSelectedTransactions([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getFileIcon = fileType => {
    if (fileType.includes("image")) return <Image className="w-5 h-5" />;
    if (fileType.includes("pdf")) return <FileText className="w-5 h-5" />;
    if (fileType.includes("csv"))
      return <FileSpreadsheet className="w-5 h-5" />;
    return <Upload className="w-5 h-5" />;
  };

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {showPreview
              ? "Review & Import Transactions"
              : "Import Bank Statement"}
          </h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {!showPreview ? (
            // Upload Interface
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Import Bank Statement
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Upload a CSV, PDF, or image to automatically import your
                  transactions. AI-powered analysis for receipts and statements.
                </p>
              </div>

              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.pdf,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-all rounded-lg text-white font-medium disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {isProcessing ? processingStep : "Choose File"}
                </button>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Supported formats: CSV, PDF, Images (JPG, PNG, GIF, WebP) with
                  AI analysis
                </div>
              </div>
            </div>
          ) : (
            // Preview Interface
            <div className="space-y-6">
              {/* Document Info */}
              {documentInfo && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    {getFileIcon(documentInfo.type)}
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        {documentInfo.type}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Source: {documentInfo.source} • Confidence:{" "}
                        {documentInfo.confidence}
                      </p>
                      {documentInfo.notes && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          {documentInfo.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Duplicate Warning */}
              {duplicates.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                        Potential Duplicates Found
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        {duplicates.length} transaction(s) may already exist in
                        your database. Review and select which transactions you
                        want to import.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction List */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Transactions ({parsedTransactions.length})
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleSelectNone}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Select None
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {parsedTransactions.map(transaction => {
                    const isDuplicate = duplicates.some(
                      d => d.new.id === transaction.id
                    );
                    const isSelected = selectedTransactions.includes(
                      transaction.id
                    );

                    return (
                      <div
                        key={transaction.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        } ${isDuplicate ? "border-yellow-300 dark:border-yellow-600" : ""}`}
                        onClick={() => handleTransactionToggle(transaction.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleTransactionToggle(transaction.id)
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {transaction.description}
                            </p>
                            {isDuplicate && (
                              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>{formatDate(transaction.date)}</span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                transaction.type === "income"
                                  ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                                  : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                              }`}
                            >
                              {transaction.type}
                            </span>
                            <span>{transaction.category}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p
                            className={`font-medium ${
                              transaction.type === "income"
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportSelected}
                  disabled={isProcessing || selectedTransactions.length === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {processingStep}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Import Selected ({selectedTransactions.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium mb-1">Import Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatementImporter;
