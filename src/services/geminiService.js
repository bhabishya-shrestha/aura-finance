// Enhanced Gemini API service for professional document analysis
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

class GeminiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.dailyRequestCount = 0;
    this.lastDailyReset = new Date().toDateString();
    this.rateLimit = {
      maxRequests: 15, // Keep 15 per minute (matches Gemini free tier)
      timeWindow: 60000, // 1 minute in milliseconds
      maxDailyRequests: 150, // Daily limit for demo (100-150 range)
    };

    if (!this.apiKey) {
      // Gemini API key not found - AI features will be disabled
    }
  }

  // Rate limiting check
  checkRateLimit() {
    const now = Date.now();
    const today = new Date().toDateString();

    // Reset daily counter if it's a new day
    if (today !== this.lastDailyReset) {
      this.dailyRequestCount = 0;
      this.lastDailyReset = today;
    }

    // Reset minute counter if time window has passed
    if (now - this.lastRequestTime > this.rateLimit.timeWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    // Check daily limit
    if (this.dailyRequestCount >= this.rateLimit.maxDailyRequests) {
      throw new Error(
        `Daily limit exceeded. Maximum ${this.rateLimit.maxDailyRequests} requests per day allowed.`
      );
    }

    // Check minute limit
    if (this.requestCount >= this.rateLimit.maxRequests) {
      throw new Error(
        `Rate limit exceeded. Maximum ${this.rateLimit.maxRequests} requests per minute allowed.`
      );
    }

    this.requestCount++;
    this.dailyRequestCount++;
  }

  // Enhanced file validation with better error messages
  validateFile(file) {
    const maxSize = 20 * 1024 * 1024; // Increased to 20MB for better support
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
      "text/csv",
    ];

    if (file.size > maxSize) {
      throw new Error("File size too large. Maximum 20MB allowed.");
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "File type not supported. Please upload an image (JPG, PNG, GIF, WebP, HEIC) or PDF."
      );
    }
  }

  // Convert file to base64 with better error handling
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        try {
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        } catch (error) {
          reject(new Error("Failed to process file. Please try again."));
        }
      };
      reader.onerror = error =>
        reject(new Error("Failed to read file. Please try again."));
    });
  }

  // Get MIME type for file with enhanced support
  getMimeType(file) {
    if (file.type) {
      return file.type;
    }

    // Fallback based on file extension
    const extension = file.name.split(".").pop().toLowerCase();
    const mimeTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      heic: "image/heic",
      heif: "image/heif",
      pdf: "application/pdf",
      csv: "text/csv",
    };

    return mimeTypes[extension] || "image/jpeg";
  }

  // Enhanced document analysis with professional-grade prompts
  async analyzeImage(file) {
    if (!this.apiKey) {
      return {
        documentType: "Unknown",
        source: "Manual Entry Required",
        transactions: [],
        confidence: "low",
        notes:
          "AI analysis is disabled. Please manually enter transaction details.",
        error: "API_KEY_MISSING",
      };
    }

    // Apply security checks
    this.checkRateLimit();
    this.validateFile(file);

    try {
      const base64Data = await this.fileToBase64(file);
      const mimeType = this.getMimeType(file);

      // Professional-grade prompt for financial document analysis
      const prompt = `You are a professional financial document analyzer. Analyze this document and extract all financial transaction information with high accuracy.

DOCUMENT ANALYSIS INSTRUCTIONS:

1. **Document Type Identification**: First, identify the type of document:
   - Bank Statement (checking, savings, credit card)
   - Receipt (retail, restaurant, service)
   - Invoice (business, personal)
   - Credit Card Statement
   - Investment Statement
   - Other financial document

2. **Transaction Extraction**: Extract ALL transactions with the following details:
   - Date (YYYY-MM-DD format)
   - Description/Merchant name
   - Amount (positive for income, negative for expenses)
   - Transaction type (income/expense)
   - Category (if identifiable)

3. **Data Quality**: Ensure:
   - All amounts are numeric values
   - Dates are in valid format
   - Descriptions are meaningful and complete
   - No duplicate transactions

4. **Special Handling**:
   - For bank statements: Look for transaction lists, activity sections
   - For receipts: Extract line items and totals
   - For invoices: Include tax, fees, and line items
   - Handle multiple currencies if present
   - Preserve transaction order

RESPONSE FORMAT (JSON only):
{
  "documentType": "string (e.g., 'Bank Statement', 'Receipt', 'Invoice')",
  "source": "string (e.g., 'Bank of America', 'Walmart', 'Netflix')",
  "confidence": "high|medium|low",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "string",
      "amount": number (positive for income, negative for expense),
      "type": "income|expense",
      "category": "string (optional)"
    }
  ],
  "summary": {
    "totalIncome": number,
    "totalExpenses": number,
    "netAmount": number,
    "transactionCount": number
  },
  "notes": "string (any important observations or warnings)",
  "processingQuality": "excellent|good|fair|poor"
}

IMPORTANT: Return ONLY valid JSON. Do not include any explanatory text outside the JSON structure.`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent results
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096, // Increased for better responses
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Gemini API error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();

      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content
      ) {
        throw new Error("Invalid response from Gemini API");
      }

      const responseText = data.candidates[0].content.parts[0].text;

      // Enhanced JSON parsing with better error handling
      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResponse = JSON.parse(jsonMatch[0]);

          // Validate the response structure
          if (
            !parsedResponse.transactions ||
            !Array.isArray(parsedResponse.transactions)
          ) {
            throw new Error("Invalid response structure from AI analysis");
          }

          return parsedResponse;
        }
      } catch (parseError) {
        // If JSON parsing fails, try to extract information from text
        return this.extractFromText(responseText);
      }

      // Fallback: return structured data from text
      return this.extractFromText(responseText);
    } catch (error) {
      throw new Error(`Failed to analyze document: ${error.message}`);
    }
  }

  // Fallback method to extract information from text when JSON parsing fails
  extractFromText(text) {
    const lines = text.split("\n").filter(line => line.trim());
    const transactions = [];

    // Simple pattern matching for common transaction formats
    const patterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+([^$]+?)\s+([-]?\$?[\d,]+\.?\d*)/gi,
      /(\d{1,2}-\d{1,2}-\d{4})\s+([^$]+?)\s+([-]?\$?[\d,]+\.?\d*)/gi,
      /([A-Za-z]{3}\s+\d{1,2},?\s+\d{4})\s+([^$]+?)\s+([-]?\$?[\d,]+\.?\d*)/gi,
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const matches = [...line.matchAll(pattern)];
        for (const match of matches) {
          const [, dateStr, description, amountStr] = match;

          try {
            const cleanAmount = parseFloat(amountStr.replace(/[$,]/g, ""));
            const date = this.parseDate(dateStr);

            if (!isNaN(cleanAmount) && cleanAmount !== 0 && date) {
              transactions.push({
                date: date.toISOString().split("T")[0],
                description: description.trim(),
                amount: cleanAmount,
                type: cleanAmount > 0 ? "income" : "expense",
                category: this.categorizeTransaction(description.trim()),
              });
            }
          } catch (error) {
            // Skip invalid entries
            continue;
          }
        }
      }
    }

    return {
      documentType: "Unknown",
      source: "Text Analysis",
      transactions: transactions,
      confidence: "low",
      notes: "Extracted using text analysis fallback method",
      processingQuality: "fair",
    };
  }

  // Enhanced date parsing
  parseDate(dateStr) {
    try {
      // Handle various date formats
      if (dateStr.includes("/")) {
        const [month, day, year] = dateStr.split("/");
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      if (dateStr.includes("-")) {
        const [month, day, year] = dateStr.split("-");
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Handle "Jan 15, 2024" format
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Enhanced transaction categorization
  categorizeTransaction(description) {
    if (!description) return "Other";

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
  }

  // Enhanced conversion to transaction format
  convertToTransactions(geminiResponse) {
    if (
      !geminiResponse.transactions ||
      !Array.isArray(geminiResponse.transactions)
    ) {
      return [];
    }

    return geminiResponse.transactions.map((transaction, index) => ({
      id: Date.now() + index,
      date: new Date(transaction.date || new Date()),
      description: transaction.description || "Unknown transaction",
      amount: parseFloat(transaction.amount) || 0,
      category:
        transaction.category ||
        this.categorizeTransaction(transaction.description),
      accountId: 1,
      selected: true,
      type: transaction.type === "income" ? "income" : "expense",
      source: "gemini-ocr",
      confidence: geminiResponse.confidence || "low",
      processingQuality: geminiResponse.processingQuality || "fair",
      documentType: geminiResponse.documentType || "Unknown",
      originalSource: geminiResponse.source || "Unknown",
    }));
  }

  // Get processing summary for user feedback
  getProcessingSummary(geminiResponse) {
    const transactionCount = geminiResponse.transactions?.length || 0;
    const confidence = geminiResponse.confidence || "low";
    const quality = geminiResponse.processingQuality || "fair";

    return {
      transactionCount,
      confidence,
      quality,
      documentType: geminiResponse.documentType || "Unknown",
      source: geminiResponse.source || "Unknown",
      notes: geminiResponse.notes || "",
      summary: geminiResponse.summary || null,
    };
  }
}

export default new GeminiService();
