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

  const spendingByCategory = getSpendingByCategory();
  const monthlySpending = getMonthlySpending();
  const incomeVsSpending = getIncomeVsSpending();

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Analytics</h1>
          <p className="text-muted-gray mt-1">
            Financial insights and spending analysis
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-gray text-sm">Total Net Worth</p>
              <p className="text-2xl font-bold text-soft-white">
                {formatCurrency(getNetWorth())}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-gray text-sm">Total Income</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(
                  transactions
                    .filter(t => t.amount > 0)
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-gray text-sm">Total Spending</p>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(
                  transactions
                    .filter(t => t.amount < 0)
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                )}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-gray text-sm">Total Transactions</p>
              <p className="text-2xl font-bold text-soft-white">
                {transactions.length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spending by Category */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold text-soft-white mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5" />
            Spending by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={spendingByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => {
                  // Only show label if percentage is significant
                  if (percentage < 5) return null;
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
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Spending Trend */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold text-soft-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Monthly Spending Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySpending}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis dataKey="month" stroke="#a1a1a1" />
              <YAxis stroke="#a1a1a1" />
              <Tooltip formatter={value => formatCurrency(value)} />
              <Bar dataKey="spending" fill="#00f2fe" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Income vs Spending */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold text-soft-white mb-4">
          Income vs Spending
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incomeVsSpending}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis dataKey="type" stroke="#a1a1a1" />
            <YAxis stroke="#a1a1a1" />
            <Tooltip formatter={value => formatCurrency(value)} />
            <Bar dataKey="amount" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Spending Categories */}
      <div className="mt-8">
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold text-soft-white mb-4">
            Top Spending Categories
          </h3>
          <div className="space-y-4">
            {spendingByCategory.slice(0, 5).map((item, index) => (
              <div
                key={item.category}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-soft-white font-medium">
                    {item.category}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-soft-white font-semibold">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="text-muted-gray text-sm">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
