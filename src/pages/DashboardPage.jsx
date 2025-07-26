import React from "react";
import NetWorth from "../components/NetWorth";
import Accounts from "../components/Accounts";
import RecentTransactions from "../components/RecentTransactions";
import AddTransaction from "../components/AddTransaction";
import StatementImporter from "../components/StatementImporter";
import useStore from "../store";

const DashboardPage = () => {
  const { setModalOpen } = useStore();

  const handleImportClick = () => {
    setModalOpen(true);
  };

  return (
    <div className="w-full h-full p-4 sm:p-6 overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">
            Dashboard
          </h1>
          <p className="text-muted text-sm sm:text-base">
            Welcome back! Here&apos;s your financial overview.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
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
