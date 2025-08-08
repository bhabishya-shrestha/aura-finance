import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock the individual services
vi.mock("../services/geminiService.js", () => ({
  default: {
    analyzeImage: vi.fn(),
    extractFromText: vi.fn(),
    convertToTransactions: vi.fn(),
    getProcessingSummary: vi.fn(),
    analyzeTransactions: vi.fn(),
    validateFile: vi.fn(),
    isProviderAvailable: vi.fn(() => true),
    dailyRequestCount: 0,
    requestCount: 0,
    isApproachingLimits: vi.fn(),
  },
}));

vi.mock("../services/huggingFaceService.js", () => ({
  default: {
    analyzeImage: vi.fn(),
    extractFromText: vi.fn(),
    convertToTransactions: vi.fn(),
    getProcessingSummary: vi.fn(),
    analyzeTransactions: vi.fn(),
    validateFile: vi.fn(),
    isProviderAvailable: vi.fn(() => true),
    dailyRequestCount: 0,
    requestCount: 0,
    isApproachingLimits: vi.fn(),
  },
}));

// Mock the API usage service with a working mock
vi.mock("../services/apiUsageService", () => {
  const mockValidateApiUsage = vi.fn().mockResolvedValue({
    success: true,
    can_proceed: true,
    current_usage: 0,
    max_requests: 150,
    remaining_requests: 150,
    approachingLimit: false,
  });

  const mockIncrementApiUsage = vi.fn().mockResolvedValue(true);

  const mockGetUserApiUsageStats = vi.fn().mockResolvedValue({
    success: true,
    gemini: {
      current_usage: 0,
      max_requests: 150,
      remaining_requests: 150,
      approaching_limit: false,
    },
    huggingface: {
      current_usage: 0,
      max_requests: 500,
      remaining_requests: 500,
      approaching_limit: false,
    },
  });

  const mockIsApproachingLimit = vi.fn().mockResolvedValue(false);
  const mockHasExceededLimit = vi.fn().mockResolvedValue(false);

  return {
    default: {
      validateApiUsage: mockValidateApiUsage,
      incrementApiUsage: mockIncrementApiUsage,
      getUserApiUsageStats: mockGetUserApiUsageStats,
      isApproachingLimit: mockIsApproachingLimit,
      hasExceededLimit: mockHasExceededLimit,
    },
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Now import the services after mocking
import aiService from "../services/aiService";
import geminiService from "../services/geminiService.js";
import huggingFaceService from "../services/huggingFaceService.js";
import apiUsageService from "../services/apiUsageService";

describe("AIService", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Ensure the mock is properly set up
    apiUsageService.validateApiUsage.mockResolvedValue({
      success: true,
      can_proceed: true,
      current_usage: 0,
      max_requests: 150,
      remaining_requests: 150,
      approachingLimit: false,
    });

    apiUsageService.incrementApiUsage.mockResolvedValue(true);

    // Set up default mock responses for service methods
    geminiService.analyzeImage.mockResolvedValue({
      success: true,
      text: "extracted text",
    });
    geminiService.extractFromText.mockResolvedValue({
      success: true,
      text: "extracted text",
    });
    geminiService.convertToTransactions.mockResolvedValue([
      { id: 1, amount: 100 },
    ]);
    geminiService.getProcessingSummary.mockResolvedValue({
      summary: "Processing complete",
    });
    geminiService.analyzeTransactions.mockResolvedValue({
      analysis: "Transaction analysis",
    });
    geminiService.validateFile.mockResolvedValue(true);

    huggingFaceService.analyzeImage.mockResolvedValue({
      success: true,
      text: "extracted text",
    });
    huggingFaceService.extractFromText.mockResolvedValue({
      success: true,
      text: "extracted text",
    });
    huggingFaceService.convertToTransactions.mockResolvedValue([
      { id: 1, amount: 100 },
    ]);
    huggingFaceService.getProcessingSummary.mockResolvedValue({
      summary: "Processing complete",
    });
    huggingFaceService.analyzeTransactions.mockResolvedValue({
      analysis: "Transaction analysis",
    });
    huggingFaceService.validateFile.mockResolvedValue(true);

    // Reset AI service state
    aiService.currentProvider = "gemini";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default provider", () => {
      expect(aiService.currentProvider).toBe("gemini");
    });

    it("should have correct provider configuration", () => {
      const providers = aiService.providers;
      expect(providers.gemini).toBeDefined();
      expect(providers.huggingface).toBeDefined();
      expect(providers.gemini.name).toBe("Gemini API");
      expect(providers.huggingface.name).toBe("Hugging Face Inference API");
    });
  });

  describe("Provider Management", () => {
    it("should set provider successfully", async () => {
      await aiService.setProvider("huggingface");
      expect(aiService.currentProvider).toBe("huggingface");
    });

    it("should validate API usage when setting provider", async () => {
      await aiService.setProvider("gemini");
      expect(apiUsageService.validateApiUsage).toHaveBeenCalledWith("gemini");
    });

    it("should throw error for invalid provider", async () => {
      await expect(aiService.setProvider("invalid")).rejects.toThrow(
        "Invalid provider: invalid"
      );
    });
  });

  describe("Provider Availability", () => {
    it("should return true for valid providers", async () => {
      expect(await aiService.isProviderAvailable("gemini")).toBe(true);
      expect(await aiService.isProviderAvailable("huggingface")).toBe(true);
    });

    it("should return false for invalid providers", async () => {
      // Mock the validation to fail for invalid provider
      apiUsageService.validateApiUsage.mockRejectedValueOnce(
        new Error("Invalid provider")
      );
      expect(await aiService.isProviderAvailable("invalid")).toBe(false);
    });

    it("should get current provider info", () => {
      const info = aiService.getCurrentProvider();
      expect(info.name).toBe("Gemini API");
      expect(info.quotas).toBeDefined();
    });
  });

  describe("Current Provider Info", () => {
    it("should return correct Gemini info", () => {
      aiService.currentProvider = "gemini";
      const info = aiService.getCurrentProvider();
      expect(info.name).toBe("Gemini API");
      expect(info.quotas.maxDailyRequests).toBe(150);
    });

    it("should return correct Hugging Face info", () => {
      aiService.currentProvider = "huggingface";
      const info = aiService.getCurrentProvider();
      expect(info.name).toBe("Hugging Face Inference API");
      expect(info.quotas.maxDailyRequests).toBe(500);
    });
  });

  describe("Service Delegation", () => {
    it("should delegate analyzeImage to current provider", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockResponse = { success: true, text: "extracted text" };
      geminiService.analyzeImage.mockResolvedValue(mockResponse);

      const result = await aiService.analyzeImage(mockFile);

      expect(geminiService.analyzeImage).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockResponse);
    });

    it("should delegate extractFromText to current provider", async () => {
      const mockText = "sample text";
      const mockResponse = { success: true, text: "extracted text" };
      geminiService.extractFromText.mockResolvedValue(mockResponse);

      const result = await aiService.extractFromText(mockText);

      expect(geminiService.extractFromText).toHaveBeenCalledWith(mockText);
      expect(result).toEqual(mockResponse);
    });

    it("should delegate convertToTransactions to current provider", async () => {
      const mockResponse = { data: "test" };
      const mockTransactions = [{ id: 1, amount: 100 }];
      geminiService.convertToTransactions.mockResolvedValue(mockTransactions);

      const result = await aiService.convertToTransactions(mockResponse);

      expect(geminiService.convertToTransactions).toHaveBeenCalledWith(
        mockResponse
      );
      expect(result).toEqual(mockTransactions);
    });

    it("should delegate getProcessingSummary to current provider", async () => {
      const mockResponse = { data: "test" };
      const mockSummary = { summary: "Processing complete" };
      geminiService.getProcessingSummary.mockResolvedValue(mockSummary);

      const result = await aiService.getProcessingSummary(mockResponse);

      expect(geminiService.getProcessingSummary).toHaveBeenCalledWith(
        mockResponse
      );
      expect(result).toEqual(mockSummary);
    });

    it("should delegate analyzeTransactions to current provider", async () => {
      const mockTexts = ["text1", "text2"];
      const mockPrompt = "test prompt";
      const mockResponse = { analysis: "Transaction analysis" };
      geminiService.analyzeTransactions.mockResolvedValue(mockResponse);

      const result = await aiService.analyzeTransactions(mockTexts, mockPrompt);

      expect(geminiService.analyzeTransactions).toHaveBeenCalledWith(
        mockTexts,
        mockPrompt
      );
      expect(result).toEqual(mockResponse);
    });

    it("should delegate validateFile to current provider", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      geminiService.validateFile.mockResolvedValue(true);

      const result = await aiService.validateFile(mockFile);

      expect(geminiService.validateFile).toHaveBeenCalledWith(mockFile);
      expect(result).toBe(true);
    });
  });

  describe("Provider Comparison", () => {
    it("should return provider comparison", async () => {
      const comparison = await aiService.getProviderComparison();
      expect(Array.isArray(comparison)).toBe(true);
      expect(comparison.length).toBeGreaterThan(0);

      const gemini = comparison.find(p => p.key === "gemini");
      const huggingface = comparison.find(p => p.key === "huggingface");

      expect(gemini).toBeDefined();
      expect(huggingface).toBeDefined();
    });
  });

  describe("No Fallback Logic", () => {
    it("should not fallback from Gemini to Hugging Face on error", async () => {
      // Mock API usage validation to allow the operation
      apiUsageService.validateApiUsage.mockResolvedValue({
        success: true,
        can_proceed: true,
        current_usage: 0,
        max_requests: 150,
        remaining_requests: 150,
        approachingLimit: false,
      });

      geminiService.analyzeImage.mockRejectedValue(new Error("Gemini failed"));
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      await aiService.setProvider("gemini");

      await expect(aiService.analyzeImage(mockFile)).rejects.toThrow(
        "Gemini failed"
      );
    });

    it("should not fallback from Hugging Face to Gemini on error", async () => {
      // Mock API usage validation to allow the operation
      apiUsageService.validateApiUsage.mockResolvedValue({
        success: true,
        can_proceed: true,
        current_usage: 0,
        max_requests: 500,
        remaining_requests: 500,
        approachingLimit: false,
      });

      huggingFaceService.analyzeImage.mockRejectedValue(
        new Error("Hugging Face failed")
      );
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      await aiService.setProvider("huggingface");

      await expect(aiService.analyzeImage(mockFile)).rejects.toThrow(
        "Hugging Face failed"
      );
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete workflow with provider switching", async () => {
      // Mock API usage validation to allow all operations
      apiUsageService.validateApiUsage.mockResolvedValue({
        success: true,
        can_proceed: true,
        current_usage: 0,
        max_requests: 150,
        remaining_requests: 150,
        approachingLimit: false,
      });

      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockImageResponse = { success: true, text: "extracted text" };
      const mockTextResponse = { success: true, text: "processed text" };

      geminiService.analyzeImage.mockResolvedValue(mockImageResponse);
      geminiService.extractFromText.mockResolvedValue(mockTextResponse);

      // Analyze image with Gemini
      const imageResult = await aiService.analyzeImage(mockFile);
      expect(imageResult).toEqual(mockImageResponse);
      expect(aiService.currentProvider).toBe("gemini");

      // Switch to Hugging Face
      await aiService.setProvider("huggingface");
      expect(aiService.currentProvider).toBe("huggingface");

      // Extract text with Hugging Face - should return the mocked response
      const textResult = await aiService.extractFromText("sample text");
      // The result will include serverUsageValidation, so we check for the expected properties
      expect(textResult.success).toBe(true);
      expect(textResult.text).toBe("extracted text");
      expect(textResult.serverUsageValidation).toBeDefined();
    });

    it("should maintain provider state across multiple operations", async () => {
      // Mock API usage validation to allow all operations
      apiUsageService.validateApiUsage.mockResolvedValue({
        success: true,
        can_proceed: true,
        current_usage: 0,
        max_requests: 500,
        remaining_requests: 500,
        approachingLimit: false,
      });

      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      // Set provider to Hugging Face
      await aiService.setProvider("huggingface");
      expect(aiService.currentProvider).toBe("huggingface");

      // Validate file
      const isValid = await aiService.validateFile(mockFile);
      expect(isValid).toBe(true);
      expect(aiService.currentProvider).toBe("huggingface");

      // Analyze image
      const result = await aiService.analyzeImage(mockFile);
      expect(result).toBeDefined();
      expect(aiService.currentProvider).toBe("huggingface");
    });
  });
});
