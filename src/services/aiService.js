// AI Service with server-side usage validation
// Prevents exploitation by validating usage on the backend

import geminiService from "./geminiService.js";
import huggingFaceService from "./huggingFaceService.js";
import apiUsageService from "./apiUsageService.js";

class AIService {
  constructor() {
    this.providers = {
      gemini: {
        name: "Gemini API",
        service: geminiService,
        quotas: { maxDailyRequests: 150, maxRequests: 15 },
        features: ["Document Analysis", "Transaction Extraction"],
        pricing: "Free Tier",
      },
      huggingface: {
        name: "Hugging Face Inference API",
        service: huggingFaceService,
        quotas: { maxDailyRequests: 500, maxRequests: 5 },
        features: ["Document Analysis", "Transaction Extraction"],
        pricing: "Free Tier",
      },
    };

    // Initialize with user's preferred provider from settings
    this.initializeFromSettings();
  }

  /**
   * Initialize provider from user settings
   */
  initializeFromSettings() {
    try {
      const settings = localStorage.getItem("aura_settings");
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        if (
          parsedSettings.aiProvider &&
          this.providers[parsedSettings.aiProvider]
        ) {
          this.currentProvider = parsedSettings.aiProvider;
        }
      }
    } catch (error) {
      // console.warn("Failed to load AI provider settings:", error);
    }

    // Default to Gemini if no setting found
    if (!this.currentProvider) {
      this.currentProvider = "gemini";
    }
  }

  /**
   * Set the current AI provider with server-side validation
   * @param {string} provider - 'gemini' or 'huggingface'
   */
  async setProvider(provider) {
    if (!this.providers[provider]) {
      throw new Error(`Invalid provider: ${provider}`);
    }

    // Validate that user can use this provider
    const validation = await apiUsageService.validateApiUsage(provider);

    if (!validation.can_proceed) {
      throw new Error(
        `Daily limit exceeded for ${this.providers[provider].name}. Please try again tomorrow or switch providers.`
      );
    }

    this.currentProvider = provider;

    // Save to localStorage
    try {
      const settings = JSON.parse(
        localStorage.getItem("aura_settings") || "{}"
      );
      settings.aiProvider = provider;
      localStorage.setItem("aura_settings", JSON.stringify(settings));
    } catch (error) {
      // console.warn("Failed to save AI provider setting:", error);
    }
  }

  /**
   * Get current provider information
   * @returns {Object} Current provider info
   */
  getCurrentProvider() {
    return this.providers[this.currentProvider];
  }

  /**
   * Get all available providers
   * @returns {Object} All available providers
   */
  getAvailableProviders() {
    return this.providers;
  }

  /**
   * Get provider comparison with server-side usage data
   * @returns {Promise<Array>} Provider comparison with usage stats
   */
  async getProviderComparison() {
    try {
      const usageStats = await apiUsageService.getUserApiUsageStats();

      return Object.entries(this.providers).map(([key, provider]) => ({
        key,
        name: provider.name,
        quotas: provider.quotas,
        features: provider.features,
        pricing: provider.pricing,
        available: usageStats[key]?.remaining_requests > 0,
        currentUsage: usageStats[key]?.current_usage || 0,
        remainingRequests: usageStats[key]?.remaining_requests || 0,
        approachingLimit: usageStats[key]?.approaching_limit || false,
      }));
    } catch (error) {
      // console.error("Failed to get provider comparison:", error);
      // Fallback to basic comparison without usage data
      return Object.entries(this.providers).map(([key, provider]) => ({
        key,
        name: provider.name,
        quotas: provider.quotas,
        features: provider.features,
        pricing: provider.pricing,
        available: true,
        currentUsage: 0,
        remainingRequests: provider.quotas.maxDailyRequests,
        approachingLimit: false,
      }));
    }
  }

  /**
   * Check if current provider is available with server-side validation
   * @returns {Promise<boolean>} True if available
   */
  async isProviderAvailable(provider = this.currentProvider) {
    try {
      const validation = await apiUsageService.validateApiUsage(provider);
      return validation.can_proceed;
    } catch (error) {
      // console.error("Provider availability check failed:", error);
      return false;
    }
  }

  /**
   * Check if approaching limits with server-side validation
   * @returns {Promise<boolean>} True if approaching limits
   */
  async isApproachingLimits(provider = this.currentProvider) {
    try {
      return await apiUsageService.isApproachingLimit(provider);
    } catch (error) {
      // console.error("Approaching limits check failed:", error);
      return false;
    }
  }

  /**
   * Analyze image with server-side validation
   * @param {File} file - Image file to analyze
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeImage(file) {
    // Validate usage before processing
    const validation = await apiUsageService.validateApiUsage(
      this.currentProvider
    );

    if (!validation.can_proceed) {
      throw new Error(
        `Daily limit exceeded for ${this.providers[this.currentProvider].name}. Please try again tomorrow or switch providers.`
      );
    }

    // Increment usage counter
    const incrementSuccess = await apiUsageService.incrementApiUsage(
      this.currentProvider
    );

    if (!incrementSuccess) {
      throw new Error("Failed to record API usage. Please try again.");
    }

    // Perform the analysis
    const result =
      await this.providers[this.currentProvider].service.analyzeImage(file);

    // Add server-side usage info to result
    if (result) {
      result.serverUsageValidation = {
        provider: this.currentProvider,
        currentUsage: validation.current_usage + 1, // +1 for this request
        maxRequests: validation.max_requests,
        remainingRequests: validation.remaining_requests - 1,
        approachingLimit: validation.approachingLimit,
      };
    }

    return result;
  }

  /**
   * Extract transactions from text with server-side validation
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Transaction extraction result
   */
  async extractFromText(text) {
    // Validate usage before processing
    const validation = await apiUsageService.validateApiUsage(
      this.currentProvider
    );

    if (!validation.can_proceed) {
      throw new Error(
        `Daily limit exceeded for ${this.providers[this.currentProvider].name}. Please try again tomorrow or switch providers.`
      );
    }

    // Increment usage counter
    const incrementSuccess = await apiUsageService.incrementApiUsage(
      this.currentProvider
    );

    if (!incrementSuccess) {
      throw new Error("Failed to record API usage. Please try again.");
    }

    // Perform the extraction
    const result =
      await this.providers[this.currentProvider].service.extractFromText(text);

    // Add server-side usage info to result
    if (result) {
      result.serverUsageValidation = {
        provider: this.currentProvider,
        currentUsage: validation.current_usage + 1,
        maxRequests: validation.max_requests,
        remainingRequests: validation.remaining_requests - 1,
        approachingLimit: validation.approachingLimit,
      };
    }

    return result;
  }

  /**
   * Convert analysis to transactions with server-side validation
   * @param {Object} analysis - Analysis result
   * @returns {Promise<Array>} Transaction array
   */
  async convertToTransactions(analysis) {
    // Validate usage before processing
    const validation = await apiUsageService.validateApiUsage(
      this.currentProvider
    );

    if (!validation.can_proceed) {
      throw new Error(
        `Daily limit exceeded for ${this.providers[this.currentProvider].name}. Please try again tomorrow or switch providers.`
      );
    }

    // Increment usage counter
    const incrementSuccess = await apiUsageService.incrementApiUsage(
      this.currentProvider
    );

    if (!incrementSuccess) {
      throw new Error("Failed to record API usage. Please try again.");
    }

    // Perform the conversion
    const result =
      await this.providers[this.currentProvider].service.convertToTransactions(
        analysis
      );

    return result;
  }

  /**
   * Get processing summary with server-side usage data
   * @param {Object} response - Optional response data
   * @returns {Promise<Object>} Processing summary
   */
  async getProcessingSummary(response) {
    try {
      const usageStats = await apiUsageService.getUserApiUsageStats();
      const currentProviderStats = usageStats[this.currentProvider];

      // Get provider-specific summary
      const providerSummary =
        await this.providers[this.currentProvider].service.getProcessingSummary(
          response
        );

      return {
        ...providerSummary,
        provider: this.providers[this.currentProvider].name,
        model: this.providers[this.currentProvider].service.getBestModel(),
        dailyRequests: currentProviderStats?.current_usage || 0,
        maxDailyRequests: currentProviderStats?.max_requests || 0,
        remainingRequests: currentProviderStats?.remaining_requests || 0,
        approachingLimits: currentProviderStats?.approaching_limit || false,
        serverValidated: true,
      };
    } catch (error) {
      // console.error("Failed to get processing summary:", error);
      // Fallback to client-side summary
      return await this.providers[this.currentProvider].service.getProcessingSummary(
        response
      );
    }
  }

  /**
   * Analyze transactions with server-side validation
   * @param {Array} transactions - Transactions to analyze
   * @param {string} prompt - Optional prompt for analysis
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeTransactions(transactions, prompt) {
    // Validate usage before processing
    const validation = await apiUsageService.validateApiUsage(
      this.currentProvider
    );

    if (!validation.can_proceed) {
      throw new Error(
        `Daily limit exceeded for ${this.providers[this.currentProvider].name}. Please try again tomorrow or switch providers.`
      );
    }

    // Increment usage counter
    const incrementSuccess = await apiUsageService.incrementApiUsage(
      this.currentProvider
    );

    if (!incrementSuccess) {
      throw new Error("Failed to record API usage. Please try again.");
    }

    // Perform the analysis
    const result = await this.providers[
      this.currentProvider
    ].service.analyzeTransactions(transactions, prompt);

    // Add server-side usage info to result
    if (result) {
      result.serverUsageValidation = {
        provider: this.currentProvider,
        currentUsage: validation.current_usage + 1,
        maxRequests: validation.max_requests,
        remainingRequests: validation.remaining_requests - 1,
        approachingLimit: validation.approachingLimit,
      };
    }

    return result;
  }

  /**
   * Validate file with server-side validation
   * @param {File} file - File to validate
   * @returns {boolean} True if valid
   */
  async validateFile(file) {
    // Validate usage before processing
    const validation = await apiUsageService.validateApiUsage(
      this.currentProvider
    );

    if (!validation.can_proceed) {
      throw new Error(
        `Daily limit exceeded for ${this.providers[this.currentProvider].name}. Please try again tomorrow or switch providers.`
      );
    }

    // Perform file validation
    return this.providers[this.currentProvider].service.validateFile(file);
  }

  /**
   * Get server-side usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  async getServerUsageStats() {
    try {
      return await apiUsageService.getUserApiUsageStats();
    } catch (error) {
      // console.error("Failed to get server usage stats:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new AIService();
