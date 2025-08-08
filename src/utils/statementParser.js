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

// Parse CSV files with enhanced error handling and smart date parsing
export const parseCSV = (file, options = {}) => {
  const {
    userSpecifiedYear = null,
    statementStartDate = null,
    statementEndDate = null,
    allowFutureDates = false,
  } = options;

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

              // Parse date with smart detection and user control
              let parsedDate;
              try {
                parsedDate = parseDateWithContext(date, {
                  userSpecifiedYear,
                  statementStartDate,
                  statementEndDate,
                  allowFutureDates,
                });
              } catch (dateError) {
                throw new Error(
                  `Invalid date format in row ${index + 1}: ${date} - ${dateError.message}`
                );
              }

              return {
                id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                date: parsedDate,
                description: description.trim(),
                amount: parsedAmount,
                category: categorizeTransaction(description.trim()),
                accountId: null, // Will be assigned during account assignment
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

// Professional date parsing with smart detection and user control
const parseDateWithContext = (dateStr, options = {}) => {
  const {
    defaultYear = new Date().getFullYear(),
    userSpecifiedYear = null,
    statementStartDate = null,
    statementEndDate = null,
    allowFutureDates = false,
  } = options;

  try {
    // If user specified a year, use it
    if (userSpecifiedYear) {
      return parseDateWithYear(dateStr, userSpecifiedYear);
    }

    // Handle various date formats
    let parsedDate = null;

    // Format: MM/DD or MM/DD/YY or MM/DD/YYYY
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");

      if (parts.length === 2) {
        // MM/DD format - ambiguous year
        const month = parseInt(parts[0]) - 1; // 0-based month
        const day = parseInt(parts[1]);

        // Smart year detection based on context
        const detectedYear = detectYearFromContext(month, day, {
          defaultYear,
          statementStartDate,
          statementEndDate,
          allowFutureDates,
        });

        parsedDate = new Date(detectedYear, month, day);
      } else if (parts.length === 3) {
        // MM/DD/YY or MM/DD/YYYY format
        const month = parseInt(parts[0]) - 1;
        const day = parseInt(parts[1]);
        const yearPart = parts[2];

        let year;
        if (yearPart.length === 2) {
          // YY format - convert to YYYY
          const shortYear = parseInt(yearPart);
          year = shortYear >= 50 ? 1900 + shortYear : 2000 + shortYear;
        } else {
          // YYYY format
          year = parseInt(yearPart);
        }

        parsedDate = new Date(year, month, day);
      }
    }

    // Format: MM-DD or MM-DD-YY or MM-DD-YYYY
    else if (dateStr.includes("-")) {
      const parts = dateStr.split("-");

      if (parts.length === 2) {
        // MM-DD format - ambiguous year
        const month = parseInt(parts[0]) - 1;
        const day = parseInt(parts[1]);

        const detectedYear = detectYearFromContext(month, day, {
          defaultYear,
          statementStartDate,
          statementEndDate,
          allowFutureDates,
        });

        parsedDate = new Date(detectedYear, month, day);
      } else if (parts.length === 3) {
        // MM-DD-YY or MM-DD-YYYY format
        const month = parseInt(parts[0]) - 1;
        const day = parseInt(parts[1]);
        const yearPart = parts[2];

        let year;
        if (yearPart.length === 2) {
          const shortYear = parseInt(yearPart);
          year = shortYear >= 50 ? 1900 + shortYear : 2000 + shortYear;
        } else {
          year = parseInt(yearPart);
        }

        parsedDate = new Date(year, month, day);
      }
    }

    // Format: "Jan 15, 2024" or "January 15, 2024"
    else {
      parsedDate = new Date(dateStr);
    }

    // Validate the parsed date
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    // Additional validation based on context
    if (statementStartDate && statementEndDate) {
      if (parsedDate < statementStartDate || parsedDate > statementEndDate) {
        // console.warn(
        //   `Date ${parsedDate.toISOString()} is outside statement period ${statementStartDate.toISOString()} - ${statementEndDate.toISOString()}`
        // );
      }
    }

    if (!allowFutureDates && parsedDate > new Date()) {
      // console.warn(`Future date detected: ${parsedDate.toISOString()}`);
    }

    return parsedDate;
  } catch (error) {
    throw new Error(`Failed to parse date '${dateStr}': ${error.message}`);
  }
};

// Smart year detection based on context
const detectYearFromContext = (month, day, context) => {
  const {
    defaultYear,
    statementStartDate,
    statementEndDate,
    allowFutureDates,
  } = context;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // Try the default year first
  let testDate = new Date(defaultYear, month, day);

  // If statement dates are provided, use them as primary context
  if (statementStartDate && statementEndDate) {
    const statementStartYear = statementStartDate.getFullYear();
    const statementEndYear = statementEndDate.getFullYear();

    // Try statement start year
    testDate = new Date(statementStartYear, month, day);
    if (testDate >= statementStartDate && testDate <= statementEndDate) {
      return statementStartYear;
    }

    // Try statement end year
    testDate = new Date(statementEndYear, month, day);
    if (testDate >= statementStartDate && testDate <= statementEndDate) {
      return statementEndYear;
    }

    // Try previous year if within reasonable range
    const prevYear = statementStartYear - 1;
    testDate = new Date(prevYear, month, day);
    if (testDate >= new Date(prevYear, 0, 1) && testDate <= statementEndDate) {
      return prevYear;
    }
  }

  // Fallback logic based on current date
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  // If the date is in the future relative to current date, use previous year
  if (month > currentMonth || (month === currentMonth && day > currentDay)) {
    if (!allowFutureDates) {
      return defaultYear - 1;
    }
  }

  // If the date is more than 6 months in the past, it's likely from current year
  // (for recent transactions)
  const sixMonthsAgo = new Date(currentYear, currentMonth - 6, currentDay);
  testDate = new Date(defaultYear, month, day);

  if (testDate < sixMonthsAgo) {
    return defaultYear;
  }

  return defaultYear;
};

// Parse date with explicit year
const parseDateWithYear = (dateStr, year) => {
  // Remove year if present and replace with specified year
  const dateWithoutYear = dateStr
    .replace(/\/(\d{2}|\d{4})$/, "")
    .replace(/-(\d{2}|\d{4})$/, "");

  if (dateWithoutYear.includes("/")) {
    const [month, day] = dateWithoutYear.split("/");
    return new Date(year, parseInt(month) - 1, parseInt(day));
  } else if (dateWithoutYear.includes("-")) {
    const [month, day] = dateWithoutYear.split("-");
    return new Date(year, parseInt(month) - 1, parseInt(day));
  }

  throw new Error(`Cannot parse date format: ${dateStr}`);
};

// Main function to parse statements (CSV only - PDF and images handled by Gemini)
export const parseStatement = async (file, options = {}) => {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    if (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) {
      return await parseCSV(file, options);
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
        "Date format error: Please ensure dates are in a recognizable format (e.g., MM/DD/YYYY or MM/DD). For ambiguous dates like '06/21', you can specify the year in the import options."
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
