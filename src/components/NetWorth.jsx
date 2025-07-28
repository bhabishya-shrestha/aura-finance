import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import useStore from "../store";

const NetWorth = () => {
  const { getNetWorth, transactions, accounts } = useStore();
  const [netWorth, setNetWorth] = useState(0);
  const [previousNetWorth, setPreviousNetWorth] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const currentNetWorth = getNetWorth();
    setPreviousNetWorth(netWorth);
    setNetWorth(currentNetWorth);

    if (netWorth !== 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [getNetWorth, netWorth]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isPositive = netWorth >= 0;
  const change = netWorth - previousNetWorth;
  const changePercentage =
    previousNetWorth !== 0 ? (change / Math.abs(previousNetWorth)) * 100 : 0;

  const getChangeColor = () => {
    if (change === 0) return "text-gray-500 dark:text-gray-400";
    return change > 0
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  const getChangeIcon = () => {
    if (change === 0) return null;
    return change > 0 ? (
      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
    ) : (
      <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" />
    );
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow group relative overflow-hidden"
      role="region"
      aria-label="Net Worth Summary"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2
              className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate"
              id="net-worth-title"
            >
              Net Worth
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Total assets minus liabilities
            </p>
          </div>
        </div>

        {/* Trend Icon */}
        <div
          className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${isPositive ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}
        >
          {isPositive ? (
            <TrendingUp
              className={`w-4 h-4 sm:w-5 sm:h-5 ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              data-testid="trend-icon"
            />
          ) : (
            <TrendingDown
              className={`w-4 h-4 sm:w-5 sm:h-5 ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              data-testid="trend-icon"
            />
          )}
        </div>
      </div>

      {/* Net Worth Amount */}
      <div className="mb-3 sm:mb-4">
        <div
          className={`text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-all duration-500 ${isAnimating ? "scale-105" : "scale-100"}`}
          aria-labelledby="net-worth-title"
          role="text"
        >
          {formatCurrency(netWorth)}
        </div>

        {/* Change Indicator */}
        {change !== 0 && (
          <div
            className={`flex items-center gap-1 mt-2 text-xs sm:text-sm font-medium ${getChangeColor()}`}
          >
            {getChangeIcon()}
            <span>
              {change > 0 ? "+" : ""}
              {formatCurrency(change)}
            </span>
            {changePercentage !== 0 && (
              <span className="text-muted">
                ({change > 0 ? "+" : ""}
                {changePercentage.toFixed(1)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {transactions.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Transactions
          </div>
        </div>
        <div className="text-center">
          <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {accounts.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Accounts
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-apple-blue/5 to-apple-purple/5 rounded-apple-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default NetWorth;
