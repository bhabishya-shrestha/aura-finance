import React, { useState, useCallback, useEffect } from "react";
import {
  Upload,
  FileText,
  Image,
  AlertCircle,
  CheckCircle,
  X,
  Settings,
  Calendar,
} from "lucide-react";
import { parseStatement } from "../utils/statementParser";
import aiService from "../services/aiService";
import useStore from "../store";
import MobileAccountAssignmentModal from "./MobileAccountAssignmentModal";

const MobileStatementImporter = ({ isOpen, onClose, onImportComplete }) => {
  const { addTransactions, addNotification } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const [processingSummary, setProcessingSummary] = useState(null);
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
      if (progressAnimationId) {
        cancelAnimationFrame(progressAnimationId);
      }

      const startProgress = displayProgress;
      const startTime = performance.now();

      const animate = currentTime => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
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

  const updateProgress = useCallback(
    (progress, step = "") => {
      setProcessingStep(step);
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

          if (importOptions.userSpecifiedYear && transaction.date) {
            const currentDate = new Date(transaction.date);
            const updatedDate = new Date(
              importOptions.userSpecifiedYear,
              currentDate.getMonth(),
              currentDate.getDate()
            );
            updatedTransaction.date = updatedDate;
          }

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
              return null;
            }
            if (endDate && transactionDate > endDate) {
              return null;
            }
          }

          if (!importOptions.allowFutureDates && transaction.date) {
            const transactionDate = new Date(transaction.date);
            const now = new Date();
            if (transactionDate > now) {
              return null;
            }
          }

          return updatedTransaction;
        })
        .filter(Boolean);
    },
    [importOptions]
  );

  // Enhanced file processing with better progress tracking
  const processFile = useCallback(
    async file => {
      setIsProcessing(true);
      setError("");
      setProcessingStep("");
      setProcessingSummary(null);
      setParsedTransactions([]);

      try {
        validateFile(file);
        updateProgress(5, "Validating file...");

        let transactions = [];
        let summary = null;

        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          updateProgress(15, "Parsing CSV file...");

          const parsingOptions = {
            userSpecifiedYear: importOptions.userSpecifiedYear,
            statementStartDate: importOptions.statementStartDate,
            statementEndDate: importOptions.statementEndDate,
            allowFutureDates: importOptions.allowFutureDates,
          };

          transactions = await parseStatement(file, parsingOptions);
          updateProgress(45, "Processing transactions...");

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

          // Check which AI provider is being used
          const currentProvider = aiService.getCurrentProvider();
          updateProgress(
            30,
            `Analyzing document with ${currentProvider.name}...`
          );

          try {
            // Add timeout for AI processing
            const aiProcessingPromise = aiService.analyzeImage(file);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new Error("AI processing timed out. Please try again.")
                  ),
                60000
              )
            );

            // Add intermediate progress updates
            const progressInterval = setInterval(() => {
              const currentProgress = displayProgress;
              if (currentProgress >= 30 && currentProgress < 50) {
                updateProgress(
                  currentProgress + 2,
                  `${currentProvider.name} is analyzing your document...`
                );
              }
            }, 2000);

            const result = await Promise.race([
              aiProcessingPromise,
              timeoutPromise,
            ]);

            clearInterval(progressInterval);
            console.log("✅ AI analysis completed:", result);

            // Check if fallback was used
            if (
              result.serverUsageValidation &&
              result.serverUsageValidation.fallbackUsed
            ) {
              console.log(
                "🔄 Fallback provider was used:",
                result.serverUsageValidation
              );
            }

            updateProgress(55, "Processing AI results...");

            if (
              result &&
              result.transactions &&
              result.transactions.length > 0
            ) {
              transactions = await aiService.convertToTransactions(result);
              console.log("✅ Transactions converted:", transactions.length);
              updateProgress(70, "Validating transaction data...");

              transactions = applyImportOptionsToTransactions(transactions);

              summary = aiService.getProcessingSummary(result);
            } else {
              throw new Error(
                "No transactions found in the document. Please try a clearer document or different file."
              );
            }
          } catch (aiError) {
            console.error("❌ AI processing failed:", aiError);

            // Check if it's a timeout or API error
            if (
              aiError.message.includes("timed out") ||
              aiError.message.includes("API")
            ) {
              throw new Error(
                `AI processing failed: ${aiError.message}. Please try switching to a different AI provider in settings or try again later.`
              );
            } else if (aiError.message.includes("Daily limit exceeded")) {
              throw new Error(
                `Daily limit exceeded for ${currentProvider.name}. Please switch to a different AI provider in settings or try again tomorrow.`
              );
            } else if (aiError.message.includes("not available")) {
              throw new Error(
                `${currentProvider.name} is not available. Please check your API key or switch to a different provider in settings.`
              );
            } else {
              throw new Error(
                `AI analysis failed: ${aiError.message}. Please try a different document or switch AI providers.`
              );
            }
          }
        } else {
          throw new Error("Unsupported file type.");
        }

        updateProgress(80, "Preparing results...");

        if (transactions.length === 0) {
          setError("No transactions found in the file.");
          setIsProcessing(false);
          setProcessingStep("");
          return;
        }

        // Defensive setParsedTransactions
        setParsedTransactions(Array.isArray(transactions) ? transactions : []);
        setProcessingSummary(summary);

        updateProgress(95, "Finalizing analysis...");

        setTimeout(() => {
          updateProgress(100, "Analysis complete!");
          setTimeout(() => {
            setIsProcessing(false);
            setCurrentStep(3); // Move to review step
          }, 800);
        }, 500);
      } catch (error) {
        setError(
          error.message || "An error occurred while processing the file."
        );
        setProcessingStep("");
        setParsedTransactions([]);
        setProcessingSummary(null);
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
        event.target.value = "";
        setCurrentStep(2); // Move to processing step
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

  const handleImportComplete = async transactions => {
    try {
      await addTransactions(transactions);

      // Add success notification
      addNotification({
        title: "Import Successful",
        message: `Successfully imported ${transactions.length} transactions from your statement.`,
        type: "success",
        action: () => {
          // Could navigate to transactions page
          onClose();
        },
      });

      onImportComplete(transactions);
      onClose();
    } catch (error) {
      setError("Failed to import transactions. Please try again.");

      // Add error notification
      addNotification({
        title: "Import Failed",
        message:
          "There was an error importing your transactions. Please try again.",
        type: "error",
      });
    }
  };

  const handleAccountAssignmentComplete = assignedTransactions => {
    // Call the original handleImportComplete with the assigned transactions
    handleImportComplete(assignedTransactions);
    setShowAccountAssignment(false);
    setTransactionsForAssignment([]);
  };

  const handleAccountAssignmentClose = () => {
    setShowAccountAssignment(false);
    setTransactionsForAssignment([]);
  };
  const resetState = useCallback(() => {
    if (progressAnimationId) {
      cancelAnimationFrame(progressAnimationId);
      setProgressAnimationId(null);
    }

    setIsProcessing(false);
    setError("");
    setProcessingStep("");
    setProcessingSummary(null);
    setParsedTransactions([]);
    setShowImportOptions(false);
    setCurrentStep(1);
    setDisplayProgress(0);
    setImportOptions({
      userSpecifiedYear: null,
      statementStartDate: null,
      statementEndDate: null,
      allowFutureDates: false,
      autoDetectYear: true,
    });
  }, [progressAnimationId]);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

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
      ? parsedTransactions.map(t => ({ ...t, selected: !allSelected }))
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

  if (!isOpen) {
    return null;
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Import Statement
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your bank or credit card statement
        </p>
      </div>

      {/* Import Options */}
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
            {showImportOptions ? "Hide" : "Show"}
          </button>
        </div>

        {showImportOptions && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            {/* Year Specification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Year for Ambiguous Dates
              </label>
              <div className="flex items-center gap-2">
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
                  Current
                </button>
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
                Allow future dates
              </label>
            </div>
          </div>
        )}
      </div>

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
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
              onClick={() => document.getElementById("file-upload").click()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Choose File
            </button>
          </div>
        </div>
      </div>

      {/* Supported Formats */}
      <div className="grid grid-cols-1 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              CSV Files
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Bank statements, credit card statements, and transaction exports
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
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Header */}
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Processing Statement
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
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
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {Math.round(displayProgress)}% complete
        </p>
      </div>

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
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Analysis Complete
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
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
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-green-600 dark:text-green-400 font-medium">
                {processingSummary.transactionCount}
              </p>
              <p className="text-green-700 dark:text-green-300">Transactions</p>
            </div>
            <div>
              <p className="text-green-600 dark:text-green-400 font-medium">
                {processingSummary.confidence}
              </p>
              <p className="text-green-700 dark:text-green-300">Confidence</p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Review Transactions
          </h3>
          <button
            onClick={toggleAllTransactions}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {Array.isArray(parsedTransactions) &&
            parsedTransactions.every(t => t.selected)
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
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
      <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleImportSelected}
          disabled={
            Array.isArray(parsedTransactions) &&
            parsedTransactions.filter(t => t.selected).length === 0
          }
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Import Selected (
          {Array.isArray(parsedTransactions)
            ? parsedTransactions.filter(t => t.selected).length
            : 0}
          )
        </button>
        <button
          onClick={handleImportAll}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Import All{" "}
          {Array.isArray(parsedTransactions) ? parsedTransactions.length : 0}{" "}
          Transactions
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Import Statement
          </h1>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Account Assignment Modal */}
      <MobileAccountAssignmentModal
        isOpen={showAccountAssignment}
        onClose={handleAccountAssignmentClose}
        transactions={transactionsForAssignment}
        onComplete={handleAccountAssignmentComplete}
      />
    </div>
  );
};

export default MobileStatementImporter;
