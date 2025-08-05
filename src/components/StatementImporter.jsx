import React, { useState, useCallback, useEffect } from "react";
import { useSettings } from "../contexts/SettingsContext";
import {
  Upload,
  FileText,
  Image,
  AlertCircle,
  CheckCircle,
  X,
  Settings,
  Calendar,
  Info,
} from "lucide-react";
import { parseStatement } from "../utils/statementParser";
import aiService from "../services/aiService";
import EnhancedAccountAssignmentModal from "./EnhancedAccountAssignmentModal";

// Custom scrollbar styles
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.5);
    border-radius: 4px;
    transition: background 0.2s ease;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.8);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(75, 85, 99, 0.5);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(75, 85, 99, 0.8);
  }
  
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }
  
  .dark .custom-scrollbar {
    scrollbar-color: rgba(75, 85, 99, 0.5) transparent;
  }
`;

const StatementImporter = ({
  isOpen,
  onClose,
  onImportComplete,
  onAccountAssignmentComplete,
  isMobile = false,
}) => {
  // Get AI provider from settings
  const { settings } = useSettings();

  // Set the AI provider based on settings
  useEffect(() => {
    if (settings.aiProvider) {
      aiService.setProvider(settings.aiProvider);
    }
  }, [settings.aiProvider]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const [processingSummary, setProcessingSummary] = useState(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState([]);
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [importOptions, setImportOptions] = useState({
    userSpecifiedYear: null,
    statementStartDate: null,
    statementEndDate: null,
    allowFutureDates: false,
    autoDetectYear: true,
  });
  const [progressAnimationId, setProgressAnimationId] = useState(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [showAccountAssignment, setShowAccountAssignment] = useState(false);
  const [transactionsForAssignment, setTransactionsForAssignment] = useState(
    []
  );

  // Smooth progress animation system
  const animateProgress = useCallback(
    (targetProgress, duration = 1200) => {
      // Clear any existing animation
      if (progressAnimationId) {
        cancelAnimationFrame(progressAnimationId);
      }

      const startProgress = displayProgress;
      const startTime = performance.now();

      const animate = currentTime => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Use easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentDisplayProgress =
          startProgress + (targetProgress - startProgress) * easeOutCubic;

        setDisplayProgress(currentDisplayProgress);

        if (progress < 1) {
          const animationId = requestAnimationFrame(animate);
          setProgressAnimationId(animationId);
        } else {
          setProgressAnimationId(null);
        }
      };

      const animationId = requestAnimationFrame(animate);
      setProgressAnimationId(animationId);
    },
    [displayProgress, progressAnimationId]
  );

  // Update progress with smooth animation
  const updateProgress = useCallback(
    (progress, step = "") => {
      setProcessingStep(step);

      // Add a small delay to make the progress feel more natural
      setTimeout(() => {
        animateProgress(progress);
      }, 100);
    },
    [animateProgress]
  );

  // Enhanced file validation
  const validateFile = file => {
    if (!file) {
      throw new Error("Please select a file to import.");
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error("File size must be less than 10MB.");
    }

    const allowedTypes = [
      "text/csv",
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(file.type) &&
      !file.name.toLowerCase().endsWith(".csv")
    ) {
      throw new Error(
        "Please select a valid file type: CSV, PDF, or image files (JPEG, PNG, GIF, WebP)."
      );
    }
  };

  // Apply import options to transactions
  const applyImportOptionsToTransactions = useCallback(
    transactions => {
      return transactions
        .map(transaction => {
          let updatedTransaction = { ...transaction };

          // Apply user-specified year if provided
          if (importOptions.userSpecifiedYear && transaction.date) {
            const currentDate = new Date(transaction.date);
            const updatedDate = new Date(
              importOptions.userSpecifiedYear,
              currentDate.getMonth(),
              currentDate.getDate()
            );
            updatedTransaction.date = updatedDate;
          }

          // Filter by statement period if provided
          if (
            importOptions.statementStartDate ||
            importOptions.statementEndDate
          ) {
            const transactionDate = new Date(updatedTransaction.date);
            const startDate = importOptions.statementStartDate
              ? new Date(importOptions.statementStartDate)
              : null;
            const endDate = importOptions.statementEndDate
              ? new Date(importOptions.statementEndDate)
              : null;

            if (startDate && transactionDate < startDate) {
              return null; // Filter out transactions before start date
            }
            if (endDate && transactionDate > endDate) {
              return null; // Filter out transactions after end date
            }
          }

          // Filter future dates if not allowed
          if (!importOptions.allowFutureDates && transaction.date) {
            const transactionDate = new Date(updatedTransaction.date);
            const now = new Date();
            if (transactionDate > now) {
              return null; // Filter out future transactions
            }
          }

          return updatedTransaction;
        })
        .filter(Boolean); // Remove null transactions
    },
    [importOptions]
  );

  // Enhanced file processing with better progress tracking
  const processFile = useCallback(
    async file => {
      // Reset all states at the beginning
      setIsProcessing(true);
      setError("");
      setProcessingStep("");
      setProcessingSummary(null);
      setShowAllTransactions(false);
      setParsedTransactions([]);

      try {
        // Validate file
        validateFile(file);
        updateProgress(5, "Validating file...");

        let transactions = [];
        let summary = null;

        // Process based on file type
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          updateProgress(15, "Parsing CSV file...");

          // Use import options for date parsing
          const parsingOptions = {
            userSpecifiedYear: importOptions.userSpecifiedYear,
            statementStartDate: importOptions.statementStartDate,
            statementEndDate: importOptions.statementEndDate,
            allowFutureDates: importOptions.allowFutureDates,
          };

          transactions = await parseStatement(file, parsingOptions);
          updateProgress(45, "Processing transactions...");

          // Apply import options to CSV transactions
          transactions = applyImportOptionsToTransactions(transactions);
          updateProgress(65, "Validating transaction data...");

          summary = {
            documentType: "CSV File",
            source: file.name,
            confidence: "high",
            quality: "excellent",
            transactionCount: transactions.length,
            dateRange:
              Array.isArray(transactions) && transactions.length > 0
                ? {
                    start: new Date(
                      Math.min(...transactions.map(t => new Date(t.date)))
                    ),
                    end: new Date(
                      Math.max(...transactions.map(t => new Date(t.date)))
                    ),
                  }
                : null,
          };
        } else if (
          file.type === "application/pdf" ||
          file.name.endsWith(".pdf") ||
          file.type.startsWith("image/")
        ) {
          updateProgress(15, "Uploading document...");

          updateProgress(30, "Analyzing document with AI...");

          // Use unified AI service for PDF and image analysis
          const result = await aiService.analyzeImage(file);
          updateProgress(55, "Processing AI results...");

          if (result.transactions && result.transactions.length > 0) {
            transactions = await aiService.convertToTransactions(result);
            updateProgress(70, "Validating transaction data...");

            // Apply import options to AI-generated transactions
            transactions = applyImportOptionsToTransactions(transactions);

            summary = aiService.getProcessingSummary(result);
          } else {
            throw new Error(
              "No transactions found in the document. Please try a clearer document or different file."
            );
          }
        } else {
          throw new Error("Unsupported file type.");
        }

        updateProgress(80, "Preparing results...");

        // Check if transactions were found before setting states
        if (transactions.length === 0) {
          setError("No transactions found in the file.");
          setIsProcessing(false);
          setProcessingStep("");
          return;
        }

        // Set the parsed transactions for review
        setParsedTransactions(Array.isArray(transactions) ? transactions : []);
        setProcessingSummary(summary);
        setShowAllTransactions(true);

        updateProgress(95, "Finalizing analysis...");

        // Add a delay to show 100% completion before moving to next step
        setTimeout(() => {
          updateProgress(100, "Analysis complete!");

          // Keep at 100% for a moment before completing
          setTimeout(() => {
            setIsProcessing(false);
          }, 800);
        }, 500);
      } catch (error) {
        setError(
          error.message || "An error occurred while processing the file."
        );
        setProcessingStep("");
        setParsedTransactions([]);
        setProcessingSummary(null);
        setShowAllTransactions(false);
      } finally {
        setIsProcessing(false);
      }
    },
    [importOptions, applyImportOptionsToTransactions, updateProgress]
  );

  const handleFileSelect = useCallback(
    event => {
      const file = event.target.files[0];
      if (file && !isProcessing) {
        // Reset the file input to allow selecting the same file again
        event.target.value = "";
        processFile(file);
      }
    },
    [processFile, isProcessing]
  );

  const handleImportSelected = async () => {
    try {
      const selectedTransactions = Array.isArray(parsedTransactions)
        ? parsedTransactions.filter(t => t.selected)
        : [];

      if (selectedTransactions.length === 0) {
        throw new Error("Please select at least one transaction to import.");
      }

      // Show account assignment modal instead of importing directly
      setTransactionsForAssignment(selectedTransactions);
      setShowAccountAssignment(true);
    } catch (error) {
      setError(
        error.message || "An error occurred while importing transactions."
      );
    }
  };

  const handleImportAll = async () => {
    try {
      if (
        !Array.isArray(parsedTransactions) ||
        parsedTransactions.length === 0
      ) {
        throw new Error("No transactions to import.");
      }

      // Show account assignment modal instead of importing directly
      setTransactionsForAssignment(parsedTransactions);
      setShowAccountAssignment(true);
    } catch (error) {
      setError(
        error.message || "An error occurred while importing transactions."
      );
    }
  };

  // Reset state when modal closes or completes
  const resetState = useCallback(() => {
    // Clear any ongoing animation
    if (progressAnimationId) {
      cancelAnimationFrame(progressAnimationId);
      setProgressAnimationId(null);
    }

    setIsProcessing(false);
    setError("");
    setProcessingStep("");
    setProcessingSummary(null);
    setShowAllTransactions(false);
    setParsedTransactions([]);
    setShowImportOptions(false);
    setImportOptions({
      userSpecifiedYear: null,
      statementStartDate: null,
      statementEndDate: null,
      allowFutureDates: false,
      autoDetectYear: true,
    });
  }, [progressAnimationId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Clean up when modal closes
      resetState();
    }
  }, [isOpen, resetState]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      if (progressAnimationId) {
        cancelAnimationFrame(progressAnimationId);
      }
    };
  }, [progressAnimationId]);

  const toggleTransactionSelection = index => {
    if (!Array.isArray(parsedTransactions)) {
      return;
    }
    const updatedTransactions = [...parsedTransactions];
    if (updatedTransactions[index]) {
      updatedTransactions[index].selected =
        !updatedTransactions[index].selected;
      setParsedTransactions(updatedTransactions);
    }
  };

  const toggleAllTransactions = () => {
    const allSelected =
      Array.isArray(parsedTransactions) &&
      parsedTransactions.every(t => t.selected);
    const updatedTransactions = Array.isArray(parsedTransactions)
      ? parsedTransactions.map(t => ({
          ...t,
          selected: !allSelected,
        }))
      : [];
    setParsedTransactions(updatedTransactions);
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

  const handleAccountAssignmentComplete = assignedTransactions => {
    // Call the appropriate callback based on what's available
    if (onAccountAssignmentComplete) {
      onAccountAssignmentComplete(assignedTransactions);
    } else {
      onImportComplete(assignedTransactions);
    }
    setShowAccountAssignment(false);
    setTransactionsForAssignment([]);
    resetState();
  };

  const handleAccountAssignmentClose = () => {
    setShowAccountAssignment(false);
    setTransactionsForAssignment([]);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <style>{customScrollbarStyles}</style>

      {/* Backdrop - Simple fixed overlay like FAB modal */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`fixed z-50 ${
          isMobile
            ? "inset-0 bg-white dark:bg-gray-800"
            : "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b border-gray-200 dark:border-gray-700 ${
            isMobile ? "p-4" : "p-6"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Import Statement
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload your bank or credit card statement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div
          className={`overflow-y-auto custom-scrollbar ${
            isMobile ? "flex-1 p-4" : "p-6 max-h-[calc(90vh-120px)]"
          }`}
        >
          {!isProcessing && !showAllTransactions && (
            <div className="space-y-6">
              {/* Import Options - Moved to upload section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Import Options
                  </h3>
                  <button
                    onClick={() => setShowImportOptions(!showImportOptions)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    {showImportOptions ? "Hide Options" : "Show Options"}
                    {showImportOptions ? (
                      <span className="text-xs">▼</span>
                    ) : (
                      <span className="text-xs">▶</span>
                    )}
                  </button>
                </div>

                {showImportOptions && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl custom-scrollbar">
                    {/* Year Specification */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Year for Ambiguous Dates (e.g., &quot;06/21&quot;)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="2000"
                          max="2030"
                          value={importOptions.userSpecifiedYear || ""}
                          onChange={e =>
                            setImportOptions(prev => ({
                              ...prev,
                              userSpecifiedYear: e.target.value
                                ? parseInt(e.target.value)
                                : null,
                            }))
                          }
                          placeholder="e.g., 2024"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() =>
                            setImportOptions(prev => ({
                              ...prev,
                              userSpecifiedYear: new Date().getFullYear(),
                            }))
                          }
                          className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          Current Year
                        </button>
                        <button
                          onClick={() =>
                            setImportOptions(prev => ({
                              ...prev,
                              userSpecifiedYear: null,
                            }))
                          }
                          className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Auto-detect
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Leave empty to auto-detect based on statement context
                        and current date
                      </p>
                    </div>

                    {/* Statement Period */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Statement Start Date
                        </label>
                        <input
                          type="date"
                          value={
                            importOptions.statementStartDate
                              ? importOptions.statementStartDate
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={e =>
                            setImportOptions(prev => ({
                              ...prev,
                              statementStartDate: e.target.value
                                ? new Date(e.target.value)
                                : null,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Statement End Date
                        </label>
                        <input
                          type="date"
                          value={
                            importOptions.statementEndDate
                              ? importOptions.statementEndDate
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={e =>
                            setImportOptions(prev => ({
                              ...prev,
                              statementEndDate: e.target.value
                                ? new Date(e.target.value)
                                : null,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Allow Future Dates */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="allowFutureDates"
                        checked={importOptions.allowFutureDates}
                        onChange={e =>
                          setImportOptions(prev => ({
                            ...prev,
                            allowFutureDates: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label
                        htmlFor="allowFutureDates"
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        Allow future dates (for pending transactions)
                      </label>
                    </div>

                    {/* Info Box */}
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">
                          Smart Date Detection:
                        </p>
                        <ul className="space-y-1">
                          <li>
                            • &quot;06/21&quot; → June 21st, 2024 (current year)
                          </li>
                          <li>
                            • &quot;12/25&quot; → December 25th, 2023 (previous
                            year if in future)
                          </li>
                          <li>
                            • Statement period helps determine correct year
                          </li>
                          <li>• Specify year manually for complete control</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Upload your statement
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Drop your file here or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".csv,.pdf,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("file-upload").click()
                      }
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Choose File
                    </button>
                  </div>
                </div>
              </div>

              {/* Supported Formats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      CSV Files
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Bank statements, credit card statements, and transaction
                    exports
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      PDF Files
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Bank statements and credit card statements in PDF format
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Image className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Images
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Screenshots and photos of statements (JPEG, PNG, GIF, WebP)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="space-y-6">
              <div className="text-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    displayProgress >= 100
                      ? "bg-green-100 dark:bg-green-900/20"
                      : "bg-blue-100 dark:bg-blue-900/20 animate-pulse"
                  }`}
                >
                  {displayProgress >= 100 ? (
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Processing your statement
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {displayProgress >= 100
                    ? "Preparing to show results..."
                    : processingStep}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ease-out relative ${
                      displayProgress >= 100 ? "bg-green-600" : "bg-blue-600"
                    }`}
                    style={{ width: `${displayProgress}%` }}
                  >
                    {/* Add a subtle shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {Math.round(displayProgress)}% complete
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {showAllTransactions && !isProcessing && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Analysis Results
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Review and select transactions to import
                </p>
              </div>
              {/* Summary */}
              {processingSummary && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-medium text-green-800 dark:text-green-200">
                      Import Summary
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      qq
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        {processingSummary.transactionCount}
                      </p>
                      <p className="text-green-700 dark:text-green-300">
                        Transactions
                      </p>
                    </div>
                    <div>
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        {processingSummary.confidence}
                      </p>
                      <p className="text-green-700 dark:text-green-300">
                        Confidence
                      </p>
                    </div>
                    <div>
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        {processingSummary.quality}
                      </p>
                      <p className="text-green-700 dark:text-green-300">
                        Quality
                      </p>
                    </div>
                    <div>
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        {processingSummary.source}
                      </p>
                      <p className="text-green-700 dark:text-green-300">
                        Source
                      </p>
                    </div>
                  </div>
                  {processingSummary.dateRange && (
                    <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Date Range:{" "}
                        {formatDate(processingSummary.dateRange.start)} -{" "}
                        {formatDate(processingSummary.dateRange.end)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction List */}
              <div className="space-y-4 custom-scrollbar">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Review Transactions
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleAllTransactions}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {parsedTransactions.every(t => t.selected)
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2">
                  {Array.isArray(parsedTransactions)
                    ? parsedTransactions.map((transaction, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                            transaction.selected
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                              : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                          onClick={() => toggleTransactionSelection(index)}
                        >
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={transaction.selected}
                              onChange={() => toggleTransactionSelection(index)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              onClick={e => e.stopPropagation()}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {transaction.description}
                                </p>
                                <p
                                  className={`font-semibold ${
                                    transaction.amount > 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {formatCurrency(transaction.amount)}
                                </p>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>{formatDate(transaction.date)}</span>
                                <span className="capitalize">
                                  {transaction.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    : null}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleImportSelected}
                    disabled={
                      Array.isArray(parsedTransactions) &&
                      parsedTransactions.filter(t => t.selected).length === 0
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Import Selected (
                    {Array.isArray(parsedTransactions)
                      ? parsedTransactions.filter(t => t.selected).length
                      : 0}
                    )
                  </button>
                  <button
                    onClick={handleImportAll}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Import{" "}
                    {Array.isArray(parsedTransactions)
                      ? parsedTransactions.length
                      : 0}{" "}
                    Transactions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-200">
                    Import Error
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Assignment Modal */}
      <EnhancedAccountAssignmentModal
        isOpen={showAccountAssignment}
        onClose={handleAccountAssignmentClose}
        transactions={transactionsForAssignment}
        onComplete={handleAccountAssignmentComplete}
      />
    </>
  );
};

export default StatementImporter;
