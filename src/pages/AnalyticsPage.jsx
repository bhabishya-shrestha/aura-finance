import React, { useState } from "react";
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
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  Eye,
  EyeOff,
  Download,
} from "lucide-react";
import useStore from "../store";

const AnalyticsPage = () => {
  const { transactions, getNetWorth } = useStore();
  const [timeRange, setTimeRange] = useState("month");
  const [showDetails, setShowDetails] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate spending by category
  const getSpendingByCategory = () => {
    const categorySpending = {};
    transactions.forEach(transaction => {
      if (transaction.amount < 0) {
        // Only spending, not income
        const category = transaction.category;
        categorySpending[category] =
          (categorySpending[category] || 0) + Math.abs(transaction.amount);
      }
    });

    return Object.entries(categorySpending)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          (amount /
            Object.values(categorySpending).reduce((a, b) => a + b, 0)) *
          100,
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Calculate monthly spending with better data structure
  const getMonthlySpending = () => {
    const monthlyData = {};
    const currentYear = new Date().getFullYear();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Initialize all months with 0
    months.forEach(month => {
      monthlyData[month] = 0;
    });

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      if (date.getFullYear() === currentYear && transaction.amount < 0) {
        const month = date.toLocaleString("default", { month: "short" });
        monthlyData[month] = monthlyData[month] + Math.abs(transaction.amount);
      }
    });

    return months.map(month => ({
      month,
      spending: monthlyData[month],
    }));
  };

  // Calculate income vs spending
  const getIncomeVsSpending = () => {
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const spending = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return [
      { type: "Income", amount: income, color: "#10B981" },
      { type: "Spending", amount: spending, color: "#EF4444" },
    ];
  };

  // Calculate spending trend over time
  const getSpendingTrend = () => {
    const trendData = [];
    const currentDate = new Date();

    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();

      const monthSpending = transactions
        .filter(t => {
          const tDate = new Date(t.date);
          return (
            tDate.getMonth() === date.getMonth() &&
            tDate.getFullYear() === date.getFullYear() &&
            t.amount < 0
          );
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      trendData.push({
        month: `${month} ${year}`,
        spending: monthSpending,
      });
    }

    return trendData;
  };

  const spendingByCategory = getSpendingByCategory();
  const monthlySpending = getMonthlySpending();
  const incomeVsSpending = getIncomeVsSpending();
  const spendingTrend = getSpendingTrend();

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleExport = () => {
    const data = {
      spendingByCategory,
      monthlySpending,
      incomeVsSpending,
      netWorth: getNetWorth(),
      totalTransactions: transactions.length,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Financial insights and spending analysis
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {showDetails ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={handleExport}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Net Worth
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(getNetWorth())}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Total Income
              </p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(
                  transactions
                    .filter(t => t.amount > 0)
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Total Spending
              </p>
              <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(
                  transactions
                    .filter(t => t.amount < 0)
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                )}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Transactions
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {transactions.length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spending by Category - Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Spending by Category
            </h3>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Show All
              </button>
            )}
          </div>

          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    selectedCategory
                      ? spendingByCategory.filter(
                          item => item.category === selectedCategory
                        )
                      : spendingByCategory
                  }
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => {
                    if (percentage < 5) return null;
                    return `${category}\n${percentage.toFixed(1)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  onClick={data =>
                    setSelectedCategory(
                      data.category === selectedCategory ? null : data.category
                    )
                  }
                >
                  {spendingByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.category}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {showDetails && (
            <div className="mt-4 space-y-2">
              {spendingByCategory.slice(0, 5).map((item, index) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                  onClick={() =>
                    setSelectedCategory(
                      item.category === selectedCategory ? null : item.category
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Spending Trend - Area Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Spending Trend
          </h3>

          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: "#6b7280" }}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: "#6b7280" }}
                  tickFormatter={value => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="spending"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Income vs Spending - Bar Chart */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Income vs Spending
        </h3>

        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeVsSpending}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="type"
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: "#6b7280" }}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: "#6b7280" }}
                tickFormatter={value => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="amount"
                fill={entry => entry.color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Spending Categories - Detailed List */}
      {showDetails && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Top Spending Categories
          </h3>
          <div className="space-y-3">
            {spendingByCategory.slice(0, 8).map((item, index) => (
              <div
                key={item.category}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {item.category}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-gray-900 dark:text-white font-semibold">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {item.percentage.toFixed(1)}% of total spending
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
