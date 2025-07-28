import React, { useState, useRef } from "react";
import { Upload, FileText, X, Check, AlertCircle, Info } from "lucide-react";
import useStore from "../store";
import { parseCSV, parsePDF, CATEGORIES } from "../utils/statementParser";

const StatementImporter = () => {
  const {
    isModalOpen,
    setModalOpen,
    parsedTransactions,
    setParsedTransactions,
    addTransactions,
  } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError("");
    setProcessingStep("Validating file...");

    try {
      let transactions = [];

      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setProcessingStep("Parsing CSV file...");
        transactions = await parseCSV(file);
      } else if (
        file.type === "application/pdf" ||
        file.name.endsWith(".pdf")
      ) {
        setProcessingStep("Processing PDF with OCR...");
        transactions = await parsePDF(file);
      } else {
        throw new Error(
          "Unsupported file type. Please upload a CSV or PDF file.",
        );
      }

      if (transactions.length === 0) {
        throw new Error(
          "No transactions found in the file. Please check the file format.",
        );
      }

      setParsedTransactions(transactions);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const handleTransactionUpdate = (index, field, value) => {
    const updatedTransactions = [...parsedTransactions];
    updatedTransactions[index] = {
      ...updatedTransactions[index],
      [field]: field === "amount" ? parseFloat(value) || 0 : value,
    };
    setParsedTransactions(updatedTransactions);
  };

  const handleTransactionToggle = (index) => {
    const updatedTransactions = [...parsedTransactions];
    updatedTransactions[index] = {
      ...updatedTransactions[index],
      selected: !updatedTransactions[index].selected,
    };
    setParsedTransactions(updatedTransactions);
  };

  const handleSelectAll = () => {
    const updatedTransactions = parsedTransactions.map((t) => ({
      ...t,
      selected: true,
    }));
    setParsedTransactions(updatedTransactions);
  };

  const handleDeselectAll = () => {
    const updatedTransactions = parsedTransactions.map((t) => ({
      ...t,
      selected: false,
    }));
    setParsedTransactions(updatedTransactions);
  };

  const handleImport = async () => {
    const selectedTransactions = parsedTransactions.filter((t) => t.selected);
    if (selectedTransactions.length === 0) {
      setError("Please select at least one transaction to import.");
      return;
    }

    try {
      await addTransactions(selectedTransactions);
      setModalOpen(false);
      setParsedTransactions([]);
      setError("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError("Failed to import transactions. Please try again.");
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
    setParsedTransactions([]);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-modal w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-soft-white">
            Import Statement
          </h2>
          <button
            onClick={handleCancel}
            className="text-muted-gray hover:text-soft-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {parsedTransactions.length === 0 ? (
            /* File Upload Section */
            <div className="text-center py-12">
              <div className="mb-6">
                <Upload className="w-16 h-16 mx-auto text-muted-gray mb-4" />
                <h3 className="text-xl font-semibold text-soft-white mb-2">
                  Upload Your Statement
                </h3>
                <p className="text-muted-gray mb-6">
                  Supported formats: CSV and PDF (Bank of America statements)
                </p>

                {/* File Requirements Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <h4 className="text-sm font-medium text-blue-400 mb-2">
                        File Requirements:
                      </h4>
                      <ul className="text-xs text-blue-300 space-y-1">
                        <li>• PDF files must be under 10MB</li>
                        <li>
                          • PDFs must contain readable text (not scanned images)
                        </li>
                        <li>• PDFs must not be password-protected</li>
                        <li>
                          • CSV files should have Date, Description, and Amount
                          columns
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

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
                className="glass-card px-8 py-4 flex items-center gap-2 mx-auto hover:bg-white/20 transition-all duration-200 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>{processingStep}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span>Choose File</span>
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium mb-1">Import Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Transaction Confirmation Section */
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-soft-white mb-1">
                    Review Transactions
                  </h3>
                  <p className="text-muted-gray">
                    {parsedTransactions.filter((t) => t.selected).length} of{" "}
                    {parsedTransactions.length} selected
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-soft-white text-sm"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-soft-white text-sm"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-auto">
                {parsedTransactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className={`p-4 rounded-lg border transition-all ${
                      transaction.selected
                        ? "bg-white/10 border-white/20"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={transaction.selected}
                        onChange={() => handleTransactionToggle(index)}
                        className="w-4 h-4 text-teal bg-white/10 border-white/20 rounded focus:ring-teal"
                      />

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-xs text-muted-gray uppercase tracking-wide">
                            Date
                          </label>
                          <input
                            type="date"
                            value={formatDate(transaction.date)
                              .split("/")
                              .reverse()
                              .join("-")}
                            onChange={(e) =>
                              handleTransactionUpdate(
                                index,
                                "date",
                                new Date(e.target.value),
                              )
                            }
                            className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-xs text-muted-gray uppercase tracking-wide">
                            Description
                          </label>
                          <input
                            type="text"
                            value={transaction.description}
                            onChange={(e) =>
                              handleTransactionUpdate(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-muted-gray uppercase tracking-wide">
                            Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={transaction.amount}
                            onChange={(e) =>
                              handleTransactionUpdate(
                                index,
                                "amount",
                                e.target.value,
                              )
                            }
                            className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-muted-gray uppercase tracking-wide">
                            Category
                          </label>
                          <select
                            value={transaction.category}
                            onChange={(e) =>
                              handleTransactionUpdate(
                                index,
                                "category",
                                e.target.value,
                              )
                            }
                            className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                          >
                            {CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium mb-1">Import Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedTransactions.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-soft-white"
            >
              Cancel
            </button>

            <button
              onClick={handleImport}
              disabled={
                parsedTransactions.filter((t) => t.selected).length === 0
              }
              className="px-6 py-3 bg-gradient-to-r from-teal to-purple hover:from-teal/90 hover:to-purple/90 transition-all rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Import {parsedTransactions.filter((t) => t.selected).length}{" "}
              Transactions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatementImporter;
