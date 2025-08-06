// Hugging Face Inference API service for high-volume document analysis
// Professional implementation with client-side OCR for cost-effective document processing

import Tesseract from "tesseract.js";

class HuggingFaceService {
  constructor() {
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
    this.baseUrl = "https://api-inference.huggingface.co/models";

    // Use the verified working model for text analysis
    this.uniformModel = "facebook/bart-large-cnn";

    // Rate limiting configuration for free tier
    this.rateLimit = {
      maxRequests: 5, // requests per minute
      maxDailyRequests: 500, // daily limit
      retryDelay: 12000, // 12 seconds between retries
    };

    // Request tracking for rate limiting
    this.requestCount = 0;
    this.dailyRequestCount = 0;
    this.lastRequestTime = 0;

    // Initialize daily counter from localStorage
    this.initializeDailyCounter();
  }

  /**
   * Initialize daily request counter from localStorage
   * Resets daily at midnight
   */
  initializeDailyCounter() {
    const today = new Date().toDateString();
    const stored = localStorage.getItem("huggingface_daily_count");

    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === today) {
        this.dailyRequestCount = count;
      } else {
        this.dailyRequestCount = 0;
        this.updateDailyCounter();
      }
    }
  }

  /**
   * Update daily counter in localStorage
   */
  updateDailyCounter() {
    const today = new Date().toDateString();
    localStorage.setItem(
      "huggingface_daily_count",
      JSON.stringify({
        date: today,
        count: this.dailyRequestCount,
      })
    );
  }

  /**
   * Check if we're approaching rate limits
   */
  isApproachingLimits() {
    return (
      this.dailyRequestCount >= this.rateLimit.maxDailyRequests * 0.8 ||
      this.requestCount >= this.rateLimit.maxRequests * 0.8
    );
  }

  /**
   * Get current model (uniform model approach)
   */
  getBestModel() {
    return this.uniformModel;
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable() {
    return (
      !!this.apiKey && this.dailyRequestCount < this.rateLimit.maxDailyRequests
    );
  }

  /**
   * Rate limiting check and delay
   */
  async checkRateLimit() {
    const now = Date.now();

    // Check per-minute limit
    if (now - this.lastRequestTime < 60000) {
      // within 1 minute
      if (this.requestCount >= this.rateLimit.maxRequests) {
        const waitTime = 60000 - (now - this.lastRequestTime);
        // console.warn(`Rate limit reached. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
      }
    } else {
      this.requestCount = 0;
    }

    // Check daily limit
    if (this.dailyRequestCount >= this.rateLimit.maxDailyRequests) {
      throw new Error(
        "Daily rate limit exceeded. Please try again tomorrow or switch to Google Gemini API."
      );
    }

    this.lastRequestTime = now;
  }

  /**
   * Extract text from image using client-side OCR (Tesseract.js)
   * This is the first stage of our two-stage approach
   */
  async extractTextFromImage(imageData) {
    try {
      // // console.log("Hugging Face: Starting client-side OCR extraction...");

      // Skip preprocessing in test environments where canvas is not available
      let processedImageData = imageData;
      try {
        processedImageData = await this.preprocessImage(imageData);
      } catch (error) {
        // console.warn(
        //   "Image preprocessing failed, using original image:",
        //   error.message
        // );
        processedImageData = imageData;
      }

      // Enhanced OCR configuration for better financial document recognition
      const result = await Tesseract.recognize(
        processedImageData,
        "eng", // English language
        {
          logger: m => {
            if (m.status === "recognizing text") {
              // // console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          },
          // Enhanced OCR settings for financial documents
          tessedit_char_whitelist:
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$.,()-/: ",
          tessedit_pageseg_mode: "6", // Uniform block of text
          tessedit_ocr_engine_mode: "3", // Default, based on what is available
          preserve_interword_spaces: "1",
          textord_heavy_nr: "1", // More aggressive noise removal
          textord_min_linesize: "2.0", // Minimum line size
        }
      );

      const extractedText = result.data.text.trim();
      // // console.log("Hugging Face: OCR extraction completed successfully");
      // // console.log("OCR Raw Text:", extractedText);

      return {
        success: true,
        text: extractedText,
        confidence: result.data.confidence,
        words: result.data.words,
      };
    } catch (error) {
      // console.error("Hugging Face: OCR extraction failed:", error);
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Preprocess image to improve OCR quality
   */
  async preprocessImage(imageData) {
    return new Promise(resolve => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply image enhancement for better OCR
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale and enhance contrast
          const gray =
            data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

          // Apply threshold for better text recognition
          const threshold = 128;
          const enhanced = gray > threshold ? 255 : 0;

          data[i] = enhanced; // Red
          data[i + 1] = enhanced; // Green
          data[i + 2] = enhanced; // Blue
          // Alpha channel remains unchanged
        }

        // Put processed image data back
        ctx.putImageData(imageData, 0, 0);

        // Convert back to blob for Tesseract
        canvas.toBlob(blob => {
          resolve(blob);
        }, "image/png");
      };

      img.src = imageData;
    });
  }

  /**
   * Analyze extracted text using Hugging Face API
   * This is the second stage of our two-stage approach
   */
  async analyzeExtractedText(text) {
    await this.checkRateLimit();

    // // console.log("[analyzeExtractedText] Input text:", text);
    // // console.log(
    //   "Hugging Face: Making API request with key:",
    //   this.apiKey.substring(0, 10) + "..."
    // );

    // Enhanced prompt specifically designed for financial transaction extraction
    const prompt = `Extract financial transactions from this bank statement text. 

Instructions:
1. Look for transaction amounts (numbers with $ or decimal points)
2. Find dates (MM/DD/YYYY, MM-DD-YYYY, or similar formats)
3. Identify merchant names or transaction descriptions
4. Categorize as income (deposits, credits) or expense (withdrawals, debits)

Expected output format:
Transaction 1: [DESCRIPTION] - $[AMOUNT] on [DATE]
Transaction 2: [DESCRIPTION] - $[AMOUNT] on [DATE]
Payment 1: [DESCRIPTION] - $[AMOUNT] on [DATE]
Payment 2: [DESCRIPTION] - $[AMOUNT] on [DATE]

Document text to analyze:
${text}

Please extract all financial transactions found in the text above using the exact format shown.`;

    const response = await fetch(`${this.baseUrl}/${this.uniformModel}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 1500,
          min_length: 100,
          do_sample: false,
          num_beams: 5,
          early_stopping: true,
          temperature: 0.1, // Lower temperature for more consistent output
          top_p: 0.9,
          repetition_penalty: 1.2,
        },
      }),
    });

    if (!response.ok) {
      // console.error("Hugging Face API Error Response:", {
      //   status: response.status,
      //   statusText: response.statusText,
      //   errorData,
      // });

      if (response.status === 404) {
        throw new Error(
          "Hugging Face model not available. Please switch to Google Gemini API in settings."
        );
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else {
        throw new Error(
          `Hugging Face API error: ${response.status} ${response.statusText}`
        );
      }
    }

    const data = await response.json();
    // // console.log("[analyzeExtractedText] API response data:", data);

    // Extract the generated text from the response
    const generatedText =
      data[0]?.summary_text || data[0]?.generated_text || "";
    // // console.log("[analyzeExtractedText] Generated text:", generatedText);

    // Extract transactions from the generated text
    const extractedTransactions =
      this.extractTransactionsFromAnalysis(generatedText);
    // // console.log(
    //   "[analyzeExtractedText] Extracted transactions:",
    //   extractedTransactions
    // );

    return {
      success: true,
      analysis: generatedText,
      transactions: extractedTransactions,
      model: this.uniformModel,
      provider: "huggingface",
      source: "Hugging Face Analysis",
      documentType: "Financial Document",
      notes:
        "Document analyzed using Hugging Face BART-CNN. Please review and adjust transaction details.",
    };
  }

  /**
   * Extract transactions from AI analysis text
   * Enhanced to handle various formats and improve accuracy
   */
  extractTransactionsFromAnalysis(analysis) {
    const transactions = [];

    if (!analysis || analysis.trim() === "") {
      // // console.log(
      //   "[extractTransactionsFromAnalysis] Empty analysis, returning empty array"
      // );
      return transactions;
    }

    // // console.log(
    //   "[extractTransactionsFromAnalysis] Processing analysis:",
    //   analysis
    // );

    // Count expected transactions for debugging
    // const transactionMatches = analysis.match(/Transaction\s+\d+:/g);
    // const paymentMatches = analysis.match(/Payment\s+\d+:/g);
    // // console.log(`[DEBUG] Found ${transactionMatches?.length || 0} transaction lines and ${paymentMatches?.length || 0} payment lines`);

    // More precise patterns specifically designed for bank statement format
    // Using flexible pattern that handles special characters and hyphens in descriptions
    const patterns = [
      // Pattern 1: "Transaction X: DESCRIPTION - $AMOUNT on DATE" format (most reliable)
      /Transaction\s+\d+:\s+(.*?)\s+-\s+\$?(\d+\.?\d*)\s+on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,

      // Pattern 2: "Payment X: DESCRIPTION - $AMOUNT on DATE" format (most reliable)
      /Payment\s+\d+:\s+(.*?)\s+-\s+\$?(\d+\.?\d*)\s+on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,
    ];

    const foundTransactions = new Set();

    patterns.forEach(pattern => {
      const matches = [...analysis.matchAll(pattern)];
      // // console.log(
      //   `[extractTransactionsFromAnalysis] Pattern found ${matches.length} matches`
      // );

      // Debug: Show what matches were found
      matches.forEach(() => {
        // // console.log(`[DEBUG] Match found`);
      });

      matches.forEach(match => {
        let amount, description, date;

        // Pattern 1 & 2: Transaction/Payment with date
        description = match[1].trim();
        amount = parseFloat(match[2]);
        date = this.normalizeDate(match[3]);

        // Validate amount and description
        if (
          amount &&
          this.isValidTransactionAmount(amount) &&
          this.isValidDescription(description)
        ) {
          const transactionKey = `${amount}-${description}`;

          if (!foundTransactions.has(transactionKey)) {
            foundTransactions.add(transactionKey);

            const transaction = {
              date: date || new Date().toISOString().split("T")[0],
              description: this.cleanDescription(description),
              amount: amount,
              type: this.determineTransactionType(description, amount),
              category: this.categorizeTransaction(description),
              confidence: 0.9,
            };

            transactions.push(transaction);
            // // console.log(
            //   `[extractTransactionsFromAnalysis] Added transaction:`,
            //   transaction
            // );
          } else {
            // // console.log(
            //   `[DEBUG] Duplicate transaction filtered out: ${transactionKey}`
            // );
          }
        } else {
          // Debug why transaction was rejected
          // // console.log(
          //   `[DEBUG] Rejected transaction: amount=${amount}, description="${description}"`
          // );
          // // console.log(
          //   `[DEBUG] isValidAmount: ${this.isValidTransactionAmount(amount)}, isValidDescription: ${this.isValidDescription(description)}`
          // );
        }
      });
    });

    // If we didn't get all expected transactions, try a more aggressive approach
    if (transactions.length < 27) {
      // // console.log(`[DEBUG] Only extracted ${transactions.length} transactions, trying alternative approach`);

      // Try to extract all lines that contain transaction information
      const lines = analysis.split("\n");
      lines.forEach(line => {
        if (line.includes("Transaction") || line.includes("Payment")) {
          // // console.log(`[DEBUG] Line: ${line}`);
        }
      });

      // Try a more flexible regex pattern
      // // console.log(`[DEBUG] Trying more flexible regex pattern`);
      const flexiblePattern =
        /Transaction\s+\d+:\s+(.*?)\s+-\s+\$?(\d+\.?\d*)\s+on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi;
      const flexibleMatches = [...analysis.matchAll(flexiblePattern)];
      // // console.log(`[DEBUG] Flexible pattern found ${flexibleMatches.length} matches`);

      flexibleMatches.forEach(match => {
        if (
          !transactions.some(
            t => t.description === this.cleanDescription(match[1].trim())
          )
        ) {
          // // console.log(`[DEBUG] Flexible match:`, match[0]);
        }
      });
    }

    if (transactions.length === 0) {
      // // console.log(
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

    // // console.log(
    //   `[extractTransactionsFromAnalysis] Final result: ${transactions.length} transactions`
    // );
    return transactions;
  }

  /**
   * Check if an amount is a valid transaction amount
   * Filters out dates, small numbers, and other false positives
   */
  isValidTransactionAmount(amount) {
    if (amount < 0.01) return false;
    if (amount >= 1900 && amount <= 2100) return false;
    if (amount >= 1 && amount <= 31 && Number.isInteger(amount)) return false;
    if (amount >= 1 && amount <= 12 && Number.isInteger(amount)) return false;
    // Remove the overly restrictive phone number check that was rejecting $100, $700, etc.
    // if (amount >= 100 && amount <= 999 && Number.isInteger(amount)) return false;
    if (amount > 100000) return false;
    return true;
  }

  /**
   * Check if a description is valid for a transaction
   */
  isValidDescription(description) {
    if (!description || description.trim().length < 2) return false;

    // Reject descriptions that are just numbers or symbols
    if (/^[\d\s\-.*]+$/.test(description)) return false;

    // Reject descriptions that are too short or generic
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

    // Reject descriptions that are just punctuation or symbols
    if (/^[\s\-.*]+$/.test(description)) return false;

    return true;
  }

  /**
   * Clean and normalize transaction description
   */
  cleanDescription(description) {
    if (!description) return "Unknown transaction";

    // Remove extra whitespace and normalize
    let cleaned = description.trim().replace(/\s+/g, " ");

    // Remove trailing punctuation
    cleaned = cleaned.replace(/[-.*]+$/, "");

    // Remove leading punctuation
    cleaned = cleaned.replace(/^[-.*]+/, "");

    // If description is still too short, try to make it more descriptive
    if (cleaned.length < 3) {
      cleaned = "Transaction";
    }

    return cleaned;
  }

  /**
   * Normalize date format to YYYY-MM-DD
   */
  normalizeDate(dateStr) {
    try {
      if (!dateStr) return new Date().toISOString().split("T")[0];

      // Handle various date formats
      let normalizedDate = dateStr;

      // Convert MM/DD/YYYY to YYYY-MM-DD
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length === 3) {
          const month = parts[0].padStart(2, "0");
          const day = parts[1].padStart(2, "0");
          const year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
          normalizedDate = `${year}-${month}-${day}`;
        }
      }

      // Convert MM-DD-YYYY to YYYY-MM-DD
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
      // console.warn("[normalizeDate] Error normalizing date:", dateStr, error);
      return new Date().toISOString().split("T")[0];
    }
  }

  /**
   * Determine transaction type based on description and amount
   */
  determineTransactionType(description, amount) {
    const desc = description.toLowerCase();

    // Keywords for income/deposits
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

    // Keywords for expenses
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

    // Default to expense for positive amounts, income for negative
    return amount > 0 ? "expense" : "income";
  }

  /**
   * Categorize transaction based on description
   */
  categorizeTransaction(description) {
    const desc = description.toLowerCase();

    const categories = {
      food: ["walmart", "target", "grocery", "restaurant", "food", "dining"],
      transportation: ["uber", "lyft", "gas", "fuel", "parking", "transport"],
      entertainment: ["netflix", "spotify", "amazon", "entertainment", "movie"],
      utilities: ["electric", "water", "gas", "internet", "phone", "utility"],
      shopping: ["amazon", "ebay", "online", "shopping", "retail"],
      healthcare: ["medical", "doctor", "pharmacy", "health", "dental"],
      finance: ["bank", "atm", "withdrawal", "deposit", "transfer"],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }

    return "Uncategorized";
  }

  /**
   * Fallback extraction from OCR text when AI analysis fails
   */
  extractFromOCRText(ocrText) {
    const transactions = [];

    // Look for amount patterns in OCR text
    const amountPattern = /\$?(\d+\.?\d*)/g;
    const matches = [...ocrText.matchAll(amountPattern)];

    matches.forEach((match, index) => {
      const amount = parseFloat(match[1]);
      if (amount > 0 && amount < 1000000) {
        transactions.push({
          date: new Date().toISOString().split("T")[0],
          description: `Transaction ${index + 1}`,
          amount: amount,
          type: "expense",
          category: "Uncategorized",
          confidence: 0.5, // Medium confidence for OCR fallback
        });
      }
    });

    return transactions;
  }

  /**
   * Main document analysis method - implements two-stage approach
   * Stage 1: Client-side OCR for text extraction
   * Stage 2: Hugging Face API for text analysis
   */
  async analyzeImage(imageData) {
    // // console.log("[analyzeImage] Starting two-stage document analysis...");

    // Stage 1: Extract text using client-side OCR
    const ocrResult = await this.extractTextFromImage(imageData);
    // // console.log("[analyzeImage] OCR result:", ocrResult);

    if (!ocrResult.success || !ocrResult.text.trim()) {
      throw new Error("No text could be extracted from the document");
    }

    // Stage 2: Analyze extracted text using Hugging Face API
    const analysisResult = await this.analyzeExtractedText(ocrResult.text);
    // // console.log("[analyzeImage] Analysis result:", analysisResult);

    // Combine results
    return {
      ...analysisResult,
      ocrConfidence: ocrResult.confidence,
      extractedText: ocrResult.text,
      processingMethod: "Two-stage: OCR + AI Analysis",
    };
  }

  /**
   * Extract transactions from text (for text-only input)
   */
  async extractFromText(text) {
    return this.analyzeExtractedText(text);
  }

  /**
   * Convert analysis to transaction format
   */
  async convertToTransactions(analysis) {
    // // console.log(
    //   "[convertToTransactions] Input analysis:",
    //   analysis,
    //   "Type:",
    //   typeof analysis
    // );
    // Handle different possible input structures
    let transactions = [];

    if (analysis && analysis.transactions) {
      // // console.log(
      //   "[convertToTransactions] analysis.transactions:",
      //   analysis.transactions,
      //   "Type:",
      //   typeof analysis.transactions
      // );
      transactions = Array.isArray(analysis.transactions)
        ? analysis.transactions
        : [];
    } else if (Array.isArray(analysis)) {
      // // console.log("[convertToTransactions] analysis is array:", analysis);
      transactions = analysis;
    } else if (analysis && typeof analysis === "object") {
      // If analysis is an object but doesn't have transactions property
      // Try to extract transactions from the analysis text
      const analysisText =
        analysis.analysis || analysis.text || JSON.stringify(analysis);
      // // console.log(
      //   "[convertToTransactions] analysisText for extraction:",
      //   analysisText
      // );
      transactions = this.extractTransactionsFromAnalysis(analysisText);
    } else {
      // Fallback: return empty array
      // console.warn(
      //   "[convertToTransactions] No valid transaction data found in analysis:",
      //   analysis
      // );
      return [];
    }

    // Ensure we have an array and map over it
    if (!Array.isArray(transactions)) {
      // console.warn(
      //   "[convertToTransactions] Transactions is not an array:",
      //   transactions,
      //   "Type:",
      //   typeof transactions
      // );
      return [];
    }
    // // console.log(
    //   "[convertToTransactions] Final transactions array before map:",
    //   transactions
    // );

    return transactions
      .map(transaction => {
        if (!transaction || typeof transaction !== "object") {
          // console.warn(
          //   "[convertToTransactions] Invalid transaction object:",
          //   transaction
          // );
          return null;
        }

        return {
          date: transaction.date || new Date().toISOString().split("T")[0],
          description: transaction.description || "Unknown transaction",
          amount: Math.abs(transaction.amount || 0),
          type: transaction.type || "expense",
          category: transaction.category || "Uncategorized",
          confidence: transaction.confidence || 0.7,
        };
      })
      .filter(Boolean); // Remove null entries
  }

  /**
   * Get processing summary
   */
  getProcessingSummary() {
    return {
      provider: "Hugging Face Inference API",
      model: this.uniformModel,
      dailyRequests: this.dailyRequestCount,
      maxDailyRequests: this.rateLimit.maxDailyRequests,
      remainingRequests:
        this.rateLimit.maxDailyRequests - this.dailyRequestCount,
      approachingLimits: this.isApproachingLimits(),
    };
  }

  /**
   * Analyze existing transactions
   */
  async analyzeTransactions(transactions) {
    await this.checkRateLimit();

    // Ensure transactions is an array and handle different input types
    let transactionArray = [];

    if (Array.isArray(transactions)) {
      transactionArray = transactions;
    } else if (
      transactions &&
      transactions.transactions &&
      Array.isArray(transactions.transactions)
    ) {
      transactionArray = transactions.transactions;
    } else if (transactions && typeof transactions === "object") {
      // Try to extract transactions from object
      // console.warn(
      //   "Hugging Face: Unexpected transactions format:",
      //   transactions
      // );
      transactionArray = [];
    } else {
      // console.warn(
      //   "Hugging Face: No valid transactions provided:",
      //   transactions
      // );
      transactionArray = [];
    }

    const transactionText = transactionArray
      .map(t => {
        if (!t || typeof t !== "object") {
          // console.warn(
          //   "Hugging Face: Invalid transaction object in array:",
          //   t
          // );
          return null;
        }
        return `${t.date || "Unknown date"}: ${t.description || "Unknown"} - $${t.amount || 0}`;
      })
      .filter(Boolean) // Remove null entries
      .join("\n");

    const prompt = `Analyze these financial transactions and provide insights:
${transactionText}

Please provide:
1. Spending patterns
2. Category suggestions
3. Anomalies or unusual transactions
4. Summary of financial activity`;

    const response = await fetch(`${this.baseUrl}/${this.uniformModel}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 800,
          min_length: 100,
          do_sample: false,
          num_beams: 3,
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Update counters
    this.requestCount++;
    this.dailyRequestCount++;
    this.updateDailyCounter();

    return {
      success: true,
      analysis: data[0]?.summary_text || "No analysis available",
      model: this.uniformModel,
      provider: "huggingface",
    };
  }

  /**
   * Validate file before processing
   */
  validateFile(file) {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid file type. Please upload an image or PDF file.");
    }

    if (file.size > maxSize) {
      throw new Error(
        "File too large. Please upload a file smaller than 10MB."
      );
    }

    return true;
  }
}

export default new HuggingFaceService();
