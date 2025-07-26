import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import useStore from "../store";

const NetWorth = () => {
  const { getNetWorth } = useStore();
  const [netWorth, setNetWorth] = useState(0);
  const [previousNetWorth, setPreviousNetWorth] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const currentNetWorth = getNetWorth();
    setPreviousNetWorth(netWorth);
    setNetWorth(currentNetWorth);

    if (netWorth !== 0) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
  }, [getNetWorth()]);

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
    if (change === 0) return "text-muted-gray";
    return change > 0 ? "text-apple-green" : "text-apple-red";
  };

  const getChangeIcon = () => {
    if (change === 0) return null;
    return change > 0 ? (
      <ArrowUpRight className="w-4 h-4" />
    ) : (
      <ArrowDownRight className="w-4 h-4" />
    );
  };

  return (
    <div className="card-glass-hover group">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-apple-green to-apple-blue rounded-apple-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-soft-white">Net Worth</h2>
            <p className="text-xs text-muted-gray">
              Total assets minus liabilities
            </p>
          </div>
        </div>

        {/* Trend Icon */}
        <div
          className={`p-2 rounded-apple-lg ${isPositive ? "bg-apple-green/10" : "bg-apple-red/10"}`}
        >
          {isPositive ? (
            <TrendingUp
              className={`w-5 h-5 ${isPositive ? "text-apple-green" : "text-apple-red"}`}
            />
          ) : (
            <TrendingDown
              className={`w-5 h-5 ${isPositive ? "text-apple-green" : "text-apple-red"}`}
            />
          )}
        </div>
      </div>

      {/* Net Worth Amount */}
      <div className="mb-4">
        <div
          className={`text-3xl font-bold text-gradient transition-all duration-500 ${isAnimating ? "scale-105" : "scale-100"}`}
        >
          {formatCurrency(netWorth)}
        </div>

        {/* Change Indicator */}
        {change !== 0 && (
          <div
            className={`flex items-center gap-1 mt-2 text-sm font-medium ${getChangeColor()}`}
          >
            {getChangeIcon()}
            <span>
              {change > 0 ? "+" : ""}
              {formatCurrency(change)}
            </span>
            {changePercentage !== 0 && (
              <span className="text-muted-gray">
                ({change > 0 ? "+" : ""}
                {changePercentage.toFixed(1)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-apple-glass-300/30">
        <div className="text-center">
          <div className="text-lg font-semibold text-soft-white">
            {useStore.getState().transactions.length}
          </div>
          <div className="text-xs text-muted-gray">Transactions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-soft-white">
            {useStore.getState().accounts.length}
          </div>
          <div className="text-xs text-muted-gray">Accounts</div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-apple-blue/5 to-apple-purple/5 rounded-apple-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default NetWorth;
