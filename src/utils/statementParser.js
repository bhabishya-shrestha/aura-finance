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

// Validate PDF file before processing
const validatePDFFile = (file) => {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(
      "PDF file is too large. Please upload a file smaller than 10MB."
    );
  }

  // Check file type
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("Invalid file type. Please upload a valid PDF file.");
  }

  // Check if file is empty
  if (file.size === 0) {
    throw new Error("PDF file is empty. Please upload a valid PDF file.");
  }
};

// Parse PDF files (optimized for Bank of America statements)
export const parsePDF = async (file) => {
  try {
    // Validate the PDF file first
    validatePDFFile(file);

    // Show loading state
    if (import.meta.env.DEV) {
      console.log("Starting PDF validation and OCR processing...");
    }

    // Perform OCR on the PDF with improved settings
    const result = await Tesseract.recognize(file, "eng", {
      logger: (m) => {
        if (import.meta.env.DEV) {
          console.log(m);
        }
      },
      // Improved OCR settings for better accuracy
      tessedit_char_whitelist:
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,$()-/ ",
      tessedit_pageseg_mode: "6", // Uniform block of text
      preserve_interword_spaces: "1",
    });

    if (import.meta.env.DEV) {
      console.log("OCR completed, parsing text...");
      console.log("Extracted text length:", result.data.text.length);
    }

    // Validate that we got meaningful text
    if (!result.data.text || result.data.text.trim().length < 100) {
      throw new Error(
        "Unable to extract meaningful text from PDF. Please ensure the PDF contains readable text and is not password-protected."
      );
    }

    // Parse the OCR text for Bank of America statement structure
    const transactions = parseBankOfAmericaText(result.data.text);

    // Validate that we found transactions
    if (transactions.length === 0) {
      throw new Error(
        "No transactions found in the PDF. Please ensure this is a valid bank statement with transaction data."
      );
    }

    return transactions;
  } catch (error) {
    // Enhanced error handling
    if (import.meta.env.DEV) {
      console.error("Error parsing PDF:", error);
    }

    // Provide more specific error messages
    if (error.message.includes("Unable to extract")) {
      throw new Error(
        "PDF parsing failed: Unable to extract text. Please ensure the PDF is not password-protected and contains readable text."
      );
    } else if (error.message.includes("No transactions found")) {
      throw new Error(
        "No transactions found in the PDF. Please ensure this is a valid bank statement with transaction data."
      );
    } else if (error.message.includes("too large")) {
      throw error; // Re-throw size validation errors
    } else if (error.message.includes("Invalid file type")) {
      throw error; // Re-throw file type validation errors
    } else {
      throw new Error(
        "Failed to parse PDF file. Please ensure it's a valid bank statement and try again."
      );
    }
  }
};

// Parse Bank of America statement text with improved patterns
const parseBankOfAmericaText = (text) => {
  const transactions = [];
  const lines = text.split("\n").filter((line) => line.trim());

  // Enhanced transaction patterns for better matching
  const transactionPatterns = [
    // Standard Bank of America pattern: MM/DD/YYYY Description $Amount
    /(\d{1,2}\/\d{1,2}\/\d{4})\s+([^$]+?)\s+([-]?\$[\d,]+\.\d{2})/g,
    // Alternative pattern with different spacing
    /(\d{1,2}\/\d{1,2}\/\d{4})\s+([^$]+?)\s+([-]?\$[\d,]+\.\d{2})/g,
    // Pattern for amounts without dollar sign
    /(\d{1,2}\/\d{1,2}\/\d{4})\s+([^0-9]+?)\s+([-]?[\d,]+\.\d{2})/g,
    // Pattern for different date formats
    /(\d{1,2}-\d{1,2}-\d{4})\s+([^$]+?)\s+([-]?\$[\d,]+\.\d{2})/g,
  ];

  let transactionId = Date.now();

  // Look for transaction sections with more flexible matching
  const sections = [
    "Purchases and Adjustments",
    "Payments and Other Credits",
    "Transactions",
    "Activity",
    "Checking Account Activity",
    "Account Activity",
    "Recent Transactions",
  ];

  let inTransactionSection = false;

  // First pass: Find transaction sections
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if we're entering a transaction section
    if (
      sections.some((section) =>
        line.toLowerCase().includes(section.toLowerCase())
      )
    ) {
      inTransactionSection = true;
      continue;
    }

    // Check if we're leaving a transaction section
    if (
      inTransactionSection &&
      (line.toLowerCase().includes("total") ||
        line.toLowerCase().includes("summary") ||
        line.toLowerCase().includes("balance") ||
        line.toLowerCase().includes("ending balance"))
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

          // Enhanced validation
          if (
            cleanDescription.length > 3 &&
            !isNaN(parseFloat(cleanAmount)) &&
            parseFloat(cleanAmount) !== 0 &&
            isValidDate(dateStr)
          ) {
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
    if (import.meta.env.DEV) {
      console.log(
        "No transactions found in sections, trying full text parsing..."
      );
    }

    for (const pattern of transactionPatterns) {
      const matches = [...text.matchAll(pattern)];

      for (const match of matches) {
        const [, dateStr, description, amountStr] = match;

        const cleanDescription = description.trim().replace(/\s+/g, " ");
        const cleanAmount = amountStr.replace(/[$,]/g, "");

        if (
          cleanDescription.length > 3 &&
          !isNaN(parseFloat(cleanAmount)) &&
          parseFloat(cleanAmount) !== 0 &&
          isValidDate(dateStr)
        ) {
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

  if (import.meta.env.DEV) {
    console.log(`Found ${uniqueTransactions.length} transactions`);
  }

  return uniqueTransactions;
};

// Validate date string
const isValidDate = (dateStr) => {
  try {
    const parsed = parseDate(dateStr);
    return (
      !isNaN(parsed.getTime()) &&
      parsed.getFullYear() > 2000 &&
      parsed.getFullYear() < 2030
    );
  } catch {
    return false;
  }
};

// Parse date string to Date object with improved error handling
const parseDate = (dateStr) => {
  try {
    // Handle MM/DD/YYYY format
    if (dateStr.includes("/")) {
      const [month, day, year] = dateStr.split("/");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Handle MM-DD-YYYY format
    if (dateStr.includes("-")) {
      const [month, day, year] = dateStr.split("-");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    throw new Error("Unsupported date format");
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error parsing date:", dateStr, error);
    }
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
    desc.includes("market") ||
    desc.includes("safeway") ||
    desc.includes("kroger") ||
    desc.includes("whole foods") ||
    desc.includes("trader joe")
  ) {
    return "Groceries";
  }

  // Restaurants
  if (
    desc.includes("restaurant") ||
    desc.includes("cafe") ||
    desc.includes("dining") ||
    desc.includes("pizza") ||
    desc.includes("burger") ||
    desc.includes("mcdonald") ||
    desc.includes("starbucks") ||
    desc.includes("subway")
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
    desc.includes("parking") ||
    desc.includes("shell") ||
    desc.includes("exxon") ||
    desc.includes("chevron")
  ) {
    return "Transport";
  }

  // Utilities
  if (
    desc.includes("electric") ||
    desc.includes("water") ||
    desc.includes("gas") ||
    desc.includes("internet") ||
    desc.includes("phone") ||
    desc.includes("at&t") ||
    desc.includes("verizon") ||
    desc.includes("comcast")
  ) {
    return "Utilities";
  }

  // Shopping
  if (
    desc.includes("amazon") ||
    desc.includes("walmart") ||
    desc.includes("target") ||
    desc.includes("shop") ||
    desc.includes("store") ||
    desc.includes("best buy") ||
    desc.includes("home depot") ||
    desc.includes("lowes")
  ) {
    return "Shopping";
  }

  // Income
  if (
    desc.includes("deposit") ||
    desc.includes("salary") ||
    desc.includes("payroll") ||
    desc.includes("income") ||
    desc.includes("direct deposit") ||
    desc.includes("transfer in")
  ) {
    return "Income";
  }

  // Entertainment
  if (
    desc.includes("netflix") ||
    desc.includes("spotify") ||
    desc.includes("movie") ||
    desc.includes("theater") ||
    desc.includes("game") ||
    desc.includes("hulu") ||
    desc.includes("disney") ||
    desc.includes("youtube")
  ) {
    return "Entertainment";
  }

  // Healthcare
  if (
    desc.includes("pharmacy") ||
    desc.includes("medical") ||
    desc.includes("doctor") ||
    desc.includes("hospital") ||
    desc.includes("cvs") ||
    desc.includes("walgreens") ||
    desc.includes("rite aid")
  ) {
    return "Healthcare";
  }

  return "Other";
};
