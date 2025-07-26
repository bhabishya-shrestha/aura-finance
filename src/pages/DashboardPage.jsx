import React from "react";
import Header from "../components/Header";
import NetWorth from "../components/NetWorth";
import Accounts from "../components/Accounts";
import RecentTransactions from "../components/RecentTransactions";
import AddTransaction from "../components/AddTransaction";
import useStore from "../store";

const DashboardPage = () => {
  const { setModalOpen } = useStore();

  const handleImportClick = () => {
    setModalOpen(true);
  };

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <Header />
        <div className="flex gap-3">
          <AddTransaction />
          <button
            onClick={handleImportClick}
            className="glass-card px-6 py-3 flex items-center gap-2 hover:bg-white/20 transition-all duration-200 group"
          >
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
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
      <div className="mt-8">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-soft-white mb-4">
            Quick Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-teal mb-2">$2,450</div>
              <div className="text-muted-gray text-sm">
                This Month's Spending
              </div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-green-400 mb-2">
                $8,200
              </div>
              <div className="text-muted-gray text-sm">This Month's Income</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-purple-400 mb-2">
                $5,750
              </div>
              <div className="text-muted-gray text-sm">Net Savings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
