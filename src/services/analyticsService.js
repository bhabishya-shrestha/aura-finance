// Analytics calculation service with professional caching and data management
class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
    this.lastTransactionHash = null;
    this.lastCalculationTime = 0;

    // Unified color palette for consistent category coloring across all charts
    this.colorPalette = [
      "#FF6B6B", // Red
      "#4ECDC4", // Teal
      "#45B7D1", // Blue
      "#96CEB4", // Green
      "#FFEAA7", // Yellow
      "#DDA0DD", // Plum
      "#98D8C8", // Mint
      "#F7DC6F", // Light Yellow
      "#BB8FCE", // Light Purple
      "#85C1E9", // Light Blue
      "#F8C471", // Orange
      "#82E0AA", // Light Green
    ];

    // Category to color mapping for consistency
    this.categoryColorMap = new Map();
  }

  // Get consistent color for a category across all charts
  getCategoryColor(category) {
    if (!this.categoryColorMap.has(category)) {
      // Assign color based on category name hash for consistency
      const hash = this.hashString(category);
      const colorIndex = hash % this.colorPalette.length;
      this.categoryColorMap.set(category, this.colorPalette[colorIndex]);
    }
    return this.categoryColorMap.get(category);
  }

  // Simple hash function for consistent color assignment
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Generate a hash of transaction data for cache invalidation
  generateTransactionHash(transactions) {
    if (!transactions || transactions.length === 0) return "empty";

    // Create a hash based on transaction count, IDs, and modification times
    const hashData = transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      date: t.date,
      category: t.category,
    }));

    // Simple hash function for performance
    return JSON.stringify(hashData).length + "_" + transactions.length;
  }

  // Clear cache when data changes
  clearCache() {
    this.cache.clear();
    this.lastTransactionHash = null;
    this.lastCalculationTime = 0;
  }

  // Force refresh cache
  forceRefresh() {
    this.clearCache();
  }

  // Check if data needs refresh based on transaction changes
  needsRefresh(transactions = []) {
    const currentHash = this.generateTransactionHash(transactions);
    return currentHash !== this.lastTransactionHash;
  }

  // Get cache key with transaction hash for proper invalidation
  getCacheKey(
    calculation,
    timeRange = "all",
    accountId = null,
    transactionHash = null
  ) {
    const baseKey = `${calculation}_${timeRange}_${accountId || "all"}`;
    return transactionHash ? `${baseKey}_${transactionHash}` : baseKey;
  }

  // Check if cache is still valid
  isCacheValid(cacheKey, transactions = []) {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return false;
    }

    // Check if transaction data has changed
    const currentHash = this.generateTransactionHash(transactions);
    if (cached.transactionHash !== currentHash) {
      return false;
    }

    // Check cache expiration
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  // Get cached result or calculate new one with proper invalidation
  getCachedOrCalculate(cacheKey, calculationFn, transactions = []) {
    const transactionHash = this.generateTransactionHash(transactions);

    // Ensure the cache key includes both the original key and transaction hash
    const fullCacheKey = `${cacheKey}_${transactionHash}`;

    if (this.isCacheValid(fullCacheKey, transactions)) {
      return this.cache.get(fullCacheKey).data;
    }

    const result = calculationFn();

    this.cache.set(fullCacheKey, {
      data: result,
      timestamp: Date.now(),
      transactionHash,
    });

    this.lastTransactionHash = transactionHash;
    this.lastCalculationTime = Date.now();

    return result;
  }

  // Filter transactions by time range with professional validation
  filterTransactionsByTimeRange(transactions, timeRange) {
    // Input validation
    if (!Array.isArray(transactions)) {
      // console.warn("Invalid transactions input:", transactions);
      return [];
    }

    if (!timeRange || typeof timeRange !== "string") {
      // console.warn("Invalid timeRange input:", timeRange);
      return transactions;
    }

    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case "week":
        // Last 7 days from now
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        // Current month (from 1st of current month to end of current month)
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        // For month filter, we should include all transactions from the current month
        // So we'll use the current date as the end date (which is correct)
        break;
      case "quarter":
        // Current quarter
        {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        }
        break;
      case "year":
        // Current year
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "all":
      default:
        return transactions;
    }

    const filteredTransactions = transactions.filter(transaction => {
      // Validate transaction structure
      if (!transaction || typeof transaction !== "object") {
        // console.warn("Invalid transaction object:", transaction);
        return false;
      }

      // Ensure we have a proper Date object
      let transactionDate;
      if (typeof transaction.date === "string") {
        transactionDate = new Date(transaction.date);
      } else if (transaction.date instanceof Date) {
        transactionDate = transaction.date;
      } else {
        // If it's a timestamp or other format, try to convert
        transactionDate = new Date(transaction.date);
      }

      // Check if the date is valid
      if (isNaN(transactionDate.getTime())) {
        // console.warn(
        //   "Invalid transaction date:",
        //   transaction.date,
        //   "for transaction:",
        //   transaction
        // );
        return false;
      }

      return transactionDate >= startDate && transactionDate <= now;
    });

    // Return filtered transactions - no fallback to all transactions
    // This ensures each time range shows only appropriate data
    return filteredTransactions;
  }

  // Calculate net worth
  calculateNetWorth(transactions, accounts = []) {
    const cacheKey = this.getCacheKey("netWorth");

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        const transactionTotal = transactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );

        const accountTotal = accounts.reduce((sum, a) => {
          const balance = a.balance || 0;
          // For credit accounts, positive balance means bank owes user (asset)
          // For credit accounts, negative balance means user owes bank (liability)
          // For other accounts, positive balance is asset, negative is liability
          if (a.type === "credit") {
            return sum + balance; // Credit balance is already correctly signed
          } else {
            return sum + balance; // Other accounts: positive = asset, negative = liability
          }
        }, 0);

        return transactionTotal + accountTotal;
      },
      transactions
    );
  }

  // Calculate spending by category (works with pre-filtered transactions)
  calculateSpendingByCategory(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("spendingByCategory", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        // Use transactions as-is (they should already be filtered)
        const categoryData = {};

        transactions.forEach(transaction => {
          if (transaction.amount < 0) {
            // Only spending transactions
            const category = transaction.category || "Uncategorized";
            if (!categoryData[category]) {
              categoryData[category] = 0;
            }
            categoryData[category] += Math.abs(transaction.amount);
          }
        });

        // Convert to array and sort by amount, using unified color system
        const result = Object.entries(categoryData)
          .map(([category, amount]) => ({
            category,
            amount: parseFloat(amount.toFixed(2)), // Format to 2 decimal places
            fill: this.getCategoryColor(category), // Use unified color system
          }))
          .sort((a, b) => b.amount - a.amount);

        return result;
      },
      transactions
    );
  }

  // Calculate income vs spending (works with pre-filtered transactions)
  calculateIncomeVsSpending(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("incomeVsSpending", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        // Use transactions as-is (they should already be filtered)
        const income = transactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);

        const spending = transactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const net = income - spending;

        return {
          income: parseFloat(income.toFixed(2)), // Format to 2 decimal places
          spending: parseFloat(spending.toFixed(2)), // Format to 2 decimal places
          net: parseFloat(net.toFixed(2)), // Format to 2 decimal places
          data: [
            {
              name: "Income",
              amount: parseFloat(income.toFixed(2)),
              fill: "#10b981",
            },
            {
              name: "Spending",
              amount: parseFloat(spending.toFixed(2)),
              fill: "#ef4444",
            },
          ],
        };
      },
      transactions
    );
  }

  // Calculate monthly spending (works with pre-filtered transactions)
  calculateMonthlySpending(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("monthlySpending", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        // Use transactions as-is (they should already be filtered)
        const monthlyData = {};

        transactions.forEach(transaction => {
          if (transaction.amount < 0) {
            // Only spending
            let transactionDate;
            if (typeof transaction.date === "string") {
              transactionDate = new Date(transaction.date);
            } else if (transaction.date instanceof Date) {
              transactionDate = transaction.date;
            } else {
              transactionDate = new Date(transaction.date);
            }

            if (isNaN(transactionDate.getTime())) {
              // console.warn(
              //   "Invalid date in monthly spending calculation:",
              //   transaction.date
              // );
              return;
            }

            const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, "0")}`;
            const monthName = transactionDate.toLocaleString("default", {
              month: "short",
            });

            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                month: monthName,
                spending: 0,
                income: 0,
                net: 0,
              };
            }

            monthlyData[monthKey].spending += Math.abs(transaction.amount);
            monthlyData[monthKey].net -= Math.abs(transaction.amount);
          } else {
            // Income
            let transactionDate;
            if (typeof transaction.date === "string") {
              transactionDate = new Date(transaction.date);
            } else if (transaction.date instanceof Date) {
              transactionDate = transaction.date;
            } else {
              transactionDate = new Date(transaction.date);
            }

            if (isNaN(transactionDate.getTime())) {
              // console.warn(
              //   "Invalid date in monthly spending calculation:",
              //   transaction.date
              // );
              return;
            }

            const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, "0")}`;
            const monthName = transactionDate.toLocaleString("default", {
              month: "short",
            });

            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                month: monthName,
                spending: 0,
                income: 0,
                net: 0,
              };
            }

            monthlyData[monthKey].income += transaction.amount;
            monthlyData[monthKey].net += transaction.amount;
          }
        });

        // Convert to array and sort chronologically
        const sortedData = Object.entries(monthlyData)
          .sort(([monthKeyA], [monthKeyB]) =>
            monthKeyA.localeCompare(monthKeyB)
          )
          .map(([, data]) => ({
            ...data,
            spending: parseFloat(data.spending.toFixed(2)), // Format to 2 decimal places
            income: parseFloat(data.income.toFixed(2)), // Format to 2 decimal places
            net: parseFloat(data.net.toFixed(2)), // Format to 2 decimal places
          }));

        return sortedData;
      },
      transactions
    );
  }

  // Calculate account-specific analytics
  calculateAccountAnalytics(transactions, accountId, timeRange = "month") {
    const cacheKey = this.getCacheKey("accountAnalytics", timeRange, accountId);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        const accountTransactions = transactions.filter(
          t => t.accountId === accountId
        );
        const filteredTransactions = this.filterTransactionsByTimeRange(
          accountTransactions,
          timeRange
        );

        const income = filteredTransactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);

        const spending = filteredTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const categoryBreakdown = this.calculateSpendingByCategory(
          filteredTransactions,
          "all"
        );

        return {
          income,
          spending,
          net: income - spending,
          transactionCount: filteredTransactions.length,
          categoryBreakdown,
        };
      },
      transactions
    );
  }

  // Calculate quick analytics (works with pre-filtered transactions)
  calculateQuickAnalytics(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("quickAnalytics", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        // Use transactions as-is (they should already be filtered)
        const income = transactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);

        const spending = transactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const netSavings = income - spending;
        const transactionCount = transactions.length;

        return {
          income: parseFloat(income.toFixed(2)), // Format to 2 decimal places
          spending: parseFloat(spending.toFixed(2)), // Format to 2 decimal places
          netSavings: parseFloat(netSavings.toFixed(2)), // Format to 2 decimal places
          transactionCount,
        };
      },
      transactions
    );
  }

  // Calculate spending trends by category for each period (works with pre-filtered transactions)
  calculateSpendingTrendsByCategory(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("spendingTrendsByCategory", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        // Use transactions as-is (they should already be filtered)
        const trends = [];
        const now = new Date();
        let periods, periodType, startDate;

        // Calculate time range parameters (matching original calculateSpendingTrends logic)
        switch (timeRange) {
          case "week":
            periods = 7;
            periodType = "day";
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            periods = 4; // 4 weeks
            periodType = "week";
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "quarter": {
            periods = 3;
            periodType = "month";
            const currentQuarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
            break;
          }
          case "year":
            periods = 12;
            periodType = "month";
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            periods = 6;
            periodType = "month";
            startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        }

        // Use unified color system for consistent category coloring

        // Generate periods with category breakdown (matching original logic)
        for (let i = 0; i < periods; i++) {
          let periodStart, periodEnd, periodLabel;

          switch (periodType) {
            case "day":
              periodStart = new Date(
                startDate.getTime() + i * 24 * 60 * 60 * 1000
              );
              periodEnd = new Date(
                periodStart.getTime() + 24 * 60 * 60 * 1000 - 1
              );
              periodLabel = periodStart.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              break;
            case "week":
              periodStart = new Date(
                startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000
              );
              periodEnd = new Date(
                periodStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1
              );
              periodLabel = `W${i + 1}`;
              break;
            case "month":
              periodStart = new Date(
                startDate.getFullYear(),
                startDate.getMonth() + i,
                1
              );
              periodEnd = new Date(
                periodStart.getFullYear(),
                periodStart.getMonth() + 1,
                0
              );
              periodLabel = periodStart.toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
              });
              break;
            default:
              periodStart = new Date(
                startDate.getTime() + i * 30 * 24 * 60 * 60 * 1000
              );
              periodEnd = new Date(
                periodStart.getTime() + 30 * 24 * 60 * 60 * 1000 - 1
              );
              periodLabel = `Period ${i + 1}`;
          }

          // Filter transactions for this period
          const periodTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return (
              transactionDate >= periodStart && transactionDate <= periodEnd
            );
          });

          // Calculate spending by category for this period
          const categoryData = {};
          periodTransactions.forEach(transaction => {
            if (transaction.amount < 0) {
              const category = transaction.category || "Uncategorized";
              if (!categoryData[category]) {
                categoryData[category] = 0;
              }
              categoryData[category] += Math.abs(transaction.amount);
            }
          });

          // Convert to array with colors using unified color system
          const categoryBreakdown = Object.entries(categoryData)
            .map(([category, amount]) => ({
              category,
              amount: parseFloat(amount.toFixed(2)),
              fill: this.getCategoryColor(category), // Use unified color system
            }))
            .sort((a, b) => b.amount - a.amount);

          const totalSpending = categoryBreakdown.reduce(
            (sum, item) => sum + item.amount,
            0
          );

          trends.push({
            period: periodLabel,
            totalSpending: parseFloat(totalSpending.toFixed(2)),
            categories: categoryBreakdown,
          });
        }

        return trends;
      },
      transactions
    );
  }

  // Calculate spending trends (works with pre-filtered transactions)
  calculateSpendingTrends(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("spendingTrends", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        // Use transactions as-is (they should already be filtered)
        const trends = [];
        const now = new Date();

        // Determine period type and count based on time range
        let periods, periodType, startDate;

        switch (timeRange) {
          case "week":
            periods = 7;
            periodType = "day";
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            // endDate = now; // Not used in this context
            break;
          case "month":
            periods = 4; // 4 weeks
            periodType = "week";
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            // endDate = now; // Not used in this context
            break;
          case "quarter": {
            periods = 3;
            periodType = "month";
            const currentQuarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
            // endDate = now; // Not used in this context
            break;
          }
          case "year":
            periods = 12;
            periodType = "month";
            startDate = new Date(now.getFullYear(), 0, 1);
            // endDate = now; // Not used in this context
            break;
          default:
            periods = 6;
            periodType = "month";
            startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
          // endDate = now; // Not used in this context
        }

        // Generate periods
        for (let i = 0; i < periods; i++) {
          let periodStart, periodEnd, periodLabel;

          switch (periodType) {
            case "day":
              periodStart = new Date(
                startDate.getTime() + i * 24 * 60 * 60 * 1000
              );
              periodEnd = new Date(
                periodStart.getTime() + 24 * 60 * 60 * 1000 - 1
              );
              periodLabel = periodStart.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              break;
            case "week":
              periodStart = new Date(
                startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000
              );
              periodEnd = new Date(
                periodStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1
              );
              periodLabel = `W${i + 1}`;
              break;
            case "month":
              periodStart = new Date(
                startDate.getFullYear(),
                startDate.getMonth() + i,
                1
              );
              periodEnd = new Date(
                periodStart.getFullYear(),
                periodStart.getMonth() + 1,
                0
              );
              periodLabel = periodStart.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              });
              break;
          }

          // Filter transactions for this period
          const periodTransactions = transactions.filter(t => {
            let transactionDate;
            if (typeof t.date === "string") {
              transactionDate = new Date(t.date);
            } else if (t.date instanceof Date) {
              transactionDate = t.date;
            } else {
              // Attempt to parse other formats, e.g., numbers as timestamps
              transactionDate = new Date(t.date);
            }

            if (isNaN(transactionDate.getTime())) {
              // console.warn(
              //   "Invalid date in spending trends calculation:",
              //   t.date
              // ); // Log the invalid date
              return false;
            }

            const isInPeriod =
              transactionDate >= periodStart && transactionDate <= periodEnd;

            // Debug logging for first few transactions
            // if (import.meta.env.DEV && idx < 3) {
            //   // Log for first 3 transactions in each period
            //   console.log("Period filtering debug:", {
            //     periodLabel,
            //     periodStart: periodStart.toISOString(),
            //     periodEnd: periodEnd.toISOString(),
            //     transactionDate: transactionDate.toISOString(),
            //     isInPeriod,
            //     transaction: {
            //       id: t.id,
            //       amount: t.amount,
            //       date: t.date,
            //       category: t.category,
            //     },
            //   });
            // }

            return isInPeriod;
          });

          // Calculate spending and income for this period
          const periodSpending = periodTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

          const periodIncome = periodTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);

          trends.push({
            period: periodLabel,
            spending: parseFloat(periodSpending.toFixed(2)), // Format to 2 decimal places
            income: parseFloat(periodIncome.toFixed(2)), // Format to 2 decimal places
            net: parseFloat((periodIncome - periodSpending).toFixed(2)), // Format to 2 decimal places
          });
        }

        // Professional debug logging
        // if (import.meta.env.DEV) {
        //   console.log("Spending trends calculation:", {
        //     timeRange,
        //     periods,
        //     periodType,
        //     startDate: startDate.toISOString(),
        //     endDate: endDate.toISOString(),
        //     trendsCount: trends.length,
        //     trends: trends,
        //     hasData: trends.some(t => t.spending > 0 || t.income > 0),
        //     totalTransactions: transactions.length,
        //     sampleTransaction: transactions.length > 0 ? transactions[0] : null,
        //     sampleTrend: trends.length > 0 ? trends[0] : null,
        //     allPeriodsHaveData: trends.every(
        //       t => t.spending > 0 || t.income > 0
        //     ),
        //     periodsWithData: trends.filter(t => t.spending > 0 || t.income > 0)
        //       .length,
        //     // Add detailed transaction analysis
        //     transactionSample: transactions.slice(0, 5).map(t => ({
        //       id: t.id,
        //       amount: t.amount,
        //       date: t.date,
        //       category: t.category,
        //       parsedDate: new Date(t.date),
        //       isValidDate: !isNaN(new Date(t.date).getTime()),
        //       isInRange: (() => {
        //         const date = new Date(t.date);
        //         return date >= startDate && date <= endDate;
        //       })(),
        //     })),
        //   });
        // }

        return trends;
      },
      transactions
    );
  }

  // Get top spending categories (works with pre-filtered transactions)
  getTopSpendingCategories(transactions, timeRange = "month", limit = 5) {
    // Filter transactions for the time range first
    const filteredTransactions = this.filterTransactionsByTimeRange(
      transactions,
      timeRange
    );

    // Then calculate spending by category using the filtered transactions
    const categories = this.calculateSpendingByCategory(
      filteredTransactions,
      timeRange
    );

    return categories.slice(0, limit);
  }

  // Calculate average daily spending (works with pre-filtered transactions)
  calculateAverageDailySpending(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("avgDailySpending", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        // Use transactions as-is (they should already be filtered)
        const totalSpending = transactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Calculate days in the time range
        const now = new Date();
        let startDate;

        switch (timeRange) {
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "quarter": {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
            break;
          }
          case "year":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const daysDiff = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
        const avgDailySpending = daysDiff > 0 ? totalSpending / daysDiff : 0;

        return parseFloat(avgDailySpending.toFixed(2)); // Format to 2 decimal places
      },
      transactions
    );
  }

  // Calculate trend percentage change between current and previous period
  calculateTrendPercentage(currentValue, previousValue) {
    if (previousValue === 0) {
      return currentValue > 0 ? 100 : 0; // If no previous data, show 100% if current > 0
    }
    return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  }

  // Calculate net worth trend
  calculateNetWorthTrend(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("netWorthTrend", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        const currentNetWorth = this.calculateNetWorth(transactions, []);

        // Calculate previous period net worth
        const previousPeriodTransactions = this.getPreviousPeriodTransactions(
          transactions,
          timeRange
        );
        const previousNetWorth = this.calculateNetWorth(
          previousPeriodTransactions,
          []
        );

        return this.calculateTrendPercentage(currentNetWorth, previousNetWorth);
      },
      transactions
    );
  }

  // Calculate income trend
  calculateIncomeTrend(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("incomeTrend", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        const filteredTransactions = this.filterTransactionsByTimeRange(
          transactions,
          timeRange
        );
        const currentIncome = filteredTransactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);

        // Calculate previous period income
        const previousPeriodTransactions = this.getPreviousPeriodTransactions(
          transactions,
          timeRange
        );
        const previousIncome = previousPeriodTransactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);

        return this.calculateTrendPercentage(currentIncome, previousIncome);
      },
      transactions
    );
  }

  // Calculate spending trend
  calculateSpendingTrend(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("spendingTrend", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        const filteredTransactions = this.filterTransactionsByTimeRange(
          transactions,
          timeRange
        );
        const currentSpending = filteredTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Calculate previous period spending
        const previousPeriodTransactions = this.getPreviousPeriodTransactions(
          transactions,
          timeRange
        );
        const previousSpending = previousPeriodTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return this.calculateTrendPercentage(currentSpending, previousSpending);
      },
      transactions
    );
  }

  // Calculate savings trend
  calculateSavingsTrend(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("savingsTrend", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        const filteredTransactions = this.filterTransactionsByTimeRange(
          transactions,
          timeRange
        );
        const currentIncome = filteredTransactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);
        const currentSpending = filteredTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const currentSavings = currentIncome - currentSpending;

        // Calculate previous period savings
        const previousPeriodTransactions = this.getPreviousPeriodTransactions(
          transactions,
          timeRange
        );
        const previousIncome = previousPeriodTransactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);
        const previousSpending = previousPeriodTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const previousSavings = previousIncome - previousSpending;

        return this.calculateTrendPercentage(currentSavings, previousSavings);
      },
      transactions
    );
  }

  // Get transactions from the previous period for comparison
  getPreviousPeriodTransactions(transactions, timeRange = "month") {
    const now = new Date();
    let startDate, endDate;

    switch (timeRange) {
      case "week": {
        // Previous week
        const lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 7);
        const weekStart = new Date(lastWeek);
        weekStart.setDate(lastWeek.getDate() - 7);
        startDate = weekStart;
        endDate = lastWeek;
        break;
      }
      case "month": {
        // Previous month
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        startDate = lastMonth;
        endDate = monthEnd;
        break;
      }
      case "quarter": {
        // Previous quarter
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const currentYear = now.getFullYear();
        const prevQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
        const prevQuarterYear =
          currentQuarter === 0 ? currentYear - 1 : currentYear;
        startDate = new Date(prevQuarterYear, prevQuarter * 3, 1);
        endDate = new Date(prevQuarterYear, (prevQuarter + 1) * 3, 0);
        break;
      }
      case "year": {
        // Previous year
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      }
      default:
        return [];
    }

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  // Calculate all analytics in a single batch for performance
  calculateAllAnalytics(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("allAnalytics", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        // Filter transactions once for the entire batch calculation
        const filteredTransactions = this.filterTransactionsByTimeRange(
          transactions,
          timeRange
        );

        // Professional debug logging
        // if (import.meta.env.DEV) {
        //   console.log(`Batch analytics calculation for ${timeRange}:`, {
        //     transactionCount: transactions.length,
        //     filteredCount: filteredTransactions.length,
        //     hasData: filteredTransactions.length > 0,
        //     sampleTransaction:
        //       filteredTransactions.length > 0 ? filteredTransactions[0] : null,
        //     dateRange: timeRange === "all" ? "All time" : `${timeRange} period`,
        //   });
        // }

        // Calculate all analytics using the same filtered transaction set
        const spendingByCategory = this.calculateSpendingByCategory(
          filteredTransactions,
          "all" // Use "all" since transactions are already filtered
        );

        const monthlySpending = this.calculateMonthlySpending(
          filteredTransactions,
          timeRange // Use the actual timeRange to generate correct period structure
        );

        const incomeVsSpending = this.calculateIncomeVsSpending(
          filteredTransactions,
          "all" // Use "all" since transactions are already filtered
        );

        const spendingTrends = this.calculateSpendingTrends(
          filteredTransactions,
          timeRange // Use the actual timeRange to generate correct period structure
        );

        const spendingTrendsByCategory = this.calculateSpendingTrendsByCategory(
          filteredTransactions,
          timeRange // Use the actual timeRange to generate correct period structure
        );

        const quickAnalytics = this.calculateQuickAnalytics(
          filteredTransactions,
          "all" // Use "all" since transactions are already filtered
        );

        const avgDailySpending = this.calculateAverageDailySpending(
          filteredTransactions,
          "all" // Use "all" since transactions are already filtered
        );

        // Calculate trend values for the selected time range
        const netWorthTrend = this.calculateNetWorthTrend(
          transactions,
          timeRange
        );
        const incomeTrend = this.calculateIncomeTrend(transactions, timeRange);
        const spendingTrend = this.calculateSpendingTrend(
          transactions,
          timeRange
        );
        const savingsTrend = this.calculateSavingsTrend(
          transactions,
          timeRange
        );

        return {
          spendingByCategory,
          monthlySpending,
          incomeVsSpending,
          spendingTrends,
          spendingTrendsByCategory,
          quickAnalytics,
          avgDailySpending,
          netWorthTrend,
          incomeTrend,
          spendingTrend,
          savingsTrend,
        };
      },
      transactions
    );
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
