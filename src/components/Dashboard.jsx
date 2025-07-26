import React from "react";
import { Upload } from "lucide-react";
import Header from "./Header";
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
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <Header />
        <div className="flex gap-3">
          <AddTransaction />
          <button
            onClick={handleImportClick}
            className="glass-card px-6 py-3 flex items-center gap-2 hover:bg-white/20 transition-all duration-200 group"
          >
            <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
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
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-soft-white mb-4">
            Analytics
          </h2>
          <div className="text-center py-12 text-muted-gray">
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
