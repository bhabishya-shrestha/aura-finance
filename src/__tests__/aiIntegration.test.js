import { describe, it, expect, vi, beforeEach } from "vitest";
import aiService from "../services/aiService";

describe("AI Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset AI service state
    aiService.currentProvider = "gemini";
  });

  describe("Provider Switching", () => {
    it("should switch between Gemini and Hugging Face providers", () => {
      aiService.setProvider("gemini");
      expect(aiService.currentProvider).toBe("gemini");

      aiService.setProvider("huggingface");
      expect(aiService.currentProvider).toBe("huggingface");
    });

    it("should provide correct provider information", () => {
      aiService.setProvider("gemini");
      const geminiInfo = aiService.getCurrentProvider();
      expect(geminiInfo.name).toBe("Google Gemini API");

      aiService.setProvider("huggingface");
      const huggingFaceInfo = aiService.getCurrentProvider();
      expect(huggingFaceInfo.name).toBe("Hugging Face Inference API");
    });
  });

  describe("Rate Limit Monitoring", () => {
    it("should detect approaching limits for Gemini", () => {
      aiService.setProvider("gemini");
      const info = aiService.getCurrentProvider();

      expect(info.quotas).toBeDefined();
      expect(info.quotas.maxDailyRequests).toBe(150);
      expect(info.quotas.maxRequests).toBe(15);
    });

    it("should detect approaching limits for Hugging Face", () => {
      aiService.setProvider("huggingface");
      const info = aiService.getCurrentProvider();

      expect(info.quotas).toBeDefined();
      expect(info.quotas.maxDailyRequests).toBe(500);
      expect(info.quotas.maxRequests).toBe(5);
    });
  });

  describe("Provider Comparison", () => {
    it("should return accurate provider comparison", () => {
      const comparison = aiService.getProviderComparison();

      // Find providers in the array
      const gemini = comparison.find(p => p.key === "gemini");
      const huggingface = comparison.find(p => p.key === "huggingface");

      expect(gemini.name).toBe("Google Gemini API");
      expect(huggingface.name).toBe("Hugging Face Inference API");
      expect(gemini.quotas.maxDailyRequests).toBe(150);
      expect(huggingface.quotas.maxDailyRequests).toBe(500);
    });
  });

  describe("Error Handling", () => {
    it("should handle provider unavailability gracefully", () => {
      expect(aiService.isProviderAvailable("gemini")).toBe(true);
      expect(aiService.isProviderAvailable("huggingface")).toBe(true);
      expect(aiService.isProviderAvailable("unknown")).toBe(false);
    });

    it("should warn for unknown provider", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      aiService.setProvider("unknown");

      expect(consoleSpy).toHaveBeenCalledWith(
        "AI Service: Unknown provider unknown, keeping current provider"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Settings Integration", () => {
    it("should provide rate limit information for settings UI", () => {
      aiService.setProvider("gemini");
      const geminiInfo = aiService.getCurrentProvider();

      expect(geminiInfo.quotas).toBeDefined();
      expect(geminiInfo.quotas.maxDailyRequests).toBe(150);
      expect(geminiInfo.quotas.maxRequests).toBe(15);

      aiService.setProvider("huggingface");
      const huggingFaceInfo = aiService.getCurrentProvider();

      expect(huggingFaceInfo.quotas).toBeDefined();
      expect(huggingFaceInfo.quotas.maxDailyRequests).toBe(500);
      expect(huggingFaceInfo.quotas.maxRequests).toBe(5);
    });
  });

  describe("No Fallback Mechanism", () => {
    it("should maintain provider selection without automatic fallback", () => {
      // Test that the provider stays the same when set
      aiService.setProvider("gemini");
      expect(aiService.currentProvider).toBe("gemini");

      aiService.setProvider("huggingface");
      expect(aiService.currentProvider).toBe("huggingface");

      // Verify that switching back works correctly
      aiService.setProvider("gemini");
      expect(aiService.currentProvider).toBe("gemini");
    });
  });

  describe("Service Availability", () => {
    it("should correctly identify available providers", () => {
      // Both providers should be available with mocked API keys
      expect(aiService.isProviderAvailable("gemini")).toBe(true);
      expect(aiService.isProviderAvailable("huggingface")).toBe(true);
    });

    it("should handle unknown providers", () => {
      expect(aiService.isProviderAvailable("unknown")).toBe(false);
    });
  });
});
