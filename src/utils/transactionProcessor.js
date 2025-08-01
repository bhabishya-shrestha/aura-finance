/**
 * Smart Transaction Processor
 * Handles intelligent categorization, account matching, and transaction validation
 */

// Common bank identifiers for account matching
const BANK_IDENTIFIERS = {
  "bank of america": {
    patterns: ["boa", "bank of america", "bofa"],
    accountTypes: ["checking", "savings", "credit card"],
    last4Digits: true,
  },
  chase: {
    patterns: ["chase", "jpmorgan"],
    accountTypes: ["checking", "savings", "credit card"],
    last4Digits: true,
  },
  "wells fargo": {
    patterns: ["wells fargo", "wellsfargo"],
    accountTypes: ["checking", "savings", "credit card"],
    last4Digits: true,
  },
  citibank: {
    patterns: ["citi", "citibank"],
    accountTypes: ["checking", "savings", "credit card"],
    last4Digits: true,
  },
  "american express": {
    patterns: ["amex", "american express"],
    accountTypes: ["credit card"],
    last4Digits: true,
  },
  discover: {
    patterns: ["discover"],
    accountTypes: ["credit card"],
    last4Digits: true,
  },
};

// Enhanced category mapping with more specific patterns
const CATEGORY_PATTERNS = {
  "Food & Dining": [
    "restaurant",
    "cafe",
    "coffee",
    "starbucks",
    "mcdonalds",
    "burger",
    "pizza",
    "doordash",
    "uber eats",
    "grubhub",
    "postmates",
    "delivery",
    "takeout",
    "dining",
    "food",
    "meal",
    "lunch",
    "dinner",
    "breakfast",
    "snack",
  ],
  Transportation: [
    "uber",
    "lyft",
    "taxi",
    "gas",
    "fuel",
    "shell",
    "exxon",
    "chevron",
    "parking",
    "toll",
    "metro",
    "subway",
    "bus",
    "train",
    "airline",
    "delta",
    "united",
    "american airlines",
    "southwest",
    "transport",
  ],
  Shopping: [
    "amazon",
    "walmart",
    "target",
    "costco",
    "best buy",
    "home depot",
    "lowes",
    "macy",
    "nordstrom",
    "target",
    "shopping",
    "retail",
  ],
  Entertainment: [
    "netflix",
    "spotify",
    "hulu",
    "disney",
    "youtube",
    "prime",
    "hbo",
    "movie",
    "theater",
    "concert",
    "show",
    "ticket",
    "game",
    "entertainment",
  ],
  Healthcare: [
    "pharmacy",
    "medical",
    "doctor",
    "hospital",
    "cvs",
    "walgreens",
    "insurance",
    "copay",
    "deductible",
    "prescription",
    "healthcare",
  ],
  Housing: [
    "rent",
    "mortgage",
    "home",
    "apartment",
    "lease",
    "property",
    "maintenance",
    "repair",
    "furniture",
    "ikea",
    "wayfair",
    "housing",
  ],
  Utilities: [
    "electric",
    "gas",
    "water",
    "internet",
    "phone",
    "cable",
    "utility",
    "at&t",
    "verizon",
    "comcast",
    "xfinity",
    "spectrum",
  ],
  Income: [
    "salary",
    "payroll",
    "deposit",
    "transfer in",
    "income",
    "payment received",
  ],
};

/**
 * Smart transaction categorization based on description
 * @param {string} description - Transaction description
 * @returns {string} - Category name
 */
export const categorizeTransaction = description => {
  if (!description) return "Other";

  const desc = description.toLowerCase();

  // Check for income patterns first
  if (CATEGORY_PATTERNS["Income"].some(pattern => desc.includes(pattern))) {
    return "Income";
  }

  // Check other categories
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (category === "Income") continue; // Already checked

    if (patterns.some(pattern => desc.includes(pattern))) {
      return category;
    }
  }

  return "Other";
};

/**
 * Extract bank information from transaction description
 * @param {string} description - Transaction description
 * @returns {Object} - Bank info with name and last 4 digits
 */
export const extractBankInfo = description => {
  if (!description) return null;

  const desc = description.toLowerCase();

  for (const [bankName, bankInfo] of Object.entries(BANK_IDENTIFIERS)) {
    if (bankInfo.patterns.some(pattern => desc.includes(pattern))) {
      // Try to extract last 4 digits
      const digitMatch = desc.match(/\*(\d{4})/);
      const last4 = digitMatch ? digitMatch[1] : null;

      return {
        bankName,
        last4Digits: last4,
        accountTypes: bankInfo.accountTypes,
      };
    }
  }

  return null;
};

/**
 * Find matching account based on transaction description
 * @param {string} description - Transaction description
 * @param {Array} existingAccounts - Array of existing accounts
 * @returns {Object|null} - Matching account or null
 */
export const findMatchingAccount = (description, existingAccounts) => {
  const bankInfo = extractBankInfo(description);

  if (!bankInfo) return null;

  // Look for exact matches first
  for (const account of existingAccounts) {
    const accountName = account.name.toLowerCase();

    // Check if account name contains bank name
    if (accountName.includes(bankInfo.bankName)) {
      // If we have last 4 digits, try to match them
      if (bankInfo.last4Digits && account.last4Digits) {
        if (account.last4Digits === bankInfo.last4Digits) {
          return account;
        }
      } else {
        // If no last 4 digits, return the first matching bank account
        return account;
      }
    }
  }

  return null;
};

/**
 * Validate and clean transaction data
 * @param {Object} transaction - Raw transaction data
 * @returns {Object} - Cleaned and validated transaction
 */
export const validateTransaction = transaction => {
  const amount = parseFloat(transaction.amount) || 0;

  // Skip $0 transactions that are likely fees or adjustments
  if (amount === 0) {
    const description = (transaction.description || "").toLowerCase();
    const skipPatterns = ["interest", "fee", "charge", "adjustment", "credit"];

    if (skipPatterns.some(pattern => description.includes(pattern))) {
      return null; // Skip this transaction
    }
  }

  return {
    ...transaction,
    amount,
    category:
      transaction.category || categorizeTransaction(transaction.description),
    description: transaction.description || "Unknown transaction",
    date: new Date(transaction.date || new Date()),
    type: amount >= 0 ? "income" : "expense",
  };
};

/**
 * Process a batch of transactions with smart categorization and account matching
 * @param {Array} transactions - Array of raw transactions
 * @param {Array} existingAccounts - Array of existing accounts
 * @returns {Object} - Processed results with categorized transactions and suggestions
 */
export const processTransactions = (transactions, existingAccounts = []) => {
  const processed = [];
  const suggestions = [];
  const unmatched = [];

  for (const transaction of transactions) {
    const validated = validateTransaction(transaction);

    if (!validated) continue; // Skip invalid transactions

    const bankInfo = extractBankInfo(validated.description);
    const matchingAccount = findMatchingAccount(
      validated.description,
      existingAccounts
    );

    if (matchingAccount) {
      processed.push({
        ...validated,
        accountId: matchingAccount.id,
        accountName: matchingAccount.name,
      });
    } else if (bankInfo) {
      // Suggest creating a new account
      suggestions.push({
        transaction: validated,
        bankInfo,
        suggestedAccountName: `${bankInfo.bankName.charAt(0).toUpperCase() + bankInfo.bankName.slice(1)} ${bankInfo.accountTypes[0] || "Account"}${bankInfo.last4Digits ? ` ****${bankInfo.last4Digits}` : ""}`,
      });
    } else {
      unmatched.push(validated);
    }
  }

  return {
    processed,
    suggestions,
    unmatched,
    summary: {
      total: transactions.length,
      processed: processed.length,
      suggestions: suggestions.length,
      unmatched: unmatched.length,
      skipped:
        transactions.length -
        processed.length -
        suggestions.length -
        unmatched.length,
    },
  };
};

/**
 * Generate account suggestions based on transaction patterns
 * @param {Array} transactions - Array of transactions
 * @returns {Array} - Suggested accounts to create
 */
export const generateAccountSuggestions = transactions => {
  const bankCounts = {};

  for (const transaction of transactions) {
    const bankInfo = extractBankInfo(transaction.description);
    if (bankInfo) {
      const key = `${bankInfo.bankName}-${bankInfo.last4Digits || "unknown"}`;
      bankCounts[key] = (bankCounts[key] || 0) + 1;
    }
  }

  return Object.entries(bankCounts)
    .filter(([_, count]) => count >= 2) // Only suggest if we have multiple transactions
    .map(([key, count]) => {
      const [bankName, last4] = key.split("-");
      return {
        bankName,
        last4Digits: last4 === "unknown" ? null : last4,
        transactionCount: count,
        suggestedName: `${bankName.charAt(0).toUpperCase() + bankName.slice(1)} Account${last4 !== "unknown" ? ` ****${last4}` : ""}`,
      };
    })
    .sort((a, b) => b.transactionCount - a.transactionCount);
};
