import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import huggingFaceService from "../services/huggingFaceService";

// Mock environment variables
vi.mock("import.meta.env", () => ({
  env: {
    VITE_HUGGINGFACE_API_KEY: "test_api_key_123",
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

describe("HuggingFaceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset service state for each test
    huggingFaceService.requestCount = 0;
    huggingFaceService.dailyRequestCount = 0;
    huggingFaceService.lastRequestTime = 0;
    huggingFaceService.lastDailyReset = new Date().toDateString();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constructor and Initialization", () => {
    it("should initialize with correct default values", () => {
      expect(huggingFaceService.apiKey).toBe("test_api_key_123");
      expect(huggingFaceService.baseUrl).toBe(
        "https://api-inference.huggingface.co/models"
      );
      expect(huggingFaceService.rateLimit.maxRequests).toBe(5);
      expect(huggingFaceService.rateLimit.maxDailyRequests).toBe(500);
      expect(huggingFaceService.rateLimit.timeWindow).toBe(60000);
    });

    it("should warn when API key is not configured", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Temporarily remove API key
      const originalKey = huggingFaceService.apiKey;
      huggingFaceService.apiKey = null;

      // Trigger the warning by calling a method that checks availability
      huggingFaceService.isAvailable();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Hugging Face: API key not configured. AI features will be disabled."
      );

      // Restore API key
      huggingFaceService.apiKey = originalKey;
      consoleSpy.mockRestore();
    });
  });

  describe("Model Selection", () => {
    it("should return correct model for text analysis", () => {
      const model = huggingFaceService.getBestModel("textAnalysis");
      expect(model).toBe("deepseek-ai/deepseek-coder-6.7b-instruct");
    });

    it("should return correct model for transaction extraction", () => {
      const model = huggingFaceService.getBestModel("transactionExtraction");
      expect(model).toBe("deepseek-ai/deepseek-coder-6.7b-instruct");
    });

    it("should return correct model for vision analysis", () => {
      const model = huggingFaceService.getBestModel("visionAnalysis");
      expect(model).toBe("microsoft/git-base-coco");
    });

    it("should return correct model for OCR", () => {
      const model = huggingFaceService.getBestModel("ocr");
      expect(model).toBe("microsoft/trocr-base-handwritten");
    });

    it("should return default model for unknown task", () => {
      const model = huggingFaceService.getBestModel("unknownTask");
      expect(model).toBe(huggingFaceService.defaultModel);
    });
  });

  describe("Rate Limiting", () => {
    it("should allow requests within limits", () => {
      expect(() => huggingFaceService.checkRateLimit()).not.toThrow();
    });

    it("should throw error when daily limit exceeded", () => {
      huggingFaceService.dailyRequestCount = 500;

      expect(() => huggingFaceService.checkRateLimit()).toThrow(
        "Hugging Face API: Daily request limit exceeded. Please try again tomorrow."
      );
    });

    it("should throw error when minute limit exceeded", () => {
      huggingFaceService.requestCount = 5;

      expect(() => huggingFaceService.checkRateLimit()).toThrow(
        "Hugging Face API: Rate limit exceeded. Please wait a minute before trying again."
      );
    });

    it("should reset daily counter on new day", () => {
      huggingFaceService.dailyRequestCount = 100;
      huggingFaceService.lastDailyReset = "2023-01-01";

      // Mock current date to be different
      const mockDate = new Date("2023-01-02");
      vi.spyOn(global, "Date").mockImplementation(() => mockDate);

      huggingFaceService.checkRateLimit();

      expect(huggingFaceService.dailyRequestCount).toBe(1);
    });

    it("should reset minute counter after time window", () => {
      huggingFaceService.requestCount = 3;
      huggingFaceService.lastRequestTime = Date.now() - 70000; // 70 seconds ago

      huggingFaceService.checkRateLimit();

      expect(huggingFaceService.requestCount).toBe(1);
    });
  });

  describe("File Validation", () => {
    it("should validate valid image file", () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      expect(() => huggingFaceService.validateFile(file)).not.toThrow();
    });

    it("should validate valid PDF file", () => {
      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      expect(() => huggingFaceService.validateFile(file)).not.toThrow();
    });

    it("should reject file without type", () => {
      expect(() => huggingFaceService.validateFile(null)).toThrow(
        "No file provided"
      );
    });

    it("should reject oversized file", () => {
      const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      });
      expect(() => huggingFaceService.validateFile(largeFile)).toThrow(
        "File size exceeds 10MB limit"
      );
    });

    it("should reject unsupported file type", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      expect(() => huggingFaceService.validateFile(file)).toThrow(
        "Unsupported file type. Please use JPEG, PNG, or PDF files"
      );
    });
  });

  describe("File to Base64 Conversion", () => {
    it("should convert file to base64", async () => {
      const file = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });
      const base64 = await huggingFaceService.fileToBase64(file);

      expect(base64).toBeDefined();
      expect(typeof base64).toBe("string");
    });

    it("should handle file read errors", async () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      // Mock FileReader to throw error
      const originalFileReader = global.FileReader;
      global.FileReader = class {
        readAsDataURL() {
          setTimeout(() => this.onerror(new Error("Read error")), 0);
        }
      };

      await expect(huggingFaceService.fileToBase64(file)).rejects.toThrow(
        "Read error"
      );

      global.FileReader = originalFileReader;
    });
  });

  describe("Image Analysis", () => {
    it("should analyze image successfully", async () => {
      const mockResponse = {
        generated_text: "Sample extracted text from image",
        label: "document",
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const result = await huggingFaceService.analyzeImage(file);

      expect(result.success).toBe(true);
      expect(result.text).toContain("Sample extracted text");
      expect(result.confidence).toBe(0.85);
      expect(result.model).toBe("microsoft/git-base-coco");
      expect(result.provider).toBe("huggingface");
    });

    it("should handle API errors gracefully", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
        json: async () => ({ error: "Invalid input" }),
      });

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      await expect(huggingFaceService.analyzeImage(file)).rejects.toThrow(
        "Failed to analyze document: Hugging Face API error: Invalid input"
      );
    });

    it("should handle network errors", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      await expect(huggingFaceService.analyzeImage(file)).rejects.toThrow(
        "Failed to analyze document: Network error"
      );
    });
  });

  describe("Transaction Extraction", () => {
    it("should extract transactions from text successfully", async () => {
      const mockResponse = {
        generated_text:
          '[{"date": "2024-01-15", "description": "Coffee Shop", "amount": 5.50, "type": "expense", "category": "Food"}]',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const text = "Sample transaction text";
      const result = await huggingFaceService.extractTransactions(text);

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0]).toEqual({
        date: "2024-01-15",
        description: "Coffee Shop",
        amount: 5.5,
        type: "expense",
        category: "Food",
      });
      expect(result.model).toBe("deepseek-ai/deepseek-coder-6.7b-instruct");
      expect(result.provider).toBe("huggingface");
    });

    it("should handle malformed JSON response", async () => {
      const mockResponse = {
        generated_text: "Invalid JSON response",
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const text = "Sample transaction text";
      const result = await huggingFaceService.extractTransactions(text);

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0]).toEqual({
        date: expect.any(String),
        description: "Extracted from document",
        amount: 0,
        type: "expense",
        category: "Uncategorized",
      });
    });

    it("should handle API errors in transaction extraction", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Rate Limited",
        json: async () => ({ error: "Rate limit exceeded" }),
      });

      const text = "Sample transaction text";

      await expect(
        huggingFaceService.extractTransactions(text)
      ).rejects.toThrow(
        "Failed to extract transactions: Hugging Face API error: Rate limit exceeded"
      );
    });
  });

  describe("Account Suggestions", () => {
    it("should analyze transactions for account suggestions", async () => {
      const mockResponse = {
        generated_text:
          'Based on the transaction patterns, I suggest categorizing these as "Food & Dining" expenses.',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const transactionTexts = ["Coffee Shop - $5.50", "Restaurant - $25.00"];
      const prompt = "Suggest account categories for these transactions";

      const result = await huggingFaceService.analyzeTransactions(
        transactionTexts,
        prompt
      );

      expect(result.success).toBe(true);
      expect(result.suggestions).toContain("Food & Dining");
      expect(result.model).toBe("deepseek-ai/deepseek-coder-6.7b-instruct");
      expect(result.provider).toBe("huggingface");
    });

    it("should handle empty suggestions gracefully", async () => {
      const mockResponse = {
        generated_text: "",
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const transactionTexts = ["Coffee Shop - $5.50"];
      const prompt = "Suggest account categories";

      const result = await huggingFaceService.analyzeTransactions(
        transactionTexts,
        prompt
      );

      expect(result.success).toBe(true);
      expect(result.suggestions).toBe("No suggestions available");
    });
  });

  describe("Service Methods", () => {
    it("should provide usage statistics", () => {
      huggingFaceService.dailyRequestCount = 50;
      huggingFaceService.requestCount = 2;

      const stats = huggingFaceService.getUsageStats();

      expect(stats.dailyRequests).toBe(50);
      expect(stats.dailyLimit).toBe(500);
      expect(stats.minuteRequests).toBe(2);
      expect(stats.minuteLimit).toBe(5);
      expect(stats.remainingDaily).toBe(450);
      expect(stats.remainingMinute).toBe(3);
    });

    it("should check service availability", () => {
      expect(huggingFaceService.isAvailable()).toBe(true);

      const originalKey = huggingFaceService.apiKey;
      huggingFaceService.apiKey = null;
      expect(huggingFaceService.isAvailable()).toBe(false);
      huggingFaceService.apiKey = originalKey;
    });

    it("should convert AI response to transactions", () => {
      const response = {
        transactions: [{ date: "2024-01-15", description: "Test", amount: 10 }],
      };

      const transactions = huggingFaceService.convertToTransactions(response);
      expect(transactions).toEqual(response.transactions);
    });

    it("should handle empty response in convertToTransactions", () => {
      const transactions = huggingFaceService.convertToTransactions(null);
      expect(transactions).toEqual([]);
    });

    it("should provide processing summary", () => {
      const response = {
        transactions: [{ id: 1 }, { id: 2 }],
        model: "test-model",
        success: true,
      };

      const summary = huggingFaceService.getProcessingSummary(response);

      expect(summary.totalTransactions).toBe(2);
      expect(summary.provider).toBe("huggingface");
      expect(summary.model).toBe("test-model");
      expect(summary.success).toBe(true);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete document processing workflow", async () => {
      // Mock image analysis response
      const imageResponse = {
        generated_text: "Coffee Shop - $5.50\nRestaurant - $25.00",
      };

      // Mock transaction extraction response
      const transactionResponse = {
        generated_text:
          '[{"date": "2024-01-15", "description": "Coffee Shop", "amount": 5.50, "type": "expense", "category": "Food"}]',
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => imageResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => transactionResponse,
        });

      const file = new File(["test"], "receipt.jpg", { type: "image/jpeg" });

      // Step 1: Analyze image
      const imageResult = await huggingFaceService.analyzeImage(file);
      expect(imageResult.success).toBe(true);

      // Step 2: Extract transactions from analyzed text
      const transactionResult = await huggingFaceService.extractTransactions(
        imageResult.text
      );
      expect(transactionResult.success).toBe(true);
      expect(transactionResult.transactions).toHaveLength(1);
    });

    it("should handle rate limiting across multiple requests", async () => {
      // Set up rate limiting
      huggingFaceService.requestCount = 4;

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      // First request should succeed
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ generated_text: "test" }),
      });

      await expect(
        huggingFaceService.analyzeImage(file)
      ).resolves.toBeDefined();

      // Second request should fail due to rate limit
      await expect(huggingFaceService.analyzeImage(file)).rejects.toThrow(
        "Hugging Face API: Rate limit exceeded"
      );
    });
  });
});
