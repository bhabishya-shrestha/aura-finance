import Papa from "papaparse";
import Tesseract from "tesseract.js";

// Categories for transaction classification
export const CATEGORIES = [
  "Groceries",
  "Utilities",
  "Income",
  "Shopping",
  "Restaurants",
  "Transport",
  "Entertainment",
  "Healthcare",
  "Other",
];

// Parse CSV files
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions = results.data.map((row, index) => {
            // Handle different CSV formats
            const date = row.Date || row.date || row.DATE;
            const description =
              row.Description || row.description || row.DESC || row.Description;
            const amount = row.Amount || row.amount || row.AMOUNT;

            if (!date || !description || !amount) {
              throw new Error(`Missing required fields in row ${index + 1}`);
            }

            return {
              id: Date.now() + index,
              date: new Date(date),
              description: description.trim(),
              amount: parseFloat(amount.replace(/[$,]/g, "")),
              category: "Other",
              accountId: 1,
              selected: true,
            };
          });

          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

// Parse PDF files (optimized for Bank of America statements)
export const parsePDF = async (file) => {
  try {
    // Show loading state
    console.log("Starting OCR processing...");

    // Perform OCR on the PDF
    const result = await Tesseract.recognize(file, "eng", {
      logger: (m) => console.log(m),
    });

    console.log("OCR completed, parsing text...");

    // Parse the OCR text for Bank of America statement structure
    const transactions = parseBankOfAmericaText(result.data.text);

    return transactions;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error(
      "Failed to parse PDF file. Please ensure it's a valid Bank of America statement."
    );
  }
};

// Parse Bank of America statement text
const parseBankOfAmericaText = (text) => {
  const transactions = [];
  const lines = text.split("\n").filter((line) => line.trim());

  // Bank of America specific patterns
  const transactionPatterns = [
    // Pattern for "Purchases and Adjustments" section
    /(\d{2}\/\d{2}\/\d{4})\s+([^$]+?)\s+([-]?\$[\d,]+\.\d{2})/g,
    // Pattern for "Payments and Other Credits" section
    /(\d{2}\/\d{2}\/\d{4})\s+([^$]+?)\s+([-]?\$[\d,]+\.\d{2})/g,
    // Alternative pattern with different spacing
    /(\d{2}\/\d{2}\/\d{4})\s+([^$]+?)\s+([-]?\$[\d,]+\.\d{2})/g,
  ];

  let transactionId = Date.now();

  // Look for transaction sections
  const sections = [
    "Purchases and Adjustments",
    "Payments and Other Credits",
    "Transactions",
    "Activity",
  ];

  let inTransactionSection = false;

  for (const line of lines) {
    // Check if we're entering a transaction section
    if (sections.some((section) => line.includes(section))) {
      inTransactionSection = true;
      continue;
    }

    // Check if we're leaving a transaction section
    if (
      inTransactionSection &&
      (line.includes("Total") || line.includes("SUMMARY"))
    ) {
      inTransactionSection = false;
      continue;
    }

    if (inTransactionSection) {
      // Try to match transaction patterns
      for (const pattern of transactionPatterns) {
        const matches = [...line.matchAll(pattern)];

        for (const match of matches) {
          const [, dateStr, description, amountStr] = match;

          // Clean up the data
          const cleanDescription = description.trim().replace(/\s+/g, " ");
          const cleanAmount = amountStr.replace(/[$,]/g, "");

          // Validate the data
          if (cleanDescription.length > 3 && !isNaN(parseFloat(cleanAmount))) {
            transactions.push({
              id: transactionId++,
              date: parseDate(dateStr),
              description: cleanDescription,
              amount: parseFloat(cleanAmount),
              category: categorizeTransaction(cleanDescription),
              accountId: 1,
              selected: true,
            });
          }
        }
      }
    }
  }

  // If no transactions found with section parsing, try regex on entire text
  if (transactions.length === 0) {
    console.log(
      "No transactions found in sections, trying full text parsing..."
    );

    for (const pattern of transactionPatterns) {
      const matches = [...text.matchAll(pattern)];

      for (const match of matches) {
        const [, dateStr, description, amountStr] = match;

        const cleanDescription = description.trim().replace(/\s+/g, " ");
        const cleanAmount = amountStr.replace(/[$,]/g, "");

        if (cleanDescription.length > 3 && !isNaN(parseFloat(cleanAmount))) {
          transactions.push({
            id: transactionId++,
            date: parseDate(dateStr),
            description: cleanDescription,
            amount: parseFloat(cleanAmount),
            category: categorizeTransaction(cleanDescription),
            accountId: 1,
            selected: true,
          });
        }
      }
    }
  }

  // Remove duplicates based on date, description, and amount
  const uniqueTransactions = transactions.filter(
    (transaction, index, self) =>
      index ===
      self.findIndex(
        (t) =>
          t.date.getTime() === transaction.date.getTime() &&
          t.description === transaction.description &&
          t.amount === transaction.amount
      )
  );

  console.log(`Found ${uniqueTransactions.length} transactions`);
  return uniqueTransactions;
};

// Parse date string to Date object
const parseDate = (dateStr) => {
  try {
    // Handle MM/DD/YYYY format
    const [month, day, year] = dateStr.split("/");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } catch {
    console.error("Error parsing date:", dateStr);
    return new Date();
  }
};

// Categorize transaction based on description
const categorizeTransaction = (description) => {
  const desc = description.toLowerCase();

  // Groceries
  if (
    desc.includes("grocery") ||
    desc.includes("supermarket") ||
    desc.includes("food") ||
    desc.includes("market")
  ) {
    return "Groceries";
  }

  // Restaurants
  if (
    desc.includes("restaurant") ||
    desc.includes("cafe") ||
    desc.includes("dining") ||
    desc.includes("pizza") ||
    desc.includes("burger")
  ) {
    return "Restaurants";
  }

  // Transport
  if (
    desc.includes("gas") ||
    desc.includes("fuel") ||
    desc.includes("uber") ||
    desc.includes("lyft") ||
    desc.includes("taxi") ||
    desc.includes("parking")
  ) {
    return "Transport";
  }

  // Utilities
  if (
    desc.includes("electric") ||
    desc.includes("water") ||
    desc.includes("gas") ||
    desc.includes("internet") ||
    desc.includes("phone")
  ) {
    return "Utilities";
  }

  // Shopping
  if (
    desc.includes("amazon") ||
    desc.includes("walmart") ||
    desc.includes("target") ||
    desc.includes("shop") ||
    desc.includes("store")
  ) {
    return "Shopping";
  }

  // Income
  if (
    desc.includes("deposit") ||
    desc.includes("salary") ||
    desc.includes("payroll") ||
    desc.includes("income")
  ) {
    return "Income";
  }

  // Entertainment
  if (
    desc.includes("netflix") ||
    desc.includes("spotify") ||
    desc.includes("movie") ||
    desc.includes("theater") ||
    desc.includes("game")
  ) {
    return "Entertainment";
  }

  // Healthcare
  if (
    desc.includes("pharmacy") ||
    desc.includes("medical") ||
    desc.includes("doctor") ||
    desc.includes("hospital")
  ) {
    return "Healthcare";
  }

  return "Other";
};
