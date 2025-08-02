// Analytics calculation service with professional caching and data management
class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
    this.lastTransactionHash = null;
    this.lastCalculationTime = 0;
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
    console.log("Force refreshing analytics cache");
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

    // Use the original cacheKey directly instead of trying to parse it
    const fullCacheKey = `${cacheKey}_${transactionHash}`;

    if (this.isCacheValid(fullCacheKey, transactions)) {
      return this.cache.get(fullCacheKey).data;
    }

    const result = calculationFn();

    // Debug logging
    if (import.meta.env.DEV) {
      console.log(`Analytics calculation for ${fullCacheKey}:`, {
        transactionCount: transactions.length,
        transactionHash,
        result: result,
        hasData: Array.isArray(result) ? result.length > 0 : result !== 0,
        calculationTime: Date.now() - this.lastCalculationTime,
      });
    }

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
      console.warn("Invalid transactions input:", transactions);
      return [];
    }

    if (!timeRange || typeof timeRange !== "string") {
      console.warn("Invalid timeRange input:", timeRange);
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
        // Current month (from 1st of current month to now)
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
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
        console.warn("Invalid transaction object:", transaction);
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
        console.warn(
          "Invalid transaction date:",
          transaction.date,
          "for transaction:",
          transaction
        );
        return false;
      }

      return transactionDate >= startDate && transactionDate <= now;
    });

    // Professional debug logging
    if (import.meta.env.DEV) {
      console.log(`Filtered transactions for ${timeRange}:`, {
        totalTransactions: transactions.length,
        filteredCount: filteredTransactions.length,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        sampleTransaction:
          filteredTransactions.length > 0 ? filteredTransactions[0] : null,
        sampleTransactionDates: transactions.slice(0, 3).map(t => ({
          id: t.id,
          date: t.date,
          dateType: typeof t.date,
          isDateObject: t.date instanceof Date,
          parsedDate: new Date(t.date),
          parsedDateValid: !isNaN(new Date(t.date).getTime()),
        })),
        validationSummary: {
          validTransactions: filteredTransactions.length,
          invalidTransactions:
            transactions.length - filteredTransactions.length,
          dateRange: `${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`,
        },
      });
    }

    // Fallback: if no transactions match the time range, return all transactions
    // This ensures charts show data even if date filtering doesn't work
    if (filteredTransactions.length === 0 && transactions.length > 0) {
      console.warn(
        `No transactions found for time range '${timeRange}', falling back to all transactions`
      );
      return transactions;
    }

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

        const accountTotal = accounts.reduce(
          (sum, a) => sum + (a.balance || 0),
          0
        );

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

        // Convert to array and sort by amount
        const result = Object.entries(categoryData)
          .map(([category, amount]) => ({
            category,
            amount,
            fill: "#667eea", // Default color, will be enhanced later
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
          income,
          spending,
          net,
          data: [
            { name: "Income", amount: income, fill: "#10b981" },
            { name: "Spending", amount: spending, fill: "#ef4444" },
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
              console.warn(
                "Invalid date in monthly spending calculation:",
                transaction.date
              );
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
              console.warn(
                "Invalid date in monthly spending calculation:",
                transaction.date
              );
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
          .map(([, data]) => data);

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
          income,
          spending,
          netSavings,
          transactionCount,
        };
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
        let periods, periodType, startDate, endDate;

        switch (timeRange) {
          case "week":
            periods = 7;
            periodType = "day";
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
          case "month":
            periods = 4; // 4 weeks
            periodType = "week";
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = now;
            break;
          case "quarter": {
            periods = 3;
            periodType = "month";
            const currentQuarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
            endDate = now;
            break;
          }
          case "year":
            periods = 12;
            periodType = "month";
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = now;
            break;
          default:
            periods = 6;
            periodType = "month";
            startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
            endDate = now;
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
              periodLabel = `Week ${i + 1}`;
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
          const periodTransactions = transactions.filter((t, idx) => {
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
              console.warn(
                "Invalid date in spending trends calculation:",
                t.date
              ); // Log the invalid date
              return false;
            }

            const isInPeriod =
              transactionDate >= periodStart && transactionDate <= periodEnd;

            // Debug logging for first few transactions
            if (import.meta.env.DEV && idx < 3) {
              // Log for first 3 transactions in each period
              console.log("Period filtering debug:", {
                periodLabel,
                periodStart: periodStart.toISOString(),
                periodEnd: periodEnd.toISOString(),
                transactionDate: transactionDate.toISOString(),
                isInPeriod,
                transaction: {
                  id: t.id,
                  amount: t.amount,
                  date: t.date,
                  category: t.category,
                },
              });
            }

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
            spending: periodSpending,
            income: periodIncome,
            net: periodIncome - periodSpending,
          });
        }

        // Professional debug logging
        if (import.meta.env.DEV) {
          console.log("Spending trends calculation:", {
            timeRange,
            periods,
            periodType,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            trendsCount: trends.length,
            trends: trends,
            hasData: trends.some(t => t.spending > 0 || t.income > 0),
            totalTransactions: transactions.length,
            sampleTransaction: transactions.length > 0 ? transactions[0] : null,
            sampleTrend: trends.length > 0 ? trends[0] : null,
            allPeriodsHaveData: trends.every(
              t => t.spending > 0 || t.income > 0
            ),
            periodsWithData: trends.filter(t => t.spending > 0 || t.income > 0)
              .length,
            // Add detailed transaction analysis
            transactionSample: transactions.slice(0, 5).map(t => ({
              id: t.id,
              amount: t.amount,
              date: t.date,
              category: t.category,
              parsedDate: new Date(t.date),
              isValidDate: !isNaN(new Date(t.date).getTime()),
              isInRange: (() => {
                const date = new Date(t.date);
                return date >= startDate && date <= endDate;
              })(),
            })),
          });
        }

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

        return avgDailySpending;
      },
      transactions
    );
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
        if (import.meta.env.DEV) {
          console.log(`Batch analytics calculation for ${timeRange}:`, {
            transactionCount: transactions.length,
            filteredCount: filteredTransactions.length,
            hasData: filteredTransactions.length > 0,
            sampleTransaction:
              filteredTransactions.length > 0 ? filteredTransactions[0] : null,
            dateRange: timeRange === "all" ? "All time" : `${timeRange} period`,
          });
        }

        // Calculate all analytics using the same filtered transaction set
        const spendingByCategory = this.calculateSpendingByCategory(
          filteredTransactions,
          timeRange
        );

        const monthlySpending = this.calculateMonthlySpending(
          filteredTransactions,
          timeRange
        );

        const incomeVsSpending = this.calculateIncomeVsSpending(
          filteredTransactions,
          timeRange
        );

        const spendingTrends = this.calculateSpendingTrends(
          filteredTransactions,
          timeRange
        );

        const quickAnalytics = this.calculateQuickAnalytics(
          filteredTransactions,
          timeRange
        );

        const avgDailySpending = this.calculateAverageDailySpending(
          filteredTransactions,
          timeRange
        );

        return {
          spendingByCategory,
          monthlySpending,
          incomeVsSpending,
          spendingTrends,
          quickAnalytics,
          avgDailySpending,
        };
      },
      transactions
    );
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
