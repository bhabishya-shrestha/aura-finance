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
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
} from "lucide-react";
import useStore from "../store";

const AnalyticsPage = () => {
  const { transactions, getNetWorth } = useStore();
  const [timeRange, setTimeRange] = useState("month");
  const [analyticsData, setAnalyticsData] = useState({
    spendingByCategory: [],
    monthlySpending: [],
    incomeVsSpending: [],
  });

  // Update analytics data when transactions change
  useEffect(() => {
    const spendingByCategory = getSpendingByCategory();
    const monthlySpending = getMonthlySpending();
    const incomeVsSpending = getIncomeVsSpending();

    setAnalyticsData({
      spendingByCategory,
      monthlySpending,
      incomeVsSpending,
    });
  }, [transactions]);

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

  // Calculate monthly spending
  const getMonthlySpending = () => {
    const monthlyData = {};
    const currentYear = new Date().getFullYear();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      if (date.getFullYear() === currentYear && transaction.amount < 0) {
        const month = date.toLocaleString("default", { month: "short" });
        monthlyData[month] =
          (monthlyData[month] || 0) + Math.abs(transaction.amount);
      }
    });

    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      spending: amount,
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

  const { spendingByCategory, monthlySpending, incomeVsSpending } = analyticsData;

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text">
            Analytics
          </h1>
          <p className="text-muted-gray mt-1 text-sm lg:text-base">
            Financial insights and spending analysis
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal text-sm lg:text-base"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-gray text-sm lg:text-base">
                Total Net Worth
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-soft-white">
                {formatCurrency(getNetWorth())}
              </p>
            </div>
            <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-green-400" />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-gray text-sm lg:text-base">
                Total Income
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-400">
                {formatCurrency(
                  transactions
                    .filter(t => t.amount > 0)
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
            <DollarSign className="w-6 h-6 lg:w-8 lg:h-8 text-green-400" />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-gray text-sm lg:text-base">
                Total Spending
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-400">
                {formatCurrency(
                  transactions
                    .filter(t => t.amount < 0)
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                )}
              </p>
            </div>
            <TrendingDown className="w-6 h-6 lg:w-8 lg:h-8 text-red-400" />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-gray text-sm lg:text-base">
                Total Transactions
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-soft-white">
                {transactions.length}
              </p>
            </div>
            <Calendar className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
        {/* Spending by Category */}
        <div className="glass-card p-4 sm:p-6 lg:p-8">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-soft-white mb-4 lg:mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 lg:w-6 lg:h-6" />
            Spending by Category
          </h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spendingByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => {
                    // Only show label if percentage is significant and readable
                    if (percentage < 8) return null;
                    return `${category}\n${percentage.toFixed(1)}%`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {spendingByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.category}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={value => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "8px",
                    color: "rgba(0, 0, 0, 0.9)",
                    fontSize: "14px",
                    padding: "8px 12px",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                  labelStyle={{
                    color: "rgba(0, 0, 0, 0.9)",
                    fontWeight: "bold",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Spending Trend */}
        <div className="glass-card p-4 sm:p-6 lg:p-8">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-soft-white mb-4 lg:mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6" />
            Monthly Spending Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySpending}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis dataKey="month" stroke="#a1a1a1" fontSize={12} />
              <YAxis stroke="#a1a1a1" fontSize={12} />
              <Tooltip
                formatter={value => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  borderRadius: "8px",
                  color: "rgba(0, 0, 0, 0.9)",
                  fontSize: "14px",
                  padding: "8px 12px",
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                }}
              />
              <Bar dataKey="spending" fill="#00f2fe" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Income vs Spending */}
      <div className="glass-card p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-soft-white mb-4 lg:mb-6">
          Income vs Spending
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incomeVsSpending}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis dataKey="type" stroke="#a1a1a1" fontSize={12} />
            <YAxis stroke="#a1a1a1" fontSize={12} />
            <Tooltip
              formatter={value => formatCurrency(value)}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
                color: "rgba(0, 0, 0, 0.9)",
                fontSize: "14px",
                padding: "8px 12px",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
            />
            <Bar dataKey="amount" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Spending Categories */}
      <div className="glass-card p-4 sm:p-6 lg:p-8">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-soft-white mb-4 lg:mb-6">
          Top Spending Categories
        </h3>
        <div className="space-y-3 lg:space-y-4">
          {spendingByCategory.slice(0, 5).map((item, index) => (
            <div
              key={item.category}
              className="flex items-center justify-between p-3 lg:p-4 bg-white/5 rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="w-4 h-4 lg:w-5 lg:h-5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-soft-white font-medium truncate">
                  {item.category}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-soft-white font-semibold text-sm lg:text-base">
                  {formatCurrency(item.amount)}
                </div>
                <div className="text-muted-gray text-xs lg:text-sm">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
