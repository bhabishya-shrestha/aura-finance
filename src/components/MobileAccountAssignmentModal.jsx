import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  X,
  Plus,
  Building2,
  CreditCard,
  PiggyBank,
  Sparkles,
  DollarSign,
  Smartphone,
  ShoppingBag,
  Car,
  Home,
  Utensils,
  Plane,
  Heart,
  GraduationCap,
  Briefcase,
  ArrowLeft,
  Save,
} from "lucide-react";
import useStore from "../store";
import geminiService from "../services/geminiService";

const MobileAccountAssignmentModal = ({
  isOpen,
  onClose,
  transactions,
  accounts: propAccounts = [],
  onComplete,
}) => {
  const { addAccount, accounts: storeAccounts } = useStore();
  const [selectedAccounts, setSelectedAccounts] = useState({});
  const [newAccountData, setNewAccountData] = useState({
    name: "",
    type: "checking",
    balance: 0,
  });
  const [suggestedAccounts, setSuggestedAccounts] = useState([]);
  const [localTransactions, setLocalTransactions] = useState([]);
  const [localAccounts, setLocalAccounts] = useState([]);
  const [stagedAccounts, setStagedAccounts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState("overview"); // overview, create-account, edit-transaction
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const hasGeneratedSuggestions = useRef(false);
  const transactionsRef = useRef(transactions);

  // Account type icons mapping
  const accountTypeIcons = {
    checking: Building2,
    savings: PiggyBank,
    credit: CreditCard,
    investment: PiggyBank,
    loan: CreditCard,
  };

  // Category icons for better transaction identification
  const categoryIcons = {
    food: Utensils,
    transportation: Car,
    shopping: ShoppingBag,
    travel: Plane,
    healthcare: Heart,
    education: GraduationCap,
    work: Briefcase,
    home: Home,
    entertainment: Smartphone,
    utilities: Building2,
    default: DollarSign,
  };

  // Generate account suggestions using AI
  const generateAccountSuggestions = useCallback(async () => {
    const currentTransactions = transactionsRef.current;
    if (currentTransactions.length === 0) return;

    try {
      // Analyze transactions to suggest accounts
      const transactionTexts = currentTransactions
        .map(t => `${t.description} - ${t.amount} - ${t.category}`)
        .join("\n");

      const prompt = `Analyze these transactions and suggest 3-5 account names that would be appropriate for categorizing them. Consider the transaction descriptions, amounts, and categories. Return only the account names, one per line, without numbers or formatting.`;

      // Use the actual Gemini service for AI suggestions
      const response = await geminiService.analyzeTransactions(
        transactionTexts,
        prompt
      );

      // Parse the response and create suggestions
      const suggestions = response
        .split("\n")
        .filter(line => line.trim())
        .map((name, index) => ({
          name: name.trim(),
          type: index === 0 ? "checking" : index === 1 ? "savings" : "credit",
          confidence: 0.9 - index * 0.1,
        }))
        .slice(0, 5);

      setSuggestedAccounts(suggestions);
      setShowAISuggestions(true);
    } catch (error) {
      // Fallback to basic suggestions
      const suggestions = [
        { name: "Primary Checking", type: "checking", confidence: 0.9 },
        { name: "Savings Account", type: "savings", confidence: 0.8 },
        { name: "Credit Card", type: "credit", confidence: 0.7 },
      ];
      setSuggestedAccounts(suggestions);
      setShowAISuggestions(true);
    }
  }, []);

    // Update transactions ref when transactions change
  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  // Initialize local state when modal opens
  useEffect(() => {
    if (isOpen && transactions.length > 0) {
      setLocalTransactions(transactions.map(t => ({ ...t, selected: true })));
      setLocalAccounts(propAccounts.length > 0 ? propAccounts : storeAccounts);
      
      // Generate AI suggestions only once when modal opens
      if (!hasGeneratedSuggestions.current) {
        generateAccountSuggestions();
        hasGeneratedSuggestions.current = true;
      }
    } else if (!isOpen) {
      // Reset the flag when modal closes
      hasGeneratedSuggestions.current = false;
    }
  }, [isOpen, transactions, propAccounts, storeAccounts]);

  // Handle account creation
  const handleCreateAccount = async () => {
    if (!newAccountData.name.trim()) return;

    try {
      const newAccount = {
        id: `temp-${Date.now()}`,
        name: newAccountData.name,
        type: newAccountData.type,
        balance: newAccountData.balance,
        isStaged: true,
      };

      setStagedAccounts(prev => [...prev, newAccount]);
      setLocalAccounts(prev => [...prev, newAccount]);
      setNewAccountData({ name: "", type: "checking", balance: 0 });
      setCurrentStep("overview");
    } catch (error) {
      // Handle error silently for now
    }
  };

  // Create account from AI suggestion
  const createAccountFromSuggestion = suggestion => {
    const newAccount = {
      id: `temp-${Date.now()}`,
      name: suggestion.name,
      type: suggestion.type,
      balance: 0,
      isStaged: true,
    };

    setStagedAccounts(prev => [...prev, newAccount]);
    setLocalAccounts(prev => [...prev, newAccount]);

    // Remove the suggestion from the list
    setSuggestedAccounts(prev => prev.filter(s => s.name !== suggestion.name));
  };

  // Assign transaction to account
  const assignTransactionToAccount = (transactionId, accountId) => {
    setSelectedAccounts(prev => ({
      ...prev,
      [transactionId]: accountId,
    }));
  };

  // Handle completion
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Process staged accounts first
      for (const account of stagedAccounts) {
        if (account.isStaged) {
          await addAccount(account);
        }
      }

      // Prepare transactions with account assignments
      const processedTransactions = localTransactions.map(transaction => ({
        ...transaction,
        accountId: selectedAccounts[transaction.id] || null,
      }));

      // Call the completion handler
      onComplete(processedTransactions);
    } catch (error) {
      // Handle error silently for now
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get all accounts (no filtering needed for mobile)
  const filteredAccounts = useMemo(() => {
    return localAccounts;
  }, [localAccounts]);

  // Get category icon
  const getCategoryIcon = category => {
    const iconKey = category.toLowerCase();
    return categoryIcons[iconKey] || categoryIcons.default;
  };

  // Get account type icon
  const getAccountTypeIcon = type => {
    return accountTypeIcons[type] || Building2;
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .mobile-account-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          z-index: 50;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        .dark .mobile-account-modal {
          background: #111827;
        }
      `}</style>

      <div className="mobile-account-modal">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Assign Accounts
            </h1>
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Import Summary
            </h2>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p>{transactions.length} transactions ready to import</p>
              <p>{Object.keys(selectedAccounts).length} accounts assigned</p>
            </div>
          </div>

          {/* AI Suggestions Section */}
          {showAISuggestions && suggestedAccounts.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  AI Suggestions
                </h3>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                Based on your transactions, we suggest these accounts:
              </p>
              <div className="space-y-2">
                {suggestedAccounts.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-600"
                  >
                    <div className="flex items-center gap-3">
                      {React.createElement(
                        getAccountTypeIcon(suggestion.type),
                        {
                          className:
                            "w-5 h-5 text-purple-600 dark:text-purple-400",
                        }
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {suggestion.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {suggestion.type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => createAccountFromSuggestion(suggestion)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Creation Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Accounts
              </h3>
              <button
                onClick={() => setCurrentStep("create-account")}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Account
              </button>
            </div>

            {/* Account List */}
            <div className="space-y-3">
              {filteredAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No accounts found. Create your first account to get started.
                  </p>
                </div>
              ) : (
                filteredAccounts.map(account => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {React.createElement(getAccountTypeIcon(account.type), {
                        className: "w-5 h-5 text-blue-600 dark:text-blue-400",
                      })}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {account.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {account.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${account.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Transactions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Transactions
            </h3>

            <div className="space-y-3">
              {localTransactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {React.createElement(
                        getCategoryIcon(transaction.category),
                        {
                          className: "w-5 h-5 text-gray-600 dark:text-gray-400",
                        }
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-semibold ${
                        transaction.amount > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}$
                      {Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>

                  {/* Account Assignment */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assign to Account:
                    </label>
                    <select
                      value={selectedAccounts[transaction.id] || ""}
                      onChange={e =>
                        assignTransactionToAccount(
                          transaction.id,
                          e.target.value
                        )
                      }
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select an account...</option>
                      {filteredAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Create Account Modal */}
        {currentStep === "create-account" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create New Account
                </h3>
                <button
                  onClick={() => setCurrentStep("overview")}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={newAccountData.name}
                    onChange={e =>
                      setNewAccountData(prev => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Primary Checking"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Type
                  </label>
                  <select
                    value={newAccountData.type}
                    onChange={e =>
                      setNewAccountData(prev => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="investment">Investment</option>
                    <option value="loan">Loan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Balance
                  </label>
                  <input
                    type="number"
                    value={newAccountData.balance}
                    onChange={e =>
                      setNewAccountData(prev => ({
                        ...prev,
                        balance: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setCurrentStep("overview")}
                    className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAccount}
                    disabled={!newAccountData.name.trim()}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileAccountAssignmentModal;
