import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import aiService from "../services/aiService";

// Mock environment variables
vi.mock("import.meta.env", () => ({
  env: {
    VITE_GEMINI_API_KEY: "test_gemini_key",
    VITE_HUGGINGFACE_API_KEY: "test_huggingface_key",
  },
}));

// Mock the individual services
vi.mock("../services/geminiService", () => ({
  default: {
    analyzeImage: vi.fn(),
    extractFromText: vi.fn(),
    convertToTransactions: vi.fn(),
    getProcessingSummary: vi.fn(),
    analyzeTransactions: vi.fn(),
    validateFile: vi.fn(),
    dailyRequestCount: 0,
    requestCount: 0,
  },
}));

vi.mock("../services/huggingFaceService", () => ({
  default: {
    analyzeImage: vi.fn(),
    extractFromText: vi.fn(),
    convertToTransactions: vi.fn(),
    getProcessingSummary: vi.fn(),
    analyzeTransactions: vi.fn(),
    validateFile: vi.fn(),
    dailyRequestCount: 0,
    requestCount: 0,
  },
}));

describe("AIService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default provider
    aiService.setProvider("gemini");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with correct default provider", () => {
      expect(aiService.currentProvider).toBe("gemini");
    });

    it("should have both providers configured", () => {
      const providers = aiService.getAvailableProviders();
      expect(providers.gemini).toBeDefined();
      expect(providers.huggingface).toBeDefined();
    });

    it("should have correct provider information", () => {
      const providers = aiService.getAvailableProviders();

      expect(providers.gemini.name).toBe("Google Gemini API");
      expect(providers.gemini.quotas.maxDailyRequests).toBe(150);
      expect(providers.gemini.quotas.maxRequests).toBe(15);

      expect(providers.huggingface.name).toBe("Hugging Face Inference API");
      expect(providers.huggingface.quotas.maxDailyRequests).toBe(500);
      expect(providers.huggingface.quotas.maxRequests).toBe(5);
    });
  });

  describe("Provider Management", () => {
    it("should switch to Hugging Face provider", () => {
      aiService.setProvider("huggingface");
      expect(aiService.currentProvider).toBe("huggingface");
    });

    it("should switch back to Gemini provider", () => {
      aiService.setProvider("huggingface");
      aiService.setProvider("gemini");
      expect(aiService.currentProvider).toBe("gemini");
    });

    it("should warn for unknown provider", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      aiService.setProvider("unknown");

      expect(consoleSpy).toHaveBeenCalledWith(
        "AI Service: Unknown provider unknown, keeping current provider"
      );
      expect(aiService.currentProvider).toBe("gemini"); // Should keep current provider

      consoleSpy.mockRestore();
    });

    it("should log provider switch", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      aiService.setProvider("huggingface");

      expect(consoleSpy).toHaveBeenCalledWith(
        "AI Service: Switched to Hugging Face Inference API"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Provider Availability", () => {
    it("should detect Gemini as available", () => {
      expect(aiService.isProviderAvailable("gemini")).toBe(true);
    });

    it("should detect Hugging Face as available", () => {
      expect(aiService.isProviderAvailable("huggingface")).toBe(true);
    });

    it("should detect unknown provider as unavailable", () => {
      expect(aiService.isProviderAvailable("unknown")).toBe(false);
    });
  });

  describe("Current Provider Info", () => {
    it("should return correct Gemini provider info", () => {
      aiService.setProvider("gemini");
      const info = aiService.getCurrentProvider();

      expect(info.name).toBe("Google Gemini API");
      expect(info.quotas.maxDailyRequests).toBe(150);
      expect(info.quotas.maxRequests).toBe(15);
      expect(info.pricing).toBe("Free Tier");
    });

    it("should return correct Hugging Face provider info", () => {
      aiService.setProvider("huggingface");
      const info = aiService.getCurrentProvider();

      expect(info.name).toBe("Hugging Face Inference API");
      expect(info.quotas.maxDailyRequests).toBe(500);
      expect(info.quotas.maxRequests).toBe(5);
      expect(info.pricing).toBe("Free Tier");
    });
  });

  describe("Service Delegation", () => {
    it("should delegate analyzeImage to current provider", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockResponse = { success: true, text: "test" };

      // Mock Gemini service
      const geminiService = await import("../services/geminiService");
      geminiService.default.analyzeImage.mockResolvedValue(mockResponse);

      aiService.setProvider("gemini");
      const result = await aiService.analyzeImage(mockFile);

      expect(geminiService.default.analyzeImage).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockResponse);
    });

    it("should delegate extractFromText to current provider", () => {
      const mockText = "test text";
      const mockResponse = { transactions: [] };

      const geminiService = require("../services/geminiService");
      geminiService.default.extractFromText.mockReturnValue(mockResponse);

      aiService.setProvider("gemini");
      const result = aiService.extractFromText(mockText);

      expect(geminiService.default.extractFromText).toHaveBeenCalledWith(
        mockText
      );
      expect(result).toEqual(mockResponse);
    });

    it("should delegate convertToTransactions to current provider", () => {
      const mockResponse = { data: "test" };
      const mockTransactions = [{ id: 1 }];

      const geminiService = require("../services/geminiService");
      geminiService.default.convertToTransactions.mockReturnValue(
        mockTransactions
      );

      aiService.setProvider("gemini");
      const result = aiService.convertToTransactions(mockResponse);

      expect(geminiService.default.convertToTransactions).toHaveBeenCalledWith(
        mockResponse
      );
      expect(result).toEqual(mockTransactions);
    });

    it("should delegate getProcessingSummary to current provider", () => {
      const mockResponse = { data: "test" };
      const mockSummary = { total: 1 };

      const geminiService = require("../services/geminiService");
      geminiService.default.getProcessingSummary.mockReturnValue(mockSummary);

      aiService.setProvider("gemini");
      const result = aiService.getProcessingSummary(mockResponse);

      expect(geminiService.default.getProcessingSummary).toHaveBeenCalledWith(
        mockResponse
      );
      expect(result).toEqual(mockSummary);
    });

    it("should delegate analyzeTransactions to current provider", async () => {
      const mockTexts = ["text1", "text2"];
      const mockPrompt = "test prompt";
      const mockResponse = { suggestions: "test" };

      const geminiService = await import("../services/geminiService");
      geminiService.default.analyzeTransactions.mockResolvedValue(mockResponse);

      aiService.setProvider("gemini");
      const result = await aiService.analyzeTransactions(mockTexts, mockPrompt);

      expect(geminiService.default.analyzeTransactions).toHaveBeenCalledWith(
        mockTexts,
        mockPrompt
      );
      expect(result).toEqual(mockResponse);
    });

    it("should delegate validateFile to current provider", () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      const geminiService = require("../services/geminiService");
      geminiService.default.validateFile.mockReturnValue(true);

      aiService.setProvider("gemini");
      const result = aiService.validateFile(mockFile);

      expect(geminiService.default.validateFile).toHaveBeenCalledWith(mockFile);
      expect(result).toBe(true);
    });
  });

  describe("Fallback Logic", () => {
    it("should fallback from Gemini to Hugging Face on error", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockResponse = { success: true, text: "fallback response" };

      const geminiService = await import("../services/geminiService");
      const huggingFaceService = await import("../services/huggingFaceService");

      geminiService.default.analyzeImage.mockRejectedValue(
        new Error("Gemini failed")
      );
      huggingFaceService.default.analyzeImage.mockResolvedValue(mockResponse);

      aiService.setProvider("gemini");
      const result = await aiService.analyzeImage(mockFile);

      expect(geminiService.default.analyzeImage).toHaveBeenCalledWith(mockFile);
      expect(huggingFaceService.default.analyzeImage).toHaveBeenCalledWith(
        mockFile
      );
      expect(result).toEqual(mockResponse);
      expect(aiService.currentProvider).toBe("huggingface");
    });

    it("should fallback from Hugging Face to Gemini on error", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockResponse = { success: true, text: "fallback response" };

      const geminiService = await import("../services/geminiService");
      const huggingFaceService = await import("../services/huggingFaceService");

      huggingFaceService.default.analyzeImage.mockRejectedValue(
        new Error("Hugging Face failed")
      );
      geminiService.default.analyzeImage.mockResolvedValue(mockResponse);

      aiService.setProvider("huggingface");
      const result = await aiService.analyzeImage(mockFile);

      expect(huggingFaceService.default.analyzeImage).toHaveBeenCalledWith(
        mockFile
      );
      expect(geminiService.default.analyzeImage).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockResponse);
      expect(aiService.currentProvider).toBe("gemini");
    });

    it("should not fallback if alternative provider is unavailable", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      // Mock environment to remove Hugging Face key
      const originalEnv = import.meta.env;
      import.meta.env.VITE_HUGGINGFACE_API_KEY = null;

      const geminiService = await import("../services/geminiService");
      geminiService.default.analyzeImage.mockRejectedValue(
        new Error("Gemini failed")
      );

      aiService.setProvider("gemini");

      await expect(aiService.analyzeImage(mockFile)).rejects.toThrow(
        "Gemini failed"
      );

      // Restore environment
      import.meta.env = originalEnv;
    });

    it("should log fallback warnings", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockResponse = { success: true, text: "fallback response" };

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const geminiService = await import("../services/geminiService");
      const huggingFaceService = await import("../services/huggingFaceService");

      geminiService.default.analyzeImage.mockRejectedValue(
        new Error("Gemini failed")
      );
      huggingFaceService.default.analyzeImage.mockResolvedValue(mockResponse);

      aiService.setProvider("gemini");
      await aiService.analyzeImage(mockFile);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Gemini API failed, falling back to Hugging Face"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Rate Limit Information", () => {
    it("should return correct rate limit info for Gemini", () => {
      aiService.setProvider("gemini");
      const info = aiService.getRateLimitInfo();

      expect(info.provider).toBe("gemini");
      expect(info.providerName).toBe("Google Gemini API");
      expect(info.quotas.maxDailyRequests).toBe(150);
      expect(info.quotas.maxRequests).toBe(15);
    });

    it("should return correct rate limit info for Hugging Face", () => {
      aiService.setProvider("huggingface");
      const info = aiService.getRateLimitInfo();

      expect(info.provider).toBe("huggingface");
      expect(info.providerName).toBe("Hugging Face Inference API");
      expect(info.quotas.maxDailyRequests).toBe(500);
      expect(info.quotas.maxRequests).toBe(5);
    });
  });

  describe("Approaching Limits Check", () => {
    it("should detect when approaching daily limits", () => {
      aiService.setProvider("gemini");

      // Mock service with high usage
      const geminiService = require("../services/geminiService");
      geminiService.default.dailyRequestCount = 120; // 80% of 150
      geminiService.default.requestCount = 12; // 80% of 15

      const limits = aiService.isApproachingLimits();

      expect(limits.daily).toBe(true);
      expect(limits.minute).toBe(true);
      expect(limits.dailyUsage).toBe(120);
      expect(limits.minuteUsage).toBe(12);
      expect(limits.dailyLimit).toBe(150);
      expect(limits.minuteLimit).toBe(15);
    });

    it("should not detect approaching limits when usage is low", () => {
      aiService.setProvider("huggingface");

      // Mock service with low usage
      const huggingFaceService = require("../services/huggingFaceService");
      huggingFaceService.default.dailyRequestCount = 100; // 20% of 500
      huggingFaceService.default.requestCount = 1; // 20% of 5

      const limits = aiService.isApproachingLimits();

      expect(limits.daily).toBe(false);
      expect(limits.minute).toBe(false);
    });
  });

  describe("Provider Comparison", () => {
    it("should return provider comparison for settings UI", () => {
      const comparison = aiService.getProviderComparison();

      expect(comparison).toHaveLength(2);

      const gemini = comparison.find(p => p.key === "gemini");
      const huggingface = comparison.find(p => p.key === "huggingface");

      expect(gemini).toBeDefined();
      expect(gemini.name).toBe("Google Gemini API");
      expect(gemini.available).toBe(true);

      expect(huggingface).toBeDefined();
      expect(huggingface.name).toBe("Hugging Face Inference API");
      expect(huggingface.available).toBe(true);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete workflow with provider switching", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockImageResponse = { success: true, text: "extracted text" };
      const mockTransactionResponse = { transactions: [{ id: 1 }] };

      const geminiService = await import("../services/geminiService");
      const huggingFaceService = await import("../services/huggingFaceService");

      // Start with Gemini, but it fails
      geminiService.default.analyzeImage.mockRejectedValue(
        new Error("Gemini failed")
      );
      huggingFaceService.default.analyzeImage.mockResolvedValue(
        mockImageResponse
      );
      huggingFaceService.default.extractFromText.mockResolvedValue(
        mockTransactionResponse
      );

      aiService.setProvider("gemini");

      // This should trigger fallback to Hugging Face
      const imageResult = await aiService.analyzeImage(mockFile);
      expect(imageResult).toEqual(mockImageResponse);
      expect(aiService.currentProvider).toBe("huggingface");

      // Now extract transactions using Hugging Face
      const transactionResult = await aiService.extractFromText("test text");
      expect(transactionResult).toEqual(mockTransactionResponse);
    });

    it("should maintain provider state across multiple operations", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockResponse = { success: true, text: "test" };

      const huggingFaceService = await import("../services/huggingFaceService");
      huggingFaceService.default.analyzeImage.mockResolvedValue(mockResponse);
      huggingFaceService.default.validateFile.mockReturnValue(true);

      aiService.setProvider("huggingface");

      // Validate file
      const isValid = aiService.validateFile(mockFile);
      expect(isValid).toBe(true);
      expect(aiService.currentProvider).toBe("huggingface");

      // Analyze image
      const result = await aiService.analyzeImage(mockFile);
      expect(result).toEqual(mockResponse);
      expect(aiService.currentProvider).toBe("huggingface");
    });
  });
});
