/**
 * Transaction utility functions for smart categorization and amount management
 */

/**
 * Smart detection of transaction type based on description and amount
 * @param {string} description - Transaction description
 * @param {number} amount - Transaction amount (can be positive or negative)
 * @returns {string} - "income" or "expense"
 */
export const detectTransactionType = (description, amount = 0) => {
  if (!description) {
    // Default to expense for most transactions
    return amount > 0 ? "income" : "expense";
  }

  const desc = description.toLowerCase();

  // Income keywords (regardless of amount)
  const incomeKeywords = [
    "deposit",
    "salary",
    "payroll",
    "income",
    "refund",
    "reimbursement",
    "bonus",
    "commission",
    "credit",
    "payment received",
    "transfer in",
    "cashback",
    "reward",
    "dividend",
    "interest",
    "refund",
    "return",
  ];

  // Expense keywords (regardless of amount)
  const expenseKeywords = [
    "withdrawal",
    "debit",
    "purchase",
    "payment",
    "fee",
    "charge",
    "atm",
    "cash withdrawal",
    "bill",
    "subscription",
    "rent",
    "mortgage",
    "insurance",
    "tax",
    "utility",
    "gas",
    "groceries",
    "restaurant",
    "shopping",
    "entertainment",
  ];

  // Check for income keywords first
  if (incomeKeywords.some(keyword => desc.includes(keyword))) {
    return "income";
  }

  // Check for expense keywords
  if (expenseKeywords.some(keyword => desc.includes(keyword))) {
    return "expense";
  }

  // Default: positive amounts are income, negative are expenses
  return amount > 0 ? "income" : "expense";
};

/**
 * Calculate the correct amount sign based on transaction type
 * @param {number} amount - Base amount (always positive)
 * @param {string} transactionType - "income" or "expense"
 * @returns {number} - Amount with correct sign
 */
export const calculateAmountWithSign = (amount, transactionType) => {
  const baseAmount = Math.abs(parseFloat(amount) || 0);
  // Handle zero case specially to avoid -0
  if (baseAmount === 0) return 0;
  return transactionType === "expense" ? -baseAmount : baseAmount;
};

/**
 * Get the absolute value and type from a signed amount
 * @param {number} amount - Signed amount
 * @returns {object} - { absoluteAmount, transactionType }
 */
export const parseAmountAndType = amount => {
  const absoluteAmount = Math.abs(amount);
  // Handle zero case - consider it as income (positive)
  const transactionType = amount >= 0 ? "income" : "expense";

  return {
    absoluteAmount,
    transactionType,
  };
};

/**
 * Validate transaction data and suggest corrections
 * @param {object} transaction - Transaction object
 * @returns {object} - Validation result with suggestions
 */
export const validateTransaction = transaction => {
  const { description, amount, category } = transaction;
  const suggestions = [];
  const warnings = [];

  // Detect expected transaction type
  const expectedType = detectTransactionType(description, amount);
  const actualType = amount > 0 ? "income" : "expense";

  // Check for type mismatch
  if (expectedType !== actualType) {
    suggestions.push({
      type: "amount_sign",
      message: `Description suggests this should be ${expectedType}, but amount is ${actualType}`,
      suggestedAmount: calculateAmountWithSign(Math.abs(amount), expectedType),
      confidence: "high",
    });
  }

  // Check for missing category
  if (!category || category === "Other") {
    suggestions.push({
      type: "category",
      message: "Transaction is uncategorized",
      suggestedCategory: "Other",
      confidence: "medium",
    });
  }

  // Check for suspicious amounts
  if (Math.abs(amount) > 10000) {
    warnings.push({
      type: "large_amount",
      message: "Transaction amount is unusually large",
      severity: "medium",
    });
  }

  return {
    isValid: suggestions.length === 0,
    suggestions,
    warnings,
    expectedType,
    actualType,
  };
};

/**
 * Format amount for display with proper sign and color
 * @param {number} amount - Transaction amount
 * @param {boolean} showSign - Whether to show + sign for positive amounts
 * @returns {object} - { formattedAmount, colorClass, isPositive }
 */
export const formatAmountForDisplay = (amount, showSign = true) => {
  const isPositive = amount > 0;
  const absoluteAmount = Math.abs(amount);

  let formattedAmount = absoluteAmount.toFixed(2);
  if (showSign && isPositive) {
    formattedAmount = `+${formattedAmount}`;
  } else if (!isPositive) {
    formattedAmount = `-${formattedAmount}`;
  }

  const colorClass = isPositive
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";

  return {
    formattedAmount,
    colorClass,
    isPositive,
  };
};

/**
 * Get transaction type icon and color
 * @param {string} transactionType - "income" or "expense"
 * @returns {object} - { icon, colorClass, label }
 */
export const getTransactionTypeInfo = transactionType => {
  const types = {
    income: {
      icon: "TrendingUp",
      colorClass: "text-green-600 dark:text-green-400",
      label: "Income",
    },
    expense: {
      icon: "TrendingDown",
      colorClass: "text-red-600 dark:text-red-400",
      label: "Expense",
    },
  };

  return types[transactionType] || types.expense;
};
