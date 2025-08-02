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

const AnalyticsPage = () => {
  const {
    getNetWorth,
    getSpendingByCategory,
    getMonthlySpending,
    getIncomeVsSpending,
    getSpendingTrends,
    getTopSpendingCategories,
    getAverageDailySpending,
    getQuickAnalytics,
    transactions,
    refreshAnalytics,
  } = useStore();

  const [timeRange, setTimeRange] = useState("month");
  const [selectedView, setSelectedView] = useState("overview");
  const [animateCards, setAnimateCards] = useState(false);
  const [expandedCharts, setExpandedCharts] = useState({});

  const toggleChartExpansion = chartId => {
    setExpandedCharts(prev => ({
      ...prev,
      [chartId]: !prev[chartId],
    }));
  };

  // Enhanced data processing with animations
  const {
    spendingByCategory,
    monthlySpending,
    incomeVsSpending,
    spendingTrends,
    netWorthTrend,
    incomeTrend,
    spendingTrend,
    savingsTrend,
  } = useMemo(() => {
    const GRADIENT_COLORS = [
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    ];

    const data = {
      spendingByCategory: getSpendingByCategory(timeRange),
      monthlySpending: getMonthlySpending(timeRange),
      incomeVsSpending: getIncomeVsSpending(timeRange),
      spendingTrends: getSpendingTrends(timeRange),
      topCategories: getTopSpendingCategories(timeRange),
      avgDailySpending: getAverageDailySpending(timeRange),
      quickAnalytics: getQuickAnalytics(timeRange),
    };

    // Debug logging
    if (import.meta.env.DEV) {
      console.log("Analytics data for charts:", {
        transactionsCount: transactions.length,
        timeRange,
        spendingByCategory: data.spendingByCategory,
        monthlySpending: data.monthlySpending,
        incomeVsSpending: data.incomeVsSpending,
        spendingTrends: data.spendingTrends,
        sampleTransactions: transactions.slice(0, 3),
      });
    }

    // Enhanced spending data with gradients and proper colors
    const enhancedSpendingData = data.spendingByCategory.map((item, index) => ({
      ...item,
      fill: GRADIENT_COLORS[index % GRADIENT_COLORS.length],
      percentage:
        (item.amount / Math.abs(data.incomeVsSpending.spending)) * 100,
    }));

    // Enhanced monthly data with smooth curves
    const enhancedMonthlyData = data.monthlySpending.map(item => ({
      ...item,
      spending: Math.abs(item.spending),
    }));

    // Calculate trends for metric cards
    const calculateTrend = (current, previous) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      spendingByCategory: enhancedSpendingData,
      monthlySpending: enhancedMonthlyData,
      incomeVsSpending: data.incomeVsSpending,
      spendingTrends: data.spendingTrends,
      sampleTransactions: transactions.slice(0, 3),
      // Calculate trends for metric cards
      netWorthTrend: calculateTrend(getNetWorth(), getNetWorth() * 0.95),
      incomeTrend: calculateTrend(
        data.incomeVsSpending.income,
        data.incomeVsSpending.income * 0.9
      ),
      spendingTrend: calculateTrend(
        Math.abs(data.incomeVsSpending.spending),
        Math.abs(data.incomeVsSpending.spending) * 0.85
      ),
      savingsTrend: calculateTrend(
        data.incomeVsSpending.income - Math.abs(data.incomeVsSpending.spending),
        (data.incomeVsSpending.income -
          Math.abs(data.incomeVsSpending.spending)) *
          0.92
      ),
    };
  }, [
    timeRange,
    getSpendingByCategory,
    getMonthlySpending,
    getIncomeVsSpending,
    getSpendingTrends,
    getTopSpendingCategories,
    getAverageDailySpending,
    getQuickAnalytics,
    transactions,
    getNetWorth,
  ]);

  // Animation effects
  useEffect(() => {
    setAnimateCards(true);
    const timer = setTimeout(() => setAnimateCards(false), 1000);
    return () => clearTimeout(timer);
  }, [timeRange, selectedView]);

  // Refresh analytics data when component mounts
  useEffect(() => {
    refreshAnalytics();

    // Debug logging for transactions
    if (import.meta.env.DEV) {
      console.log("AnalyticsPage - Current transactions:", {
        count: transactions.length,
        transactions: transactions.slice(0, 5),
        sampleDates: transactions.slice(0, 3).map(t => ({
          id: t.id,
          date: t.date,
          dateType: typeof t.date,
          isDateObject: t.date instanceof Date,
          description: t.description,
          amount: t.amount,
        })),
      });
    }
  }, [refreshAnalytics, transactions]);

  // Enhanced utility functions
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

  // Enhanced Custom Tooltip with animations
  const CustomTooltip = ({
    active,
    payload,
    label,
    formatter = formatCurrency,
  }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 backdrop-blur-sm">
        <p className="text-gray-900 dark:text-white font-medium text-sm mb-2">
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              {entry.name}:
            </span>
            <span className="text-gray-900 dark:text-white font-semibold text-sm">
              {formatter(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Enhanced Metric Card with animations and interactions
  const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "blue",
    className = "",
    onClick,
  }) => {
    const colorClasses = {
      blue: "bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20",
      green:
        "bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20",
      red: "bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20",
      purple:
        "bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20",
    };

    return (
      <div
        className={`relative p-4 sm:p-6 rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-lg ${
          colorClasses[color]
        } ${className} ${animateCards ? "animate-fade-in-up" : ""}`}
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
            <div
              className={`flex items-center text-sm font-medium ${
                trend >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              <div className="transform transition-transform duration-300">
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
  };

  // Enhanced Chart Container with animations
  const ChartContainer = ({
    title,
    children,
    className = "",
    isExpanded = false,
    onToggleExpand,
  }) => {
    const isMobile = window.innerWidth < 768; // Only show collapse on mobile

    return (
      <div
        className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 dark:border-white/10 border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${className}`}
        onClick={isMobile ? onToggleExpand : undefined}
        style={{ cursor: isMobile ? "pointer" : "default" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-soft-white">{title}</h3>
          {isMobile && (
            <button
              onClick={e => {
                e.stopPropagation(); // Prevent card click when clicking button
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
          <div className="h-64 sm:h-72 lg:h-80">{children}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Header with professional styling */}
      <div className="relative overflow-hidden">
        {/* Background pattern */}
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
                Comprehensive insights into your financial patterns and trends
                with real-time data visualization
              </p>
            </div>

            {/* Enhanced controls - Mobile optimized */}
            <div className="flex flex-col gap-3 flex-shrink-0 w-full sm:w-auto">
              {/* View Toggle with enhanced styling */}
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

              {/* Enhanced Time Range Selector */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={timeRange}
                  onChange={e => setTimeRange(e.target.value)}
                  className="appearance-none w-full sm:w-auto px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm pr-10"
                >
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content with enhanced spacing */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        {selectedView === "overview" ? (
          <>
            {/* Enhanced Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 mb-4 sm:mb-6 lg:mb-8">
              {/* Income vs Spending Comparison */}
              <ChartContainer
                title="Income vs Spending"
                isExpanded={expandedCharts.incomeVsSpending}
                onToggleExpand={() => toggleChartExpansion("incomeVsSpending")}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={[
                      {
                        name: "Income",
                        amount: incomeVsSpending.income,
                        type: "income",
                        fill: "#10B981", // Green for income
                      },
                      {
                        name: "Spending",
                        amount: Math.abs(incomeVsSpending.spending),
                        type: "spending",
                        fill: "#EF4444", // Red for spending
                      },
                    ]}
                  >
                    <defs>
                      <linearGradient
                        id="incomeGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="spendingGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#EF4444"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#EF4444"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
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
                    <YAxis
                      stroke="#6B7280"
                      fontSize={12}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="amount"
                      fill={entry => entry.fill}
                      radius={[8, 8, 0, 0]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Spending by Category - Enhanced Pie Chart */}
              <ChartContainer
                title="Spending by Category"
                isExpanded={expandedCharts.spendingByCategory}
                onToggleExpand={() =>
                  toggleChartExpansion("spendingByCategory")
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="amount"
                      nameKey="category"
                      label={({ category, percentage }) => {
                        // Hide labels on mobile, show only on desktop
                        const isMobile = window.innerWidth < 768;
                        return !isMobile && percentage > 5
                          ? `${category}\n${percentage.toFixed(1)}%`
                          : "";
                      }}
                      labelLine={false}
                      strokeWidth={2}
                      stroke="#ffffff"
                    >
                      {spendingByCategory.map((entry, index) => (
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
              </ChartContainer>
            </div>

            {/* Monthly Spending Trend - Enhanced */}
            <ChartContainer
              title="Monthly Spending Trend"
              isExpanded={expandedCharts.monthlyTrend}
              onToggleExpand={() => toggleChartExpansion("monthlyTrend")}
              className="mb-6 sm:mb-8"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySpending}>
                  <defs>
                    <linearGradient
                      id="trendGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#3B82F6"
                        stopOpacity={0.1}
                      />
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
                  <YAxis
                    stroke="#6B7280"
                    fontSize={11}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="spending"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fill="url(#trendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Enhanced Summary Cards moved to bottom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
              <MetricCard
                title="Net Worth"
                value={getNetWorth()}
                subtitle="Total assets minus liabilities"
                icon={DollarSign}
                color="purple"
                trend={netWorthTrend}
                className="sm:animate-fade-in-up"
                style={{ animationDelay: "0ms" }}
              />
              <MetricCard
                title="Total Income"
                value={incomeVsSpending.income}
                subtitle={`${getQuickAnalytics(timeRange).transactionCount} transactions`}
                icon={TrendingUp}
                trend={incomeTrend}
                color="green"
                className="sm:animate-fade-in-up"
                style={{ animationDelay: "100ms" }}
              />
              <MetricCard
                title="Total Spending"
                value={incomeVsSpending.spending}
                subtitle="All expenses this period"
                icon={TrendingDown}
                trend={spendingTrend}
                color="red"
                className="sm:animate-fade-in-up"
                style={{ animationDelay: "200ms" }}
              />
              <MetricCard
                title="Net Savings"
                value={getQuickAnalytics(timeRange).netSavings}
                subtitle="Income minus spending"
                icon={PiggyBank}
                trend={savingsTrend}
                color="blue"
                className="sm:animate-fade-in-up"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </>
        ) : (
          <>
            {/* Detailed Analytics View */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 mb-4 sm:mb-6 lg:mb-8">
              {/* Spending Trends Over Time */}
              <ChartContainer
                title="Spending Trends"
                isExpanded={expandedCharts.spendingTrendsDetailed}
                onToggleExpand={() =>
                  toggleChartExpansion("spendingTrendsDetailed")
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={spendingTrends}>
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
                    <YAxis
                      stroke="#6B7280"
                      fontSize={11}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
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
              </ChartContainer>

              {/* Top Spending Categories - Enhanced */}
              <ChartContainer
                title="Top Spending Categories"
                isExpanded={expandedCharts.topSpendingCategories}
                onToggleExpand={() =>
                  toggleChartExpansion("topSpendingCategories")
                }
                className="mb-6 sm:mb-8"
              >
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
                      <div className="text-right">
                        <div className="text-soft-white font-semibold text-sm sm:text-base">
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartContainer>

              {/* Transaction Distribution - Enhanced */}
              <ChartContainer
                title="Transaction Distribution"
                isExpanded={expandedCharts.transactionDistribution}
                onToggleExpand={() =>
                  toggleChartExpansion("transactionDistribution")
                }
                className="mb-6 sm:mb-8"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {transactions.filter(t => t.amount > 0).length}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm sm:text-base font-medium">
                      Income Transactions
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                      {transactions.filter(t => t.amount < 0).length}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm sm:text-base font-medium">
                      Spending Transactions
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800 sm:col-span-2 lg:col-span-1">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {formatCurrency(getAverageDailySpending(timeRange))}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm sm:text-base font-medium">
                      Avg Daily Spending
                    </div>
                  </div>
                </div>
              </ChartContainer>
            </div>

            {/* Enhanced Summary Cards moved to bottom for detailed view too */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
              <MetricCard
                title="Net Worth"
                value={getNetWorth()}
                subtitle="Total assets minus liabilities"
                icon={DollarSign}
                color="purple"
                trend={netWorthTrend}
                className="sm:animate-fade-in-up"
                style={{ animationDelay: "0ms" }}
              />
              <MetricCard
                title="Total Income"
                value={incomeVsSpending.income}
                subtitle={`${getQuickAnalytics(timeRange).transactionCount} transactions`}
                icon={TrendingUp}
                trend={incomeTrend}
                color="green"
                className="sm:animate-fade-in-up"
                style={{ animationDelay: "100ms" }}
              />
              <MetricCard
                title="Total Spending"
                value={incomeVsSpending.spending}
                subtitle="All expenses this period"
                icon={TrendingDown}
                trend={spendingTrend}
                color="red"
                className="sm:animate-fade-in-up"
                style={{ animationDelay: "200ms" }}
              />
              <MetricCard
                title="Net Savings"
                value={getQuickAnalytics(timeRange).netSavings}
                subtitle="Income minus spending"
                icon={PiggyBank}
                trend={savingsTrend}
                color="blue"
                className="sm:animate-fade-in-up"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
