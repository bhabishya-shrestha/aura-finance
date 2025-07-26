import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import useStore from "../store";
import { CATEGORIES } from "../utils/statementParser";

const AddTransaction = () => {
  const { accounts, addTransactions } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [transaction, setTransaction] = useState({
    description: "",
    amount: "",
    category: "Other",
    date: new Date().toISOString().split("T")[0],
    accountId: accounts[0]?.id || 1,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!transaction.description.trim()) {
      alert("Please enter a description");
      return;
    }

    if (!transaction.amount || parseFloat(transaction.amount) === 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await addTransactions([
        {
          ...transaction,
          description: transaction.description.trim(),
          amount: parseFloat(transaction.amount),
          date: new Date(transaction.date),
          selected: true,
        },
      ]);

      // Reset form
      setTransaction({
        description: "",
        amount: "",
        category: "Other",
        date: new Date().toISOString().split("T")[0],
        accountId: accounts[0]?.id || 1,
      });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="glass-card px-4 py-2 flex items-center gap-2 hover:bg-white/20 transition-all duration-200 group"
      >
        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="font-medium">Add Transaction</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-modal w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-soft-white">
                Add Transaction
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-gray hover:text-soft-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-gray mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={transaction.description}
                  onChange={(e) =>
                    setTransaction({
                      ...transaction,
                      description: e.target.value,
                    })
                  }
                  placeholder="e.g., Grocery shopping"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-gray mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={transaction.amount}
                  onChange={(e) =>
                    setTransaction({ ...transaction, amount: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-gray mb-2">
                  Category
                </label>
                <select
                  value={transaction.category}
                  onChange={(e) =>
                    setTransaction({ ...transaction, category: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-gray mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={transaction.date}
                  onChange={(e) =>
                    setTransaction({ ...transaction, date: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-gray mb-2">
                  Account
                </label>
                <select
                  value={transaction.accountId}
                  onChange={(e) =>
                    setTransaction({
                      ...transaction,
                      accountId: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-soft-white focus:outline-none focus:border-teal"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-soft-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-teal to-purple hover:from-teal/90 hover:to-purple/90 transition-all rounded-lg text-white font-medium"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddTransaction;
