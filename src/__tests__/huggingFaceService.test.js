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

// Mock Tesseract.js with immediate resolution
vi.mock("tesseract.js", () => {
  const mockRecognize = vi.fn().mockImplementation(imageData => {
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
  });

  return {
    default: {
      recognize: mockRecognize,
      createWorker: vi.fn().mockResolvedValue({
        recognize: mockRecognize,
        terminate: vi.fn().mockResolvedValue(undefined),
      }),
    },
    recognize: mockRecognize, // Also mock the top-level recognize function
  };
});

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

    it("should return uniform model for specific task", () => {
      expect(huggingFaceService.getBestModel("summarization")).toBe(
        "facebook/bart-large-cnn"
      );
      expect(huggingFaceService.getBestModel("text-generation")).toBe(
        "facebook/bart-large-cnn"
      );
    });
  });

  describe("Rate Limiting", () => {
    it("should check rate limits correctly", () => {
      huggingFaceService.requestCount = 3;
      huggingFaceService.dailyRequestCount = 100;

      expect(huggingFaceService.isApproachingLimits()).toBe(false);
    });

    it("should detect approaching minute limits", () => {
      huggingFaceService.requestCount = 4;
      expect(huggingFaceService.isApproachingLimits()).toBe(true);
    });

    it("should detect approaching daily limits", () => {
      huggingFaceService.dailyRequestCount = 450;
      expect(huggingFaceService.isApproachingLimits()).toBe(true);
    });

    it("should detect exceeded limits", () => {
      huggingFaceService.requestCount = 6;
      expect(huggingFaceService.isApproachingLimits()).toBe(true);
    });
  });

  describe("API Calls", () => {
    it("should make successful API call", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ summary_text: "success" }]),
      });

      const result = await huggingFaceService.extractFromText("test");

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        analysis: "success",
        transactions: expect.any(Array),
        model: "facebook/bart-large-cnn",
        provider: "huggingface",
        source: "Hugging Face Analysis",
        documentType: "Financial Document",
        notes: expect.any(String),
      });
    });

    it("should handle API errors", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      });

      await expect(huggingFaceService.extractFromText("test")).rejects.toThrow(
        "Rate limit exceeded. Please try again later."
      );
    });

    it("should handle network errors", async () => {
      global.fetch.mockRejectedValue(new Error("Network error"));

      await expect(huggingFaceService.extractFromText("test")).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("Document Analysis", () => {
    it("should analyze document successfully", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ summary_text: "Document summary" }]),
      });

      const result = await huggingFaceService.extractFromText(
        "test document content"
      );

      expect(result).toEqual({
        success: true,
        analysis: "Document summary",
        transactions: expect.any(Array),
        model: "facebook/bart-large-cnn",
        provider: "huggingface",
        source: "Hugging Face Analysis",
        documentType: "Financial Document",
        notes: expect.any(String),
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("facebook/bart-large-cnn"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should handle analysis errors", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(
        huggingFaceService.extractFromText("test content")
      ).rejects.toThrow("Hugging Face API error: 500 Internal Server Error");
    });
  });

  // TODO: Fix OCR tests - they require proper canvas mocking in test environment
  // describe("OCR Text Extraction", () => {
  //   it("should extract text from image using Tesseract", async () => {
  //     const imageData = "data:image/jpeg;base64,/9j/4AAQ...";

  //     const result = await huggingFaceService.extractTextFromImage(imageData);
  //     expect(result).toEqual({
  //       success: true,
  //       text: "Sample receipt text",
  //       confidence: 85.5,
  //       words: [{ text: "Sample", confidence: 90 }],
  //     });
  //   });

  //   it("should handle OCR errors gracefully", async () => {
  //     const imageData = "data:image/jpeg;base64,error";

  //     await expect(
  //       huggingFaceService.extractTextFromImage(imageData)
  //     ).rejects.toThrow("OCR extraction failed: OCR failed");
  //   });
  // });

  // TODO: Fix two-stage analysis tests - they require proper canvas mocking in test environment
  // describe("Two-Stage Document Analysis", () => {
  //   it("should perform complete two-stage analysis", async () => {
  //     global.fetch.mockResolvedValue({
  //       ok: true,
  //       json: () => Promise.resolve([{ summary_text: "Document summary" }]),
  //     });

  //     const imageData = "data:image/jpeg;base64,/9j/4AAQ...";
  //     const result = await huggingFaceService.analyzeImage(imageData);

  //     expect(result).toBeDefined();
  //     expect(global.fetch).toHaveBeenCalled();
  //   });

  //   it("should handle OCR failure in two-stage analysis", async () => {
  //     const imageData = "data:image/jpeg;base64,error";

  //     await expect(
  //       huggingFaceService.analyzeImage(imageData)
  //     ).rejects.toThrow("OCR extraction failed: OCR failed");
  //   });
  // });

  describe("Text Processing", () => {
    it("should extract from text successfully", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ summary_text: "Extracted text" }]),
      });

      const result = await huggingFaceService.extractFromText("sample text");

      expect(result).toEqual({
        success: true,
        analysis: "Extracted text",
        transactions: expect.any(Array),
        model: "facebook/bart-large-cnn",
        provider: "huggingface",
        source: "Hugging Face Analysis",
        documentType: "Financial Document",
        notes: expect.any(String)
      });
    });

    it("should convert to transactions", async () => {
      const mockResponse = { summary_text: "Transaction data" };
      const result =
        await huggingFaceService.convertToTransactions(mockResponse);

      expect(result).toBeDefined();
    });

    it("should get processing summary", async () => {
      const mockResponse = { summary_text: "Processing complete" };
      const result =
        await huggingFaceService.getProcessingSummary(mockResponse);

      expect(result).toBeDefined();
    });

    it("should analyze transactions", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ summary_text: "Transaction analysis" }]),
      });

      const result = await huggingFaceService.analyzeTransactions([
        "text1",
        "text2",
      ]);

      expect(result).toEqual({
        success: true,
        analysis: "Transaction analysis",
        model: "facebook/bart-large-cnn",
        provider: "huggingface"
      });
    });
  });

  describe("File Validation", () => {
    it("should validate supported file types", () => {
      const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      expect(huggingFaceService.validateFile(validFile)).toBe(true);
    });

    it("should reject unsupported file types", () => {
      const invalidFile = new File(["test"], "test.txt", {
        type: "text/plain",
      });
      expect(() => huggingFaceService.validateFile(invalidFile)).toThrow(
        "Invalid file type. Please upload an image or PDF file."
      );
    });

    it("should reject files that are too large", () => {
      const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      });
      expect(() => huggingFaceService.validateFile(largeFile)).toThrow(
        "File too large. Please upload a file smaller than 10MB."
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle rate limit errors", async () => {
      huggingFaceService.requestCount = 5;
      huggingFaceService.dailyRequestCount = 500;

      await expect(huggingFaceService.extractFromText("test")).rejects.toThrow(
        "Daily rate limit exceeded"
      );
    });

    it("should handle missing API key", async () => {
      const originalKey = huggingFaceService.apiKey;
      huggingFaceService.apiKey = null;

      // Mock fetch to return an error response
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized"
      });

      await expect(huggingFaceService.extractFromText("test")).rejects.toThrow(
        "Hugging Face API error: 401 Unauthorized"
      );

      huggingFaceService.apiKey = originalKey;
    });
  });
});
