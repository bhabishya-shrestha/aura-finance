import React from "react";
import { Upload } from "lucide-react";
import NetWorth from "./NetWorth";
import Accounts from "./Accounts";
import RecentTransactions from "./RecentTransactions";
import AddTransaction from "./AddTransaction";
import useStore from "../store";

const Dashboard = () => {
  const { setModalOpen } = useStore();

  const handleImportClick = () => {
    setModalOpen(true);
  };

  return (
    <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-3">
          <AddTransaction />
          <button
            onClick={handleImportClick}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 hover:scale-105 transition-all duration-200 group shadow-sm"
          >
            <Upload className="w-5 h-5 group-hover:scale-110 transition-all duration-200" />
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

      {/* Future: Charts and Analytics Section */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Analytics
          </h2>
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            <p>Charts and analytics coming soon...</p>
            <p className="text-sm mt-2">
              Import more transactions to see spending patterns
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
