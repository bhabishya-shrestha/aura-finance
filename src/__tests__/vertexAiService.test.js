import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the Google Cloud AI Platform client
vi.mock("@google-cloud/aiplatform", () => ({
  PredictionServiceClient: vi.fn().mockImplementation(() => ({
    endpointPath: vi
      .fn()
      .mockReturnValue(
        "projects/test-project-id/locations/us-central1/endpoints/test-endpoint-id"
      ),
    predict: vi.fn().mockResolvedValue([
      {
        predictions: [
          {
            content: JSON.stringify({
              documentType: "Bank Statement",
              source: "Test Bank",
              confidence: "high",
              accountInfo: {
                institution: "Test Bank",
                accountType: "checking",
                accountName: "Test Bank Checking",
                confidence: 0.9,
              },
              transactions: [
                {
                  date: "2024-01-15",
                  description: "Test Transaction",
                  amount: -50.0,
                  type: "expense",
                  category: "Shopping",
                },
              ],
              summary: {
                totalIncome: 0,
                totalExpenses: 50.0,
                netAmount: -50.0,
                transactionCount: 1,
              },
              notes: "Test analysis",
              processingQuality: "excellent",
            }),
          },
        ],
      },
    ]),
  })),
}));

// Import the service after mocking
import { VertexAiService } from "../services/vertexAiService";

describe("VertexAiService", () => {
  let service;

  beforeEach(() => {
    // Set environment variables for testing
    vi.stubEnv("VITE_GOOGLE_CLOUD_PROJECT_ID", "test-project-id");
    vi.stubEnv("VITE_GOOGLE_CLOUD_LOCATION", "us-central1");
    vi.stubEnv("VITE_VERTEX_AI_MODEL_ID", "gemini-1.5-flash-001");
    vi.stubEnv("VITE_VERTEX_AI_ENDPOINT_ID", "test-endpoint-id");

    // Create a new instance for each test to avoid state pollution
    service = new VertexAiService();
    // Reset rate limiting counters
    service.requestCount = 0;
    service.dailyRequestCount = 0;
    service.lastRequestTime = 0;
    service.lastDailyReset = new Date().toDateString();
  });

  describe("constructor", () => {
    it("should initialize with correct configuration", () => {
      expect(service.projectId).toBe("test-project-id");
      expect(service.location).toBe("us-central1");
      expect(service.modelId).toBe("gemini-1.5-flash-001");
      expect(service.endpointId).toBe("test-endpoint-id");
      expect(service.client).toBeDefined();
    });

    it("should set higher rate limits than Gemini", () => {
      expect(service.rateLimit.maxRequests).toBe(60); // Higher than Gemini's 15
      expect(service.rateLimit.maxDailyRequests).toBe(1000); // Much higher than Gemini's 150
    });
  });

  describe("rate limiting", () => {
    it("should allow requests within rate limits", () => {
      expect(() => service.checkRateLimit()).not.toThrow();
      expect(service.requestCount).toBe(1);
      expect(service.dailyRequestCount).toBe(1);
    });

    it("should throw error when minute limit exceeded", () => {
      service.requestCount = 60;
      service.lastRequestTime = Date.now(); // Set to current time so time window check doesn't reset
      expect(() => service.checkRateLimit()).toThrow("Rate limit exceeded");
    });

    it("should throw error when daily limit exceeded", () => {
      service.dailyRequestCount = 1000;
      expect(() => service.checkRateLimit()).toThrow("Daily limit exceeded");
    });
  });

  describe("file validation", () => {
    it("should accept valid file types", () => {
      const validFile = {
        type: "image/jpeg",
        size: 1024 * 1024, // 1MB
        name: "test.jpg",
      };
      expect(() => service.validateFile(validFile)).not.toThrow();
    });

    it("should reject files that are too large", () => {
      const largeFile = {
        type: "image/jpeg",
        size: 25 * 1024 * 1024, // 25MB
        name: "large.jpg",
      };
      expect(() => service.validateFile(largeFile)).toThrow(
        "File size too large"
      );
    });

    it("should reject unsupported file types", () => {
      const invalidFile = {
        type: "text/plain",
        size: 1024,
        name: "test.txt",
      };
      expect(() => service.validateFile(invalidFile)).toThrow(
        "File type not supported"
      );
    });
  });

  describe("file processing", () => {
    it("should convert file to base64", async () => {
      const file = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });
      const base64 = await service.fileToBase64(file);
      expect(base64).toBeDefined();
      expect(typeof base64).toBe("string");
    });

    it("should get correct MIME type", () => {
      const file = { type: "image/png", name: "test.png" };
      expect(service.getMimeType(file)).toBe("image/png");
    });

    it("should fallback to extension-based MIME type", () => {
      const file = { name: "test.jpg" };
      expect(service.getMimeType(file)).toBe("image/jpeg");
    });
  });

  describe("document analysis", () => {
    it("should analyze image and return structured data", async () => {
      const file = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });
      const result = await service.analyzeImage(file);

      expect(result).toHaveProperty("documentType");
      expect(result).toHaveProperty("source");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("transactions");
      expect(result).toHaveProperty("accountInfo");
      expect(Array.isArray(result.transactions)).toBe(true);
    });

    it("should return error when not configured", async () => {
      // Temporarily remove client to test unconfigured state
      const originalClient = service.client;
      service.client = null;

      const file = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });
      const result = await service.analyzeImage(file);

      expect(result.error).toBe("VERTEX_AI_NOT_CONFIGURED");
      expect(result.notes).toContain("Vertex AI is not configured");

      // Restore client
      service.client = originalClient;
    });
  });

  describe("transaction conversion", () => {
    it("should convert AI response to transaction format", () => {
      const aiResponse = {
        transactions: [
          {
            date: "2024-01-15",
            description: "Test Transaction",
            amount: -50.0,
            type: "expense",
            category: "Shopping",
          },
        ],
        confidence: "high",
        processingQuality: "excellent",
        documentType: "Bank Statement",
        source: "Test Bank",
      };

      const transactions = service.convertToTransactions(aiResponse);

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBe(1);
      expect(transactions[0]).toHaveProperty("id");
      expect(transactions[0]).toHaveProperty("date");
      expect(transactions[0]).toHaveProperty("description");
      expect(transactions[0]).toHaveProperty("amount");
      expect(transactions[0]).toHaveProperty("category");
      expect(transactions[0]).toHaveProperty("selected");
      expect(transactions[0]).toHaveProperty("type");
      expect(transactions[0]).toHaveProperty("source");
      expect(transactions[0].source).toBe("vertex-ai-ocr");
    });

    it("should handle empty transactions array", () => {
      const aiResponse = { transactions: [] };
      const transactions = service.convertToTransactions(aiResponse);
      expect(transactions).toEqual([]);
    });
  });

  describe("processing summary", () => {
    it("should generate processing summary", () => {
      const aiResponse = {
        transactions: [
          { date: "2024-01-15", description: "Test", amount: -50.0 },
        ],
        confidence: "high",
        processingQuality: "excellent",
        documentType: "Bank Statement",
        source: "Test Bank",
        notes: "Test notes",
        summary: {
          totalIncome: 0,
          totalExpenses: 50.0,
          netAmount: -50.0,
          transactionCount: 1,
        },
        accountInfo: {
          institution: "Test Bank",
          accountType: "checking",
          accountName: "Test Bank Checking",
          confidence: 0.9,
        },
      };

      const summary = service.getProcessingSummary(aiResponse);

      expect(summary).toHaveProperty("transactionCount");
      expect(summary).toHaveProperty("confidence");
      expect(summary).toHaveProperty("quality");
      expect(summary).toHaveProperty("documentType");
      expect(summary).toHaveProperty("source");
      expect(summary).toHaveProperty("notes");
      expect(summary).toHaveProperty("accountInfo");
      expect(summary.transactionCount).toBe(1);
      expect(summary.confidence).toBe("high");
      expect(summary.quality).toBe("excellent");
    });
  });

  describe("transaction categorization", () => {
    it("should categorize grocery transactions", () => {
      expect(service.categorizeTransaction("Walmart grocery")).toBe(
        "Groceries"
      );
      expect(service.categorizeTransaction("Safeway")).toBe("Groceries");
    });

    it("should categorize restaurant transactions", () => {
      expect(service.categorizeTransaction("McDonald's")).toBe("Restaurants");
      expect(service.categorizeTransaction("Starbucks")).toBe("Restaurants");
    });

    it("should categorize transport transactions", () => {
      expect(service.categorizeTransaction("Shell gas")).toBe("Transport");
      expect(service.categorizeTransaction("Uber")).toBe("Transport");
    });

    it("should return 'Other' for unknown categories", () => {
      expect(service.categorizeTransaction("Unknown merchant")).toBe("Other");
    });
  });

  describe("date parsing", () => {
    it("should parse various date formats", () => {
      expect(service.parseDate("01/15/2024")).toBeInstanceOf(Date);
      expect(service.parseDate("01-15-2024")).toBeInstanceOf(Date);
      expect(service.parseDate("Jan 15, 2024")).toBeInstanceOf(Date);
    });

    it("should return null for invalid dates", () => {
      expect(service.parseDate("invalid date")).toBeNull();
    });
  });
});
