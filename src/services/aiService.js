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
    console.log("🤖 [AI Service] Starting analyzeImage for file:", file.name, file.type);
    
    try {
      // Validate API usage first
      console.log("🤖 [AI Service] Validating API usage...");
      try {
        await apiUsageService.validateApiUsage();
        console.log("🤖 [AI Service] ✅ API usage validated");
      } catch (error) {
        console.log("🤖 [AI Service] ⚠️ API usage validation failed, proceeding with client-side limits:", error.message);
      }

      // Get current provider
      const provider = this.getCurrentProvider();
      console.log("🤖 [AI Service] Using provider:", provider.name);

      let result = null;

      // Try Hugging Face first
      if (provider.name === "Hugging Face" && huggingFaceService.isProviderAvailable()) {
        console.log("🤖 [AI Service] Attempting Hugging Face analysis...");
        try {
          result = await huggingFaceService.analyzeImage(file);
          console.log("🤖 [AI Service] ✅ Hugging Face analysis successful");
          
          // Increment API usage
          try {
            await apiUsageService.incrementApiUsage("huggingface");
            console.log("🤖 [AI Service] ✅ API usage incremented");
          } catch (error) {
            console.log("🤖 [AI Service] ⚠️ API usage increment failed:", error.message);
          }
          
          return result;
        } catch (error) {
          console.log("🤖 [AI Service] ❌ Hugging Face failed:", error.message);
          
          // Try Gemini as fallback
          if (geminiService.isProviderAvailable()) {
            console.log("🤖 [AI Service] 🔄 Falling back to Gemini...");
            try {
              result = await geminiService.analyzeImage(file);
              console.log("🤖 [AI Service] ✅ Gemini fallback successful");
              
              // Increment API usage
              try {
                await apiUsageService.incrementApiUsage("gemini");
                console.log("🤖 [AI Service] ✅ Gemini API usage incremented");
              } catch (error) {
                console.log("🤖 [AI Service] ⚠️ Gemini API usage increment failed:", error.message);
              }
              
              return {
                ...result,
                serverUsageValidation: {
                  fallbackUsed: true,
                  originalProvider: "huggingface",
                  fallbackProvider: "gemini",
                  originalError: error.message
                }
              };
            } catch (geminiError) {
              console.log("🤖 [AI Service] ❌ Gemini fallback also failed:", geminiError.message);
              throw new Error(`Both Hugging Face and Gemini failed. Hugging Face: ${error.message}, Gemini: ${geminiError.message}`);
            }
          } else {
            console.log("🤖 [AI Service] ❌ No fallback available");
            throw error;
          }
        }
      }

      // Try Gemini if it's the primary provider
      if (provider.name === "Google Gemini" && geminiService.isProviderAvailable()) {
        console.log("🤖 [AI Service] Attempting Gemini analysis...");
        try {
          result = await geminiService.analyzeImage(file);
          console.log("🤖 [AI Service] ✅ Gemini analysis successful");
          
          // Increment API usage
          try {
            await apiUsageService.incrementApiUsage("gemini");
            console.log("🤖 [AI Service] ✅ API usage incremented");
          } catch (error) {
            console.log("🤖 [AI Service] ⚠️ API usage increment failed:", error.message);
          }
          
          return result;
        } catch (error) {
          console.log("🤖 [AI Service] ❌ Gemini failed:", error.message);
          
          // Try Hugging Face as fallback
          if (huggingFaceService.isProviderAvailable()) {
            console.log("🤖 [AI Service] 🔄 Falling back to Hugging Face...");
            try {
              result = await huggingFaceService.analyzeImage(file);
              console.log("🤖 [AI Service] ✅ Hugging Face fallback successful");
              
              // Increment API usage
              try {
                await apiUsageService.incrementApiUsage("huggingface");
                console.log("🤖 [AI Service] ✅ Hugging Face API usage incremented");
              } catch (error) {
                console.log("🤖 [AI Service] ⚠️ Hugging Face API usage increment failed:", error.message);
              }
              
              return {
                ...result,
                serverUsageValidation: {
                  fallbackUsed: true,
                  originalProvider: "gemini",
                  fallbackProvider: "huggingface",
                  originalError: error.message
                }
              };
            } catch (huggingFaceError) {
              console.log("🤖 [AI Service] ❌ Hugging Face fallback also failed:", huggingFaceError.message);
              throw new Error(`Both Gemini and Hugging Face failed. Gemini: ${error.message}, Hugging Face: ${huggingFaceError.message}`);
            }
          } else {
            console.log("🤖 [AI Service] ❌ No fallback available");
            throw error;
          }
        }
      }

      console.log("🤖 [AI Service] ❌ No available providers");
      throw new Error("No AI providers are available. Please check your API keys and try again.");
    } catch (error) {
      console.error("🤖 [AI Service] ❌ analyzeImage failed:", error);
      throw error;
    }
  }

  /**
   * Extract transactions from text with server-side validation
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Transaction extraction result
   */
  async extractFromText(text) {
    try {
      // Try to validate usage before processing
      let validation = {
        can_proceed: true,
        current_usage: 0,
        max_requests: 100,
        remaining_requests: 100,
      };

      try {
        validation = await apiUsageService.validateApiUsage(
          this.currentProvider
        );
      } catch (error) {
        console.warn(
          "API usage validation failed, proceeding with client-side limits:",
          error.message
        );
        // Fallback to client-side validation
        const provider = this.providers[this.currentProvider];
        if (!provider.service.isProviderAvailable()) {
          throw new Error(
            `${provider.name} is not available. Please check your API key or try switching providers.`
          );
        }
      }

      if (!validation.can_proceed) {
        throw new Error(
          `Daily limit exceeded for ${this.providers[this.currentProvider].name}. Please try again tomorrow or switch providers.`
        );
      }

      // Try to increment usage counter (optional)
      try {
        await apiUsageService.incrementApiUsage(this.currentProvider);
      } catch (error) {
        console.warn(
          "Failed to record API usage, continuing with analysis:",
          error.message
        );
      }

      // Perform the extraction
      const result =
        await this.providers[this.currentProvider].service.extractFromText(
          text
        );

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
    } catch (error) {
      console.error("AI text extraction failed:", error);
      throw error;
    }
  }

  /**
   * Convert analysis to transactions with server-side validation
   * @param {Object} analysis - Analysis result
   * @returns {Promise<Array>} Transaction array
   */
  async convertToTransactions(analysis) {
    try {
      // Try to validate usage before processing
      let validation = {
        can_proceed: true,
        current_usage: 0,
        max_requests: 100,
        remaining_requests: 100,
      };

      try {
        validation = await apiUsageService.validateApiUsage(
          this.currentProvider
        );
      } catch (error) {
        console.warn(
          "API usage validation failed, proceeding with client-side limits:",
          error.message
        );
        // Fallback to client-side validation
        const provider = this.providers[this.currentProvider];
        if (!provider.service.isProviderAvailable()) {
          throw new Error(
            `${provider.name} is not available. Please check your API key or try switching providers.`
          );
        }
      }

      if (!validation.can_proceed) {
        throw new Error(
          `Daily limit exceeded for ${this.providers[this.currentProvider].name}. Please try again tomorrow or switch providers.`
        );
      }

      // Try to increment usage counter (optional)
      try {
        await apiUsageService.incrementApiUsage(this.currentProvider);
      } catch (error) {
        console.warn(
          "Failed to record API usage, continuing with analysis:",
          error.message
        );
      }

      // Perform the conversion
      const result =
        await this.providers[
          this.currentProvider
        ].service.convertToTransactions(analysis);

      return result;
    } catch (error) {
      console.error("AI transaction conversion failed:", error);
      throw error;
    }
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
      console.warn(
        "Failed to get server-side processing summary, using client-side:",
        error.message
      );
      // Fallback to client-side summary
      return await this.providers[
        this.currentProvider
      ].service.getProcessingSummary(response);
    }
  }

  /**
   * Analyze transactions with server-side validation
   * @param {Array} transactions - Transactions to analyze
   * @param {string} prompt - Optional prompt for analysis
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeTransactions(transactions, prompt) {
    try {
      // Try to validate usage before processing
      let validation = {
        can_proceed: true,
        current_usage: 0,
        max_requests: 100,
        remaining_requests: 100,
      };

      try {
        validation = await apiUsageService.validateApiUsage(
          this.currentProvider
        );
      } catch (error) {
        console.warn(
          "API usage validation failed, proceeding with client-side limits:",
          error.message
        );
        // Fallback to client-side validation
        const provider = this.providers[this.currentProvider];
        if (!provider.service.isProviderAvailable()) {
          throw new Error(
            `${provider.name} is not available. Please check your API key or try switching providers.`
          );
        }
      }

      if (!validation.can_proceed) {
        throw new Error(
          `Daily limit exceeded for ${this.providers[this.currentProvider].name}. Please try again tomorrow or switch providers.`
        );
      }

      // Try to increment usage counter (optional)
      try {
        await apiUsageService.incrementApiUsage(this.currentProvider);
      } catch (error) {
        console.warn(
          "Failed to record API usage, continuing with analysis:",
          error.message
        );
      }

      // Perform the analysis
      const result = await this.providers[
        this.currentProvider
      ].service.analyzeTransactions(transactions, prompt);

      return result;
    } catch (error) {
      console.error("AI transaction analysis failed:", error);
      throw error;
    }
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
