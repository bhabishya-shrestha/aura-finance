// Unified AI service that can switch between Gemini API and Vertex AI
import geminiService from "./geminiService";
import vertexAIService from "./vertexAIService";

class AIService {
  constructor() {
    this.currentProvider = "gemini"; // Default to Gemini API
    this.providers = {
      gemini: {
        name: "Google Gemini API",
        service: geminiService,
        quotas: {
          maxRequests: 15,
          maxDailyRequests: 150,
        },
        features: [
          "Document Analysis",
          "Transaction Extraction",
          "Account Suggestions",
        ],
        pricing: "Free Tier",
      },
      vertex: {
        name: "Google Cloud Vertex AI",
        service: vertexAIService,
        quotas: {
          maxRequests: 300,
          maxDailyRequests: 10000,
        },
        features: [
          "Document Analysis",
          "Transaction Extraction",
          "Account Suggestions",
          "Higher Quotas",
        ],
        pricing: "Pay-as-you-go",
      },
    };
  }

  // Set the current AI provider
  setProvider(provider) {
    if (this.providers[provider]) {
      this.currentProvider = provider;
      console.log(`AI Service: Switched to ${this.providers[provider].name}`);
    } else {
      console.warn(
        `AI Service: Unknown provider ${provider}, keeping current provider`
      );
    }
  }

  // Get current provider info
  getCurrentProvider() {
    return {
      name: this.providers[this.currentProvider].name,
      quotas: this.providers[this.currentProvider].quotas,
      features: this.providers[this.currentProvider].features,
      pricing: this.providers[this.currentProvider].pricing,
    };
  }

  // Get all available providers
  getAvailableProviders() {
    return this.providers;
  }

  // Check if provider is available (has required credentials)
  isProviderAvailable(provider) {
    if (provider === "gemini") {
      return !!import.meta.env.VITE_GEMINI_API_KEY;
    } else if (provider === "vertex") {
      return !!(
        import.meta.env.VITE_GCP_PROJECT_ID && import.meta.env.VITE_GCP_API_KEY
      );
    }
    return false;
  }

  // Get the current service instance
  getCurrentService() {
    return this.providers[this.currentProvider].service;
  }

  // Analyze image/document
  async analyzeImage(file) {
    const service = this.getCurrentService();
    try {
      return await service.analyzeImage(file);
    } catch (error) {
      // If current provider fails, try to fallback to the other provider
      if (
        this.currentProvider === "gemini" &&
        this.isProviderAvailable("vertex")
      ) {
        console.warn("Gemini API failed, falling back to Vertex AI");
        this.setProvider("vertex");
        return await this.getCurrentService().analyzeImage(file);
      } else if (
        this.currentProvider === "vertex" &&
        this.isProviderAvailable("gemini")
      ) {
        console.warn("Vertex AI failed, falling back to Gemini API");
        this.setProvider("gemini");
        return await this.getCurrentService().analyzeImage(file);
      }
      throw error;
    }
  }

  // Extract transactions from text
  extractFromText(text) {
    const service = this.getCurrentService();
    return service.extractFromText(text);
  }

  // Convert AI response to transactions
  convertToTransactions(response) {
    const service = this.getCurrentService();
    return service.convertToTransactions(response);
  }

  // Get processing summary
  getProcessingSummary(response) {
    const service = this.getCurrentService();
    return service.getProcessingSummary(response);
  }

  // Analyze transactions for account suggestions
  async analyzeTransactions(transactionTexts, prompt) {
    const service = this.getCurrentService();
    return await service.analyzeTransactions(transactionTexts, prompt);
  }

  // Validate file
  validateFile(file) {
    const service = this.getCurrentService();
    return service.validateFile(file);
  }

  // Get rate limit info for current provider
  getRateLimitInfo() {
    const service = this.getCurrentService();
    return {
      provider: this.currentProvider,
      providerName: this.providers[this.currentProvider].name,
      quotas: this.providers[this.currentProvider].quotas,
      currentUsage: {
        dailyRequests: service.dailyRequestCount || 0,
        minuteRequests: service.requestCount || 0,
      },
    };
  }

  // Check if we're approaching rate limits
  isApproachingLimits() {
    const service = this.getCurrentService();
    const quotas = this.providers[this.currentProvider].quotas;

    const dailyUsage = service.dailyRequestCount || 0;
    const minuteUsage = service.requestCount || 0;

    return {
      daily: dailyUsage >= quotas.maxDailyRequests * 0.8, // 80% of daily limit
      minute: minuteUsage >= quotas.maxRequests * 0.8, // 80% of minute limit
      dailyUsage,
      minuteUsage,
      dailyLimit: quotas.maxDailyRequests,
      minuteLimit: quotas.maxRequests,
    };
  }

  // Get provider comparison for settings UI
  getProviderComparison() {
    return Object.entries(this.providers).map(([key, provider]) => ({
      key,
      name: provider.name,
      quotas: provider.quotas,
      features: provider.features,
      pricing: provider.pricing,
      available: this.isProviderAvailable(key),
    }));
  }
}

export default new AIService();
