import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  Download,
  CreditCard,
  PiggyBank,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Wifi,
  Heart,
  BookOpen,
  Gamepad2,
  Gift,
} from "lucide-react";
import useStore from "../store";

const ReportsPage = () => {
  const { transactions, loadTransactions } = useStore();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedReport, setSelectedReport] = useState("overview");

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCurrentPeriodData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });
  };

  const getCategoryIcon = (categoryName) => {
    const icons = {
      "Food & Dining": Utensils,
      Transportation: Car,
      Shopping: ShoppingCart,
      Housing: Home,
      Entertainment: Gamepad2,
      Healthcare: Heart,
      Education: BookOpen,
      Utilities: Wifi,
      Gifts: Gift,
      Savings: PiggyBank,
      "Credit Card": CreditCard,
    };

    return icons[categoryName] || DollarSign;
  };

  const calculateCategoryBreakdown = () => {
    const periodData = getCurrentPeriodData();
    const expenses = periodData.filter((t) => t.type === "expense");

    const categoryMap = {};
    expenses.forEach((transaction) => {
      const category = transaction.category?.name || "Uncategorized";
      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }
      categoryMap[category] += Math.abs(transaction.amount);
    });

    return Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const calculateMonthlyTrends = () => {
    const months = [];
    const currentDate = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const year = date.getFullYear();

      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return (
          tDate.getMonth() === date.getMonth() && tDate.getFullYear() === year
        );
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      months.push({
        month: monthName,
        income,
        expenses,
        net: income - expenses,
      });
    }

    return months;
  };

  const periodData = getCurrentPeriodData();
  const totalIncome = periodData
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = periodData
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netIncome = totalIncome - totalExpenses;
  const categoryBreakdown = calculateCategoryBreakdown();
  const monthlyTrends = calculateMonthlyTrends();

  const reports = [
    {
      id: "overview",
      name: "Overview",
      icon: BarChart3,
      description: "Financial summary and key metrics",
    },
    {
      id: "expenses",
      name: "Expense Analysis",
      icon: TrendingDown,
      description: "Detailed expense breakdown by category",
    },
    {
      id: "trends",
      name: "Monthly Trends",
      icon: TrendingUp,
      description: "Income and expense trends over time",
    },
    {
      id: "budget",
      name: "Budget vs Actual",
      icon: PieChart,
      description: "Compare spending against budget",
    },
  ];

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-400 truncate">
                Total Income
              </p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                {formatCurrency(totalIncome)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-400 truncate">
                Total Expenses
              </p>
              <p className="text-lg sm:text-2xl font-bold text-red-600 truncate">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-400 truncate">
                Net Income
              </p>
              <p
                className={`text-lg sm:text-2xl font-bold truncate ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(netIncome)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-400 truncate">
                Transactions
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {periodData.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Expense Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Expense Categories
        </h3>
        <div className="space-y-3">
          {categoryBreakdown.slice(0, 5).map((category) => {
            const Icon = getCategoryIcon(category.category);
            const percentage = (
              (category.amount / totalExpenses) *
              100
            ).toFixed(1);

            return (
              <div
                key={category.category}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-700 dark:text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {category.category}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {percentage}% of total
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white ml-2">
                  {formatCurrency(category.amount)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderExpenseAnalysis = () => (
    <div className="space-y-6">
      {/* Category Breakdown Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Expense Breakdown by Category
        </h3>
        <div className="space-y-4">
          {categoryBreakdown.map((category, index) => {
            const Icon = getCategoryIcon(category.category);
            const percentage = (
              (category.amount / totalExpenses) *
              100
            ).toFixed(1);
            const colors = [
              "bg-blue-500",
              "bg-green-500",
              "bg-yellow-500",
              "bg-red-500",
              "bg-purple-500",
              "bg-pink-500",
              "bg-indigo-500",
              "bg-orange-500",
            ];

            return (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${colors[index % colors.length]}`}
                    />
                    <Icon className="w-4 h-4 text-gray-700 dark:text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {category.category}
                    </span>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(category.amount)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {percentage}%
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${colors[index % colors.length]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderMonthlyTrends = () => (
    <div className="space-y-6">
      {/* Monthly Trends Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Income vs Expenses
        </h3>
        <div className="space-y-4">
          {monthlyTrends.map((month) => (
            <div key={month.month} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">
                  {month.month}
                </span>
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="text-right">
                    <p className="text-sm text-green-600 font-medium">
                      {formatCurrency(month.income)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Income
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600 font-medium">
                      {formatCurrency(month.expenses)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Expenses
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${month.net >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(month.net)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Net
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full"
                  style={{
                    width: `${(month.income / Math.max(...monthlyTrends.map((m) => m.income))) * 100}%`,
                  }}
                />
                <div
                  className="bg-red-500 h-full"
                  style={{
                    width: `${(month.expenses / Math.max(...monthlyTrends.map((m) => m.expenses))) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBudgetReport = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Budget vs Actual Spending
        </h3>
        <div className="text-center py-8">
          <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Budget tracking feature coming soon!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Set up budgets for different categories and track your spending
            against them.
          </p>
        </div>
      </div>
    </div>
  );

  const renderReportContent = () => {
    switch (selectedReport) {
      case "overview":
        return renderOverviewReport();
      case "expenses":
        return renderExpenseAnalysis();
      case "trends":
        return renderMonthlyTrends();
      case "budget":
        return renderBudgetReport();
      default:
        return renderOverviewReport();
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-14 lg:pb-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Financial Reports
            </h1>
            <p className="text-gray-700 dark:text-gray-400 mt-1">
              Analyze your financial data and track your progress
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>

            <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-4 rounded-lg border transition-all duration-200 text-left min-h-[80px] ${
                  selectedReport === report.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      selectedReport === report.id
                        ? "text-blue-600"
                        : "text-gray-700 dark:text-gray-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`font-medium truncate ${
                        selectedReport === report.id
                          ? "text-blue-600"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {report.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Content */}
      <div className="space-y-6">{renderReportContent()}</div>
    </div>
  );
};

export default ReportsPage;
