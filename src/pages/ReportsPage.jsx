import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  CreditCard,
} from "lucide-react";
import useProductionStore from "../store/productionStore";
import analyticsService from "../services/analyticsService";

// Empty Chart State Component
const EmptyChartState = ({
  message = "No data available for this time period",
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);

// Chart Container Component
const ChartContainer = ({
  title,
  children,
  isExpanded,
  onToggleExpand,
  className = "",
  isMobile,
}) => {
  const handleCardClick = e => {
    // Only handle clicks on mobile and only if the click is not on the chart area
    if (isMobile && onToggleExpand) {
      // Check if the click is on the chart area (children)
      const chartArea = e.currentTarget.querySelector("[data-chart-area]");
      if (chartArea && chartArea.contains(e.target)) {
        return; // Don't toggle if clicking on chart
      }
      onToggleExpand();
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className} ${
        isMobile && onToggleExpand ? "cursor-pointer" : ""
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {/* Only show collapse button on mobile */}
        {onToggleExpand && isMobile && (
          <button
            onClick={e => {
              e.stopPropagation(); // Prevent card click
              onToggleExpand();
            }}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        )}
      </div>
      <div className="p-4" data-chart-area>
        {children}
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
}) => {
  const getColorClasses = () => {
    switch (color) {
      case "green":
        return "text-green-600 dark:text-green-400";
      case "red":
        return "text-red-600 dark:text-red-400";
      case "purple":
        return "text-purple-600 dark:text-purple-400";
      case "blue":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-700 ${getColorClasses()}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center mt-3">
          {trend > 0 ? (
            <ArrowUpRight className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          )}
          <span
            className={`text-sm font-medium ml-1 ${trend > 0 ? "text-green-600" : "text-red-600"}`}
          >
            {Math.abs(trend).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Main Reports Page Component
const ReportsPage = () => {
  const { transactions, initialize, isInitialized } = useProductionStore();

  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedReport, setSelectedReport] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  const [expandedCharts, setExpandedCharts] = useState({});

  // Handle period change with cache clearing
  const handlePeriodChange = newPeriod => {
    console.log(
      `🔄 [Reports Page] Changing period from ${selectedPeriod} to ${newPeriod}`
    );
    setSelectedPeriod(newPeriod);
    analyticsService.forceRefresh();
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize store if needed
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // Use Analytics service for consistent calculations
  const analyticsData = useMemo(() => {
    if (!transactions || !transactions.length) {
      return {
        spendingByCategory: [],
        monthlySpending: [],
        incomeVsSpending: { income: 0, spending: 0, net: 0 },
        quickAnalytics: { transactionCount: 0 },
      };
    }

    // Debug logging for input transactions
    if (import.meta.env.DEV) {
      console.log(
        `🔄 [Reports Page] Input transactions for ${selectedPeriod}: ${transactions.length}`
      );
      const sept1stTransactions = transactions.filter(t => {
        if (!t.date) return false;
        const dateStr = typeof t.date === "string" ? t.date : t.date.toString();
        return (
          dateStr.includes("2025-09-01") || dateStr.includes("Sep 01 2025")
        );
      });
      if (sept1stTransactions.length > 0) {
        console.log(
          `   🎯 SEPTEMBER 1ST TRANSACTIONS IN INPUT: ${sept1stTransactions.length}`
        );
        sept1stTransactions.forEach(t => {
          console.log(`      ${t.date}: $${t.amount} - ${t.description}`);
        });
      } else {
        console.log(
          `   ❌ NO SEPTEMBER 1ST TRANSACTIONS IN INPUT for ${selectedPeriod}`
        );
      }
    }

    // Use the analytics service to calculate all analytics for the selected time range
    const allAnalytics = analyticsService.calculateAllAnalytics(
      transactions,
      selectedPeriod
    );

    // Debug logging for the analytics data received
    if (import.meta.env.DEV) {
      console.log(
        `🔄 [Reports Page] Analytics data received for ${selectedPeriod}:`
      );
      console.log(
        `   💸 incomeVsSpending.spending: $${allAnalytics.incomeVsSpending.spending}`
      );
      console.log(
        `   📊 Raw allAnalytics.incomeVsSpending:`,
        allAnalytics.incomeVsSpending
      );
    }

    return {
      spendingByCategory: allAnalytics.spendingByCategory,
      monthlySpending: allAnalytics.monthlySpending,
      incomeVsSpending: allAnalytics.incomeVsSpending,
      quickAnalytics: allAnalytics.quickAnalytics,
    };
  }, [transactions, selectedPeriod]);

  // Chart expansion handling
  const toggleChartExpansion = chartId => {
    setExpandedCharts(prev => ({
      ...prev,
      [chartId]: !prev[chartId],
    }));
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const renderOverviewReport = () => {
    const { incomeVsSpending, spendingByCategory } = analyticsData;
    const totalIncome = incomeVsSpending.income || 0;
    const totalExpenses = incomeVsSpending.spending || 0;
    const netIncome = incomeVsSpending.net || 0;

    // Debug logging for Reports page
    if (import.meta.env.DEV) {
      console.log(
        `📊 [Reports Page Debug] Overview Report for ${selectedPeriod}:`
      );
      console.log(`   💰 Total Income: $${totalIncome}`);
      console.log(`   💸 Total Expenses: $${totalExpenses}`);
      console.log(`   📈 Net Income: $${netIncome}`);
      console.log(`   📊 Raw incomeVsSpending:`, incomeVsSpending);
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards with Analytics page theme */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Income"
            value={formatCurrency(totalIncome)}
            subtitle="Income this period"
            icon={TrendingUp}
            color="green"
          />
          <MetricCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            subtitle="All expenses this period"
            icon={TrendingDown}
            color="red"
          />
          <MetricCard
            title="Net Income"
            value={formatCurrency(netIncome)}
            subtitle="Income minus expenses"
            icon={DollarSign}
            color={netIncome >= 0 ? "green" : "red"}
          />
        </div>

        {/* Category Breakdown with Analytics page theme */}
        <ChartContainer
          title="Expense Breakdown by Category"
          isExpanded={expandedCharts.categoryBreakdown}
          onToggleExpand={() => toggleChartExpansion("categoryBreakdown")}
          isMobile={isMobile}
        >
          {spendingByCategory.length > 0 ? (
            <div className="space-y-3">
              {spendingByCategory.slice(0, 10).map((item, index) => {
                const percentage =
                  totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;

                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-400" />
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
          ) : (
            <EmptyChartState message="No spending categories available for this time period" />
          )}
        </ChartContainer>
      </div>
    );
  };

  const renderExpenseAnalysis = () => {
    const { spendingByCategory } = analyticsData;

    return (
      <div className="space-y-6">
        <ChartContainer
          title="Top Expense Categories"
          isExpanded={expandedCharts.expenseAnalysis}
          onToggleExpand={() => toggleChartExpansion("expenseAnalysis")}
          isMobile={isMobile}
        >
          {spendingByCategory.length > 0 ? (
            <div className="space-y-4">
              {spendingByCategory.slice(0, 8).map((item, index) => {
                const totalExpenses = spendingByCategory.reduce(
                  (sum, cat) => sum + cat.amount,
                  0
                );
                const percentage =
                  totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;

                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
          ) : (
            <EmptyChartState message="No expense categories available for this time period" />
          )}
        </ChartContainer>
      </div>
    );
  };

  const renderMonthlyTrends = () => {
    const { monthlySpending: monthlyData } = analyticsData;

    // Filter out months with no data (NaN or zero values)
    const validMonthlyData = monthlyData.filter(
      month =>
        !isNaN(month.net) &&
        !isNaN(month.income) &&
        !isNaN(month.expenses) &&
        (month.income > 0 || month.expenses > 0)
    );

    return (
      <div className="space-y-6">
        <ChartContainer
          title="Monthly Trends (Last 12 Months)"
          isExpanded={expandedCharts.monthlyTrends}
          onToggleExpand={() => toggleChartExpansion("monthlyTrends")}
          isMobile={isMobile}
        >
          {validMonthlyData.length > 0 ? (
            <div className="space-y-4">
              {validMonthlyData.map((month, index) => (
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
          ) : (
            <EmptyChartState message="No monthly data available for this time period" />
          )}
        </ChartContainer>
      </div>
    );
  };

  const renderBudgetReport = () => {
    return (
      <div className="space-y-6">
        <ChartContainer
          title="Budget Overview"
          isExpanded={expandedCharts.budgetReport}
          onToggleExpand={() => toggleChartExpansion("budgetReport")}
          isMobile={isMobile}
        >
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-sm">
              Budget tracking features will be available in future updates.
            </p>
          </div>
        </ChartContainer>
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
    <div className="p-4 lg:p-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 flex-shrink-0 w-fit">
        {/* Period Selection */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-sm w-fit">
          {["week", "month", "quarter", "year"].map(period => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPeriod === period
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>

        {/* Report Type Selection */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-sm w-fit">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "expenses", label: "Expense Analysis", icon: DollarSign },
            { id: "trends", label: "Monthly Trends", icon: TrendingUp },
            { id: "budget", label: "Budget Report", icon: CreditCard },
          ].map(report => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedReport === report.id
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {report.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="mt-6">{renderReportContent()}</div>
    </div>
  );
};

export default ReportsPage;
