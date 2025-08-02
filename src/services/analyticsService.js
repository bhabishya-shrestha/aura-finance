// Analytics calculation service with caching and efficient data management
class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 1 * 60 * 1000; // 1 minute (reduced from 5 minutes)
    this.lastCalculation = null;
    this.lastTransactionCount = 0;
  }

  // Clear cache when data changes
  clearCache() {
    this.cache.clear();
    this.lastCalculation = null;
    this.lastTransactionCount = 0;
  }

  // Force refresh all analytics data
  forceRefresh() {
    this.clearCache();
  }

  // Check if data needs refresh based on transaction changes
  needsRefresh(transactions = []) {
    return transactions.length !== this.lastTransactionCount;
  }

  // Get cache key for different time ranges and calculations
  getCacheKey(calculation, timeRange = "all", accountId = null) {
    return `${calculation}_${timeRange}_${accountId || "all"}`;
  }

  // Check if cache is valid
  isCacheValid(cacheKey, transactions = []) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;

    // Invalidate cache if transaction count changed
    if (transactions.length !== this.lastTransactionCount) {
      return false;
    }

    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  // Get cached result or calculate new one
  getCachedOrCalculate(cacheKey, calculationFn, transactions = []) {
    if (this.isCacheValid(cacheKey, transactions)) {
      return this.cache.get(cacheKey).data;
    }

    const result = calculationFn();

    // Debug logging
    if (import.meta.env.DEV) {
      console.log(`Analytics calculation for ${cacheKey}:`, {
        transactionCount: transactions.length,
        result: result,
        hasData: Array.isArray(result) ? result.length > 0 : result !== 0,
      });
    }

    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    // Update last transaction count
    this.lastTransactionCount = transactions.length;

    return result;
  }

  // Filter transactions by time range
  filterTransactionsByTimeRange(transactions, timeRange) {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
      default:
        return transactions;
    }

    const filteredTransactions = transactions.filter(transaction => {
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

    // Debug logging
    if (import.meta.env.DEV) {
      console.log(`Filtered transactions for ${timeRange}:`, {
        totalTransactions: transactions.length,
        filteredCount: filteredTransactions.length,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        sampleTransaction:
          filteredTransactions.length > 0 ? filteredTransactions[0] : null,
      });
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

  // Calculate monthly spending
  calculateMonthlySpending(transactions, timeRange = "year") {
    const cacheKey = this.getCacheKey("monthlySpending", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        const filteredTransactions = this.filterTransactionsByTimeRange(
          transactions,
          timeRange
        );
        const monthlyData = {};

        filteredTransactions.forEach(transaction => {
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

        return Object.values(monthlyData).sort((a, b) => {
          const [yearA, monthA] = a.month.split("-");
          const [yearB, monthB] = b.month.split("-");
          return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
        });
      },
      transactions
    );
  }

  // Calculate spending by category
  calculateSpendingByCategory(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("spendingByCategory", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        const filteredTransactions = this.filterTransactionsByTimeRange(
          transactions,
          timeRange
        );
        const categorySpending = {};

        filteredTransactions.forEach(transaction => {
          if (transaction.amount < 0) {
            // Only spending
            const category = transaction.category || "Uncategorized";
            categorySpending[category] =
              (categorySpending[category] || 0) + Math.abs(transaction.amount);
          }
        });

        const totalSpending = Object.values(categorySpending).reduce(
          (sum, amount) => sum + amount,
          0
        );

        return Object.entries(categorySpending)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
          }))
          .sort((a, b) => b.amount - a.amount);
      },
      transactions
    );
  }

  // Calculate income vs spending
  calculateIncomeVsSpending(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("incomeVsSpending", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        const filteredTransactions = this.filterTransactionsByTimeRange(
          transactions,
          timeRange
        );

        const income = filteredTransactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);

        const spending = filteredTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
          income,
          spending,
          net: income - spending,
          data: [
            { type: "Income", amount: income, color: "#10B981" },
            { type: "Spending", amount: spending, color: "#EF4444" },
          ],
        };
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

  // Calculate quick analytics for dashboard
  calculateQuickAnalytics(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("quickAnalytics", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        const filteredTransactions = this.filterTransactionsByTimeRange(
          transactions,
          timeRange
        );

        const income = filteredTransactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);

        const spending = filteredTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const netSavings = income - spending;

        // Calculate spending trend (compare with previous period)
        const previousPeriodTransactions = this.filterTransactionsByTimeRange(
          transactions.filter(t => {
            let transactionDate;
            if (typeof t.date === "string") {
              transactionDate = new Date(t.date);
            } else if (t.date instanceof Date) {
              transactionDate = t.date;
            } else {
              transactionDate = new Date(t.date);
            }

            if (isNaN(transactionDate.getTime())) {
              console.warn(
                "Invalid date in quick analytics calculation:",
                t.date
              );
              return false;
            }

            const now = new Date();
            const startDate = new Date();

            switch (timeRange) {
              case "month":
                startDate.setMonth(now.getMonth() - 2);
                break;
              case "quarter":
                startDate.setMonth(now.getMonth() - 6);
                break;
              case "year":
                startDate.setFullYear(now.getFullYear() - 2);
                break;
              default:
                return false;
            }

            return (
              transactionDate >= startDate &&
              transactionDate < new Date(now.getMonth() - 1)
            );
          }),
          timeRange
        );

        const previousSpending = previousPeriodTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const spendingTrend =
          previousSpending > 0
            ? ((spending - previousSpending) / previousSpending) * 100
            : 0;

        return {
          income,
          spending,
          netSavings,
          spendingTrend,
          transactionCount: filteredTransactions.length,
        };
      },
      transactions
    );
  }

  // Calculate spending trends over time
  calculateSpendingTrends(transactions, periods = 12) {
    const cacheKey = this.getCacheKey("spendingTrends", `${periods}periods`);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        const trends = [];
        const now = new Date();

        for (let i = periods - 1; i >= 0; i--) {
          const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const endDate = new Date(
            now.getFullYear(),
            now.getMonth() - i + 1,
            0
          );

          const periodTransactions = transactions.filter(t => {
            let transactionDate;
            if (typeof t.date === "string") {
              transactionDate = new Date(t.date);
            } else if (t.date instanceof Date) {
              transactionDate = t.date;
            } else {
              transactionDate = new Date(t.date);
            }

            if (isNaN(transactionDate.getTime())) {
              console.warn(
                "Invalid date in spending trends calculation:",
                t.date
              );
              return false;
            }

            return transactionDate >= startDate && transactionDate <= endDate;
          });

          const spending = periodTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

          const income = periodTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);

          trends.push({
            period: startDate.toLocaleString("default", {
              month: "short",
              year: "numeric",
            }),
            spending,
            income,
            net: income - spending,
          });
        }

        return trends;
      },
      transactions
    );
  }

  // Get top spending categories
  getTopSpendingCategories(transactions, timeRange = "month", limit = 5) {
    const categories = this.calculateSpendingByCategory(
      transactions,
      timeRange
    );
    return categories.slice(0, limit);
  }

  // Calculate average daily spending
  calculateAverageDailySpending(transactions, timeRange = "month") {
    const cacheKey = this.getCacheKey("avgDailySpending", timeRange);

    return this.getCachedOrCalculate(
      cacheKey,
      () => {
        const filteredTransactions = this.filterTransactionsByTimeRange(
          transactions,
          timeRange
        );
        const spending = filteredTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const now = new Date();
        let daysInPeriod;

        switch (timeRange) {
          case "week":
            daysInPeriod = 7;
            break;
          case "month":
            daysInPeriod = 30;
            break;
          case "quarter":
            daysInPeriod = 90;
            break;
          case "year":
            daysInPeriod = 365;
            break;
          default:
            daysInPeriod =
              filteredTransactions.length > 0
                ? Math.ceil(
                    (now -
                      (() => {
                        let lastTransactionDate;
                        const lastTransaction =
                          filteredTransactions[filteredTransactions.length - 1];
                        if (typeof lastTransaction.date === "string") {
                          lastTransactionDate = new Date(lastTransaction.date);
                        } else if (lastTransaction.date instanceof Date) {
                          lastTransactionDate = lastTransaction.date;
                        } else {
                          lastTransactionDate = new Date(lastTransaction.date);
                        }
                        return lastTransactionDate;
                      })()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 1;
        }

        return spending / daysInPeriod;
      },
      transactions
    );
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
