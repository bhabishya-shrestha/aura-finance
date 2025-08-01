import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  AlertCircle,
  Building2,
  CreditCard,
  PiggyBank,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  MapPin,
  Smartphone,
  ShoppingBag,
  Car,
  Home,
  Utensils,
  Plane,
  Heart,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import useStore from "../store";

const EnhancedAccountAssignmentModal = ({
  isOpen,
  onClose,
  transactions,
  accounts = [],
  detectedAccountInfo = null,
  accountSuggestions = [],
  onComplete,
}) => {
  const { addAccount } = useStore();
  const [selectedAccounts, setSelectedAccounts] = useState({});
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    name: "",
    type: "checking",
    balance: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [expandedTransactions, setExpandedTransactions] = useState(new Set());
  const [suggestedAccounts, setSuggestedAccounts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

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
    default: DollarSign,
  };

  // Initialize selected accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialSelection = {};
      transactions.forEach(transaction => {
        initialSelection[transaction.id] = transaction.accountId || null;
      });
      setSelectedAccounts(initialSelection);

      // Pre-fill new account data if account info was detected
      if (detectedAccountInfo) {
        setNewAccountData({
          name: detectedAccountInfo.name || "",
          type: detectedAccountInfo.type || "checking",
          balance: detectedAccountInfo.balance || 0,
        });
      }

      // Generate AI-powered account suggestions
      generateAccountSuggestions();
    }
  }, [isOpen, transactions, detectedAccountInfo]);

  // Enhanced AI-powered account suggestion algorithm
  const generateAccountSuggestions = () => {
    const suggestions = [];
    const transactionTexts = transactions.map(t =>
      `${t.description || ""} ${t.category || ""}`.toLowerCase()
    );

    // Analyze transaction patterns to suggest account types
    const patterns = {
      checking: ["bank", "checking", "deposit", "withdrawal", "debit"],
      savings: ["savings", "interest", "deposit"],
      credit: ["credit", "card", "visa", "mastercard", "amex", "discover"],
      investment: [
        "investment",
        "stock",
        "fund",
        "portfolio",
        "trading",
        "brokerage",
      ],
      loan: ["loan", "mortgage", "payment", "interest", "finance"],
    };

    // Detect account type from transaction patterns
    let detectedType = "checking";
    for (const [type, keywords] of Object.entries(patterns)) {
      if (
        keywords.some(keyword =>
          transactionTexts.some(text => text.includes(keyword))
        )
      ) {
        detectedType = type;
        break;
      }
    }

    // Extract institution names from transaction descriptions
    const institutionPatterns = [
      /(chase|bank of america|wells fargo|citibank|us bank|pnc|td bank|capital one|american express|discover)/i,
      /(amazon|walmart|target|costco|home depot|lowes|kroger|safeway|whole foods)/i,
      /(netflix|spotify|hulu|disney|amazon prime|youtube|google|microsoft|apple)/i,
    ];

    const detectedInstitutions = new Set();
    transactions.forEach(t => {
      const description = t.description || "";
      institutionPatterns.forEach(pattern => {
        const match = description.match(pattern);
        if (match) {
          detectedInstitutions.add(match[1].toLowerCase());
        }
      });
    });

    // Generate financial account suggestions based on detected patterns
    if (detectedInstitutions.size > 0) {
      const institutions = Array.from(detectedInstitutions);

      // Suggest based on financial institutions
      const financialInstitutions = institutions.filter(inst =>
        [
          "chase",
          "bank of america",
          "wells fargo",
          "citibank",
          "us bank",
          "pnc",
          "td bank",
          "capital one",
        ].includes(inst)
      );

      if (financialInstitutions.length > 0) {
        const institution = financialInstitutions[0];
        const institutionName = institution
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        suggestions.push({
          name: `${institutionName} ${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)}`,
          type: detectedType,
          confidence: 0.9,
          reason: `Detected ${institutionName} transactions`,
        });
      }
    }

    // Suggest based on transaction patterns and amounts
    const avgAmount =
      transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) /
      transactions.length;

    if (avgAmount > 500) {
      suggestions.push({
        name: `${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)} Account`,
        type: detectedType,
        confidence: 0.7,
        reason: `Based on ${detectedType} transaction patterns`,
      });
    }

    // Suggest based on transaction frequency and types
    const creditCardPatterns = [
      "visa",
      "mastercard",
      "amex",
      "discover",
      "credit",
    ];
    const hasCreditCardTransactions = creditCardPatterns.some(pattern =>
      transactionTexts.some(text => text.includes(pattern))
    );

    if (hasCreditCardTransactions) {
      suggestions.push({
        name: "Credit Card Account",
        type: "credit",
        confidence: 0.8,
        reason: "Detected credit card transactions",
      });
    }

    // Suggest based on transaction categories
    const categories = new Set(
      transactions.map(t => t.category).filter(Boolean)
    );

    if (categories.size > 0) {
      const categoryList = Array.from(categories).slice(0, 2);
      suggestions.push({
        name: `${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)} Account`,
        type: detectedType,
        confidence: 0.6,
        reason: `Based on categories: ${categoryList.join(", ")}`,
      });
    }

    // Add default suggestion if no specific patterns detected
    if (suggestions.length === 0) {
      suggestions.push({
        name: `${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)} Account`,
        type: detectedType,
        confidence: 0.5,
        reason: "Default account suggestion",
      });
    }

    setSuggestedAccounts(suggestions);
  };

  // Enhanced account suggestion for transactions
  const suggestAccountForTransaction = (transaction, accounts) => {
    const description = (transaction.description || "").toLowerCase();
    const category = (transaction.category || "").toLowerCase();

    // First, try to match existing accounts by name
    if (!accounts || !Array.isArray(accounts)) {
      return null;
    }

    for (const account of accounts) {
      const accountName = account.name.toLowerCase();
      const accountType = account.type.toLowerCase();

      // Direct name matching
      if (
        description.includes(accountName) ||
        accountName.includes(description.split(" ")[0])
      ) {
        return { account, confidence: 0.9, reason: "Direct name match" };
      }

      // Type matching
      if (description.includes(accountType) || category.includes(accountType)) {
        return { account, confidence: 0.7, reason: "Type match" };
      }

      // Bank name matching
      if (accountName.includes("bank") && description.includes("bank")) {
        return { account, confidence: 0.8, reason: "Bank name match" };
      }
    }

    // If no direct match, try to suggest based on transaction patterns and account types
    const financialPatterns = {
      credit: ["visa", "mastercard", "amex", "discover", "credit"],
      checking: ["checking", "debit", "bank", "deposit"],
      savings: ["savings", "interest", "deposit"],
      investment: ["investment", "stock", "fund", "brokerage"],
    };

    for (const [accountType, keywords] of Object.entries(financialPatterns)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        // Look for accounts of the matching type
        const relevantAccounts = accounts.filter(
          acc => acc.type === accountType
        );
        if (relevantAccounts.length > 0) {
          return {
            account: relevantAccounts[0],
            confidence: 0.6,
            reason: `Pattern match: ${pattern}`,
          };
        }
      }
    }

    return null;
  };

  // Filter accounts based on search and type
  const filteredAccounts = useMemo(() => {
    if (!accounts || !Array.isArray(accounts)) {
      return [];
    }
    return accounts.filter(account => {
      const matchesSearch = account.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || account.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [accounts, searchTerm, filterType]);

  // Enhanced transaction grouping with AI suggestions
  const groupedTransactions = useMemo(() => {
    const groups = {};

    transactions.forEach(transaction => {
      // Try to suggest account based on transaction description
      const suggestion = suggestAccountForTransaction(transaction, accounts);
      const key = suggestion ? suggestion.account.id : "uncategorized";

      if (!groups[key]) {
        groups[key] = {
          account: suggestion?.account,
          suggestion: suggestion,
          transactions: [],
          totalAmount: 0,
        };
      }
      groups[key].transactions.push(transaction);
      groups[key].totalAmount += Math.abs(transaction.amount);
    });

    // Sort groups by total amount (most significant first)
    const sortedGroups = Object.entries(groups).sort(
      ([, a], [, b]) => b.totalAmount - a.totalAmount
    );

    return Object.fromEntries(sortedGroups);
  }, [transactions, accounts]);

  // Get category icon for transaction
  const getCategoryIcon = transaction => {
    const description = (transaction.description || "").toLowerCase();
    const category = (transaction.category || "").toLowerCase();

    const iconMap = {
      food: Utensils,
      restaurant: Utensils,
      transportation: Car,
      travel: Plane,
      shopping: ShoppingBag,
      entertainment: Smartphone,
      healthcare: Heart,
      education: GraduationCap,
      work: Briefcase,
      home: Home,
    };

    // Try to match by category first
    for (const [key, Icon] of Object.entries(iconMap)) {
      if (category.includes(key) || description.includes(key)) {
        return Icon;
      }
    }

    return categoryIcons.default;
  };

  // Format account type for display
  const formatAccountType = type => {
    const typeMap = {
      checking: "Checking Account",
      savings: "Savings Account",
      credit: "Credit Card",
      investment: "Investment Account",
      loan: "Loan Account",
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleCreateAccount = async () => {
    try {
      setIsProcessing(true);
      const newAccount = await addAccount(newAccountData);

      // Assign all uncategorized transactions to the new account
      const updatedSelection = { ...selectedAccounts };
      Object.entries(groupedTransactions).forEach(([groupId, group]) => {
        if (groupId === "uncategorized" || !group.account) {
          group.transactions.forEach(transaction => {
            updatedSelection[transaction.id] = newAccount.id;
          });
        }
      });

      setSelectedAccounts(updatedSelection);
      setShowCreateAccount(false);
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const assignGroupToAccount = accountId => {
    const updatedSelection = { ...selectedAccounts };
    Object.entries(groupedTransactions).forEach(([groupId, group]) => {
      if (groupId === accountId) {
        group.transactions.forEach(transaction => {
          updatedSelection[transaction.id] = accountId;
        });
      }
    });
    setSelectedAccounts(updatedSelection);
  };

  const assignTransactionToAccount = (transactionId, accountId) => {
    setSelectedAccounts(prev => ({
      ...prev,
      [transactionId]: accountId,
    }));
  };

  const toggleTransactionExpansion = transactionId => {
    setExpandedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const handleComplete = () => {
    const updatedTransactions = transactions.map(transaction => ({
      ...transaction,
      accountId: selectedAccounts[transaction.id] || transaction.accountId,
    }));

    onComplete(updatedTransactions);
    onClose();
  };

  const getAccountIcon = account => {
    const IconComponent = accountTypeIcons[account.type] || Building2;
    return <IconComponent className="w-4 h-4" />;
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Assign Transactions to Accounts
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {transactions.length} transactions to organize
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Left Column - Account Selection */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Available Accounts
              </h3>

              {/* Search and Filter */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              {/* Existing Accounts */}
              <div className="space-y-2">
                {filteredAccounts.map(account => (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => assignGroupToAccount(account.id)}
                  >
                    <div className="text-blue-500">
                      {getAccountIcon(account)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {account.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatAccountType(account.type)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Create New Account */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowCreateAccount(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create New Account
                </button>
              </div>

              {/* AI Suggestions */}
              {(suggestedAccounts.length > 0 ||
                accountSuggestions.length > 0) && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    AI Suggestions
                  </h4>
                  <div className="space-y-2">
                    {/* Gemini AI Account Suggestions */}
                    {accountSuggestions.map((suggestion, index) => (
                      <div
                        key={`gemini-${index}`}
                        className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {suggestion.name}
                          </p>
                          <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                            {formatAccountType(suggestion.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {suggestion.reason}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${suggestion.confidence * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Local AI Suggestions */}
                    {suggestedAccounts.map((suggestion, index) => (
                      <div
                        key={`local-${index}`}
                        className="p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">
                          {suggestion.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {suggestion.reason}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{
                                width: `${suggestion.confidence * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Transaction Assignment */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Transactions to Import
            </h3>

            <div className="space-y-4">
              {Object.entries(groupedTransactions).map(([groupId, group]) => (
                <div
                  key={groupId}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-blue-500">
                          {group.account ? (
                            getAccountIcon(group.account)
                          ) : (
                            <AlertCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {group.account
                              ? group.account.name
                              : "Uncategorized"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {group.transactions.length} transaction
                            {group.transactions.length !== 1 ? "s" : ""} •{" "}
                            {formatCurrency(group.totalAmount)}
                          </p>
                          {group.suggestion && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              AI Suggestion: {group.suggestion.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      {group.account && (
                        <button
                          onClick={() => assignGroupToAccount(group.account.id)}
                          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Assign All
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Transactions in Group */}
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {group.transactions.map(transaction => {
                      const CategoryIcon = getCategoryIcon(transaction);
                      const isExpanded = expandedTransactions.has(
                        transaction.id
                      );
                      const assignedAccount = selectedAccounts[transaction.id];

                      return (
                        <div key={transaction.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="text-gray-500">
                                <CategoryIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {transaction.description}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(
                                    transaction.date
                                  ).toLocaleDateString()}
                                  {transaction.category && (
                                    <>
                                      <span>•</span>
                                      <span className="capitalize">
                                        {transaction.category}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p
                                  className={`font-semibold ${
                                    transaction.amount > 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </p>
                                {assignedAccount && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Assigned
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() =>
                                  toggleTransactionExpansion(transaction.id)
                                }
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Assign to:
                                </span>
                                {assignedAccount && (
                                  <div className="flex items-center gap-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm">
                                    <CheckCircle className="w-3 h-3" />
                                    {
                                      accounts.find(
                                        a => a.id === assignedAccount
                                      )?.name
                                    }
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                {filteredAccounts.slice(0, 4).map(account => (
                                  <button
                                    key={account.id}
                                    onClick={() =>
                                      assignTransactionToAccount(
                                        transaction.id,
                                        account.id
                                      )
                                    }
                                    className={`flex items-center gap-2 p-2 rounded border text-sm transition-colors ${
                                      selectedAccounts[transaction.id] ===
                                      account.id
                                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                  >
                                    {getAccountIcon(account)}
                                    <span className="truncate">
                                      {account.name}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {Object.values(selectedAccounts).filter(Boolean).length} of{" "}
            {transactions.length} transactions assigned
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={
                Object.values(selectedAccounts).filter(Boolean).length === 0
              }
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Complete Import
            </button>
          </div>
        </div>

        {/* Create Account Modal */}
        {showCreateAccount && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create New Account
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter account name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Initial Balance
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateAccount(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAccount}
                  disabled={!newAccountData.name || isProcessing}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? "Creating..." : "Create Account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAccountAssignmentModal;
