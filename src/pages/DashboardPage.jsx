import React, { useState, useEffect } from "react";
import NetWorth from "../components/NetWorth";
import Accounts from "../components/Accounts";
import RecentTransactions from "../components/RecentTransactions";
import AddTransaction from "../components/AddTransaction";
import StatementImporter from "../components/StatementImporter";
import { useAuth } from "../contexts/AuthContext";

const DashboardPage = ({ onPageChange }) => {
  const { isLoading } = useAuth();
  const [error, setError] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Defensive: Always set modal closed on mount
  useEffect(() => {
    setIsImportModalOpen(false);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load any necessary data for dashboard
        setError(null);
      } catch (error) {
        setError("Failed to load dashboard data");
      }
    };

    loadData();
  }, []);

  // Debug: Log modal state on every render
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[DashboardPage] isImportModalOpen:", isImportModalOpen);
  }, [isImportModalOpen]);

  const handleImportClick = () => {
    try {
      setIsImportModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewAllTransactions = () => {
    if (onPageChange) {
      onPageChange("transactions");
    }
  };

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if there is one
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => setError(null)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-2">
            Dashboard
          </h1>
          <p className="text-muted text-sm sm:text-base lg:text-lg">
            Welcome back! Here&apos;s your financial overview.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <AddTransaction />
          <button
            onClick={handleImportClick}
            className="btn-glass-primary px-4 sm:px-6 py-3 flex items-center justify-center gap-2 hover:scale-105 transition-all duration-200 group text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="font-medium">Import Statement</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid - Improved for portrait desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 mb-6 lg:mb-8">
        {/* Net Worth Card */}
        <div className="xl:col-span-1">
          <NetWorth />
        </div>

        {/* Accounts Card */}
        <div className="xl:col-span-1">
          <Accounts />
        </div>

        {/* Recent Transactions Card */}
        <div className="xl:col-span-1">
          <RecentTransactions
            onViewAllTransactions={handleViewAllTransactions}
          />
        </div>
      </div>

      {/* Analytics Preview */}
      <div className="mb-6 lg:mb-8">
        <div className="glass-card-hover p-6 lg:p-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-6">
            Quick Analytics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center p-6 apple-glass-light rounded-apple-lg">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-success mb-2">
                $2,450
              </div>
              <div className="text-muted text-sm lg:text-base">
                This Month&apos;s Spending
              </div>
            </div>
            <div className="text-center p-6 apple-glass-light rounded-apple-lg">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-success mb-2">
                $8,200
              </div>
              <div className="text-muted text-sm lg:text-base">
                This Month&apos;s Income
              </div>
            </div>
            <div className="text-center p-6 apple-glass-light rounded-apple-lg sm:col-span-2 xl:col-span-1">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-success mb-2">
                $5,750
              </div>
              <div className="text-muted text-sm lg:text-base">Net Savings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statement Importer Modal */}
      <StatementImporter
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
