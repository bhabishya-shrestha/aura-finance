// Enhanced Vertex AI service for professional document analysis
import { PredictionServiceClient } from "@google-cloud/aiplatform";

class VertexAiService {
  constructor() {
    this.projectId = import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID;
    this.location = import.meta.env.VITE_GOOGLE_CLOUD_LOCATION || "us-central1";
    this.modelId =
      import.meta.env.VITE_VERTEX_AI_MODEL_ID || "gemini-1.5-flash-001";
    this.endpointId = import.meta.env.VITE_VERTEX_AI_ENDPOINT_ID;

    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.dailyRequestCount = 0;
    this.lastDailyReset = new Date().toDateString();

    // Vertex AI has much higher rate limits than the free Generative Language API
    this.rateLimit = {
      maxRequests: 60, // 60 per minute (much higher than Gemini free tier)
      timeWindow: 60000, // 1 minute in milliseconds
      maxDailyRequests: 1000, // Much higher daily limit
    };

    // Initialize the client if credentials are available
    if (this.projectId) {
      try {
        this.client = new PredictionServiceClient({
          projectId: this.projectId,
          location: this.location,
        });
      } catch (error) {
        console.warn("Failed to initialize Vertex AI client:", error);
      }
    }
  }

  // Rate limiting check with higher limits
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
    const maxSize = 20 * 1024 * 1024; // 20MB for better support
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
      reader.onerror = () =>
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
    if (!this.client || !this.projectId) {
      return {
        documentType: "Unknown",
        source: "Manual Entry Required",
        transactions: [],
        confidence: "low",
        notes:
          "Vertex AI is not configured. Please set up Google Cloud credentials.",
        error: "VERTEX_AI_NOT_CONFIGURED",
      };
    }

    // Apply security checks
    this.checkRateLimit();
    this.validateFile(file);

    try {
      const base64Data = await this.fileToBase64(file);
      const mimeType = this.getMimeType(file);

      // Professional-grade prompt for financial document analysis with enhanced account detection
      const prompt = `You are a professional financial document analyzer. Analyze this document and extract all financial transaction information with high accuracy, including account information.

DOCUMENT ANALYSIS INSTRUCTIONS:

1. **Document Type Identification**: First, identify the type of document:
   - Bank Statement (checking, savings, credit card)
   - Receipt (retail, restaurant, service)
   - Invoice (business, personal)
   - Credit Card Statement
   - Investment Statement
   - Other financial document

2. **Account Information Detection**: Extract account details:
   - Bank/Institution name (from logos, headers, or text)
   - Account type (checking, savings, credit, investment, loan)
   - Account number (if visible, mask sensitive parts)
   - Account holder name (if present)
   - Statement period or date range
   
   IMPORTANT: For account type detection, look for:
   - "Checking" or "Checking Account" → accountType: "checking"
   - "Savings" or "Savings Account" → accountType: "savings"
   - "Credit Card" or "Credit" → accountType: "credit"
   - "Investment" or "Brokerage" → accountType: "investment"
   - "Loan" or "Mortgage" → accountType: "loan"

3. **Transaction Extraction**: Extract ALL transactions with the following details:
   - Date (YYYY-MM-DD format)
   - Description/Merchant name
   - Amount (positive for income, negative for expenses)
   - Transaction type (income/expense)
   - Category (if identifiable)

4. **Data Quality**: Ensure:
   - All amounts are numeric values
   - Dates are in valid format
   - Descriptions are meaningful and complete
   - No duplicate transactions

5. **Special Handling**:
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
  "accountInfo": {
    "institution": "string (bank or financial institution name)",
    "accountType": "string (checking, savings, credit, investment, loan)",
    "accountName": "string (suggested account name based on institution and type)",
    "accountNumber": "string (masked if visible, otherwise null)",
    "statementPeriod": "string (if available)",
    "confidence": "number (0-1, confidence in account detection)"
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "string",
      "amount": number (positive for income, negative for expense),
      "type": "income|expense",
      "category": "string (optional)",
      "suggestedAccount": "string (suggested account name based on transaction patterns)"
    }
  ],
  "summary": {
    "totalIncome": number,
    "totalExpenses": number,
    "netAmount": number,
    "transactionCount": number,
    "accountSuggestions": [
      {
        "name": "string (suggested account name based on institution and type, e.g., 'Chase Checking', 'Bank of America Savings')",
        "type": "string (checking, savings, credit, investment, loan)",
        "reason": "string (why this account is suggested)",
        "confidence": "number (0-1)"
      }
    ]
  },
  "notes": "string (any important observations or warnings)",
  "processingQuality": "excellent|good|fair|poor"
}

ACCOUNT DETECTION GUIDELINES:
- Look for bank names, institution logos, or account numbers
- Analyze transaction patterns to suggest account types
- Use institution names to suggest account names (e.g., "Chase Checking", "Bank of America Savings")
- Consider transaction amounts and frequency for account type detection
- Provide multiple account suggestions with confidence scores

IMPORTANT: Return ONLY valid JSON. Do not include any explanatory text outside the JSON structure.`;

      // Prepare the request for Vertex AI
      const endpoint = this.client.endpointPath(
        this.projectId,
        this.location,
        this.endpointId
      );

      const request = {
        endpoint,
        instances: [
          {
            prompt: prompt,
            image: {
              bytesBase64Encoded: base64Data,
              mimeType: mimeType,
            },
          },
        ],
        parameters: {
          temperature: 0.1, // Low temperature for consistent results
          maxOutputTokens: 4096, // Increased for better responses
          topK: 32,
          topP: 1,
        },
      };

      const [response] = await this.client.predict(request);

      if (!response.predictions || !response.predictions[0]) {
        throw new Error("Invalid response from Vertex AI");
      }

      const responseText = response.predictions[0].content;

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

  // Enhanced conversion to transaction format with account information
  convertToTransactions(vertexResponse) {
    if (
      !vertexResponse.transactions ||
      !Array.isArray(vertexResponse.transactions)
    ) {
      return [];
    }

    return vertexResponse.transactions.map((transaction, index) => ({
      id: Date.now() + index,
      date: new Date(transaction.date || new Date()),
      description: transaction.description || "Unknown transaction",
      amount: parseFloat(transaction.amount) || 0,
      category:
        transaction.category ||
        this.categorizeTransaction(transaction.description),
      accountId: null, // Will be assigned during account assignment
      selected: true,
      type: transaction.type === "income" ? "income" : "expense",
      source: "vertex-ai-ocr",
      confidence: vertexResponse.confidence || "low",
      processingQuality: vertexResponse.processingQuality || "fair",
      documentType: vertexResponse.documentType || "Unknown",
      originalSource: vertexResponse.source || "Unknown",
      // Enhanced account information
      suggestedAccount: transaction.suggestedAccount || null,
      accountInfo: vertexResponse.accountInfo || null,
    }));
  }

  // Get processing summary for user feedback with account information
  getProcessingSummary(vertexResponse) {
    const transactionCount = vertexResponse.transactions?.length || 0;
    const confidence = vertexResponse.confidence || "low";
    const quality = vertexResponse.processingQuality || "fair";

    return {
      transactionCount,
      confidence,
      quality,
      documentType: vertexResponse.documentType || "Unknown",
      source: vertexResponse.source || "Unknown",
      notes: vertexResponse.notes || "",
      summary: vertexResponse.summary || null,
      // Enhanced account information
      accountInfo: vertexResponse.accountInfo || null,
      accountSuggestions: vertexResponse.summary?.accountSuggestions || [],
      detectedAccount: vertexResponse.accountInfo
        ? {
            name: vertexResponse.accountInfo.accountName,
            type: vertexResponse.accountInfo.accountType,
            institution: vertexResponse.accountInfo.institution,
            confidence: vertexResponse.accountInfo.confidence,
          }
        : null,
    };
  }
}

export { VertexAiService };
export default new VertexAiService();
