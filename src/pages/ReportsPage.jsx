import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
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
  const {
    getSpendingByCategory,
    getMonthlySpending,
    getSpendingTrends,
    getTopSpendingCategories,
    getAverageDailySpending,
    getIncomeVsSpending,
    refreshAnalytics,
  } = useStore();

  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedReport, setSelectedReport] = useState("overview");
  const [reportData, setReportData] = useState({
    categoryBreakdown: [],
    monthlyTrends: [],
    spendingTrends: [],
    topCategories: [],
    avgDailySpending: 0,
    incomeVsSpending: {},
  });

  // Update report data when period changes
  useEffect(() => {
    // Force refresh analytics data to ensure latest data
    refreshAnalytics();

    const categoryBreakdown = getSpendingByCategory(selectedPeriod);
    const monthlyTrends = getMonthlySpending(
      selectedPeriod === "month" ? "year" : selectedPeriod
    );
    const spendingTrends = getSpendingTrends(12);
    const topCategories = getTopSpendingCategories(selectedPeriod, 10);
    const avgDailySpending = getAverageDailySpending(selectedPeriod);
    const incomeVsSpending = getIncomeVsSpending(selectedPeriod);

    setReportData({
      categoryBreakdown,
      monthlyTrends,
      spendingTrends,
      topCategories,
      avgDailySpending,
      incomeVsSpending,
    });
  }, [
    selectedPeriod,
    getSpendingByCategory,
    getMonthlySpending,
    getSpendingTrends,
    getTopSpendingCategories,
    getAverageDailySpending,
    getIncomeVsSpending,
    refreshAnalytics,
  ]);

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCategoryIcon = categoryName => {
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

  const handleExportReport = () => {
    const exportData = {
      period: selectedPeriod,
      report: selectedReport,
      generatedAt: new Date().toISOString(),
      data: {
        overview: {
          totalIncome: reportData.incomeVsSpending.income || 0,
          totalExpenses: reportData.incomeVsSpending.spending || 0,
          netSavings: reportData.incomeVsSpending.net || 0,
          categoryBreakdown: reportData.categoryBreakdown,
          topCategories: reportData.topCategories,
          avgDailySpending: reportData.avgDailySpending,
        },
        monthlyTrends: reportData.monthlyTrends,
        spendingTrends: reportData.spendingTrends,
      },
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getPeriodLabel = () => {
    const labels = {
      week: "This Week",
      month: "This Month",
      quarter: "This Quarter",
      year: "This Year",
    };
    return labels[selectedPeriod] || "This Month";
  };

  const renderOverviewReport = () => {
    const { incomeVsSpending, categoryBreakdown } = reportData;
    const totalIncome = incomeVsSpending.income || 0;
    const totalExpenses = incomeVsSpending.spending || 0;
    const netIncome = incomeVsSpending.net || 0;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Income
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Net Income
                </p>
                <p
                  className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(netIncome)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Expense Breakdown by Category
          </h3>
          <div className="space-y-3">
            {categoryBreakdown.slice(0, 10).map((item, index) => {
              const Icon = getCategoryIcon(item.category);
              const percentage =
                totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;

              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.category}
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderExpenseAnalysis = () => {
    const { categoryBreakdown } = reportData;

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Expense Categories
          </h3>
          <div className="space-y-4">
            {categoryBreakdown.slice(0, 8).map((item, index) => {
              const Icon = getCategoryIcon(item.category);
              const totalExpenses = categoryBreakdown.reduce(
                (sum, cat) => sum + cat.amount,
                0
              );
              const percentage =
                totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.category}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthlyTrends = () => {
    const { monthlyTrends: monthlyData } = reportData;

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Trends (Last 12 Months)
          </h3>
          <div className="space-y-4">
            {monthlyData.map((month, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {month.month} {month.year}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {month.income > 0 &&
                      `Income: ${formatCurrency(month.income)}`}
                    {month.income > 0 && month.expenses > 0 && " • "}
                    {month.expenses > 0 &&
                      `Expenses: ${formatCurrency(month.expenses)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${month.net >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(month.net)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Net
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBudgetReport = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Budget Overview
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Budget tracking features will be available in future updates.
          </p>
        </div>
      </div>
    );
  };

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Analyze your financial data and track your spending patterns
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportReport}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span className="text-white font-medium">Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Period Selection */}
        <div className="flex flex-wrap gap-2">
          {["week", "month", "quarter", "year"].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                selectedPeriod === period
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>

        {/* Report Type Selection */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "expenses", label: "Expense Analysis", icon: PieChart },
            { id: "trends", label: "Monthly Trends", icon: TrendingUp },
            { id: "budget", label: "Budget Report", icon: CreditCard },
          ].map(report => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  selectedReport === report.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {report.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Content */}
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {getPeriodLabel()} -{" "}
            {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)}{" "}
            Report
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        {renderReportContent()}
      </div>
    </div>
  );
};

export default ReportsPage;
