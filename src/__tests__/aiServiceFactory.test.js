import { describe, it, expect, beforeEach } from "vitest";
import aiServiceFactory from "../services/aiServiceFactory";

describe("AiServiceFactory", () => {
  beforeEach(() => {
    // Reset the factory
    aiServiceFactory.switchService("vertex-ai");
  });

  describe("service initialization", () => {
    it("should default to vertex-ai service", () => {
      const serviceInfo = aiServiceFactory.getServiceInfo();
      expect(serviceInfo.type).toBe("vertex-ai");
      expect(serviceInfo.serviceName).toBe("Vertex AI");
    });

    it("should allow switching to gemini service", () => {
      aiServiceFactory.switchService("gemini");
      const serviceInfo = aiServiceFactory.getServiceInfo();
      expect(serviceInfo.type).toBe("gemini");
      expect(serviceInfo.serviceName).toBe("Gemini");
    });
  });

  describe("rate limit comparison", () => {
    it("should show vertex-ai has higher rate limits than gemini", () => {
      aiServiceFactory.switchService("vertex-ai");
      const vertexInfo = aiServiceFactory.getServiceInfo();

      aiServiceFactory.switchService("gemini");
      const geminiInfo = aiServiceFactory.getServiceInfo();

      expect(vertexInfo.rateLimits.maxRequests).toBeGreaterThan(
        geminiInfo.rateLimits.maxRequests
      );
      expect(vertexInfo.rateLimits.maxDailyRequests).toBeGreaterThan(
        geminiInfo.rateLimits.maxDailyRequests
      );
    });
  });

  describe("service methods", () => {
    it("should have analyzeImage method", () => {
      expect(typeof aiServiceFactory.analyzeImage).toBe("function");
    });

    it("should have convertToTransactions method", () => {
      expect(typeof aiServiceFactory.convertToTransactions).toBe("function");
    });

    it("should have getProcessingSummary method", () => {
      expect(typeof aiServiceFactory.getProcessingSummary).toBe("function");
    });
  });
});
