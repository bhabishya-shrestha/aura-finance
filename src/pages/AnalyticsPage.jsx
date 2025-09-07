import React, { useState, useEffect, useMemo } from "react";
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
  BarChart,
  Legend,
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

// Custom Tooltip Component for Category Charts
const CategoryTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900 dark:text-white">
          {data.category}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          $
          {data.amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    );
  }
  return null;
};

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

// Chart Components
const IncomeVsSpendingChart = ({ data }) => {
  if (!data || !data.data || !data.data.length) return <EmptyChartState />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data.data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={value => [`$${value.toFixed(2)}`, "Amount"]} />
        <Bar dataKey="amount" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const SpendingByCategoryChart = ({ data, isMobile }) => {
  if (!data || !data.length) return <EmptyChartState />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={isMobile ? 40 : 60}
          outerRadius={isMobile ? 80 : 100}
          paddingAngle={5}
          dataKey="amount"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<CategoryTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const MonthlySpendingChart = ({ data }) => {
  if (!data || !data.length) return <EmptyChartState />;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
        />
        <YAxis />
        <Tooltip
          formatter={(value, name, props) => {
            const dataKey = props.dataKey;
            const label = dataKey === "income" ? "Income" : "Spending";
            return [`$${value.toFixed(2)}`, label];
          }}
          labelFormatter={(label, payload) => {
            // Use the actual month from the data payload
            if (payload && payload.length > 0) {
              return `Period: ${payload[0].payload.month}`;
            }
            return `Period: ${label}`;
          }}
          position={{ x: undefined, y: undefined }}
          allowEscapeViewBox={{ x: false, y: false }}
        />
        <Legend
          verticalAlign="top"
          height={36}
          wrapperStyle={{ paddingBottom: "10px" }}
        />
        <Line
          type="monotone"
          dataKey="income"
          stroke="#10b981"
          strokeWidth={2}
          name="Income"
        />
        <Line
          type="monotone"
          dataKey="spending"
          stroke="#ef4444"
          strokeWidth={2}
          name="Spending"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const SpendingTrendsChart = ({ data, timeRange }) => {
  if (!data || !data.length) return <EmptyChartState />;

  // Custom tick formatter based on time range
  const formatXAxisTick = tickItem => {
    if (!tickItem) return "";

    // For different time ranges, we might want different formatting
    switch (timeRange) {
      case "week":
        // For week view, show day names or dates
        return tickItem;
      case "month":
        // For month view, show week numbers
        return tickItem;
      case "quarter":
        // For quarter view, show month names
        return tickItem;
      case "year":
        // For year view, show month names
        return tickItem;
      default:
        return tickItem;
    }
  };

  // Get all unique categories across all periods
  const allCategories = new Set();
  data.forEach(period => {
    period.categories.forEach(category => {
      allCategories.add(category.category);
    });
  });

  // Create data structure for stacked bar chart
  const chartData = data.map(period => {
    const dataPoint = { period: period.period };

    // Initialize all categories with 0
    allCategories.forEach(category => {
      dataPoint[category] = 0;
    });

    // Fill in actual values
    period.categories.forEach(category => {
      dataPoint[category.category] = category.amount;
    });

    return dataPoint;
  });

  // Create bars for each category
  const categoryBars = Array.from(allCategories).map(category => {
    // Find the color for this category from the first period that has it
    const firstPeriodWithCategory = data.find(period =>
      period.categories.some(cat => cat.category === category)
    );
    const categoryData = firstPeriodWithCategory?.categories.find(
      cat => cat.category === category
    );
    const fillColor = categoryData?.fill || "#8884d8";

    return (
      <Bar
        key={category}
        dataKey={category}
        stackId="spending"
        fill={fillColor}
        name={category}
      />
    );
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="period"
          tickFormatter={formatXAxisTick}
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
        />
        <YAxis />
        <Tooltip
          formatter={(value, name) => {
            return [`$${value.toFixed(2)}`, name];
          }}
          labelFormatter={(label, payload) => {
            // Use the actual period from the data payload
            if (payload && payload.length > 0) {
              return `Period: ${payload[0].payload.period}`;
            }
            return `Period: ${label}`;
          }}
          position={{ x: undefined, y: undefined }}
          allowEscapeViewBox={{ x: false, y: false }}
        />
        <Legend
          verticalAlign="bottom"
          height={60}
          wrapperStyle={{ paddingTop: "20px" }}
        />
        {categoryBars}
      </BarChart>
    </ResponsiveContainer>
  );
};

// Main Analytics Page Component
const AnalyticsPage = () => {
  const { transactions, getNetWorth: storeGetNetWorth } = useProductionStore();
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
    console.log(
      `🔄 [Analytics Page] Changing time range from ${timeRange} to ${newRange}`
    );
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

  // Analytics data calculation using the analytics service
  const analyticsData = useMemo(() => {
    if (!transactions || !transactions.length) {
      return {
        spendingByCategory: [],
        monthlySpending: [],
        incomeVsSpending: { income: 0, spending: 0, net: 0, data: [] },
        spendingTrends: [],
        netWorthTrend: 0,
        incomeTrend: 0,
        spendingTrend: 0,
        savingsTrend: 0,
        quickAnalytics: { transactionCount: 0, netSavings: 0 },
        avgDailySpending: 0,
      };
    }

    // Debug logging for input transactions
    if (import.meta.env.DEV) {
      console.log(
        `🔄 [Analytics Page] Input transactions for ${timeRange}: ${transactions.length}`
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
          `   ❌ NO SEPTEMBER 1ST TRANSACTIONS IN INPUT for ${timeRange}`
        );
      }
    }

    // Use the analytics service to calculate all analytics for the selected time range
    const allAnalytics = analyticsService.calculateAllAnalytics(
      transactions,
      timeRange
    );

    // Debug logging for the analytics data received
    if (import.meta.env.DEV) {
      console.log(
        `🔄 [Analytics Page] Analytics data received for ${timeRange}:`
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
      spendingTrends: allAnalytics.spendingTrends,
      spendingTrendsByCategory: allAnalytics.spendingTrendsByCategory,
      netWorthTrend: allAnalytics.netWorthTrend,
      incomeTrend: allAnalytics.incomeTrend,
      spendingTrend: allAnalytics.spendingTrend,
      savingsTrend: allAnalytics.savingsTrend,
      quickAnalytics: allAnalytics.quickAnalytics,
      avgDailySpending: allAnalytics.avgDailySpending,
    };
  }, [transactions, timeRange]);

  const {
    spendingByCategory,
    monthlySpending,
    incomeVsSpending,
    spendingTrendsByCategory,
    netWorthTrend,
    incomeTrend,
    spendingTrend,
    savingsTrend,
    quickAnalytics,
  } = analyticsData;

  // Debug logging for Analytics page
  if (import.meta.env.DEV) {
    console.log(`📊 [Analytics Page Debug] Overview for ${timeRange}:`);
    console.log(`   💰 Total Income: $${incomeVsSpending.income}`);
    console.log(`   💸 Total Spending: $${incomeVsSpending.spending}`);
    console.log(`   📈 Net Savings: $${incomeVsSpending.net}`);
    console.log(`   📊 Raw incomeVsSpending:`, incomeVsSpending);
  }

  // Format numbers with commas for better readability
  const formatCurrency = amount => {
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getNetWorth = () => {
    // Use the store's getNetWorth method for consistency
    const netWorth = storeGetNetWorth();
    return formatCurrency(netWorth);
  };

  // Dynamic chart title based on time range
  const getSpendingTrendTitle = () => {
    switch (timeRange) {
      case "week":
        return "Daily Spending Trend";
      case "month":
        return "Weekly Spending Trend";
      case "quarter":
        return "Monthly Spending Trend";
      case "year":
        return "Monthly Spending Trend";
      default:
        return "Monthly Spending Trend";
    }
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
          <IncomeVsSpendingChart
            key={`income-vs-spending-${timeRange}`}
            data={incomeVsSpending}
          />
        </ChartContainer>

        <ChartContainer
          title="Spending by Category"
          isExpanded={expandedCharts.spendingByCategory}
          onToggleExpand={() => toggleChartExpansion("spendingByCategory")}
          isMobile={isMobile}
        >
          <SpendingByCategoryChart
            key={`spending-by-category-${timeRange}`}
            data={spendingByCategory}
            isMobile={isMobile}
          />
        </ChartContainer>
      </div>

      <ChartContainer
        title={getSpendingTrendTitle()}
        isExpanded={expandedCharts.monthlyTrend}
        onToggleExpand={() => toggleChartExpansion("monthlyTrend")}
        className="mb-6 sm:mb-8"
        isMobile={isMobile}
      >
        <MonthlySpendingChart
          key={`monthly-spending-${timeRange}`}
          data={monthlySpending}
          timeRange={timeRange}
        />
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
          value={formatCurrency(incomeVsSpending.income)}
          subtitle={`${quickAnalytics.transactionCount} transactions`}
          icon={TrendingUp}
          trend={incomeTrend}
          color="green"
          animateCards={false}
        />
        <MetricCard
          title="Total Spending"
          value={formatCurrency(incomeVsSpending.spending)}
          subtitle="All expenses this period"
          icon={TrendingDown}
          trend={spendingTrend}
          color="red"
          animateCards={false}
        />
        <MetricCard
          title="Net Savings"
          value={formatCurrency(incomeVsSpending.net)}
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
          <SpendingTrendsChart
            key={`spending-trends-${timeRange}`}
            data={spendingTrendsByCategory}
            timeRange={timeRange}
          />
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
                    {formatCurrency(item.amount)}
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
          value={formatCurrency(incomeVsSpending.income)}
          subtitle={`${quickAnalytics.transactionCount} transactions`}
          icon={TrendingUp}
          trend={incomeTrend}
          color="green"
          animateCards={false}
        />
        <MetricCard
          title="Total Spending"
          value={formatCurrency(incomeVsSpending.spending)}
          subtitle="All expenses this period"
          icon={TrendingDown}
          trend={spendingTrend}
          color="red"
          animateCards={false}
        />
        <MetricCard
          title="Net Savings"
          value={formatCurrency(incomeVsSpending.net)}
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
      <div className="flex flex-col gap-3 flex-shrink-0 w-fit">
        {/* View Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-sm w-fit">
          <button
            onClick={() => setSelectedView("overview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedView === "overview"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView("detailed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedView === "detailed"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Detailed
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-sm w-fit">
          {["week", "month", "quarter", "year"].map(range => (
            <button
              key={range}
              onClick={() => handleTimeRangeChange(range)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
