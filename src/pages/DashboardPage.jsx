import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Upload,
  FileText,
} from "lucide-react";
import useProductionStore from "../store/productionStore";
import { useFirebaseAuth } from "../contexts/FirebaseAuthContext";
import StatementImporter from "../components/StatementImporter";
import MobileStatementImporter from "../components/MobileStatementImporter";
import AddTransaction from "../components/AddTransaction";
import { useMobileViewport } from "../hooks/useMobileViewport";

const DashboardPage = ({
  onPageChange,
  triggerImport,
  onImportClick,
  isModalOnly = false,
}) => {
  const { transactions, accounts, addTransactions, initialize, isInitialized } =
    useProductionStore();
  const { isAuthenticated, isInitialized: authInitialized } = useFirebaseAuth();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const navigate = useNavigate();

  const [error, setError] = useState("");

  // Use mobile viewport handling
  const { isMobile } = useMobileViewport();

  useEffect(() => {
    // Only initialize the store when user is authenticated and auth is initialized
    if (authInitialized && isAuthenticated && !isInitialized) {
      console.log("🔐 User authenticated, initializing production store...");
      initialize();
    }
  }, [authInitialized, isAuthenticated, isInitialized, initialize]);

  // Handle import trigger from floating action button
  useEffect(() => {
    if (triggerImport) {
      setIsImportModalOpen(true);
    }
  }, [triggerImport]);

  const handleImportClick = () => {
    if (onImportClick) {
      onImportClick();
    } else {
      setIsImportModalOpen(true);
    }
  };

  const handleImportComplete = async importedTransactions => {
    try {
      // Add transactions to store
      await addTransactions(importedTransactions);

      // Close modal
      setIsImportModalOpen(false);

      // Show success message or redirect
    } catch (error) {
      setError("Failed to import transactions: " + error.message);
    }
  };

  const handleAccountAssignmentComplete = async assignedTransactions => {
    try {
      // Add the assigned transactions
      await addTransactions(assignedTransactions);

      // Transactions will be updated automatically via real-time listeners

      // Close modal
      setIsImportModalOpen(false);
    } catch (error) {
      setError("Failed to complete account assignment: " + error.message);
    }
  };

  // Calculate dashboard metrics
  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );
  // Robust recent transactions: sort by date desc using epoch ms
  const getMs = value => {
    if (!value) return 0;
    try {
      if (
        typeof value === "object" &&
        value !== null &&
        ("seconds" in value || "nanoseconds" in value)
      ) {
        const seconds = Number(value.seconds || 0);
        const nanos = Number(value.nanoseconds || 0);
        return seconds * 1000 + Math.floor(nanos / 1e6);
      }
      const ms = new Date(value).getTime();
      return isNaN(ms) ? 0 : ms;
    } catch (_) {
      return 0;
    }
  };
  const recentTransactions = [...transactions]
    .sort((a, b) => getMs(b.date) - getMs(a.date))
    .slice(0, 5);
  const monthlyIncome = transactions
    .filter(
      t => t.amount > 0 && new Date(t.date).getMonth() === new Date().getMonth()
    )
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = transactions
    .filter(
      t => t.amount < 0 && new Date(t.date).getMonth() === new Date().getMonth()
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const QuickAnalyticsCard = ({
    title,
    value,
    change,
    icon: Icon,
    trend = "up",
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {change && (
            <div
              className={`flex items-center text-sm ${trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {trend === "up" ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {change}
            </div>
          )}
        </div>
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>
  );

  // If only rendering modals, return just the modals
  if (isModalOnly) {
    return (
      <>
        {!isMobile ? (
          <>
            <StatementImporter
              isOpen={isImportModalOpen}
              onClose={() => setIsImportModalOpen(false)}
              onImportComplete={handleImportComplete}
              onAccountAssignmentComplete={handleAccountAssignmentComplete}
              isMobile={false}
            />
          </>
        ) : (
          <MobileStatementImporter
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportComplete={handleImportComplete}
          />
        )}
      </>
    );
  }

  return (
    <div className="pt-0 px-4 pb-4 lg:p-4 space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Mobile Header - Simple */}
      <div className="lg:hidden">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Welcome back! Here&apos;s your financial overview.
        </p>
      </div>

      {/* Net Worth Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 lg:p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">Total Net Worth</p>
            <p className="text-3xl font-bold">
              ${totalBalance.toLocaleString()}
            </p>
          </div>
          <DollarSign className="w-12 h-12 text-blue-200" />
        </div>
      </div>

      {/* Quick Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAnalyticsCard
          title="Monthly Income"
          value={`$${monthlyIncome.toLocaleString()}`}
          change="+12.5%"
          icon={TrendingUp}
          trend="up"
        />
        <QuickAnalyticsCard
          title="Monthly Expenses"
          value={`$${monthlyExpenses.toLocaleString()}`}
          change="-8.2%"
          icon={TrendingDown}
          trend="down"
        />
        <QuickAnalyticsCard
          title="Total Accounts"
          value={accounts.length}
          change="+2"
          icon={CreditCard}
          trend="up"
        />
        <QuickAnalyticsCard
          title="Recent Transactions"
          value={recentTransactions.length}
          icon={FileText}
        />
      </div>

      {/* Quick Actions */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <AddTransaction />
          <button
            onClick={handleImportClick}
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
          >
            <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div className="text-left">
              <p className="font-medium text-green-900 dark:text-green-100">
                Import Statement
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Upload bank statements
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Transactions
          </h2>
          <button
            onClick={() => (typeof onPageChange === "function" ? onPageChange("transactions") : navigate("/transactions"))}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
          >
            View All
          </button>
        </div>
        {Array.isArray(recentTransactions) && recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map(transaction => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(transaction.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}
                  </p>
                </div>
                <p
                  className={`font-semibold ${
                    transaction.amount > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : ""}$
                  {Math.abs(transaction.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No transactions yet. Add your first transaction to get started.
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
