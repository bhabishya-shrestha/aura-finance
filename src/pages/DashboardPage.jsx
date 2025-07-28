import React, { useEffect, useState } from "react";
import NetWorth from "../components/NetWorth";
import Accounts from "../components/Accounts";
import RecentTransactions from "../components/RecentTransactions";
import AddTransaction from "../components/AddTransaction";
import StatementImporter from "../components/StatementImporter";
import useStore from "../store";
import { useAuth } from "../contexts/AuthContext";

const DashboardPage = () => {
  const { setModalOpen } = useStore();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Debug logged
    // Debug logged
  }, [user, isAuthenticated, isLoading]);

  const handleImportClick = () => {
    try {
      setModalOpen(true);
    } catch (err) {
      console.error("Error opening import modal:", err);
      setError(err.message);
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
    <div className="w-full h-full p-4 sm:p-6 iphone15pro:p-3 overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 iphone15pro:mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl iphone15pro:text-xl font-bold text-gradient mb-2">
            Dashboard
          </h1>
          <p className="text-muted text-sm sm:text-base iphone15pro:text-sm">
            Welcome back! Here&apos;s your financial overview.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto iphone15pro:flex-row iphone15pro:gap-2">
          <AddTransaction />
          <button
            onClick={handleImportClick}
            className="btn-glass-primary px-4 sm:px-6 py-3 flex items-center justify-center gap-2 hover:scale-105 transition-all duration-200 group text-sm sm:text-base iphone15pro:text-xs iphone15pro:px-3 iphone15pro:py-2"
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
            <span className="font-medium iphone15pro:hidden">
              Import Statement
            </span>
            <span className="font-medium iphone15pro:block">Import</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 iphone15pro:gap-3 iphone15pro:mb-4">
        {/* Net Worth Card */}
        <div className="lg:col-span-1">
          <NetWorth />
        </div>

        {/* Accounts Card */}
        <div className="lg:col-span-1">
          <Accounts />
        </div>

        {/* Recent Transactions Card */}
        <div className="lg:col-span-1">
          <RecentTransactions />
        </div>
      </div>

      {/* Analytics Preview */}
      <div className="mb-6">
        <div className="glass-card-hover p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-primary mb-4">
            Quick Analytics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4 apple-glass-light rounded-apple-lg">
              <div className="text-xl sm:text-2xl font-bold text-success mb-2">
                $2,450
              </div>
              <div className="text-muted text-xs sm:text-sm">
                This Month&apos;s Spending
              </div>
            </div>
            <div className="text-center p-4 apple-glass-light rounded-apple-lg">
              <div className="text-xl sm:text-2xl font-bold text-success mb-2">
                $8,200
              </div>
              <div className="text-muted text-xs sm:text-sm">
                This Month&apos;s Income
              </div>
            </div>
            <div className="text-center p-4 apple-glass-light rounded-apple-lg sm:col-span-2 lg:col-span-1">
              <div className="text-xl sm:text-2xl font-bold text-success mb-2">
                $5,750
              </div>
              <div className="text-muted text-xs sm:text-sm">Net Savings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statement Importer Modal */}
      <StatementImporter />
    </div>
  );
};

export default DashboardPage;
