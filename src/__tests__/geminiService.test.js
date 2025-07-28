import { describe, it, expect, vi, beforeEach } from "vitest";
import geminiService from "../services/geminiService";

// Mock environment variables
vi.mock("import.meta.env", () => ({
  env: {
    VITE_GEMINI_API_KEY: "test-api-key",
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe("GeminiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure API key is set for tests
    geminiService.apiKey = "test-api-key";
  });

  describe("fileToBase64", () => {
    it("should convert file to base64", async () => {
      const mockFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      const result = await geminiService.fileToBase64(mockFile);
      expect(result).toBe("dGVzdCBjb250ZW50");
    });

    it("should handle file read errors", async () => {
      const mockFile = new File(["test"], "test.txt");
      const mockReader = {
        readAsDataURL: vi.fn(),
        onload: null,
        onerror: null,
      };

      global.FileReader = vi.fn(() => mockReader);

      const promise = geminiService.fileToBase64(mockFile);
      mockReader.onerror(new Error("Read error"));

      await expect(promise).rejects.toThrow("Read error");
    });
  });

  describe("getMimeType", () => {
    it("should return file type if available", () => {
      const file = { type: "image/jpeg", name: "test.jpg" };
      expect(geminiService.getMimeType(file)).toBe("image/jpeg");
    });

    it("should infer mime type from extension", () => {
      const file = { name: "test.png" };
      expect(geminiService.getMimeType(file)).toBe("image/png");
    });

    it("should default to image/jpeg for unknown extensions", () => {
      const file = { name: "test.unknown" };
      expect(geminiService.getMimeType(file)).toBe("image/jpeg");
    });
  });

  describe("categorizeTransaction", () => {
    it("should categorize grocery transactions", () => {
      expect(geminiService.categorizeTransaction("Walmart Grocery")).toBe(
        "Groceries"
      );
      expect(geminiService.categorizeTransaction("SAFEWAY")).toBe("Groceries");
    });

    it("should categorize restaurant transactions", () => {
      expect(geminiService.categorizeTransaction("McDonald's")).toBe(
        "Restaurants"
      );
      expect(geminiService.categorizeTransaction("Starbucks Coffee")).toBe(
        "Restaurants"
      );
    });

    it("should categorize transport transactions", () => {
      expect(geminiService.categorizeTransaction("Shell Gas Station")).toBe(
        "Transport"
      );
      expect(geminiService.categorizeTransaction("Uber Ride")).toBe(
        "Transport"
      );
    });

    it("should return Other for unknown categories", () => {
      expect(geminiService.categorizeTransaction("Random Place")).toBe("Other");
      expect(geminiService.categorizeTransaction("")).toBe("Other");
    });
  });

  describe("convertToTransactions", () => {
    it("should convert valid Gemini response to transactions", () => {
      const mockResponse = {
        documentType: "Receipt",
        source: "Walmart",
        confidence: "high",
        transactions: [
          {
            date: "2024-01-15",
            description: "Walmart Grocery",
            amount: 45.67,
            type: "expense",
            category: "Groceries",
          },
        ],
      };

      const result = geminiService.convertToTransactions(mockResponse);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        description: "Walmart Grocery",
        amount: 45.67,
        category: "Groceries",
        type: "expense",
        source: "gemini-ocr",
        confidence: "high",
      });
      expect(result[0].id).toBeDefined();
      expect(result[0].date).toBeInstanceOf(Date);
    });

    it("should handle empty transactions array", () => {
      const mockResponse = {
        documentType: "Receipt",
        source: "Walmart",
        confidence: "low",
        transactions: [],
      };

      const result = geminiService.convertToTransactions(mockResponse);
      expect(result).toHaveLength(0);
    });

    it("should handle missing transactions property", () => {
      const mockResponse = {
        documentType: "Receipt",
        source: "Walmart",
        confidence: "medium",
      };

      const result = geminiService.convertToTransactions(mockResponse);
      expect(result).toHaveLength(0);
    });

    it("should use default values for missing fields", () => {
      const mockResponse = {
        transactions: [
          {
            description: "Test Transaction",
          },
        ],
      };

      const result = geminiService.convertToTransactions(mockResponse);

      expect(result[0]).toMatchObject({
        description: "Test Transaction",
        amount: 0,
        category: "Other",
        type: "expense",
        confidence: "low",
      });
    });
  });

  describe("analyzeImage", () => {
    beforeEach(() => {
      // Mock FileReader for all analyzeImage tests
      global.FileReader = vi.fn(() => ({
        readAsDataURL: vi.fn(),
        onload: null,
        onerror: null,
      }));
    });

    it("should throw error if API key is not configured", async () => {
      // Temporarily remove API key
      geminiService.apiKey = undefined;

      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      await expect(geminiService.analyzeImage(mockFile)).rejects.toThrow(
        "Gemini API key not configured"
      );
    });

    it("should make API request with correct parameters", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      // Mock FileReader to return base64 data
      const mockReader = {
        readAsDataURL: vi.fn(),
        onload: null,
        onerror: null,
      };
      global.FileReader = vi.fn(() => mockReader);

      // Mock successful API response
      const mockApiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    documentType: "Receipt",
                    source: "Walmart",
                    confidence: "high",
                    transactions: [
                      {
                        date: "2024-01-15",
                        description: "Walmart Grocery",
                        amount: 45.67,
                        type: "expense",
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      // Trigger the FileReader onload with base64 data
      const promise = geminiService.analyzeImage(mockFile);
      mockReader.onload({
        target: { result: "data:image/jpeg;base64,dGVzdA==" },
      });
      const result = await promise;

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("generativelanguage.googleapis.com"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining("test"),
        })
      );

      expect(result).toMatchObject({
        documentType: "Receipt",
        source: "Walmart",
        confidence: "high",
      });
    });

    it("should handle API errors", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      // Mock FileReader to return base64 data
      const mockReader = {
        readAsDataURL: vi.fn(),
        onload: null,
        onerror: null,
      };
      global.FileReader = vi.fn(() => mockReader);

      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
        json: async () => ({ error: { message: "Invalid API key" } }),
      });

      // Trigger the FileReader onload with base64 data
      const promise = geminiService.analyzeImage(mockFile);
      mockReader.onload({
        target: { result: "data:image/jpeg;base64,dGVzdA==" },
      });

      await expect(promise).rejects.toThrow(
        "Gemini API error: Invalid API key"
      );
    });

    it("should handle invalid API response", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      // Mock FileReader to return base64 data
      const mockReader = {
        readAsDataURL: vi.fn(),
        onload: null,
        onerror: null,
      };
      global.FileReader = vi.fn(() => mockReader);

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: "response" }),
      });

      // Trigger the FileReader onload with base64 data
      const promise = geminiService.analyzeImage(mockFile);
      mockReader.onload({
        target: { result: "data:image/jpeg;base64,dGVzdA==" },
      });

      await expect(promise).rejects.toThrow("Invalid response from Gemini API");
    });

    it("should handle non-JSON response text", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      // Mock FileReader to return base64 data
      const mockReader = {
        readAsDataURL: vi.fn(),
        onload: null,
        onerror: null,
      };
      global.FileReader = vi.fn(() => mockReader);

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: "This is not JSON, just plain text",
                  },
                ],
              },
            },
          ],
        }),
      });

      // Trigger the FileReader onload with base64 data
      const promise = geminiService.analyzeImage(mockFile);
      mockReader.onload({
        target: { result: "data:image/jpeg;base64,dGVzdA==" },
      });
      const result = await promise;

      expect(result).toMatchObject({
        documentType: "Unknown",
        source: "Unknown",
        transactions: [],
        confidence: "low",
        notes: "This is not JSON, just plain text",
      });
    });
  });
});
