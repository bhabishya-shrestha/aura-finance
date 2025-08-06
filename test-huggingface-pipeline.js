// Test script for Hugging Face pipeline with test image
import { fileURLToPath } from "url";
import { dirname } from "path";

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

// Mock fetch for API calls
global.fetch = async () => {
  // console.log('Mock API call to:', url);
  // console.log('Request body:', JSON.parse(options.body));

  // Simulate Hugging Face API response
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
      
      Payment 1: PAYMENT FROM CHK 7012 CONF#162rrgson - $700.00 on 07/23/2025
      Payment 2: PAYMENT FROM CHK 7012 CONF#1jjh0j84x - $1487.16 on 07/22/2025
      Payment 3: PAYMENT FROM CHK 7012 CONF#1ck0ygred - $1100.00 on 07/21/2025
      
      Additional transactions include ATM withdrawals, Tesla services, Uber Eats, and various retail purchases.`,
      },
    ],
  };
};

// Test the transaction extraction logic directly
function testTransactionExtraction() {
  // console.log('=== Testing Transaction Extraction Logic ===\n');

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
    return true;
  };

  const extractTransactionsFromAnalysis = analysis => {
    const transactions = [];

    if (!analysis || analysis.trim() === "") {
      // console.log("[extractTransactionsFromAnalysis] Empty analysis, returning empty array");
      return transactions;
    }

    // console.log("[extractTransactionsFromAnalysis] Processing analysis:", analysis);

    const patterns = [
      /\$?(\d+\.?\d*)\s+([A-Za-z0-9\s-]+?)(?=\s+\$?\d+\.?\d*|$)/gi,
      /([A-Za-z0-9\s-]+?)\s+\$?(\d+\.?\d*)/gi,
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+\$?(\d+\.?\d*)\s+([A-Za-z0-9\s-]+?)(?=\s+\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|$)/gi,
      /\$?(\d+\.?\d*)\s+(?:on\s+)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,
    ];

    const foundTransactions = new Set();

    patterns.forEach((pattern, index) => {
      const matches = [...analysis.matchAll(pattern)];
      // console.log(`[extractTransactionsFromAnalysis] Pattern ${index + 1} found ${matches.length} matches:`, matches);

      matches.forEach(match => {
        let amount, description, date;

        if (index === 0) {
          amount = parseFloat(match[1]);
          description = match[2].trim();
        } else if (index === 1) {
          description = match[1].trim();
          amount = parseFloat(match[2]);
        } else if (index === 2) {
          date = normalizeDate(match[1]);
          amount = parseFloat(match[2]);
          description = match[3].trim();
        } else if (index === 3) {
          amount = parseFloat(match[1]);
          date = normalizeDate(match[2]);
          description = "Transaction";
        }

        if (
          amount &&
          amount >= 0.01 &&
          amount < 1000000 &&
          isValidTransactionAmount(amount)
        ) {
          const transactionKey = `${amount}-${description}`;

          if (!foundTransactions.has(transactionKey)) {
            foundTransactions.add(transactionKey);

            const transaction = {
              date: date || new Date().toISOString().split("T")[0],
              description: description || "Extracted transaction",
              amount: amount,
              type: determineTransactionType(description, amount),
              category: categorizeTransaction(description),
              confidence: 0.8,
            };

            transactions.push(transaction);
            // console.log(`[extractTransactionsFromAnalysis] Added transaction:`, transaction);
          }
        }
      });
    });

    if (transactions.length === 0) {
      // console.log("[extractTransactionsFromAnalysis] No transactions found, creating fallback");
      transactions.push({
        date: new Date().toISOString().split("T")[0],
        description: "Document analysis completed",
        amount: 0,
        type: "expense",
        category: "Uncategorized",
        confidence: 0.3,
      });
    }

    // console.log(`[extractTransactionsFromAnalysis] Final result: ${transactions.length} transactions`);
    return transactions;
  };

  // Test with the mock AI analysis
  const mockAnalysis = `Extracted financial transactions from bank statement:
      
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
      
      Payment 1: PAYMENT FROM CHK 7012 CONF#162rrgson - $700.00 on 07/23/2025
      Payment 2: PAYMENT FROM CHK 7012 CONF#1jjh0j84x - $1487.16 on 07/22/2025
      Payment 3: PAYMENT FROM CHK 7012 CONF#1ck0ygred - $1100.00 on 07/21/2025
      
      Additional transactions include ATM withdrawals, Tesla services, Uber Eats, and various retail purchases.`;

  // console.log('Testing with mock AI analysis...\n');
  const transactions = extractTransactionsFromAnalysis(mockAnalysis);

  // console.log('\n=== Extracted Transactions ===');
  transactions.forEach(() => {
    // console.log(`Transaction extracted successfully`);
  });

  // console.log('\n=== Test Summary ===');
  // console.log(`Transactions Extracted: ${transactions.length}`);
  // console.log(`Expected Transactions: 13+ (from mock analysis)`);
  // console.log(`Success Rate: ${((transactions.length / 13) * 100).toFixed(1)}%`);
}

// Run the test
testTransactionExtraction();
