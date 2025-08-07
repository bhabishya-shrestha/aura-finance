import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import useStore from "../store";
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
  const handleCardClick = (e) => {
    // Only handle clicks on mobile and only if the click is not on the chart area
    if (isMobile && onToggleExpand) {
      // Check if the click is on the chart area (children)
      const chartArea = e.currentTarget.querySelector('[data-chart-area]');
      if (chartArea && chartArea.contains(e.target)) {
        return; // Don't toggle if clicking on chart
      }
      onToggleExpand();
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className} ${
        isMobile && onToggleExpand ? 'cursor-pointer' : ''
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
            onClick={(e) => {
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
      <div className="p-4" data-chart-area>{children}</div>
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
  animateCards = true,
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

// Chart Components
const IncomeVsSpendingChart = ({ data }) => {
  if (!data || !data.length) return <EmptyChartState />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="income"
          stackId="1"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.3}
        />
        <Area
          type="monotone"
          dataKey="spending"
          stackId="1"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.3}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

const SpendingByCategoryChart = ({ data, isMobile }) => {
  if (!data || !data.length) return <EmptyChartState />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={isMobile ? 40 : 60}
          outerRadius={isMobile ? 80 : 100}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

const MonthlySpendingChart = ({ data }) => {
  if (!data || !data.length) return <EmptyChartState />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="spending"
          stroke="#3b82f6"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const SpendingTrendsChart = ({ data }) => {
  if (!data || !data.length) return <EmptyChartState />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="amount" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Main Analytics Page Component
const AnalyticsPage = () => {
  const { transactions } = useStore();
  const [selectedView, setSelectedView] = useState("overview");
  const [timeRange, setTimeRange] = useState("week");
  const [isMobile, setIsMobile] = useState(false);
  const [expandedCharts, setExpandedCharts] = useState({});

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Time range handling
  useEffect(() => {
    const saved = localStorage.getItem("aura-finance-timeRange");
    if (saved) setTimeRange(saved);
  }, []);

  const handleTimeRangeChange = newRange => {
    setTimeRange(newRange);
    localStorage.setItem("aura-finance-timeRange", newRange);
    analyticsService.forceRefresh();
  };

  // Chart expansion handling
  const toggleChartExpansion = chartId => {
    setExpandedCharts(prev => ({
      ...prev,
      [chartId]: !prev[chartId],
    }));
  };

  // Analytics data calculation
  const analyticsData = useMemo(() => {
    if (!transactions || !transactions.length) {
      return {
        spendingByCategory: [],
        monthlySpending: [],
        incomeVsSpending: { income: 0, spending: 0, net: 0 },
        spendingTrends: [],
        netWorthTrend: 0,
        incomeTrend: 0,
        spendingTrend: 0,
        savingsTrend: 0,
        quickAnalytics: { transactionCount: 0, netSavings: 0 },
        avgDailySpending: 0,
      };
    }

    // Calculate analytics data here
    // This is a simplified version - you can add your complex calculations
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const spending = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const net = income - spending;

    return {
      spendingByCategory: [],
      monthlySpending: [],
      incomeVsSpending: { income, spending, net },
      spendingTrends: [],
      netWorthTrend: 0,
      incomeTrend: 0,
      spendingTrend: 0,
      savingsTrend: 0,
      quickAnalytics: {
        transactionCount: transactions.length,
        netSavings: net,
      },
      avgDailySpending: 0,
    };
  }, [transactions]);

  const {
    spendingByCategory,
    monthlySpending,
    incomeVsSpending,
    spendingTrends,
    netWorthTrend,
    incomeTrend,
    spendingTrend,
    savingsTrend,
    quickAnalytics,
  } = analyticsData;

  const getNetWorth = () => {
    return "$0.00"; // Add your net worth calculation
  };

  // Render overview content
  const renderOverviewContent = () => (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 mb-4 sm:mb-6 lg:mb-8">
        <ChartContainer
          title="Income vs Spending"
          isExpanded={expandedCharts.incomeVsSpending}
          onToggleExpand={() => toggleChartExpansion("incomeVsSpending")}
          isMobile={isMobile}
        >
          <IncomeVsSpendingChart data={incomeVsSpending} />
        </ChartContainer>

        <ChartContainer
          title="Spending by Category"
          isExpanded={expandedCharts.spendingByCategory}
          onToggleExpand={() => toggleChartExpansion("spendingByCategory")}
          isMobile={isMobile}
        >
          <SpendingByCategoryChart
            data={spendingByCategory}
            isMobile={isMobile}
          />
        </ChartContainer>
      </div>

      <ChartContainer
        title="Monthly Spending Trend"
        isExpanded={expandedCharts.monthlyTrend}
        onToggleExpand={() => toggleChartExpansion("monthlyTrend")}
        className="mb-6 sm:mb-8"
        isMobile={isMobile}
      >
        <MonthlySpendingChart data={monthlySpending} />
      </ChartContainer>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        <MetricCard
          title="Net Worth"
          value={getNetWorth()}
          subtitle="Total assets minus liabilities"
          icon={DollarSign}
          color="purple"
          trend={netWorthTrend}
          animateCards={false}
        />
        <MetricCard
          title="Total Income"
          value={`$${incomeVsSpending.income.toFixed(2)}`}
          subtitle={`${quickAnalytics.transactionCount} transactions`}
          icon={TrendingUp}
          trend={incomeTrend}
          color="green"
          animateCards={false}
        />
        <MetricCard
          title="Total Spending"
          value={`$${incomeVsSpending.spending.toFixed(2)}`}
          subtitle="All expenses this period"
          icon={TrendingDown}
          trend={spendingTrend}
          color="red"
          animateCards={false}
        />
        <MetricCard
          title="Net Savings"
          value={`$${incomeVsSpending.net.toFixed(2)}`}
          subtitle="Income minus spending"
          icon={PiggyBank}
          trend={savingsTrend}
          color="blue"
          animateCards={false}
        />
      </div>
    </>
  );

  // Render detailed content
  const renderDetailedContent = () => (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 mb-4 sm:mb-6 lg:mb-8">
        <ChartContainer
          title="Spending Trends"
          isExpanded={expandedCharts.spendingTrendsDetailed}
          onToggleExpand={() => toggleChartExpansion("spendingTrendsDetailed")}
          isMobile={isMobile}
        >
          <SpendingTrendsChart data={spendingTrends} />
        </ChartContainer>

        <ChartContainer
          title="Top Spending Categories"
          isExpanded={expandedCharts.topSpendingCategories}
          onToggleExpand={() => toggleChartExpansion("topSpendingCategories")}
          className="mb-6 sm:mb-8"
          isMobile={isMobile}
        >
          {spendingByCategory.length > 0 ? (
            <div className="space-y-3">
              {spendingByCategory.slice(0, 6).map(item => (
                <div
                  key={item.category}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="font-medium text-sm sm:text-base">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChartState message="No spending categories available for this time period" />
          )}
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        <MetricCard
          title="Net Worth"
          value={getNetWorth()}
          subtitle="Total assets minus liabilities"
          icon={DollarSign}
          color="purple"
          trend={netWorthTrend}
          animateCards={false}
        />
        <MetricCard
          title="Total Income"
          value={`$${incomeVsSpending.income.toFixed(2)}`}
          subtitle={`${quickAnalytics.transactionCount} transactions`}
          icon={TrendingUp}
          trend={incomeTrend}
          color="green"
          animateCards={false}
        />
        <MetricCard
          title="Total Spending"
          value={`$${incomeVsSpending.spending.toFixed(2)}`}
          subtitle="All expenses this period"
          icon={TrendingDown}
          trend={spendingTrend}
          color="red"
          animateCards={false}
        />
        <MetricCard
          title="Net Savings"
          value={`$${incomeVsSpending.net.toFixed(2)}`}
          subtitle="Income minus spending"
          icon={PiggyBank}
          trend={savingsTrend}
          color="blue"
          animateCards={false}
        />
      </div>
    </>
  );

  return (
    <div className="p-4 lg:p-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 flex-shrink-0 w-full sm:w-auto">
        {/* View Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setSelectedView("overview")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedView === "overview"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView("detailed")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedView === "detailed"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Detailed
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-sm w-full sm:w-auto">
          {["week", "month", "quarter", "year"].map(range => (
            <button
              key={range}
              onClick={() => handleTimeRangeChange(range)}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeRange === range
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="mt-6">
        {selectedView === "overview"
          ? renderOverviewContent()
          : renderDetailedContent()}
      </div>
    </div>
  );
};

export default AnalyticsPage;
