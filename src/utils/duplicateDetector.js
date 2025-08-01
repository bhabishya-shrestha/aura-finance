/**
 * Duplicate Transaction Detection Utility
 *
 * This utility provides functions to detect and handle duplicate transactions
 * based on various criteria including date, amount, vendor, and other fields.
 */

/**
 * Normalize a string for comparison (remove extra spaces, lowercase, etc.)
 * @param {string} str - The string to normalize
 * @returns {string} - Normalized string
 */
const normalizeString = str => {
  if (!str) return "";
  return str.toString().toLowerCase().trim().replace(/\s+/g, " ");
};

/**
 * Check if two dates are the same (within a tolerance for time differences)
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @param {number} toleranceDays - Tolerance in days (default: 1)
 * @returns {boolean} - True if dates are considered the same
 */
const isSameDate = (date1, date2, toleranceDays = 1) => {
  if (!date1 || !date2) return false;

  const d1 = new Date(date1);
  const d2 = new Date(date2);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

  const diffTime = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= toleranceDays;
};

/**
 * Check if two amounts are the same (with tolerance for rounding differences)
 * @param {number} amount1 - First amount
 * @param {number} amount2 - Second amount
 * @param {number} tolerance - Tolerance in cents (default: 0.01)
 * @returns {boolean} - True if amounts are considered the same
 */
const isSameAmount = (amount1, amount2, tolerance = 0.01) => {
  if (typeof amount1 !== "number" || typeof amount2 !== "number") return false;
  return Math.abs(amount1 - amount2) <= tolerance;
};

/**
 * Check if two descriptions/vendors are similar enough to be considered the same
 * @param {string} desc1 - First description
 * @param {string} desc2 - Second description
 * @param {number} similarityThreshold - Threshold for similarity (default: 0.8)
 * @returns {boolean} - True if descriptions are considered similar
 */
const isSimilarDescription = (desc1, desc2, similarityThreshold = 0.8) => {
  const normalized1 = normalizeString(desc1);
  const normalized2 = normalizeString(desc2);

  if (normalized1 === normalized2) return true;

  // Check if one is contained within the other (for partial matches)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    const shorter =
      normalized1.length < normalized2.length ? normalized1 : normalized2;
    const longer =
      normalized1.length < normalized2.length ? normalized2 : normalized1;
    const similarity = shorter.length / longer.length;
    return similarity >= similarityThreshold;
  }

  // Calculate Levenshtein distance for more complex similarity
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const similarity = 1 - distance / maxLength;

  return similarity >= similarityThreshold;
};

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Levenshtein distance
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

/**
 * Check if a transaction is a duplicate of an existing transaction
 * @param {Object} newTransaction - The new transaction to check
 * @param {Object} existingTransaction - The existing transaction to compare against
 * @param {Object} options - Options for duplicate detection
 * @returns {Object} - Duplicate detection result
 */
export const checkTransactionDuplicate = (
  newTransaction,
  existingTransaction,
  options = {}
) => {
  const {
    dateTolerance = 1,
    amountTolerance = 0.01,
    descriptionSimilarityThreshold = 0.8,
    requireExactCategory = false,
  } = options;

  // Check date similarity
  const dateMatch = isSameDate(
    newTransaction.date,
    existingTransaction.date,
    dateTolerance
  );

  // Check amount similarity
  const amountMatch = isSameAmount(
    newTransaction.amount,
    existingTransaction.amount,
    amountTolerance
  );

  // Check description/vendor similarity
  const descriptionMatch = isSimilarDescription(
    newTransaction.description,
    existingTransaction.description,
    descriptionSimilarityThreshold
  );

  // Check category (optional)
  const categoryMatch =
    !requireExactCategory ||
    normalizeString(newTransaction.category) ===
      normalizeString(existingTransaction.category);

  // Calculate confidence score
  let confidence = 0;
  if (dateMatch) confidence += 0.4;
  if (amountMatch) confidence += 0.4;
  if (descriptionMatch) confidence += 0.2;

  const isDuplicate =
    dateMatch && amountMatch && descriptionMatch && categoryMatch;

  return {
    isDuplicate,
    confidence,
    matches: {
      date: dateMatch,
      amount: amountMatch,
      description: descriptionMatch,
      category: categoryMatch,
    },
    existingTransaction,
  };
};

/**
 * Find all duplicates for a set of new transactions against existing transactions
 * @param {Array} newTransactions - Array of new transactions to check
 * @param {Array} existingTransactions - Array of existing transactions to check against
 * @param {Object} options - Options for duplicate detection
 * @returns {Object} - Duplicate detection results
 */
export const findDuplicateTransactions = (
  newTransactions,
  existingTransactions,
  options = {}
) => {
  const duplicates = [];
  const nonDuplicates = [];

  for (const newTransaction of newTransactions) {
    let isDuplicate = false;
    let bestMatch = null;
    let highestConfidence = 0;

    for (const existingTransaction of existingTransactions) {
      const result = checkTransactionDuplicate(
        newTransaction,
        existingTransaction,
        options
      );

      if (result.isDuplicate && result.confidence > highestConfidence) {
        isDuplicate = true;
        bestMatch = result;
        highestConfidence = result.confidence;
      }
    }

    if (isDuplicate && bestMatch) {
      duplicates.push({
        newTransaction,
        ...bestMatch,
      });
    } else {
      nonDuplicates.push(newTransaction);
    }
  }

  return {
    duplicates,
    nonDuplicates,
    summary: {
      total: newTransactions.length,
      duplicates: duplicates.length,
      nonDuplicates: nonDuplicates.length,
      duplicatePercentage: (duplicates.length / newTransactions.length) * 100,
    },
  };
};

/**
 * Group duplicates by confidence level for UI display
 * @param {Array} duplicates - Array of duplicate detection results
 * @returns {Object} - Grouped duplicates
 */
export const groupDuplicatesByConfidence = duplicates => {
  const highConfidence = duplicates.filter(d => d.confidence >= 0.9);
  const mediumConfidence = duplicates.filter(
    d => d.confidence >= 0.7 && d.confidence < 0.9
  );
  const lowConfidence = duplicates.filter(d => d.confidence < 0.7);

  return {
    high: highConfidence,
    medium: mediumConfidence,
    low: lowConfidence,
    all: duplicates,
  };
};

/**
 * Get a human-readable reason for why a transaction was flagged as duplicate
 * @param {Object} duplicateResult - Result from checkTransactionDuplicate
 * @returns {string} - Human-readable reason
 */
export const getDuplicateReason = duplicateResult => {
  const { matches, confidence } = duplicateResult;
  const reasons = [];

  if (matches.date) reasons.push("same date");
  if (matches.amount) reasons.push("same amount");
  if (matches.description) reasons.push("similar description");
  if (matches.category) reasons.push("same category");

  if (reasons.length === 0) return "Unknown reason";

  const reasonText = reasons.join(", ");
  const confidenceText =
    confidence >= 0.9 ? "high" : confidence >= 0.7 ? "medium" : "low";

  return `${reasonText} (${confidenceText} confidence)`;
};
