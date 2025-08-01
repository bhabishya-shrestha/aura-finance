// Gemini API service for OCR and image analysis
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
      console.warn(
        "Gemini API key not found. AI-powered document analysis will be disabled. Set VITE_GEMINI_API_KEY in your environment variables to enable this feature."
      );
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

  // Validate file size and type
  validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    if (file.size > maxSize) {
      throw new Error("File size too large. Maximum 10MB allowed.");
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "File type not supported. Please upload an image (JPG, PNG, GIF, WebP) or PDF."
      );
    }
  }

  // Convert file to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  // Get MIME type for file
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
      pdf: "application/pdf",
    };

    return mimeTypes[extension] || "image/jpeg";
  }

  // Analyze image and extract transaction data
  async analyzeImage(file) {
    if (!this.apiKey) {
      // Return a fallback response instead of throwing an error
      return {
        documentType: "Unknown",
        source: "Manual Entry Required",
        transactions: [],
        confidence: "low",
        notes: "AI analysis is disabled. Please manually enter transaction details.",
        error: "API_KEY_MISSING"
      };
    }

    // Apply security checks
    this.checkRateLimit();
    this.validateFile(file);

    try {
      const base64Data = await this.fileToBase64(file);
      const mimeType = this.getMimeType(file);

      const prompt = `Analyze this financial document image and extract transaction information. 

Please identify the type of document (receipt, bank statement, credit card statement, etc.) and extract all transaction details including:

1. Document type and source (e.g., "Bank of America Statement", "Walmart Receipt")
2. Transaction date(s)
3. Merchant/description
4. Amount(s)
5. Transaction type (income/expense)
6. Any additional relevant information

Format the response as JSON with the following structure:
{
  "documentType": "string",
  "source": "string", 
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "string",
      "amount": number,
      "type": "income|expense",
      "category": "string"
    }
  ],
  "confidence": "high|medium|low",
  "notes": "string"
}

If you cannot extract specific transaction data, provide as much information as possible about what you can see in the document.`;

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
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
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

      // Try to parse JSON from the response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.warn("Failed to parse JSON from Gemini response:", parseError);
      }

      // Fallback: return structured data from text
      return {
        documentType: "Unknown",
        source: "Unknown",
        transactions: [],
        confidence: "low",
        notes: responseText,
        rawResponse: responseText,
      };
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  // Categorize transaction based on description
  categorizeTransaction(description) {
    if (!description) return "Other";

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
      desc.includes("trader joe") ||
      desc.includes("walmart")
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
  }

  // Convert Gemini response to transaction format
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
    }));
  }
}

export default new GeminiService();
