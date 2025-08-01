import Papa from "papaparse";

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
  "Housing",
  "Other",
];

// Parse CSV files with enhanced error handling
export const parseCSV = file => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        try {
          if (results.errors && results.errors.length > 0) {
            throw new Error(
              `CSV parsing errors: ${results.errors.map(e => e.message).join(", ")}`
            );
          }

          const transactions = results.data
            .filter(row => row && Object.keys(row).length > 0) // Filter out empty rows
            .map((row, index) => {
              // Handle different CSV formats with more flexible field matching
              const date =
                row.Date ||
                row.date ||
                row.DATE ||
                row.Date ||
                row.TransactionDate ||
                row.transaction_date;
              const description =
                row.Description ||
                row.description ||
                row.DESC ||
                row.Description ||
                row.Memo ||
                row.memo ||
                row.Note ||
                row.note;
              const amount =
                row.Amount ||
                row.amount ||
                row.AMOUNT ||
                row.Amount ||
                row.TransactionAmount ||
                row.transaction_amount;

              if (!date || !description || !amount) {
                throw new Error(
                  `Missing required fields in row ${index + 1}. Found: date=${!!date}, description=${!!description}, amount=${!!amount}`
                );
              }

              // Clean and validate amount
              const cleanAmount = amount.toString().replace(/[$,]/g, "");
              const parsedAmount = parseFloat(cleanAmount);

              if (isNaN(parsedAmount)) {
                throw new Error(
                  `Invalid amount format in row ${index + 1}: ${amount}`
                );
              }

              // Parse date with better error handling
              let parsedDate;
              try {
                parsedDate = new Date(date);
                if (isNaN(parsedDate.getTime())) {
                  throw new Error("Invalid date");
                }
              } catch (dateError) {
                throw new Error(
                  `Invalid date format in row ${index + 1}: ${date}`
                );
              }

              return {
                id: Date.now() + index,
                date: parsedDate,
                description: description.trim(),
                amount: parsedAmount,
                category: categorizeTransaction(description.trim()),
                accountId: 1,
                selected: true,
                type: parsedAmount > 0 ? "income" : "expense",
                source: "csv-import",
              };
            });

          if (transactions.length === 0) {
            throw new Error(
              "No valid transactions found in CSV file. Please check the file format."
            );
          }

          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      },
      error: error => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
};

// Enhanced transaction categorization
const categorizeTransaction = description => {
  if (!description || typeof description !== "string") {
    return "Other";
  }

  const desc = description.toLowerCase();

  // Enhanced categorization with more merchants and patterns
  const categories = {
    Groceries: [
      "grocery",
      "supermarket",
      "food",
      "market",
      "safeway",
      "kroger",
      "whole foods",
      "trader joe",
      "walmart",
      "target",
      "costco",
      "sams club",
      "albertsons",
      "publix",
      "wegmans",
      "shoprite",
      "stop & shop",
    ],
    Restaurants: [
      "restaurant",
      "cafe",
      "dining",
      "pizza",
      "burger",
      "mcdonald",
      "starbucks",
      "subway",
      "chipotle",
      "panera",
      "olive garden",
      "applebees",
      "chili",
      "taco bell",
      "kfc",
      "dominos",
      "papa johns",
    ],
    Transport: [
      "gas",
      "fuel",
      "uber",
      "lyft",
      "taxi",
      "parking",
      "shell",
      "exxon",
      "chevron",
      "bp",
      "mobil",
      "valero",
      "speedway",
      "public transit",
      "metro",
      "bus",
      "train",
      "airline",
      "delta",
      "united",
    ],
    Utilities: [
      "electric",
      "water",
      "internet",
      "phone",
      "at&t",
      "verizon",
      "comcast",
      "spectrum",
      "cox",
      "xfinity",
      "gas company",
      "utility",
    ],
    Shopping: [
      "amazon",
      "target",
      "shop",
      "store",
      "best buy",
      "home depot",
      "lowes",
      "macy",
      "nordstrom",
      "kohl",
      "marshalls",
      "tj maxx",
      "ross",
      "burlington",
      "old navy",
      "gap",
      "h&m",
      "zara",
    ],
    Income: [
      "deposit",
      "salary",
      "payroll",
      "income",
      "direct deposit",
      "transfer in",
      "refund",
      "reimbursement",
      "bonus",
      "commission",
    ],
    Entertainment: [
      "netflix",
      "spotify",
      "movie",
      "theater",
      "game",
      "hulu",
      "disney",
      "youtube",
      "prime",
      "hbo",
      "peacock",
      "paramount",
      "concert",
      "show",
      "ticket",
      "amazon prime",
    ],
    Healthcare: [
      "pharmacy",
      "medical",
      "doctor",
      "hospital",
      "cvs",
      "walgreens",
      "rite aid",
      "insurance",
      "copay",
      "deductible",
      "prescription",
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
    ],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return category;
    }
  }

  return "Other";
};

// Main function to parse statements (CSV only - PDF and images handled by Gemini)
export const parseStatement = async file => {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    if (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) {
      return await parseCSV(file);
    } else {
      throw new Error(
        "This parser only handles CSV files. For PDF and image files, please use the AI-powered import feature."
      );
    }
  } catch (error) {
    // Provide user-friendly error messages
    if (error.message.includes("Missing required fields")) {
      throw new Error(
        "CSV format error: Please ensure your CSV file has columns for Date, Description, and Amount."
      );
    } else if (error.message.includes("Invalid amount format")) {
      throw new Error(
        "Amount format error: Please ensure amounts are numeric values (e.g., 123.45 or -123.45)."
      );
    } else if (error.message.includes("Invalid date format")) {
      throw new Error(
        "Date format error: Please ensure dates are in a recognizable format (e.g., MM/DD/YYYY or YYYY-MM-DD)."
      );
    } else if (error.message.includes("No valid transactions")) {
      throw new Error(
        "No transactions found: Please check that your CSV file contains valid transaction data."
      );
    } else {
      // Re-throw the original error if it's already user-friendly
      throw error;
    }
  }
};
