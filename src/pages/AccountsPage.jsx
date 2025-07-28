import React, { useState } from "react";
import {
  Plus,
  CreditCard,
  Wallet,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
} from "lucide-react";
import useStore from "../store";

const AccountsPage = () => {
  const { accounts, getAccountBalance, getTransactionsByAccount } = useStore();
  const [selectedAccount, setSelectedAccount] = useState(null);

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getAccountIcon = type => {
    switch (type) {
      case "credit":
        return <CreditCard className="w-6 h-6" />;
      case "checking":
        return <Wallet className="w-6 h-6" />;
      case "savings":
        return <PiggyBank className="w-6 h-6" />;
      default:
        return <Wallet className="w-6 h-6" />;
    }
  };

  const getAccountTypeColor = type => {
    switch (type) {
      case "credit":
        return "text-purple-400";
      case "checking":
        return "text-blue-400";
      case "savings":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const getAccountTransactions = accountId => {
    return getTransactionsByAccount(accountId).slice(0, 5); // Last 5 transactions
  };

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Accounts</h1>
          <p className="text-muted-gray mt-1">Manage your financial accounts</p>
        </div>
        <button className="glass-card px-6 py-3 flex items-center gap-2 hover:bg-white/20 transition-all duration-200 group">
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Add Account</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts List */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-soft-white mb-4">
              Your Accounts
            </h2>
            <div className="space-y-3">
              {accounts.map(account => {
                const balance = getAccountBalance(account.id);
                const isSelected = selectedAccount?.id === account.id;

                return (
                  <div
                    key={account.id}
                    onClick={() => setSelectedAccount(account)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white/15 border-white/30 shadow-lg"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`${getAccountTypeColor(account.type)}`}>
                          {getAccountIcon(account.type)}
                        </div>
                        <div>
                          <p className="text-soft-white font-medium">
                            {account.name}
                          </p>
                          <p className="text-muted-gray text-sm capitalize">
                            {account.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            balance >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {formatCurrency(balance)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {balance >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-400" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="lg:col-span-2">
          {selectedAccount ? (
            <div className="space-y-6">
              {/* Account Overview */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`${getAccountTypeColor(selectedAccount.type)}`}
                    >
                      {getAccountIcon(selectedAccount.type)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-soft-white">
                        {selectedAccount.name}
                      </h2>
                      <p className="text-muted-gray capitalize">
                        {selectedAccount.type} Account
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold gradient-text">
                      {formatCurrency(getAccountBalance(selectedAccount.id))}
                    </div>
                    <p className="text-muted-gray text-sm">Current Balance</p>
                  </div>
                </div>

                {/* Account Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <DollarSign className="w-8 h-8 mx-auto text-teal mb-2" />
                    <div className="text-xl font-bold text-soft-white">
                      {getTransactionsByAccount(selectedAccount.id).length}
                    </div>
                    <div className="text-muted-gray text-sm">
                      Total Transactions
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Calendar className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                    <div className="text-xl font-bold text-soft-white">
                      {
                        getTransactionsByAccount(selectedAccount.id).filter(
                          t =>
                            new Date(t.date).getMonth() ===
                            new Date().getMonth()
                        ).length
                      }
                    </div>
                    <div className="text-muted-gray text-sm">This Month</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto text-green-400 mb-2" />
                    <div className="text-xl font-bold text-soft-white">
                      {formatCurrency(
                        getTransactionsByAccount(selectedAccount.id)
                          .filter(t => t.amount > 0)
                          .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </div>
                    <div className="text-muted-gray text-sm">Total Income</div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-semibold text-soft-white mb-4">
                  Recent Transactions
                </h3>
                <div className="space-y-3">
                  {getAccountTransactions(selectedAccount.id).length > 0 ? (
                    getAccountTransactions(selectedAccount.id).map(
                      transaction => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-muted-gray text-sm">
                              <Calendar className="w-4 h-4" />
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                            <div>
                              <p className="text-soft-white font-medium">
                                {transaction.description}
                              </p>
                              <p className="text-muted-gray text-sm">
                                {transaction.category}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-semibold ${
                                transaction.amount >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {transaction.amount >= 0 ? "+" : ""}
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-8 text-muted-gray">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No transactions yet</p>
                      <p className="text-sm">
                        Import a statement to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Wallet className="w-16 h-16 mx-auto text-muted-gray mb-4" />
              <h3 className="text-xl font-semibold text-soft-white mb-2">
                Select an Account
              </h3>
              <p className="text-muted-gray">
                Choose an account from the list to view details and transactions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountsPage;
