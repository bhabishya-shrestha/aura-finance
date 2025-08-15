import { describe, it, expect, vi, beforeEach } from "vitest";
import aiService from "../services/aiService";

// Mock the API usage service
vi.mock("../services/apiUsageService", () => ({
  default: {
    validateApiUsage: vi.fn().mockImplementation(provider => {
      if (provider === "unknown") {
        return Promise.resolve({
          success: false,
          can_proceed: false,
          current_usage: 0,
          max_requests: 0,
          remaining_requests: 0,
          approachingLimit: false,
        });
      }
      return Promise.resolve({
        success: true,
        can_proceed: true,
        current_usage: 0,
        max_requests: 150,
        remaining_requests: 150,
        approachingLimit: false,
      });
    }),
    incrementApiUsage: vi.fn().mockResolvedValue(true),
    getUserApiUsageStats: vi.fn().mockResolvedValue({
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
    }),
    isApproachingLimit: vi.fn().mockResolvedValue(false),
    hasExceededLimit: vi.fn().mockResolvedValue(false),
  },
}));

describe("AI Integration Tests", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset AI service state
    aiService.currentProvider = "gemini";

    // Reset the API usage service mock to default behavior
    const apiUsageService = await import("../services/apiUsageService");
    apiUsageService.default.validateApiUsage.mockImplementation(provider => {
      if (provider === "unknown") {
        return Promise.resolve({
          success: false,
          can_proceed: false,
          current_usage: 0,
          max_requests: 0,
          remaining_requests: 0,
          approachingLimit: false,
        });
      }
      return Promise.resolve({
        success: true,
        can_proceed: true,
        current_usage: 0,
        max_requests: 150,
        remaining_requests: 150,
        approachingLimit: false,
      });
    });
  });

  describe("Provider Switching", () => {
    it("should switch between Gemini and Hugging Face providers", async () => {
      await aiService.setProvider("gemini");
      expect(aiService.currentProvider).toBe("gemini");

      await aiService.setProvider("huggingface");
      expect(aiService.currentProvider).toBe("huggingface");
    });

    it("should provide correct provider information", async () => {
      await aiService.setProvider("gemini");
      const geminiInfo = aiService.getCurrentProvider();
      expect(geminiInfo.name).toBe("Gemini API");

      await aiService.setProvider("huggingface");
      const huggingFaceInfo = aiService.getCurrentProvider();
      expect(huggingFaceInfo.name).toBe("Hugging Face Inference API");
    });
  });

  describe("Rate Limit Monitoring", () => {
    it("should detect approaching limits for Gemini", async () => {
      await aiService.setProvider("gemini");
      const info = aiService.getCurrentProvider();

      expect(info.quotas).toBeDefined();
      expect(info.quotas.maxDailyRequests).toBe(150);
      expect(info.quotas.maxRequests).toBe(15);
    });

    it("should detect approaching limits for Hugging Face", async () => {
      await aiService.setProvider("huggingface");
      const info = aiService.getCurrentProvider();

      expect(info.quotas).toBeDefined();
      expect(info.quotas.maxDailyRequests).toBe(500);
      expect(info.quotas.maxRequests).toBe(5);
    });
  });

  describe("Provider Comparison", () => {
    it("should return accurate provider comparison", async () => {
      const comparison = await aiService.getProviderComparison();

      // Find providers in the array
      const gemini = comparison.find(p => p.key === "gemini");
      const huggingface = comparison.find(p => p.key === "huggingface");

      expect(gemini.name).toBe("Gemini API");
      expect(huggingface.name).toBe("Hugging Face Inference API");
      expect(gemini.quotas.maxDailyRequests).toBe(150);
      expect(huggingface.quotas.maxDailyRequests).toBe(500);
    });
  });

  describe("Error Handling", () => {
    it("should handle provider unavailability gracefully", async () => {
      expect(await aiService.isProviderAvailable("gemini")).toBe(true);
      expect(await aiService.isProviderAvailable("huggingface")).toBe(true);
      expect(await aiService.isProviderAvailable("unknown")).toBe(false);
    });

    it("should throw error for unknown provider", async () => {
      await expect(aiService.setProvider("unknown")).rejects.toThrow(
        "Invalid provider: unknown"
      );
    });
  });

  describe("Settings Integration", () => {
    it("should provide rate limit information for settings UI", async () => {
      await aiService.setProvider("gemini");
      const geminiInfo = aiService.getCurrentProvider();

      expect(geminiInfo.quotas).toBeDefined();
      expect(geminiInfo.quotas.maxDailyRequests).toBe(150);
      expect(geminiInfo.quotas.maxRequests).toBe(15);

      await aiService.setProvider("huggingface");
      const huggingFaceInfo = aiService.getCurrentProvider();

      expect(huggingFaceInfo.quotas).toBeDefined();
      expect(huggingFaceInfo.quotas.maxDailyRequests).toBe(500);
      expect(huggingFaceInfo.quotas.maxRequests).toBe(5);
    });

    it("should provide feature information for settings UI", async () => {
      await aiService.setProvider("gemini");
      const geminiInfo = aiService.getCurrentProvider();

      expect(geminiInfo.features).toBeDefined();
      expect(Array.isArray(geminiInfo.features)).toBe(true);

      await aiService.setProvider("huggingface");
      const huggingFaceInfo = aiService.getCurrentProvider();

      expect(huggingFaceInfo.features).toBeDefined();
      expect(Array.isArray(huggingFaceInfo.features)).toBe(true);
    });
  });

  describe("API Usage Integration", () => {
    it("should validate API usage before operations", async () => {
      const apiUsageService = await import("../services/apiUsageService");

      await aiService.setProvider("gemini");

      expect(apiUsageService.default.validateApiUsage).toHaveBeenCalledWith(
        "gemini"
      );
    });

    it("should handle API usage validation failures", async () => {
      const apiUsageService = await import("../services/apiUsageService");
      apiUsageService.default.validateApiUsage.mockResolvedValue({
        success: false,
        can_proceed: false,
        current_usage: 150,
        max_requests: 150,
        remaining_requests: 0,
        approachingLimit: true,
      });

      // Should handle gracefully by disabling the provider instead of throwing
      await aiService.setProvider("gemini");
      expect(aiService.currentProvider).toBe(null); // Provider should be disabled
    });
  });

  describe("Provider State Management", () => {
    it("should maintain provider state across operations", async () => {
      await aiService.setProvider("huggingface");
      expect(aiService.currentProvider).toBe("huggingface");

      // Simulate some operations
      const info = aiService.getCurrentProvider();
      expect(info.name).toBe("Hugging Face Inference API");

      // Provider should remain the same
      expect(aiService.currentProvider).toBe("huggingface");
    });

    it("should handle provider switching with validation", async () => {
      // Switch to Hugging Face
      await aiService.setProvider("huggingface");
      expect(aiService.currentProvider).toBe("huggingface");

      // Switch back to Gemini
      await aiService.setProvider("gemini");
      expect(aiService.currentProvider).toBe("gemini");
    });
  });
});
