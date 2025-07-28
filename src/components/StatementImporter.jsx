import React, { useState, useRef } from "react";
import { Upload, AlertCircle, X, Camera, Sparkles } from "lucide-react";
import { parseStatement } from "../utils/statementParser";
import geminiService from "../services/geminiService";
import useStore from "../store";

const StatementImporter = ({ isOpen, onClose }) => {
  const { addTransactions } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Don't render if not open
  if (!isOpen) return null;

  const handleFileUpload = async event => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError("");
    setAnalysisResult(null);
    setPreviewUrl(null);

    try {
      let transactions = [];

      // Create preview URL for images
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      }

      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setProcessingStep("Parsing CSV file...");
        transactions = await parseStatement(file);
      } else if (
        file.type === "application/pdf" ||
        file.name.endsWith(".pdf")
      ) {
        setProcessingStep("Processing PDF with OCR...");
        transactions = await parseStatement(file);
      } else if (file.type.startsWith("image/")) {
        setProcessingStep("Analyzing image with AI...");

        // Use Gemini for image analysis
        const result = await geminiService.analyzeImage(file);
        setAnalysisResult(result);

        if (result.transactions && result.transactions.length > 0) {
          transactions = geminiService.convertToTransactions(result);
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

      // Add transactions to store
      await addTransactions(transactions);
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
        setAnalysisResult(null);
        setPreviewUrl(null);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setError("");
      setProcessingStep("");
      setAnalysisResult(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Smart Document Import
            </h2>
          </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Import Financial Documents
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Upload receipts, bank statements, or any financial document.
                    Our AI will automatically extract and categorize your
                    transactions.
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
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-400 disabled:to-purple-400 transition-all rounded-lg text-white font-medium disabled:cursor-not-allowed flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                    {isProcessing ? processingStep : "Choose File"}
                  </button>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Supported formats: CSV, PDF, Images (JPG, PNG, GIF, WebP)
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium mb-1">Import Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Preview and Analysis Section */}
            <div className="space-y-4">
              {previewUrl && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Document Preview
                  </h4>
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Document preview"
                      className="w-full h-48 object-contain border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
                          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Analyzing...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Analysis Results
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Document Type:
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {analysisResult.documentType || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Source:
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {analysisResult.source || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Confidence:
                      </span>
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded-full ${
                          analysisResult.confidence === "high"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : analysisResult.confidence === "medium"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {analysisResult.confidence || "low"}
                      </span>
                    </div>
                    {analysisResult.transactions && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Transactions Found:
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {analysisResult.transactions.length}
                        </span>
                      </div>
                    )}
                    {analysisResult.notes && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {analysisResult.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatementImporter;
