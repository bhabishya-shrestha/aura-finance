import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import huggingFaceService from "../services/huggingFaceService";

// Mock HTML5 Canvas API for jsdom
Object.defineProperty(global, "HTMLCanvasElement", {
  value: class HTMLCanvasElement {
    getContext() {
      return {
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8Array(100) })),
        putImageData: vi.fn(),
        canvas: { width: 100, height: 100 },
      };
    }
  },
});

// Mock Tesseract.js
vi.mock("tesseract.js", () => ({
  default: {
    recognize: vi.fn().mockImplementation(imageData => {
      // Return different results based on the test context
      if (imageData.includes("error")) {
        return Promise.reject(new Error("OCR failed"));
      }
      // Return immediately to avoid timeouts
      return Promise.resolve({
        data: {
          text: "Sample receipt text",
          confidence: 85.5,
          words: [{ text: "Sample", confidence: 90 }],
        },
      });
    }),
    createWorker: vi.fn().mockResolvedValue({
      recognize: vi.fn().mockImplementation(imageData => {
        // Return different results based on the test context
        if (imageData.includes("error")) {
          return Promise.reject(new Error("OCR failed"));
        }
        // Return immediately to avoid timeouts
        return Promise.resolve({
          data: {
            text: "Sample receipt text",
            confidence: 85.5,
            words: [{ text: "Sample", confidence: 90 }],
          },
        });
      }),
      terminate: vi.fn(),
    }),
  },
}));



// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe("HuggingFaceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    huggingFaceService.requestCount = 0;
    huggingFaceService.dailyRequestCount = 0;
    huggingFaceService.lastRequestTime = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with working BART-CNN model", () => {
      expect(huggingFaceService.uniformModel).toBe("facebook/bart-large-cnn");
    });

    it("should have correct rate limits", () => {
      expect(huggingFaceService.rateLimit.maxRequests).toBe(5);
      expect(huggingFaceService.rateLimit.maxDailyRequests).toBe(500);
    });

    it("should initialize request counters", () => {
      expect(huggingFaceService.requestCount).toBe(0);
      expect(huggingFaceService.dailyRequestCount).toBe(0);
    });
  });

  describe("Model Selection", () => {
    it("should return uniform model for all tasks", () => {
      expect(huggingFaceService.getBestModel()).toBe("facebook/bart-large-cnn");
    });
  });

  describe("Rate Limiting", () => {
    it("should check rate limits correctly", () => {
      expect(huggingFaceService.isApproachingLimits()).toBe(false);

      huggingFaceService.dailyRequestCount = 400; // 80% of 500
      expect(huggingFaceService.isApproachingLimits()).toBe(true);
    });

    it("should check provider availability", () => {
      expect(huggingFaceService.isProviderAvailable()).toBe(true);

      huggingFaceService.dailyRequestCount = 500;
      expect(huggingFaceService.isProviderAvailable()).toBe(false);
    });
  });

  describe("OCR Text Extraction", () => {
    it("should extract text from image using Tesseract", async () => {
      const imageData = "data:image/jpeg;base64,/9j/4AAQ...";
      const result = await huggingFaceService.extractTextFromImage(imageData);

      expect(result.success).toBe(true);
      expect(result.text).toBe("Sample receipt text");
      expect(result.confidence).toBe(85.5);
    });

    it("should handle OCR errors gracefully", async () => {
      const imageData = "data:image/jpeg;base64,error";

      await expect(
        huggingFaceService.extractTextFromImage(imageData)
      ).rejects.toThrow("OCR extraction failed: OCR failed");
    });
  });

  describe("Text Analysis", () => {
    it("should analyze extracted text using Hugging Face API", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([{ summary_text: "Analysis of financial document" }]),
      });

      const result =
        await huggingFaceService.analyzeExtractedText("Sample text");

      expect(result.success).toBe(true);
      expect(result.analysis).toBe("Analysis of financial document");
      expect(result.model).toBe("facebook/bart-large-cnn");
      expect(result.transactions).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Bearer"),
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining("Sample text"),
        })
      );
    });

    it("should handle API errors correctly", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({}),
      });

      await expect(
        huggingFaceService.analyzeExtractedText("Sample text")
      ).rejects.toThrow(
        "Hugging Face model not available. Please switch to Google Gemini API in settings."
      );
    });
  });

  describe("Two-Stage Document Analysis", () => {
    it("should perform complete two-stage analysis", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { summary_text: "Transaction: Walmart $45.67 on 2024-01-15" },
          ]),
      });

      const imageData = "data:image/jpeg;base64,/9j/4AAQ...";
      const result = await huggingFaceService.analyzeImage(imageData);

      expect(result.success).toBe(true);
      expect(result.processingMethod).toBe("Two-stage: OCR + AI Analysis");
      expect(result.extractedText).toBe("Walmart $45.67 on 2024-01-15");
      expect(result.ocrConfidence).toBe(90.0);
      expect(result.transactions).toHaveLength(1);
    });

    it("should handle OCR failure in two-stage analysis", async () => {
      const imageData = "data:image/jpeg;base64,error";

      await expect(huggingFaceService.analyzeImage(imageData)).rejects.toThrow(
        "OCR extraction failed: OCR failed"
      );
    });
  });

  describe("Transaction Extraction", () => {
    it("should extract transactions from analysis text", () => {
      const analysis =
        "Transaction 1: Walmart - $45.67 on 01/15/2024\nTransaction 2: Gas station - $30.00 on 01/16/2024";
      const transactions =
        huggingFaceService.extractTransactionsFromAnalysis(analysis);

      expect(transactions).toHaveLength(1); // Only one transaction matches the pattern
      expect(transactions[0]).toEqual({
        date: "2024-01-15",
        description: "Walmart",
        amount: 45.67,
        type: "expense",
        category: "Food",
        confidence: 0.9,
      });
    });

    it("should handle empty analysis", () => {
      const transactions =
        huggingFaceService.extractTransactionsFromAnalysis("");
      expect(transactions).toHaveLength(0);
    });

    it("should create fallback transaction when no amounts found", () => {
      const analysis = "This is a document with no financial data";
      const transactions =
        huggingFaceService.extractTransactionsFromAnalysis(analysis);

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual({
        date: expect.any(String),
        description: "Document analysis completed",
        amount: 0,
        type: "expense",
        category: "Uncategorized",
        confidence: 0.3,
      });
    });
  });

  describe("File Validation", () => {
    it("should validate file types correctly", () => {
      const validFile = { type: "image/jpeg", size: 1024 * 1024 };
      expect(huggingFaceService.validateFile(validFile)).toBe(true);
    });

    it("should reject invalid file types", () => {
      const invalidFile = { type: "text/plain", size: 1024 };
      expect(() => huggingFaceService.validateFile(invalidFile)).toThrow(
        "Invalid file type. Please upload an image or PDF file."
      );
    });

    it("should reject files that are too large", () => {
      const largeFile = { type: "image/jpeg", size: 15 * 1024 * 1024 };
      expect(() => huggingFaceService.validateFile(largeFile)).toThrow(
        "File too large. Please upload a file smaller than 10MB."
      );
    });
  });

  describe("Processing Summary", () => {
    it("should return correct processing summary", () => {
      huggingFaceService.dailyRequestCount = 100;
      const summary = huggingFaceService.getProcessingSummary();

      expect(summary.provider).toBe("Hugging Face Inference API");
      expect(summary.model).toBe("facebook/bart-large-cnn");
      expect(summary.dailyRequests).toBe(100);
      expect(summary.maxDailyRequests).toBe(500);
      expect(summary.remainingRequests).toBe(400);
      expect(summary.approachingLimits).toBe(false);
    });
  });
});
