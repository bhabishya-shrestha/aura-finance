import { describe, it, expect, beforeEach, vi } from "vitest";
import geminiService from "../services/geminiService";

// Mock environment variables
vi.mock("import.meta.env", () => ({
  env: {
    VITE_GEMINI_API_KEY: "test-api-key",
  },
}));

describe("GeminiService", () => {
  let service;

  beforeEach(() => {
    service = geminiService;
    // Reset the singleton's state for each test
    service.requestCount = 0;
    service.lastRequestTime = 0;
    service.dailyRequestCount = 0;
    service.lastDailyReset = new Date().toDateString();
    vi.clearAllMocks();
  });

  describe("validateFile", () => {
    it("should accept valid file types", () => {
      const validFiles = [
        { size: 1024, type: "image/jpeg" },
        { size: 1024, type: "image/png" },
        { size: 1024, type: "image/gif" },
        { size: 1024, type: "image/webp" },
        { size: 1024, type: "application/pdf" },
      ];

      validFiles.forEach(file => {
        expect(() => service.validateFile(file)).not.toThrow();
      });
    });

    it("should reject files that are too large", () => {
      const largeFile = { size: 21 * 1024 * 1024, type: "image/jpeg" };
      expect(() => service.validateFile(largeFile)).toThrow(
        "File size too large"
      );
    });

    it("should reject unsupported file types", () => {
      const invalidFile = { size: 1024, type: "text/plain" };
      expect(() => service.validateFile(invalidFile)).toThrow(
        "File type not supported"
      );
    });
  });

  describe("checkRateLimit", () => {
    it("should allow requests within rate limit", () => {
      for (let i = 0; i < 10; i++) {
        expect(() => service.checkRateLimit()).not.toThrow();
      }
    });

    it("should throw error when rate limit exceeded", () => {
      // Make 15 requests (the limit)
      for (let i = 0; i < 15; i++) {
        service.checkRateLimit();
      }

      // 16th request should fail
      expect(() => service.checkRateLimit()).toThrow("Rate limit exceeded");
    });
  });

  describe("fileToBase64", () => {
    it("should convert file to base64", async () => {
      const file = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });
      const base64 = await service.fileToBase64(file);
      expect(base64).toBeDefined();
      expect(typeof base64).toBe("string");
    });
  });

  describe("getMimeType", () => {
    it("should return correct MIME type for file with type", () => {
      const file = { type: "image/jpeg" };
      expect(service.getMimeType(file)).toBe("image/jpeg");
    });

    it("should infer MIME type from file extension", () => {
      const files = [
        { name: "test.jpg" },
        { name: "test.png" },
        { name: "test.gif" },
        { name: "test.webp" },
        { name: "test.pdf" },
      ];

      const expectedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
      ];

      files.forEach((file, index) => {
        expect(service.getMimeType(file)).toBe(expectedTypes[index]);
      });
    });
  });

  describe("categorizeTransaction", () => {
    it("should categorize common transaction types", () => {
      const testCases = [
        { description: "WALMART", expected: "Groceries" },
        { description: "STARBUCKS", expected: "Restaurants" },
        { description: "SHELL", expected: "Transport" },
        { description: "NETFLIX", expected: "Entertainment" },
        { description: "AMAZON", expected: "Shopping" },
      ];

      testCases.forEach(({ description, expected }) => {
        expect(service.categorizeTransaction(description)).toBe(expected);
      });
    });

    it('should return "Other" for unknown transactions', () => {
      expect(service.categorizeTransaction("UNKNOWN_VENDOR")).toBe("Other");
    });
  });
});
