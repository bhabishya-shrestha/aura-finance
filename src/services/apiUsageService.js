// API Usage Service for server-side validation
// Prevents users from bypassing client-side rate limits

import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  increment,
} from "firebase/firestore";
import { app } from "./firebaseService.js";

class ApiUsageService {
  constructor() {
    // Get Firebase instances directly
    this.auth = getAuth(app);
    this.db = getFirestore(app);

    // API usage limits and cost estimates
    this.apiLimits = {
      huggingface: {
        maxRequests: 10, // Increased from 5 - more generous since it's less accurate
        maxDailyRequests: 1000, // Increased from 500 - much more generous
        retryDelay: 8000, // Reduced from 12000 - faster retries
        approachingLimitThreshold: 800, // Increased threshold
        estimatedCostPerRequest: 0.0005, // Reduced cost estimate since it's less accurate
        description: "Less accurate but more uses - great for bulk processing",
        accuracy: "85-90%", // Lower accuracy rating
        bestFor: "High volume, cost-conscious users",
      },
      gemini: {
        maxRequests: 5,
        maxDailyRequests: 100,
        retryDelay: 15000,
        approachingLimitThreshold: 80,
        estimatedCostPerRequest: 0.001,
        description: "High accuracy but fewer uses - best for precision",
        accuracy: "95-98%", // Higher accuracy rating
        bestFor: "Precision-focused users",
      },
    };
  }

  /**
   * Validate if user can make an API request
   * @param {string} provider - 'gemini' or 'huggingface'
   * @returns {Promise<Object>} Validation result
   */
  async validateApiUsage(provider) {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        throw new Error("User not authenticated");
      }

      if (!this.apiLimits[provider]) {
        throw new Error(`Invalid provider: ${provider}`);
      }

      // Get user's API usage from Firestore
      const usageDoc = doc(this.db, "api_usage", user.uid);
      const usageSnapshot = await getDoc(usageDoc);

      const today = new Date().toISOString().split("T")[0];
      const currentUsage = usageSnapshot.exists()
        ? usageSnapshot.data()[provider]?.[today] || 0
        : 0;

      const maxRequests = this.apiLimits[provider].maxDailyRequests;
      const remainingRequests = Math.max(0, maxRequests - currentUsage);
      const canProceed = currentUsage < maxRequests;

      return {
        success: true,
        can_proceed: canProceed,
        current_usage: currentUsage,
        max_requests: maxRequests,
        remaining_requests: remainingRequests,
        approachingLimit:
          currentUsage >= this.apiLimits[provider].approachingLimitThreshold,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        can_proceed: false,
        current_usage: 0,
        max_requests: this.apiLimits[provider]?.maxDailyRequests || 0,
        remaining_requests: 0,
      };
    }
  }

  /**
   * Increment API usage counter
   * @param {string} provider - 'gemini' or 'huggingface'
   * @returns {Promise<boolean>} True if successful, false if limit exceeded
   */
  async incrementApiUsage(provider) {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        throw new Error("User not authenticated");
      }

      if (!this.apiLimits[provider]) {
        throw new Error(`Invalid provider: ${provider}`);
      }

      // First validate if user can make the request
      const validation = await this.validateApiUsage(provider);
      if (!validation.can_proceed) {
        return false;
      }

      // Increment usage in Firestore
      const usageDoc = doc(this.db, "api_usage", user.uid);
      const today = new Date().toISOString().split("T")[0];

      await setDoc(
        usageDoc,
        {
          [provider]: {
            [today]: increment(1),
          },
        },
        { merge: true }
      );

      return true;
    } catch (error) {
      console.error("API usage increment failed:", error);
      return false;
    }
  }

  /**
   * Get comprehensive usage statistics for the current user
   * @returns {Promise<Object>} Usage statistics
   */
  async getUserApiUsageStats() {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get user's API usage from Firestore
      const usageDoc = doc(this.db, "api_usage", user.uid);
      const usageSnapshot = await getDoc(usageDoc);

      const today = new Date().toISOString().split("T")[0];
      const usageData = usageSnapshot.exists() ? usageSnapshot.data() : {};

      const geminiUsage = usageData.gemini?.[today] || 0;
      const huggingfaceUsage = usageData.huggingface?.[today] || 0;

      return {
        success: true,
        gemini: {
          current_usage: geminiUsage,
          max_requests: this.apiLimits.gemini.maxDailyRequests,
          remaining_requests: Math.max(
            0,
            this.apiLimits.gemini.maxDailyRequests - geminiUsage
          ),
          approaching_limit:
            geminiUsage >= this.apiLimits.gemini.approachingLimitThreshold,
        },
        huggingface: {
          current_usage: huggingfaceUsage,
          max_requests: this.apiLimits.huggingface.maxDailyRequests,
          remaining_requests: Math.max(
            0,
            this.apiLimits.huggingface.maxDailyRequests - huggingfaceUsage
          ),
          approaching_limit:
            huggingfaceUsage >=
            this.apiLimits.huggingface.approachingLimitThreshold,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        gemini: {
          current_usage: 0,
          max_requests: this.apiLimits.gemini.maxDailyRequests,
          remaining_requests: this.apiLimits.gemini.maxDailyRequests,
          approaching_limit: false,
        },
        huggingface: {
          current_usage: 0,
          max_requests: this.apiLimits.huggingface.maxDailyRequests,
          remaining_requests: this.apiLimits.huggingface.maxDailyRequests,
          approaching_limit: false,
        },
      };
    }
  }

  /**
   * Get current daily usage for a specific provider
   * @param {string} provider - 'gemini' or 'huggingface'
   * @returns {Promise<number>} Current usage count
   */
  async getDailyApiUsage(provider) {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        return 0;
      }

      if (!this.apiLimits[provider]) {
        return 0;
      }

      // Get user's API usage from Firestore
      const usageDoc = doc(this.db, "api_usage", user.uid);
      const usageSnapshot = await getDoc(usageDoc);

      const today = new Date().toISOString().split("T")[0];
      const usageData = usageSnapshot.exists() ? usageSnapshot.data() : {};

      return usageData[provider]?.[today] || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if user is approaching limits for a provider
   * @param {string} provider - 'gemini' or 'huggingface'
   * @returns {Promise<boolean>} True if approaching limit
   */
  async isApproachingLimit(provider) {
    const currentUsage = await this.getDailyApiUsage(provider);
    const threshold = this.apiLimits[provider]?.approachingLimitThreshold || 0;
    return currentUsage >= threshold;
  }

  /**
   * Check if user has exceeded daily limit for a provider
   * @param {string} provider - 'gemini' or 'huggingface'
   * @returns {Promise<boolean>} True if limit exceeded
   */
  async hasExceededLimit(provider) {
    const currentUsage = await this.getDailyApiUsage(provider);
    const maxRequests = this.apiLimits[provider]?.maxDailyRequests || 0;
    return currentUsage >= maxRequests;
  }

  /**
   * Get provider configuration
   * @param {string} provider - 'gemini' or 'huggingface'
   * @returns {Object} Provider configuration
   */
  getProviderConfig(provider) {
    return this.apiLimits[provider] || null;
  }

  /**
   * Get all provider configurations
   * @returns {Object} All provider configurations
   */
  getAllProviderConfigs() {
    return this.apiLimits;
  }

  /**
   * Get estimated cost for a provider
   * @param {string} provider - 'gemini' or 'huggingface'
   * @param {number} requestCount - Number of requests
   * @returns {Object} Cost estimate
   */
  getCostEstimate(provider, requestCount = 1) {
    const config = this.apiLimits[provider];
    if (!config) {
      return { error: `Invalid provider: ${provider}` };
    }

    const totalCost = config.estimatedCostPerRequest * requestCount;
    const dailyCost = config.estimatedCostPerRequest * config.maxDailyRequests;

    return {
      costPerRequest: config.estimatedCostPerRequest,
      totalCost,
      dailyCost,
      requestCount,
      provider,
    };
  }

  /**
   * Get all provider cost estimates
   * @returns {Object} Cost estimates for all providers
   */
  getAllCostEstimates() {
    const estimates = {};
    for (const [provider, config] of Object.entries(this.apiLimits)) {
      estimates[provider] = {
        costPerRequest: config.estimatedCostPerRequest,
        dailyCost: config.estimatedCostPerRequest * config.maxDailyRequests,
        maxDailyRequests: config.maxDailyRequests,
      };
    }
    return estimates;
  }
}

export default new ApiUsageService();
