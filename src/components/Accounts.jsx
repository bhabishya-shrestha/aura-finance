import React, { useState } from "react";
import { CreditCard, Wallet, PiggyBank, Plus, Trash2, X } from "lucide-react";
import useStore from "../store";

const Accounts = () => {
  const { accounts, addAccount, deleteAccount, getAccountBalance } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "checking",
    balance: 0,
  });

  const getAccountIcon = (type) => {
    switch (type) {
      case "credit":
        return <CreditCard className="w-5 h-5" />;
      case "checking":
        return <Wallet className="w-5 h-5" />;
      case "savings":
        return <PiggyBank className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleAddAccount = async () => {
    if (!newAccount.name.trim()) {
      alert("Please enter an account name");
      return;
    }

    try {
      await addAccount({
        ...newAccount,
        name: newAccount.name.trim(),
        balance: parseFloat(newAccount.balance) || 0,
      });
      setNewAccount({ name: "", type: "checking", balance: 0 });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding account:", error);
    }
  };

  const handleDeleteAccount = async (accountId, accountName) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${accountName}"? This will also delete all associated transactions.`
      )
    ) {
      try {
        await deleteAccount(accountId);
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  };

  return (
    <>
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-soft-white mb-4">Accounts</h2>

        <div className="space-y-3">
          {accounts.map((account) => {
            const balance = getAccountBalance(account.id);
            return (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="text-teal">
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

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-soft-white font-semibold">
                      {formatCurrency(balance)}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleDeleteAccount(account.id, account.name)
                    }
                    className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-muted-gray hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-soft-white text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-modal w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-soft-white">
                Add New Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-gray hover:text-soft-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-gray mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, name: e.target.value })
                  }
                  placeholder="e.g., Chase Checking"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-gray mb-2">
                  Account Type
                </label>
                <select
                  value={newAccount.type}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, type: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-gray mb-2">
                  Initial Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newAccount.balance}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, balance: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-soft-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-teal to-purple hover:from-teal/90 hover:to-purple/90 transition-all rounded-lg text-white font-medium"
              >
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Accounts;
