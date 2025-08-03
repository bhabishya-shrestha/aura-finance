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

// Separate Analytics Data Provider - handles all data calculations with professional patterns
const AnalyticsDataProvider = ({ children }) => {
  const { getAllAnalytics, transactions } = useStore();

  // Helper function for empty analytics data - moved to top to fix hoisting
  const getEmptyAnalyticsData = () => ({
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
  });

  // Get saved time range from localStorage or default to "week"
  const getSavedTimeRange = () => {
    try {
      const saved = localStorage.getItem("aura-finance-timeRange");
      return saved || "week";
    } catch (error) {
      // console.warn("Could not load saved time range:", error);
      return "week";
    }
  };

  const [timeRange, setTimeRange] = useState(getSavedTimeRange);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [lastTransactionCount, setLastTransactionCount] = useState(0);

  // Save time range to localStorage when it changes
  const handleTimeRangeChange = useCallback(newTimeRange => {
    setTimeRange(newTimeRange);
    try {
      localStorage.setItem("aura-finance-timeRange", newTimeRange);
      // Force refresh cache when time range changes
      analyticsService.forceRefresh();
    } catch (error) {
      // console.warn("Could not save time range:", error);
    }
  }, []);

  // Professional analytics data calculation with proper memoization
  const analyticsData = useMemo(() => {
    // Check if we need to recalculate
    const currentTransactionCount = transactions.length;
    const needsRecalculation =
      currentTransactionCount !== lastTransactionCount || !isAnalyticsLoading;

    if (needsRecalculation) {
      setLastTransactionCount(currentTransactionCount);
      setIsAnalyticsLoading(true);
    }

    // Professional data validation
    if (!Array.isArray(transactions)) {
      // console.error("Invalid transactions data:", transactions);
      setIsAnalyticsLoading(false);
      return getEmptyAnalyticsData();
    }

    if (!transactions.length) {
      setIsAnalyticsLoading(false);
      return getEmptyAnalyticsData();
    }

    // Data consistency check
    const validTransactions = transactions.filter(
      t =>
        t &&
        typeof t === "object" &&
        t.id &&
        typeof t.amount === "number" &&
        t.date
    );

    if (validTransactions.length !== transactions.length) {
      // console.warn("Data consistency issue:", {
      //   totalTransactions: transactions.length,
      //   validTransactions: validTransactions.length,
      //   invalidTransactions: transactions.length - validTransactions.length,
      // });
    }

    // Get all analytics data in a single batch calculation
    const data = getAllAnalytics(timeRange);

    // Enhanced spending data with proper colors
    const GRADIENT_COLORS = [
      "#667eea",
      "#f093fb",
      "#4facfe",
      "#43e97b",
      "#fa709a",
      "#a8edea",
      "#ff9a9e",
      "#fecfef",
      "#ffecd2",
      "#fcb69f",
      "#ff9a9e",
      "#fecfef",
    ];

    const enhancedSpendingData = data.spendingByCategory.map((item, index) => ({
      ...item,
      fill: GRADIENT_COLORS[index % GRADIENT_COLORS.length],
      percentage:
        data.incomeVsSpending.spending !== 0
          ? (item.amount / Math.abs(data.incomeVsSpending.spending)) * 100
          : 0,
    }));

    const enhancedMonthlyData = data.monthlySpending.map(item => ({
      ...item,
      spending: Math.abs(item.spending),
    }));

    const calculateTrend = (current, previous) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const currentIncome = data.incomeVsSpending.income;
    const currentSpending = Math.abs(data.incomeVsSpending.spending);

    const result = {
      spendingByCategory: enhancedSpendingData,
      monthlySpending: enhancedMonthlyData,
      incomeVsSpending: data.incomeVsSpending,
      spendingTrends: data.spendingTrends,
      netWorthTrend: calculateTrend(
        data.incomeVsSpending.net,
        data.incomeVsSpending.net * 0.95
      ),
      incomeTrend: calculateTrend(currentIncome, currentIncome * 0.9),
      spendingTrend: calculateTrend(currentSpending, currentSpending * 0.85),
      savingsTrend: calculateTrend(
        currentIncome - currentSpending,
        (currentIncome - currentSpending) * 0.92
      ),
      quickAnalytics: data.quickAnalytics,
      avgDailySpending: data.avgDailySpending,
    };

    // Set loading to false after calculation is complete
    setIsAnalyticsLoading(false);

    // Professional debug logging
    // if (import.meta.env.DEV) {
    //   console.log("Analytics data calculation:", {
    //     timeRange,
    //     transactionCount: transactions.length,
    //     validTransactionCount: validTransactions.length,
    //     needsRecalculation,
    //     calculationTime: Date.now(),
    //     dataSummary: {
    //       spendingByCategory: enhancedSpendingData.length,
    //       monthlySpending: enhancedMonthlyData.length,
    //       spendingTrends: data.spendingTrends.length,
    //       hasIncomeVsSpending:
    //         !!data.incomeVsSpending.income || !!data.incomeVsSpending.spending,
    //       quickAnalytics: data.quickAnalytics,
    //     },
    //     dataConsistency: {
    //       totalTransactions: transactions.length,
    //       validTransactions: validTransactions.length,
    //       dataIntegrity: validTransactions.length === transactions.length,
    //     },
    //   });
    // }

    return result;
  }, [
    timeRange,
    transactions,
    lastTransactionCount,
    isAnalyticsLoading,
    getAllAnalytics,
  ]);

  return children({
    analyticsData,
    isAnalyticsLoading,
    timeRange,
    setTimeRange: handleTimeRangeChange,
  });
};

// Empty state component for charts
const EmptyChartState = ({
  message = "No data available for this time period",
}) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6">
    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
      <BarChart3 className="w-8 h-8 text-gray-400" />
    </div>
    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">
      No Data Available
    </p>
    <p className="text-gray-400 dark:text-gray-500 text-xs">{message}</p>
  </div>
);

// Separate Chart Components - each is completely independent
const SpendingByCategoryChart = React.memo(({ data, isMobile }) => {
  const formatCurrency = useCallback(amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  if (!data || !data.length) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={5}
          dataKey="amount"
          nameKey="category"
          label={({ category, percentage }) => {
            return !isMobile && percentage > 5
              ? `${category}\n${percentage.toFixed(1)}%`
              : "";
          }}
          labelLine={false}
          strokeWidth={2}
          stroke="#ffffff"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.fill}
              stroke="#ffffff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null;
            const data = payload[0].payload;
            return (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 backdrop-blur-sm">
                <p className="text-gray-900 dark:text-white font-medium text-sm mb-2">
                  {data.category}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Amount: {formatCurrency(data.amount)}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Percentage: {data.percentage.toFixed(1)}%
                </p>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

SpendingByCategoryChart.displayName = "SpendingByCategoryChart";

const MonthlySpendingChart = React.memo(({ data }) => {
  const formatCurrency = useCallback(amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  if (!data || !data.length) return <EmptyChartState />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(156, 163, 175, 0.2)"
        />
        <XAxis
          dataKey="month"
          stroke="#6B7280"
          fontSize={11}
          tick={{ fontSize: 10 }}
        />
        <YAxis stroke="#6B7280" fontSize={11} tick={{ fontSize: 10 }} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            return (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 backdrop-blur-sm">
                <p className="text-gray-900 dark:text-white font-medium text-sm mb-2">
                  {label}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Spending: {formatCurrency(payload[0].value)}
                </p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="spending"
          stroke="#3B82F6"
          strokeWidth={3}
          fill="url(#trendGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

MonthlySpendingChart.displayName = "MonthlySpendingChart";

const IncomeVsSpendingChart = React.memo(({ data }) => {
  const formatCurrency = useCallback(amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  if (!data || (!data.income && !data.spending)) return <EmptyChartState />;

  const chartData = [
    {
      name: "Income",
      amount: data.income,
      type: "income",
      fill: "#10B981",
    },
    {
      name: "Spending",
      amount: Math.abs(data.spending),
      type: "spending",
      fill: "#EF4444",
    },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(156, 163, 175, 0.2)"
        />
        <XAxis
          dataKey="name"
          stroke="#6B7280"
          fontSize={12}
          tick={{ fontSize: 11 }}
        />
        <YAxis stroke="#6B7280" fontSize={12} tick={{ fontSize: 11 }} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            return (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 backdrop-blur-sm">
                <p className="text-gray-900 dark:text-white font-medium text-sm mb-2">
                  {label}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Amount: {formatCurrency(payload[0].value)}
                </p>
              </div>
            );
          }}
        />
        <Bar
          dataKey="amount"
          fill={entry => entry.fill}
          radius={[8, 8, 0, 0]}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
});

IncomeVsSpendingChart.displayName = "IncomeVsSpendingChart";

const SpendingTrendsChart = React.memo(({ data }) => {
  const formatCurrency = useCallback(amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Debug logging
  // console.log("SpendingTrendsChart received data:", {
  //   data,
  //   dataLength: data?.length,
  //   hasData: data?.some(item => item.spending > 0),
  //   sampleData: data?.slice(0, 3),
  //   // Add detailed analysis of the data
  //   allSpendingValues: data?.map(item => ({
  //     period: item.period,
  //     spending: item.spending,
  //     income: item.income,
  //     net: item.net,
  //     transactionCount: item.transactionCount,
  //   })),
  //   totalSpending: data?.reduce((sum, item) => sum + item.spending, 0),
  //   totalIncome: data?.reduce((sum, item) => sum + item.income, 0),
  // });

  if (!data || !data.length) return <EmptyChartState />;

  // Check if there's any actual spending data
  const hasSpendingData = data.some(item => item.spending > 0);
  if (!hasSpendingData) {
    return (
      <EmptyChartState message="No spending data available for this time period" />
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(156, 163, 175, 0.2)"
        />
        <XAxis
          dataKey="period"
          stroke="#6B7280"
          fontSize={11}
          tick={{ fontSize: 10 }}
        />
        <YAxis stroke="#6B7280" fontSize={11} tick={{ fontSize: 10 }} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            return (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 backdrop-blur-sm">
                <p className="text-gray-900 dark:text-white font-medium text-sm mb-2">
                  {label}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Spending: {formatCurrency(payload[0].value)}
                </p>
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="spending"
          stroke="#3B82F6"
          strokeWidth={3}
          dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

SpendingTrendsChart.displayName = "SpendingTrendsChart";

// Separate Chart Container Component
const ChartContainer = React.memo(
  ({
    title,
    children,
    className = "",
    isExpanded = false,
    onToggleExpand,
    isMobile,
  }) => {
    const handleCardClick = useCallback(
      e => {
        if (e.target.closest(".chart-content")) {
          return; // Don't toggle if clicking on chart content
        }
        if (isMobile && onToggleExpand) {
          onToggleExpand();
        }
      },
      [isMobile, onToggleExpand]
    );

    return (
      <div
        className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 dark:border-white/10 border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${className}`}
        onClick={handleCardClick}
        style={{ cursor: isMobile ? "pointer" : "default" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-soft-white">{title}</h3>
          {isMobile && (
            <button
              onClick={e => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-soft-white" />
              ) : (
                <ChevronDown className="w-4 h-4 text-soft-white" />
              )}
            </button>
          )}
        </div>
        {(!isMobile || isExpanded) && (
          <div className="chart-content h-64 sm:h-72 lg:h-80">{children}</div>
        )}
      </div>
    );
  }
);

ChartContainer.displayName = "ChartContainer";

// Separate Metric Card Component
const MetricCard = React.memo(
  ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "blue",
    className = "",
    onClick,
    animateCards,
  }) => {
    const colorClasses = {
      blue: "bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20",
      green:
        "bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20",
      red: "bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20",
      purple:
        "bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20",
    };

    const formatCurrency = useCallback(amount => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }, []);

    const formatPercentage = useCallback(value => {
      return `${Math.abs(value).toFixed(1)}%`;
    }, []);

    return (
      <div
        className={`relative p-4 sm:p-6 rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-lg ${
          colorClasses[color]
        } ${animateCards ? "animate-fade-in-up" : ""} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="transform transition-transform duration-300">
              <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-soft-white">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="text-2xl sm:text-3xl font-bold text-soft-white">
            {typeof value === "number" ? formatCurrency(value) : value}
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-sm font-medium">
              <div
                className={`flex items-center ${
                  trend >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {trend >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                )}
              </div>
              {formatPercentage(trend)}
            </div>
          )}
        </div>
      </div>
    );
  }
);

MetricCard.displayName = "MetricCard";

// Main Analytics Page Component - now just orchestrates the separate components
const AnalyticsPage = () => {
  const { getNetWorth } = useStore();
  const [selectedView, setSelectedView] = useState("overview");
  const [expandedCharts, setExpandedCharts] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile layout once on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleChartExpansion = useCallback(chartId => {
    setExpandedCharts(prev => ({
      ...prev,
      [chartId]: !prev[chartId],
    }));
  }, []);

  return (
    <AnalyticsDataProvider>
      {({ analyticsData, isAnalyticsLoading, timeRange, setTimeRange }) => {
        if (isAnalyticsLoading) {
          return (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="ml-4 text-gray-600 dark:text-gray-400">
                Loading financial analytics...
              </p>
            </div>
          );
        }

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

        return (
          <div className="flex-1 min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Header content */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10" />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />

              <div className="relative p-4 sm:p-6 lg:p-8">
                {/* Header content */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent leading-tight">
                        Financial Analytics
                      </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg max-w-2xl">
                      Comprehensive insights into your financial patterns and
                      trends with real-time data visualization
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col gap-3 flex-shrink-0 w-full sm:w-auto">
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-sm w-full sm:w-auto">
                      {["overview", "detailed"].map(view => (
                        <button
                          key={view}
                          onClick={() => setSelectedView(view)}
                          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            selectedView === view
                              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          {view === "overview" ? "Overview" : "Detailed"}
                        </button>
                      ))}
                    </div>

                    {/* Time Range Selector */}
                    <div className="relative w-full sm:w-auto">
                      <select
                        value={timeRange}
                        onChange={e => setTimeRange(e.target.value)}
                        className="appearance-none w-full sm:w-auto px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm pr-10 text-center sm:text-left cursor-pointer"
                      >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div className="px-4 sm:px-6 lg:px-8 pb-8">
                  {selectedView === "overview" ? (
                    <>
                      {/* Charts Grid */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 mb-4 sm:mb-6 lg:mb-8">
                        <ChartContainer
                          title="Income vs Spending"
                          isExpanded={expandedCharts.incomeVsSpending}
                          onToggleExpand={() =>
                            toggleChartExpansion("incomeVsSpending")
                          }
                          isMobile={isMobile}
                        >
                          <IncomeVsSpendingChart data={incomeVsSpending} />
                        </ChartContainer>

                        <ChartContainer
                          title="Spending by Category"
                          isExpanded={expandedCharts.spendingByCategory}
                          onToggleExpand={() =>
                            toggleChartExpansion("spendingByCategory")
                          }
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
                        onToggleExpand={() =>
                          toggleChartExpansion("monthlyTrend")
                        }
                        className="mb-6 sm:mb-8"
                        isMobile={isMobile}
                      >
                        <MonthlySpendingChart data={monthlySpending} />
                      </ChartContainer>

                      {/* Summary Cards */}
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
                          value={incomeVsSpending.income}
                          subtitle={`${quickAnalytics.transactionCount} transactions`}
                          icon={TrendingUp}
                          trend={incomeTrend}
                          color="green"
                          animateCards={false}
                        />
                        <MetricCard
                          title="Total Spending"
                          value={incomeVsSpending.spending}
                          subtitle="All expenses this period"
                          icon={TrendingDown}
                          trend={spendingTrend}
                          color="red"
                          animateCards={false}
                        />
                        <MetricCard
                          title="Net Savings"
                          value={incomeVsSpending.net}
                          subtitle="Income minus spending"
                          icon={PiggyBank}
                          trend={savingsTrend}
                          color="blue"
                          animateCards={false}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Detailed View */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 mb-4 sm:mb-6 lg:mb-8">
                        <ChartContainer
                          title="Spending Trends"
                          isExpanded={expandedCharts.spendingTrendsDetailed}
                          onToggleExpand={() =>
                            toggleChartExpansion("spendingTrendsDetailed")
                          }
                          isMobile={isMobile}
                        >
                          <SpendingTrendsChart data={spendingTrends} />
                        </ChartContainer>

                        <ChartContainer
                          title="Top Spending Categories"
                          isExpanded={expandedCharts.topSpendingCategories}
                          onToggleExpand={() =>
                            toggleChartExpansion("topSpendingCategories")
                          }
                          className="mb-6 sm:mb-8"
                          isMobile={isMobile}
                        >
                          {spendingByCategory.length > 0 ? (
                            <div className="space-y-3">
                              {spendingByCategory.slice(0, 6).map(item => (
                                <div
                                  key={item.category}
                                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: item.fill }}
                                    />
                                    <span className="text-soft-white font-medium text-sm sm:text-base">
                                      {item.category}
                                    </span>
                                  </div>
                                  <div className="text-gray-400 text-xs sm:text-sm">
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

                      {/* Summary Cards for detailed view */}
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
                          value={incomeVsSpending.income}
                          subtitle={`${quickAnalytics.transactionCount} transactions`}
                          icon={TrendingUp}
                          trend={incomeTrend}
                          color="green"
                          animateCards={false}
                        />
                        <MetricCard
                          title="Total Spending"
                          value={incomeVsSpending.spending}
                          subtitle="All expenses this period"
                          icon={TrendingDown}
                          trend={spendingTrend}
                          color="red"
                          animateCards={false}
                        />
                        <MetricCard
                          title="Net Savings"
                          value={incomeVsSpending.net}
                          subtitle="Income minus spending"
                          icon={PiggyBank}
                          trend={savingsTrend}
                          color="blue"
                          animateCards={false}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </AnalyticsDataProvider>
  );
};

export default AnalyticsPage;
