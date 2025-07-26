import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import useStore from "../store";

const NetWorth = () => {
  const { getNetWorth } = useStore();
  const netWorth = getNetWorth();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const isPositive = netWorth >= 0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-soft-white">Net Worth</h2>
        {isPositive ? (
          <TrendingUp className="w-6 h-6 text-green-400" />
        ) : (
          <TrendingDown className="w-6 h-6 text-red-400" />
        )}
      </div>

      <div className="text-3xl font-bold gradient-text">
        {formatCurrency(netWorth)}
      </div>

      <p className="text-muted-gray text-sm mt-2">
        Based on {useStore.getState().transactions.length} transactions
      </p>
    </div>
  );
};

export default NetWorth;
