import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
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
  Legend,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  Target,
  Activity,
  CreditCard,
  PiggyBank,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
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
  } = useStore();

  const [timeRange, setTimeRange] = useState("month");
  const [selectedView, setSelectedView] = useState("overview");
  const [showDetailedCharts, setShowDetailedCharts] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    spendingByCategory: [],
    monthlySpending: [],
    incomeVsSpending: [],
    spendingTrends: [],
    topCategories: [],
    avgDailySpending: 0,
    quickAnalytics: {
      income: 0,
      spending: 0,
      netSavings: 0,
      spendingTrend: 0,
      transactionCount: 0,
    },
  });

  // Enhanced color palette for professional charts
  const CHART_COLORS = {
    primary: "#3B82F6",
    secondary: "#10B981",
    accent: "#F59E0B",
    danger: "#EF4444",
    purple: "#8B5CF6",
    pink: "#EC4899",
    indigo: "#6366F1",
    teal: "#14B8A6",
    orange: "#F97316",
    gray: "#6B7280",
    success: "#22C55E",
    warning: "#EAB308",
  };

  const GRADIENT_COLORS = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  ];

  // Update analytics data when time range changes
  useEffect(() => {
    const spendingByCategory = getSpendingByCategory(timeRange);
    const monthlySpending = getMonthlySpending(
      timeRange === "month" ? "year" : timeRange
    );
    const incomeVsSpending = getIncomeVsSpending(timeRange);
    const spendingTrends = getSpendingTrends(12);
    const topCategories = getTopSpendingCategories(timeRange, 8);
    const avgDailySpending = getAverageDailySpending(timeRange);
    const quickAnalytics = getQuickAnalytics(timeRange);

    setAnalyticsData({
      spendingByCategory,
      monthlySpending,
      incomeVsSpending,
      spendingTrends,
      topCategories,
      avgDailySpending,
      quickAnalytics,
    });
  }, [
    timeRange,
    getSpendingByCategory,
    getMonthlySpending,
    getIncomeVsSpending,
    getSpendingTrends,
    getTopSpendingCategories,
    getAverageDailySpending,
    getQuickAnalytics,
  ]);

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = value => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const {
    spendingByCategory,
    monthlySpending,
    incomeVsSpending,
    spendingTrends,
    quickAnalytics,
  } = analyticsData;

  // Enhanced data processing for better visualizations
  const enhancedSpendingData = useMemo(() => {
    return spendingByCategory.map((item, index) => ({
      ...item,
      fill: Object.values(CHART_COLORS)[
        index % Object.keys(CHART_COLORS).length
      ],
      gradient: GRADIENT_COLORS[index % GRADIENT_COLORS.length],
    }));
  }, [spendingByCategory]);

  const enhancedMonthlyData = useMemo(() => {
    return monthlySpending.map((item, index) => ({
      ...item,
      month: new Date(item.month).toLocaleDateString("en-US", {
        month: "short",
      }),
      trend:
        index > 0
          ? ((item.spending - monthlySpending[index - 1].spending) /
              monthlySpending[index - 1].spending) *
            100
          : 0,
    }));
  }, [monthlySpending]);

  const spendingVsIncomeData = useMemo(() => {
    return [
      {
        name: "Income",
        amount: incomeVsSpending.income,
        fill: CHART_COLORS.success,
        type: "income",
      },
      {
        name: "Spending",
        amount: incomeVsSpending.spending,
        fill: CHART_COLORS.danger,
        type: "spending",
      },
    ];
  }, [incomeVsSpending]);

  // Custom tooltip component for better UX
  const CustomTooltip = ({
    active,
    payload,
    label,
    formatter = formatCurrency,
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatter(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Enhanced metric card component
  const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "blue",
    className = "",
  }) => {
    const colorClasses = {
      blue: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
      green: "text-green-500 bg-green-50 dark:bg-green-900/20",
      red: "text-red-500 bg-red-50 dark:bg-red-900/20",
      purple: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
      orange: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
    };

    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center text-sm font-medium ${
                trend >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {trend >= 0 ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              {formatPercentage(trend)}
            </div>
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {typeof value === "number" ? formatCurrency(value) : value}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text">
            Financial Analytics
          </h1>
          <p className="text-muted-gray mt-2 text-base lg:text-lg">
            Comprehensive insights into your financial patterns and trends
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {["overview", "detailed"].map(view => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
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
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Net Worth"
          value={getNetWorth()}
          subtitle="Total assets minus liabilities"
          icon={Target}
          color="purple"
        />
        <MetricCard
          title="Total Income"
          value={incomeVsSpending.income}
          subtitle={`${quickAnalytics.transactionCount} transactions`}
          icon={TrendingUp}
          trend={quickAnalytics.spendingTrend}
          color="green"
        />
        <MetricCard
          title="Total Spending"
          value={incomeVsSpending.spending}
          subtitle="All expenses this period"
          icon={TrendingDown}
          trend={-quickAnalytics.spendingTrend}
          color="red"
        />
        <MetricCard
          title="Net Savings"
          value={quickAnalytics.netSavings}
          subtitle="Income minus spending"
          icon={PiggyBank}
          color="blue"
        />
      </div>

      {selectedView === "overview" ? (
        <>
          {/* Enhanced Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            {/* Income vs Spending Comparison */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Income vs Spending
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Income
                  </span>
                  <div className="w-3 h-3 rounded-full bg-red-500 ml-4"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Spending
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={spendingVsIncomeData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(156, 163, 175, 0.2)"
                  />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Spending by Category - Enhanced Pie Chart */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Spending by Category
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={enhancedSpendingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="amount"
                    label={({ category, percentage }) =>
                      percentage > 5
                        ? `${category}\n${percentage.toFixed(1)}%`
                        : ""
                    }
                    labelLine={false}
                  >
                    {enhancedSpendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Spending Trend - Enhanced */}
          <div className="glass-card p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Monthly Spending Trend
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={enhancedMonthlyData}>
                <defs>
                  <linearGradient
                    id="spendingGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(156, 163, 175, 0.2)"
                />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="spending"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#spendingGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <>
          {/* Detailed Analytics View */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            {/* Spending Trends Over Time */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Spending Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={spendingTrends}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(156, 163, 175, 0.2)"
                  />
                  <XAxis dataKey="period" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
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
            </div>

            {/* Top Spending Categories - Enhanced */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Top Spending Categories
              </h3>
              <div className="space-y-4">
                {enhancedSpendingData.slice(0, 6).map((item, index) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-gray-900 dark:text-white font-medium truncate">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 dark:text-white font-semibold">
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction Distribution Analysis */}
          <div className="glass-card p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Transaction Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {transactions.filter(t => t.amount > 0).length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Income Transactions
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-2">
                  {transactions.filter(t => t.amount < 0).length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Expense Transactions
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">
                  {formatCurrency(avgDailySpending)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Average Daily Spending
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Eye className="w-4 h-4" />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            <Activity className="w-4 h-4" />
            Generate Insights
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            <Target className="w-4 h-4" />
            Set Budget Goals
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
