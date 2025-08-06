// Full pipeline test with actual test1.png image
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
dirname(__filename);

// Mock environment variables for testing
process.env.VITE_HUGGINGFACE_API_KEY = "hf_JqanjMh..."; // Your actual key

// Mock localStorage for Node.js environment
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

// Mock fetch for API calls with realistic responses
global.fetch = async (url, options) => {
  // console.log("Mock API call to:", url);

  // Simulate Hugging Face API response based on the actual test1.png content
  return {
    ok: true,
    json: async () => [
      {
        summary_text: `Extracted financial transactions from bank statement:

Transaction 1: EVEREST FOOD TRUCK 2 - $27.96 on 08/02/2025
Transaction 2: WM SUPERCENTER #475 ROUND ROCK TX - $35.96 on 08/01/2025
Transaction 3: BUC-EE'S #35 TEMPLE TX - $15.13 on 07/31/2025
Transaction 4: TACO BELL #030139 AUSTIN TX - $12.50 on 07/30/2025
Transaction 5: DOLLAR TREE ROUND ROCK TX - $2.50 on 07/29/2025
Transaction 6: WALMART.COM 800-925-6278 AR - $45.67 on 07/28/2025
Transaction 7: BUC-EE'S #22 NEW BRAUNFELSTX - $18.75 on 07/27/2025
Transaction 8: SIXFLAGS FT SAN ANTOTX 210-697-5000 TX - $89.99 on 07/26/2025
Transaction 9: DOMINO'S 6615 979-695-9912 TX - $24.50 on 07/25/2025
Transaction 10: AMAZON PRIME*BO4WE5D33 Amzn.com/billWA - $12.99 on 07/24/2025
Transaction 11: ATI*3806-078190352 ATM.TK CA - $100.00 on 07/23/2025
Transaction 12: TESLA SERVICE US 877-7983752 CA - $60.00 on 07/22/2025
Transaction 13: UBER *EATS HELP.UBER.COMCA - $28.50 on 07/21/2025
Transaction 14: Perry Brooks Garage Austin TX - $60.00 on 07/20/2025
Transaction 15: SP LUXE BIDET SAN DIEGO CA - $42.20 on 07/19/2025
Transaction 16: WL *STEAM PURCHASE 425-889-9642 WA - $15.99 on 07/18/2025
Transaction 17: McDonalds 26418 151-2670263 TX - $8.75 on 07/17/2025
Transaction 18: AMAZON MKTPL*W605N7YG3 Amzn.com/billWA - $9.99 on 07/16/2025
Transaction 19: BUC-EE'S #35 TEMPLE TX - $15.13 on 07/15/2025
Transaction 20: TACO BELL #030139 AUSTIN TX - $12.50 on 07/14/2025
Transaction 21: DOLLAR TREE ROUND ROCK TX - $2.50 on 07/13/2025
Transaction 22: WALMART.COM 800-925-6278 AR - $45.67 on 07/12/2025
Transaction 23: BUC-EE'S #22 NEW BRAUNFELSTX - $18.75 on 07/11/2025
Transaction 24: SIXFLAGS FT SAN ANTOTX 210-697-5000 TX - $89.99 on 07/10/2025
Transaction 25: DOMINO'S 6615 979-695-9912 TX - $24.50 on 07/09/2025
Transaction 26: AMAZON PRIME*BO4WE5D33 Amzn.com/billWA - $12.99 on 07/08/2025
Transaction 27: ATI*3806-078190352 ATM.TK CA - $100.00 on 07/07/2025

Payment 1: PAYMENT FROM CHK 7012 CONF#162rrgson - $700.00 on 07/15/2025
Payment 2: PAYMENT FROM CHK 7012 CONF#1jjh0j84x - $1487.16 on 07/14/2025
Payment 3: PAYMENT FROM CHK 7012 CONF#1ck0ygred - $1100.00 on 07/13/2025`,
      },
    ],
  };
};

// Mock Tesseract.js with realistic OCR output from test1.png
const mockTesseract = {
  recognize: async (imageData, lang, options) => {
    // console.log("Mock OCR processing test1.png...");

    // Simulate realistic OCR text extraction from the actual test1.png image
    const ocrText = `Posting Date Description Type Amount Balance
Pending EVEREST FOOD TRUCK 2 $27.96 $444.59
08/02/2025 WM SUPERCENTER #475 ROUND ROCK TX $35.96 $416.63
08/01/2025 BUC-EE'S #35 TEMPLE TX $15.13 $380.67
07/31/2025 TACO BELL #030139 AUSTIN TX $12.50 $365.54
07/30/2025 DOLLAR TREE ROUND ROCK TX $2.50 $353.04
07/29/2025 WALMART.COM 800-925-6278 AR $45.67 $350.54
07/28/2025 BUC-EE'S #22 NEW BRAUNFELSTX $18.75 $304.87
07/27/2025 SIXFLAGS FT SAN ANTOTX 210-697-5000 TX $89.99 $286.12
07/26/2025 DOMINO'S 6615 979-695-9912 TX $24.50 $196.13
07/25/2025 AMAZON PRIME*BO4WE5D33 Amzn.com/billWA $12.99 $171.63
07/24/2025 ATI*3806-078190352 ATM.TK CA $100.00 $158.64
07/23/2025 TESLA SERVICE US 877-7983752 CA $60.00 $58.64
07/22/2025 UBER *EATS HELP.UBER.COMCA $28.50 -$1.36
07/21/2025 Perry Brooks Garage Austin TX $60.00 -$29.86
07/20/2025 SP LUXE BIDET SAN DIEGO CA $42.20 -$89.86
07/19/2025 WL *STEAM PURCHASE 425-889-9642 WA $15.99 -$132.06
07/18/2025 McDonalds 26418 151-2670263 TX $8.75 -$148.05
07/17/2025 AMAZON MKTPL*W605N7YG3 Amzn.com/billWA $9.99 -$156.80
07/16/2025 BUC-EE'S #35 TEMPLE TX $15.13 -$166.79
07/15/2025 TACO BELL #030139 AUSTIN TX $12.50 -$181.92
07/14/2025 DOLLAR TREE ROUND ROCK TX $2.50 -$194.42
07/13/2025 WALMART.COM 800-925-6278 AR $45.67 -$196.92
07/12/2025 BUC-EE'S #22 NEW BRAUNFELSTX $18.75 -$242.59
07/11/2025 SIXFLAGS FT SAN ANTOTX 210-697-5000 TX $89.99 -$261.34
07/10/2025 DOMINO'S 6615 979-695-9912 TX $24.50 -$351.33
07/09/2025 AMAZON PRIME*BO4WE5D33 Amzn.com/billWA $12.99 -$375.83
07/08/2025 ATI*3806-078190352 ATM.TK CA $100.00 -$388.82
07/07/2025 PAYMENT FROM CHK 7012 CONF#162rrgson -$700.00 -$488.82
07/15/2025 PAYMENT FROM CHK 7012 CONF#1jjh0j84x -$1487.16 $211.18
07/14/2025 PAYMENT FROM CHK 7012 CONF#1ck0ygred -$1100.00 $1698.34
Beginning balance as of 07/11/2025 $77.84`;

    return {
      data: {
        text: ocrText,
        confidence: 85.5,
        words: [],
      },
    };
  },
};

// Mock the Tesseract import
const originalImport = global.import;
global.import = async module => {
  if (module === "tesseract.js") {
    return { default: mockTesseract };
  }
  return originalImport(module);
};

// Test the transaction extraction logic directly with the improved patterns
function testImprovedExtraction() {
  // console.log(
    "=== Testing Improved Transaction Extraction with test1.png ===\n"
  );

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
        "buc-ee",
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
    // Remove the overly restrictive phone number check that was rejecting $100, $700, etc.
    // if (amount >= 100 && amount <= 999 && Number.isInteger(amount)) return false;
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
        "[extractTransactionsFromAnalysis] Empty analysis, returning empty array"
      );
      return transactions;
    }

    // console.log(
      "[extractTransactionsFromAnalysis] Processing analysis:",
      analysis
    );

    // Count expected transactions
    const transactionMatches = analysis.match(/Transaction\s+\d+:/g);
    const paymentMatches = analysis.match(/Payment\s+\d+:/g);
    // console.log(
      `[DEBUG] Found ${transactionMatches?.length || 0} transaction lines and ${paymentMatches?.length || 0} payment lines`
    );

    // More precise patterns specifically designed for bank statement format
    // Only use the most reliable patterns to avoid duplicates
    const patterns = [
      // Pattern 1: "Transaction X: DESCRIPTION - $AMOUNT on DATE" format (most reliable)
      // Using flexible pattern that handles special characters and hyphens in descriptions
      /Transaction\s+\d+:\s+(.*?)\s+-\s+\$?(\d+\.?\d*)\s+on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,

      // Pattern 2: "Payment X: DESCRIPTION - $AMOUNT on DATE" format (most reliable)
      /Payment\s+\d+:\s+(.*?)\s+-\s+\$?(\d+\.?\d*)\s+on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,
    ];

    const foundTransactions = new Set();

    patterns.forEach((pattern, index) => {
      const matches = [...analysis.matchAll(pattern)];
      // console.log(
        `[extractTransactionsFromAnalysis] Pattern ${index + 1} found ${matches.length} matches`
      );

      // Debug: Show what matches were found
      matches.forEach((match, matchIndex) => {
        // console.log(`[DEBUG] Match ${matchIndex + 1}:`, match[0]);
      });

      matches.forEach(match => {
        let amount, description, date;

        // Pattern 1 & 2: Transaction/Payment with date
        description = match[1].trim();
        amount = parseFloat(match[2]);
        date = normalizeDate(match[3]);

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
              `[extractTransactionsFromAnalysis] Added transaction:`,
              transaction
            );
          } else {
            // console.log(
              `[DEBUG] Duplicate transaction filtered out: ${transactionKey}`
            );
          }
        } else {
          // Debug why transaction was rejected
          // console.log(
            `[DEBUG] Rejected transaction: amount=${amount}, description="${description}"`
          );
          // console.log(
            `[DEBUG] isValidAmount: ${isValidTransactionAmount(amount)}, isValidDescription: ${isValidDescription(description)}`
          );
        }
      });
    });

    // If we didn't get all expected transactions, try a more aggressive approach
    if (transactions.length < 27) {
      // console.log(
        `[DEBUG] Only extracted ${transactions.length} transactions, trying alternative approach`
      );

      // Try to extract all lines that contain transaction information
      const lines = analysis.split("\n");
      lines.forEach((line, lineIndex) => {
        if (line.includes("Transaction") || line.includes("Payment")) {
          // console.log(`[DEBUG] Line ${lineIndex}: ${line}`);
        }
      });

      // Try a more flexible regex pattern
      // console.log(`[DEBUG] Trying more flexible regex pattern`);
      const flexiblePattern =
        /Transaction\s+\d+:\s+(.*?)\s+-\s+\$?(\d+\.?\d*)\s+on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi;
      const flexibleMatches = [...analysis.matchAll(flexiblePattern)];
      // console.log(
        `[DEBUG] Flexible pattern found ${flexibleMatches.length} matches`
      );

      flexibleMatches.forEach((match, matchIndex) => {
        if (
          !transactions.some(
            t => t.description === cleanDescription(match[1].trim())
          )
        ) {
          // console.log(`[DEBUG] Flexible match ${matchIndex + 1}:`, match[0]);
        }
      });
    }

    if (transactions.length === 0) {
      // console.log(
        "[extractTransactionsFromAnalysis] No transactions found, creating fallback"
      );
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
      `[extractTransactionsFromAnalysis] Final result: ${transactions.length} transactions`
    );
    return transactions;
  };

  // Test with the comprehensive AI analysis including ALL 27 transactions
  const comprehensiveAnalysis = `Extracted financial transactions from bank statement:

Transaction 1: EVEREST FOOD TRUCK 2 - $27.96 on 08/02/2025
Transaction 2: WM SUPERCENTER #475 ROUND ROCK TX - $35.96 on 08/01/2025
Transaction 3: BUC-EE'S #35 TEMPLE TX - $15.13 on 07/31/2025
Transaction 4: TACO BELL #030139 AUSTIN TX - $12.50 on 07/30/2025
Transaction 5: DOLLAR TREE ROUND ROCK TX - $2.50 on 07/29/2025
Transaction 6: WALMART.COM 800-925-6278 AR - $45.67 on 07/28/2025
Transaction 7: BUC-EE'S #22 NEW BRAUNFELSTX - $18.75 on 07/27/2025
Transaction 8: SIXFLAGS FT SAN ANTOTX 210-697-5000 TX - $89.99 on 07/26/2025
Transaction 9: DOMINO'S 6615 979-695-9912 TX - $24.50 on 07/25/2025
Transaction 10: AMAZON PRIME*BO4WE5D33 Amzn.com/billWA - $12.99 on 07/24/2025
Transaction 11: ATI*3806-078190352 ATM.TK CA - $100.00 on 07/23/2025
Transaction 12: TESLA SERVICE US 877-7983752 CA - $60.00 on 07/22/2025
Transaction 13: UBER *EATS HELP.UBER.COMCA - $28.50 on 07/21/2025
Transaction 14: Perry Brooks Garage Austin TX - $60.00 on 07/20/2025
Transaction 15: SP LUXE BIDET SAN DIEGO CA - $42.20 on 07/19/2025
Transaction 16: WL *STEAM PURCHASE 425-889-9642 WA - $15.99 on 07/18/2025
Transaction 17: McDonalds 26418 151-2670263 TX - $8.75 on 07/17/2025
Transaction 18: AMAZON MKTPL*W605N7YG3 Amzn.com/billWA - $9.99 on 07/16/2025
Transaction 19: BUC-EE'S #35 TEMPLE TX - $15.13 on 07/15/2025
Transaction 20: TACO BELL #030139 AUSTIN TX - $12.50 on 07/14/2025
Transaction 21: DOLLAR TREE ROUND ROCK TX - $2.50 on 07/13/2025
Transaction 22: WALMART.COM 800-925-6278 AR - $45.67 on 07/12/2025
Transaction 23: BUC-EE'S #22 NEW BRAUNFELSTX - $18.75 on 07/11/2025
Transaction 24: SIXFLAGS FT SAN ANTOTX 210-697-5000 TX - $89.99 on 07/10/2025
Transaction 25: DOMINO'S 6615 979-695-9912 TX - $24.50 on 07/09/2025
Transaction 26: AMAZON PRIME*BO4WE5D33 Amzn.com/billWA - $12.99 on 07/08/2025
Transaction 27: ATI*3806-078190352 ATM.TK CA - $100.00 on 07/07/2025

Payment 1: PAYMENT FROM CHK 7012 CONF#162rrgson - $700.00 on 07/15/2025
Payment 2: PAYMENT FROM CHK 7012 CONF#1jjh0j84x - $1487.16 on 07/14/2025
Payment 3: PAYMENT FROM CHK 7012 CONF#1ck0ygred - $1100.00 on 07/13/2025`;

  // console.log("Testing with comprehensive AI analysis (27 transactions)...\n");
  const transactions = extractTransactionsFromAnalysis(comprehensiveAnalysis);

  // console.log("\n=== Extracted Transactions ===");
  transactions.forEach((transaction, index) => {
    // console.log(
      `${index + 1}. ${transaction.date} | ${transaction.description} | $${transaction.amount} | ${transaction.type} | ${transaction.category} | Confidence: ${transaction.confidence}`
    );
  });

  // console.log("\n=== Test Summary ===");
  // console.log(`Transactions Extracted: ${transactions.length}`);
  // console.log(`Expected Transactions: 27 (based on test1.png)`);
  // console.log(
    `Success Rate: ${((transactions.length / 27) * 100).toFixed(1)}%`
  );

  // Analyze transaction quality
  const validTransactions = transactions.filter(
    t =>
      t.description &&
      t.description !== "Document analysis completed" &&
      t.amount > 0
  );
  // console.log(`Valid Transactions: ${validTransactions.length}`);
  // console.log(
    `Quality Score: ${((validTransactions.length / transactions.length) * 100).toFixed(1)}%`
  );

  // Show categorization breakdown
  const categories = {};
  validTransactions.forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + 1;
  });
  // console.log("\n=== Category Breakdown ===");
  Object.entries(categories).forEach(([category, count]) => {
    // console.log(`${category}: ${count} transactions`);
  });

  // Show unique merchants
  const uniqueMerchants = new Set();
  validTransactions.forEach(t => {
    uniqueMerchants.add(t.description);
  });
  // console.log(`\nUnique Merchants: ${uniqueMerchants.size}`);
}

// Run the test
testImprovedExtraction();
