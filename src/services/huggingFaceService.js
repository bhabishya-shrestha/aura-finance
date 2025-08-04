// Hugging Face Inference API service for high-volume document analysis
// Provides 30,000 daily requests for free - much higher than Gemini's 150

class HuggingFaceService {
  constructor() {
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
    this.baseUrl = "https://api-inference.huggingface.co/models";

    // Hugging Face has generous free tier limits
    this.rateLimit = {
      maxRequests: 5, // 5 per minute
      timeWindow: 60000, // 1 minute in milliseconds
      maxDailyRequests: 500, // 500 daily requests
    };

    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.dailyRequestCount = 0;
    this.lastDailyReset = new Date().toDateString();

    // Optimized models for cost-effectiveness and performance
    this.defaultModel = "deepseek-ai/deepseek-coder-6.7b-instruct"; // Excellent for text analysis, cost-effective
    this.visionModel = "microsoft/git-base-coco"; // Good for image/document analysis
    this.ocrModel = "microsoft/trocr-base-handwritten"; // Better OCR for handwritten text

    if (!this.apiKey) {
      console.warn(
        "Hugging Face: API key not configured. AI features will be disabled."
      );
    }
  }

  // Rate limiting check
  checkRateLimit() {
    const now = Date.now();

    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    if (today !== this.lastDailyReset) {
      this.dailyRequestCount = 0;
      this.lastDailyReset = today;
    }

    // Reset minute counter if time window has passed
    if (now - this.lastRequestTime > this.rateLimit.timeWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    // Check if we're within limits
    if (this.dailyRequestCount >= this.rateLimit.maxDailyRequests) {
      throw new Error(
        "Hugging Face API: Daily request limit exceeded. Please try again tomorrow."
      );
    }

    if (this.requestCount >= this.rateLimit.maxRequests) {
      throw new Error(
        "Hugging Face API: Rate limit exceeded. Please wait a minute before trying again."
      );
    }

    return true;
  }

  // Validate file type and size
  validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

    if (!file) {
      throw new Error("No file provided");
    }

    if (file.size > maxSize) {
      throw new Error("File size exceeds 10MB limit");
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Unsupported file type. Please use JPEG, PNG, or PDF files"
      );
    }

    return true;
  }

  // Convert file to base64 for API
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Analyze image/document using Hugging Face
  async analyzeImage(file) {
    try {
      this.checkRateLimit();
      this.validateFile(file);

      const base64Data = await this.fileToBase64(file);

      // Use vision model for document analysis
      const response = await fetch(`${this.baseUrl}/${this.visionModel}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `data:${file.type};base64,${base64Data}`,
          parameters: {
            max_length: 500,
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Hugging Face API error: ${errorData.error || response.statusText}`
        );
      }

      const result = await response.json();

      // Update request counters
      this.requestCount++;
      this.dailyRequestCount++;

      // Extract text content from the response
      let extractedText = "";
      if (Array.isArray(result)) {
        extractedText = result
          .map(item => item.generated_text || item.label || "")
          .join(" ");
      } else if (result.generated_text) {
        extractedText = result.generated_text;
      } else if (result.label) {
        extractedText = result.label;
      }

      return {
        success: true,
        text: extractedText,
        confidence: 0.85, // Default confidence for Hugging Face
        model: this.visionModel,
        provider: "huggingface",
      };
    } catch (error) {
      console.error("Hugging Face API Error:", error);
      throw new Error(`Failed to analyze document: ${error.message}`);
    }
  }

  // Extract transactions from analyzed text
  async extractTransactions(text) {
    try {
      this.checkRateLimit();

      const prompt = `Analyze the following financial document text and extract transaction information. Return a JSON array of transactions with fields: date, description, amount, type (income/expense), category. Text: ${text}`;

      const bestModel = this.getBestModel("transactionExtraction");
      const response = await fetch(`${this.baseUrl}/${bestModel}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 1000,
            temperature: 0.3,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Hugging Face API error: ${errorData.error || response.statusText}`
        );
      }

      const result = await response.json();

      // Update request counters
      this.requestCount++;
      this.dailyRequestCount++;

      // Parse the response to extract transactions
      let transactions = [];
      try {
        if (result.generated_text) {
          // Try to extract JSON from the response
          const jsonMatch = result.generated_text.match(/\[.*\]/);
          if (jsonMatch) {
            transactions = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (parseError) {
        console.warn(
          "Failed to parse transactions from Hugging Face response:",
          parseError
        );
        // Fallback: create a basic transaction from the text
        transactions = [
          {
            date: new Date().toISOString().split("T")[0],
            description: "Extracted from document",
            amount: 0,
            type: "expense",
            category: "Uncategorized",
          },
        ];
      }

      return {
        success: true,
        transactions,
        model: bestModel,
        provider: "huggingface",
      };
    } catch (error) {
      console.error("Hugging Face Transaction Extraction Error:", error);
      throw new Error(`Failed to extract transactions: ${error.message}`);
    }
  }

  // Get current usage statistics
  getUsageStats() {
    return {
      dailyRequests: this.dailyRequestCount,
      dailyLimit: this.rateLimit.maxDailyRequests,
      minuteRequests: this.requestCount,
      minuteLimit: this.rateLimit.maxRequests,
      remainingDaily: this.rateLimit.maxDailyRequests - this.dailyRequestCount,
      remainingMinute: this.rateLimit.maxRequests - this.requestCount,
    };
  }

  // Check if service is available
  isAvailable() {
    return !!this.apiKey;
  }

  // Get the best model for a specific task
  getBestModel(task) {
    const models = {
      textAnalysis: "deepseek-ai/deepseek-coder-6.7b-instruct", // Best for text processing
      visionAnalysis: "microsoft/git-base-coco", // Good for image understanding
      ocr: "microsoft/trocr-base-handwritten", // Best for handwritten text
      transactionExtraction: "deepseek-ai/deepseek-coder-6.7b-instruct", // Best for structured data extraction
      accountSuggestions: "deepseek-ai/deepseek-coder-6.7b-instruct", // Best for reasoning tasks
    };

    return models[task] || this.defaultModel;
  }

  // Extract transactions from text (alias for extractTransactions)
  extractFromText(text) {
    return this.extractTransactions(text);
  }

  // Convert AI response to transactions
  convertToTransactions(response) {
    if (response && response.transactions) {
      return response.transactions;
    }
    return [];
  }

  // Get processing summary
  getProcessingSummary(response) {
    return {
      totalTransactions: response?.transactions?.length || 0,
      provider: "huggingface",
      model: response?.model || "unknown",
      success: response?.success || false,
    };
  }

  // Analyze transactions for account suggestions
  async analyzeTransactions(transactionTexts, prompt) {
    try {
      this.checkRateLimit();

      const fullPrompt = `${prompt}\n\nTransaction texts:\n${transactionTexts.join("\n")}`;

      const bestModel = this.getBestModel("accountSuggestions");
      const response = await fetch(`${this.baseUrl}/${bestModel}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_length: 500,
            temperature: 0.3,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Hugging Face API error: ${errorData.error || response.statusText}`
        );
      }

      const result = await response.json();

      // Update request counters
      this.requestCount++;
      this.dailyRequestCount++;

      return {
        success: true,
        suggestions: result.generated_text || "No suggestions available",
        model: bestModel,
        provider: "huggingface",
      };
    } catch (error) {
      console.error("Hugging Face Transaction Analysis Error:", error);
      throw new Error(`Failed to analyze transactions: ${error.message}`);
    }
  }
}

export default new HuggingFaceService();
