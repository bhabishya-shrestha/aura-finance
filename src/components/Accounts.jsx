import React from "react";
import { CreditCard, Wallet, PiggyBank, BarChart3 } from "lucide-react";
import useStore from "../store";

const Accounts = () => {
  const { accounts, getAccountBalance, calculateAccountStats } = useStore();

  const getAccountIcon = type => {
    switch (type) {
      case "credit":
        return <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "checking":
        return <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "savings":
        return <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5" />;
      default:
        return <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getAccountTypeColor = type => {
    switch (type) {
      case "credit":
        return "text-purple-600 dark:text-purple-400";
      case "checking":
        return "text-blue-600 dark:text-blue-400";
      case "savings":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getAccountTypeBgColor = type => {
    switch (type) {
      case "credit":
        return "bg-purple-50 dark:bg-purple-900/20";
      case "checking":
        return "bg-blue-50 dark:bg-blue-900/20";
      case "savings":
        return "bg-green-50 dark:bg-green-900/20";
      default:
        return "bg-gray-50 dark:bg-gray-700";
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Accounts
          </h2>
        </div>

        <div className="space-y-3">
          {accounts.map(account => {
            const balance = getAccountBalance(account.id);
            const stats = calculateAccountStats(account.id);

            return (
              <div
                key={account.id}
                className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${getAccountTypeBgColor(
                  account.type
                )} border-gray-200 dark:border-gray-600`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm ${getAccountTypeColor(account.type)}`}
                    >
                      {getAccountIcon(account.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-900 dark:text-white font-medium truncate text-sm sm:text-base">
                        {account.name}
                      </p>
                      <p
                        className={`text-xs sm:text-sm capitalize truncate ${getAccountTypeColor(account.type)}`}
                      >
                        {account.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-primary font-semibold text-sm sm:text-base">
                        {formatCurrency(balance)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <BarChart3 className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {stats.transactionCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">
                      Income
                    </p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(stats.income)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">
                      Expenses
                    </p>
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(stats.expenses)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Net</p>
                    <p
                      className={`font-semibold ${
                        stats.netFlow >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(stats.netFlow)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-6">
            <Wallet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No accounts yet
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Accounts;
