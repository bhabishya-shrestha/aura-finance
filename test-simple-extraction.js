// Simple test for transaction extraction
// console.log("=== Simple Transaction Extraction Test ===\n");

// Test the transaction extraction logic directly
function testTransactionExtraction() {
  // Simulate the HuggingFaceService class methods
  const normalizeDate = dateStr => {
    try {
      if (!dateStr) return new Date().toISOString().split("T")[0];

      let normalizedDate = dateStr;

      if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length === 3) {
          const month = parts[0].padStart(2, "0");
          const day = parts[1].padStart(2, "0");
          const year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
          normalizedDate = `${year}-${month}-${day}`;
        }
      }

      if (dateStr.includes("-")) {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
          const month = parts[0].padStart(2, "0");
          const day = parts[1].padStart(2, "0");
          const year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
          normalizedDate = `${year}-${month}-${day}`;
        }
      }

      return normalizedDate;
    } catch (error) {
      console.warn("[normalizeDate] Error normalizing date:", dateStr, error);
      return new Date().toISOString().split("T")[0];
    }
  };

  const determineTransactionType = (description, amount) => {
    const desc = description.toLowerCase();

    const incomeKeywords = [
      "deposit",
      "credit",
      "refund",
      "payment",
      "transfer in",
      "income",
    ];
    if (incomeKeywords.some(keyword => desc.includes(keyword))) {
      return "income";
    }

    const expenseKeywords = [
      "withdrawal",
      "debit",
      "purchase",
      "payment",
      "fee",
      "charge",
    ];
    if (expenseKeywords.some(keyword => desc.includes(keyword))) {
      return "expense";
    }

    return amount > 0 ? "expense" : "income";
  };

  const categorizeTransaction = description => {
    const desc = description.toLowerCase();

    const categories = {
      food: [
        "walmart",
        "target",
        "grocery",
        "restaurant",
        "food",
        "dining",
        "mcdonalds",
        "taco bell",
        "domino",
        "uber eats",
      ],
      transportation: [
        "uber",
        "lyft",
        "gas",
        "fuel",
        "parking",
        "transport",
        "tesla",
        "garage",
      ],
      entertainment: [
        "netflix",
        "spotify",
        "amazon",
        "entertainment",
        "movie",
        "sixflags",
        "steam",
      ],
      utilities: ["electric", "water", "gas", "internet", "phone", "utility"],
      shopping: [
        "amazon",
        "ebay",
        "online",
        "shopping",
        "retail",
        "dollar tree",
      ],
      healthcare: ["medical", "doctor", "pharmacy", "health", "dental"],
      finance: ["bank", "atm", "withdrawal", "deposit", "transfer", "payment"],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }

    return "Uncategorized";
  };

  const isValidTransactionAmount = amount => {
    if (amount < 0.01) return false;
    if (amount >= 1900 && amount <= 2100) return false;
    if (amount >= 1 && amount <= 31 && Number.isInteger(amount)) return false;
    if (amount >= 1 && amount <= 12 && Number.isInteger(amount)) return false;
    if (amount >= 100 && amount <= 999 && Number.isInteger(amount))
      return false;
    if (amount > 100000) return false;
    return true;
  };

  const isValidDescription = description => {
    if (!description || description.trim().length < 2) return false;
    if (/^[\d\s\-.*]+$/.test(description)) return false;
    const shortWords = [
      "on",
      "the",
      "a",
      "an",
      "in",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ];
    if (shortWords.includes(description.toLowerCase().trim())) return false;
    if (/^[\s\-.*]+$/.test(description)) return false;
    return true;
  };

  const cleanDescription = description => {
    if (!description) return "Unknown transaction";
    let cleaned = description.trim().replace(/\s+/g, " ");
    cleaned = cleaned.replace(/[-.*]+$/, "");
    cleaned = cleaned.replace(/^[-.*]+/, "");
    if (cleaned.length < 3) {
      cleaned = "Transaction";
    }
    return cleaned;
  };

  const extractTransactionsFromAnalysis = analysis => {
    const transactions = [];

    if (!analysis || analysis.trim() === "") {
      // console.log(
//   "[extractTransactionsFromAnalysis] Empty analysis, returning empty array"
// );
      return transactions;
    }

    // console.log(
//   "[extractTransactionsFromAnalysis] Processing analysis:",
//   analysis
// );

    // More precise patterns specifically designed for bank statement format
    const patterns = [
      // Pattern 1: "Transaction X: DESCRIPTION - $AMOUNT on DATE" format
      /Transaction\s+\d+:\s+([^-]+?)\s+-\s+\$?(\d+\.?\d*)\s+on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,

      // Pattern 2: "Payment X: DESCRIPTION - $AMOUNT on DATE" format
      /Payment\s+\d+:\s+([^-]+?)\s+-\s+\$?(\d+\.?\d*)\s+on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,

      // Pattern 3: "DESCRIPTION - $AMOUNT" format (fallback)
      /([A-Za-z0-9\s\-.*]+?)\s+-\s+\$?(\d+\.?\d*)/gi,

      // Pattern 4: "$AMOUNT DESCRIPTION" format (fallback)
      /\$?(\d+\.?\d*)\s+([A-Za-z0-9\s\-.*]+?)(?=\s+\$?\d+\.?\d*|$)/gi,
    ];

    const foundTransactions = new Set();

    patterns.forEach((pattern, index) => {
      const matches = [...analysis.matchAll(pattern)];
      // console.log(
//   `[extractTransactionsFromAnalysis] Pattern ${index + 1} found ${matches.length} matches`
// );

      matches.forEach(match => {
        let amount, description, date;

        if (index === 0 || index === 1) {
          // Pattern 1 & 2: Transaction/Payment with date
          description = match[1].trim();
          amount = parseFloat(match[2]);
          date = normalizeDate(match[3]);
        } else if (index === 2) {
          // Pattern 3: Description - Amount
          description = match[1].trim();
          amount = parseFloat(match[2]);
          date = new Date().toISOString().split("T")[0];
        } else if (index === 3) {
          // Pattern 4: Amount Description
          amount = parseFloat(match[1]);
          description = match[2].trim();
          date = new Date().toISOString().split("T")[0];
        }

        // console.log(
//   `[DEBUG] Extracted: amount=${amount}, description="${description}", date=${date}`
// );

        // Validate amount and description
        if (
          amount &&
          isValidTransactionAmount(amount) &&
          isValidDescription(description)
        ) {
          const transactionKey = `${amount}-${description}`;

          if (!foundTransactions.has(transactionKey)) {
            foundTransactions.add(transactionKey);

            const transaction = {
              date: date || new Date().toISOString().split("T")[0],
              description: cleanDescription(description),
              amount: amount,
              type: determineTransactionType(description, amount),
              category: categorizeTransaction(description),
              confidence: 0.9,
            };

            transactions.push(transaction);
            // console.log(
//   `[extractTransactionsFromAnalysis] Added transaction:`,
//   transaction
// );
          }
        } else {
          // console.log(
//   `[DEBUG] Rejected: amount=${amount} (valid: ${isValidTransactionAmount(amount)}), description="${description}" (valid: ${isValidDescription(description)})`
// );
        }
      });
    });

    if (transactions.length === 0) {
      // console.log(
//   "[extractTransactionsFromAnalysis] No transactions found, creating fallback"
// );
      transactions.push({
        date: new Date().toISOString().split("T")[0],
        description: "Document analysis completed",
        amount: 0,
        type: "expense",
        category: "Uncategorized",
        confidence: 0.3,
      });
    }

    // console.log(
//   `[extractTransactionsFromAnalysis] Final result: ${transactions.length} transactions`
// );
    return transactions;
  };

  // Test with a simple, well-formatted analysis
  const simpleAnalysis = `Transaction 1: EVEREST FOOD TRUCK 2 - $27.96 on 08/02/2025
Transaction 2: WM SUPERCENTER #475 ROUND ROCK TX - $35.96 on 08/01/2025
Payment 1: PAYMENT FROM CHK 7012 CONF#162rrgson - $700.00 on 07/23/2025`;

  // console.log("Testing with simple analysis...\n");
  const transactions = extractTransactionsFromAnalysis(simpleAnalysis);

  // console.log("\n=== Extracted Transactions ===");
  transactions.forEach((transaction, index) => {
    // console.log(
//   `${index + 1}. ${transaction.date} | ${transaction.description} | $${transaction.amount} | ${transaction.type} | ${transaction.category} | Confidence: ${transaction.confidence}`
// );
  });

  // console.log("\n=== Test Summary ===");
  // console.log(`Transactions Extracted: ${transactions.length}`);
  // console.log(`Expected Transactions: 3`);
  // console.log(`Success Rate: ${((transactions.length / 3) * 100).toFixed(1)}%`);
}

// Run the test
testTransactionExtraction();
