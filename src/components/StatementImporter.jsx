import React, { useState, useRef } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { parseStatement } from "../utils/statementParser";
import useStore from "../store";

const StatementImporter = () => {
  const { addTransactions } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError("");
    setProcessingStep("Processing file...");

    try {
      let transactions = [];

      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setProcessingStep("Parsing CSV file...");
        transactions = await parseStatement(file);
      } else if (
        file.type === "application/pdf" ||
        file.name.endsWith(".pdf")
      ) {
        setProcessingStep("Processing PDF with OCR...");
        transactions = await parseStatement(file);
      } else {
        throw new Error(
          "Unsupported file format. Please upload a CSV or PDF file."
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
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Import Bank Statement
          </h2>
          <button
            onClick={() => {
              /* Close modal logic would go here */
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="sr-only">Close</span>
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Import Bank Statement
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Upload a CSV or PDF statement to automatically import your
                transactions. We&apos;ll help you categorize and organize them.
              </p>
            </div>

            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.pdf"
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
                Supported formats: CSV, PDF (with OCR)
              </div>
            </div>
          </div>

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
