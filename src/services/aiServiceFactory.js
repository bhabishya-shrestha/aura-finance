// AI Service Factory for switching between Gemini and Vertex AI
import geminiService from "./geminiService.js";
import vertexAiService from "./vertexAiService.js";

class AiServiceFactory {
  constructor() {
    this.serviceType = import.meta.env.VITE_AI_SERVICE_TYPE || "vertex-ai";
    this.currentService = null;
    this.initializeService();
  }

  initializeService() {
    switch (this.serviceType) {
      case "vertex-ai":
        this.currentService = vertexAiService;
        console.log("Using Vertex AI service");
        break;
      case "gemini":
        this.currentService = geminiService;
        console.log("Using Gemini service (legacy)");
        break;
      default:
        // Default to Vertex AI if available, otherwise fallback to Gemini
        if (vertexAiService.client && vertexAiService.projectId) {
          this.currentService = vertexAiService;
          console.log("Using Vertex AI service (default)");
        } else {
          this.currentService = geminiService;
          console.log("Using Gemini service (fallback)");
        }
        break;
    }
  }

  getService() {
    return this.currentService;
  }

  // Proxy methods to the current service
  async analyzeImage(file) {
    return this.currentService.analyzeImage(file);
  }

  convertToTransactions(response) {
    return this.currentService.convertToTransactions(response);
  }

  getProcessingSummary(response) {
    return this.currentService.getProcessingSummary(response);
  }

  checkRateLimit() {
    return this.currentService.checkRateLimit();
  }

  validateFile(file) {
    return this.currentService.validateFile(file);
  }

  // Get service information
  getServiceInfo() {
    return {
      type: this.serviceType,
      serviceName:
        this.currentService === vertexAiService ? "Vertex AI" : "Gemini",
      rateLimits: this.currentService.rateLimit,
      isConfigured: this.currentService.client || this.currentService.apiKey,
    };
  }

  // Switch service type (useful for testing or configuration changes)
  switchService(serviceType) {
    this.serviceType = serviceType;
    this.initializeService();
  }
}

export default new AiServiceFactory();
