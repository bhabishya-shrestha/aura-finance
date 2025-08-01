import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  AlertCircle,
  X,
  CheckCircle,
  FileText,
  Image,
  FileSpreadsheet,
  Loader2,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { parseStatement } from "../utils/statementParser";
import geminiService from "../services/geminiService";
import useStore from "../store";
import DuplicateReviewModal from "./DuplicateReviewModal";

const StatementImporter = ({ isOpen, onClose }) => {
  const { addTransactions, checkForDuplicates } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [processingSummary, setProcessingSummary] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateResults, setDuplicateResults] = useState(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [editableSummary, setEditableSummary] = useState(null);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const fileInputRef = useRef(null);

  // Enhanced file validation
  const validateFile = useCallback(file => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
      "text/csv",
    ];

    if (file.size > maxSize) {
      throw new Error("File size too large. Maximum 20MB allowed.");
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Unsupported file format. Please upload an image (JPG, PNG, GIF, WebP, HEIC) or PDF."
      );
    }

    return true;
  }, []);

  // Format file size
  const formatFileSize = useCallback(bytes => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // Get file type icon
  const getFileIcon = useCallback(file => {
    if (file.type.startsWith("image/")) return <Image className="w-5 h-5" />;
    if (file.type === "application/pdf")
      return <FileText className="w-5 h-5" />;
    if (file.type === "text/csv")
      return <FileSpreadsheet className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  }, []);

  // Enhanced file processing with better progress tracking
  const processFile = useCallback(
    async file => {
      setIsProcessing(true);
      setError("");
              setProcessingProgress(0);
        setProcessingSummary(null);
        setShowAllTransactions(false);

      try {
        // Validate file
        validateFile(file);
        setProcessingProgress(10);
        setProcessingStep("Validating file...");

        let transactions = [];
        let summary = null;

        // Process based on file type
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          setProcessingProgress(30);
          setProcessingStep("Parsing CSV file...");

          transactions = await parseStatement(file);
          summary = {
            documentType: "CSV File",
            source: file.name,
            confidence: "high",
            quality: "excellent",
            transactionCount: transactions.length,
          };
        } else if (
          file.type === "application/pdf" ||
          file.name.endsWith(".pdf") ||
          file.type.startsWith("image/")
        ) {
          setProcessingProgress(40);
          setProcessingStep("Analyzing document with AI...");

          // Use enhanced Gemini for PDF and image analysis
          const result = await geminiService.analyzeImage(file);
          setProcessingProgress(80);

          if (result.transactions && result.transactions.length > 0) {
            transactions = geminiService.convertToTransactions(result);
            summary = geminiService.getProcessingSummary(result);
          } else {
            throw new Error(
              "No transactions found in the document. Please try a clearer document or different file."
            );
          }
        } else {
          throw new Error(
            "Unsupported file format. Please upload a CSV, PDF, or image file."
          );
        }

        setProcessingProgress(90);
        setProcessingStep("Preparing results...");

        if (transactions.length === 0) {
          throw new Error("No transactions found in the file.");
        }

        // Set preview data
        setPreviewData({
          transactions,
          summary,
          fileName: file.name,
          fileSize: formatFileSize(file.size),
        });

        setProcessingProgress(100);
        setProcessingStep("Analysis complete!");
        setProcessingSummary(summary);

        // Auto-show preview for small transaction sets
        if (transactions.length <= 10) {
          setShowPreview(true);
        }
      } catch (err) {
        setError(err.message);
        setProcessingProgress(0);
      } finally {
        setIsProcessing(false);
      }
    },
    [validateFile, formatFileSize]
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    async event => {
      const file = event.target.files[0];
      if (!file) return;

      setSelectedFile(file);
      await processFile(file);
    },
    [processFile]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    async event => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (!file) return;

      setSelectedFile(file);
      await processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback(event => {
    event.preventDefault();
  }, []);

  // Reset and close
  const handleClose = useCallback(() => {
    if (!isProcessing) {
      onClose();
      setError("");
      setProcessingStep("");
      setProcessingProgress(0);
      setPreviewData(null);
      setShowPreview(false);
      setShowAllTransactions(false);
      setSelectedFile(null);
      setProcessingSummary(null);
      setShowDuplicateModal(false);
      setDuplicateResults(null);
      setIsEditingSummary(false);
      setEditableSummary(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isProcessing, onClose]);

  // Import transactions with duplicate detection
  const handleImport = useCallback(async () => {
    if (!previewData?.transactions) return;

    try {
      setIsProcessing(true);
      setProcessingStep("Checking for duplicates...");

      // Check for duplicates
      const results = await checkForDuplicates(previewData.transactions, {
        dateTolerance: 1,
        amountTolerance: 0.01,
        descriptionSimilarityThreshold: 0.8,
        requireExactCategory: false,
      });

      setDuplicateResults(results);

      if (results.duplicates.length > 0) {
        // Show duplicate review modal
        setShowDuplicateModal(true);
        setProcessingStep("Duplicates found - review required");
      } else {
        // No duplicates, import directly
        setProcessingStep("Importing transactions...");
        await addTransactions(previewData.transactions);
        setProcessingStep("Import completed successfully!");

        // Reset and close after successful import
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (error) {
      setError("Failed to import transactions: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [previewData, checkForDuplicates, addTransactions, handleClose]);

  // Handle duplicate review confirmation
  const handleDuplicateConfirm = useCallback(
    async selectedTransactions => {
      try {
        setIsProcessing(true);
        setProcessingStep("Importing selected transactions...");

        await addTransactions(selectedTransactions);

        setProcessingStep("Import completed successfully!");
        setShowDuplicateModal(false);

        // Reset and close after successful import
        setTimeout(() => {
          handleClose();
        }, 1500);
      } catch (error) {
        setError("Failed to import transactions: " + error.message);
      } finally {
        setIsProcessing(false);
      }
    },
    [addTransactions, handleClose]
  );

  // Handle skipping all duplicates
  const handleSkipAllDuplicates = useCallback(
    async nonDuplicates => {
      try {
        setIsProcessing(true);
        setProcessingStep("Importing non-duplicate transactions...");

        await addTransactions(nonDuplicates);

        setProcessingStep("Import completed successfully!");
        setShowDuplicateModal(false);

        // Reset and close after successful import
        setTimeout(() => {
          handleClose();
        }, 1500);
      } catch (error) {
        setError("Failed to import transactions: " + error.message);
      } finally {
        setIsProcessing(false);
      }
    },
    [addTransactions, handleClose]
  );

  // Get confidence color
  const getConfidenceColor = useCallback(confidence => {
    switch (confidence) {
      case "high":
        return "text-green-600 dark:text-green-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "low":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  }, []);

  // Get quality color
  const getQualityColor = useCallback(quality => {
    switch (quality) {
      case "excellent":
        return "text-green-600 dark:text-green-400";
      case "good":
        return "text-blue-600 dark:text-blue-400";
      case "fair":
        return "text-yellow-600 dark:text-yellow-400";
      case "poor":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  }, []);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Import Financial Documents
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Upload statements, receipts, or invoices to automatically import
              transactions
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {!previewData ? (
            /* Upload Section */
            <div className="space-y-6">
              {/* File Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Drop your file here or click to browse
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Support for PDF, CSV, and image files (JPG, PNG, GIF,
                      WebP, HEIC)
                    </p>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-all rounded-lg text-white font-medium disabled:cursor-not-allowed"
                  >
                    Choose File
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.pdf,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Processing Status */}
              {isProcessing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {processingStep}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {processingProgress}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-600 dark:text-red-400 font-medium">
                      Import Error
                    </p>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* File Info */}
              {selectedFile && !isProcessing && !error && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
                  {getFileIcon(selectedFile)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Preview Section */
            <div className="space-y-6">
              {/* Processing Summary */}
              {processingSummary && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">
                          Analysis Results
                        </h4>
                        <button
                          onClick={() => {
                            if (isEditingSummary) {
                              // Save changes
                              setProcessingSummary(editableSummary);
                              setIsEditingSummary(false);
                            } else {
                              // Start editing
                              setEditableSummary(processingSummary);
                              setIsEditingSummary(true);
                            }
                          }}
                          className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          {isEditingSummary ? "Save" : "Edit"}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Document Type:
                          </span>
                          {isEditingSummary ? (
                            <input
                              type="text"
                              value={editableSummary.documentType}
                              onChange={(e) => setEditableSummary({
                                ...editableSummary,
                                documentType: e.target.value
                              })}
                              className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ) : (
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {processingSummary.documentType}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Source:
                          </span>
                          {isEditingSummary ? (
                            <input
                              type="text"
                              value={editableSummary.source}
                              onChange={(e) => setEditableSummary({
                                ...editableSummary,
                                source: e.target.value
                              })}
                              className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ) : (
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {processingSummary.source}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Transactions Found:
                          </span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {processingSummary.transactionCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Confidence:
                          </span>
                          <span
                            className={`ml-2 font-medium ${getConfidenceColor(processingSummary.confidence)}`}
                          >
                            {processingSummary.confidence}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Quality:
                          </span>
                          <span
                            className={`ml-2 font-medium ${getQualityColor(processingSummary.quality)}`}
                          >
                            {processingSummary.quality}
                          </span>
                        </div>
                      </div>
                      {processingSummary.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {processingSummary.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Transaction Preview
                  </h3>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {showPreview ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {showPreview ? "Hide" : "Show"} Preview
                  </button>
                </div>

                {showPreview && (
                  <div className="max-h-64 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {previewData.transactions
                        .slice(0, showAllTransactions ? previewData.transactions.length : 10)
                        .map((transaction, index) => (
                          <div
                            key={index}
                            className="p-3 flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {transaction.description}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(
                                  transaction.date
                                ).toLocaleDateString()}{" "}
                                • {transaction.category}
                              </p>
                            </div>
                            <span
                              className={`font-medium ${
                                transaction.amount > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {transaction.amount > 0 ? "+" : ""}$
                              {Math.abs(transaction.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      {previewData.transactions.length > 10 && (
                        <div className="p-3 text-center">
                          <button
                            onClick={() => setShowAllTransactions(!showAllTransactions)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                          >
                            {showAllTransactions 
                              ? "Show Less" 
                              : `+${previewData.transactions.length - 10} more transactions`
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setPreviewData(null);
                    setSelectedFile(null);
                    setProcessingSummary(null);
                    setShowPreview(false);
                    setShowAllTransactions(false);
                    setIsEditingSummary(false);
                    setEditableSummary(null);
                  }}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Upload Another File
                </button>
                <button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Import {previewData.transactions.length} Transactions
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Review Modal */}
      <DuplicateReviewModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        duplicates={duplicateResults?.duplicates || []}
        nonDuplicates={duplicateResults?.nonDuplicates || []}
        onConfirm={handleDuplicateConfirm}
        onSkipAll={handleSkipAllDuplicates}
        summary={duplicateResults?.summary}
      />
    </div>
  );
};

export default StatementImporter;
