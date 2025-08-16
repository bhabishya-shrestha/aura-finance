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

    // API usage limits and cost estimates - INCREASED LIMITS
    this.apiLimits = {
      huggingface: {
        maxRequests: 20, // Increased from 10
        maxDailyRequests: 2000, // Increased from 1000
        retryDelay: 8000,
        approachingLimitThreshold: 1600, // Increased threshold
        estimatedCostPerRequest: 0.0005,
        description: "Less accurate but more uses - great for bulk processing",
        accuracy: "85-90%",
        bestFor: "High volume, cost-conscious users",
      },
      gemini: {
        maxRequests: 15, // Increased from 5
        maxDailyRequests: 300, // Increased from 100 - much more generous
        retryDelay: 15000,
        approachingLimitThreshold: 240, // Increased threshold
        estimatedCostPerRequest: 0.001,
        description: "High accuracy but fewer uses - best for precision",
        accuracy: "95-98%",
        bestFor: "Precision-focused users",
      },
    };

    // Cache for API usage to reduce Firestore calls
    this.usageCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cached usage data or fetch from Firestore
   * @param {string} userId - User ID
   * @param {string} provider - API provider
   * @returns {Promise<Object>} Usage data
   */
  async getCachedUsage(userId, provider) {
    const cacheKey = `${userId}-${provider}`;
    const cached = this.usageCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // Fetch from Firestore
      const usageDoc = doc(this.db, "api_usage", userId);
      const usageSnapshot = await getDoc(usageDoc);

      const today = new Date().toISOString().split("T")[0];
      const usageData = usageSnapshot.exists() ? usageSnapshot.data() : {};

      // Check if we need to reset daily usage (new day)
      const lastUpdated = usageData.lastUpdated;
      const needsReset = lastUpdated && lastUpdated !== today;

      let currentUsage = 0;
      if (!needsReset) {
        currentUsage = usageData[provider]?.[today] || 0;
      }

      // If it's a new day, reset the usage and update the document
      if (needsReset) {
        try {
          await setDoc(
            usageDoc,
            {
              [provider]: {
                [today]: 0,
              },
              lastUpdated: today,
            },
            { merge: true }
          );

          // Clear any old daily data to keep the document clean
          const cleanData = { ...usageData };
          if (cleanData[provider]) {
            // Keep only today's data
            cleanData[provider] = { [today]: 0 };
          }
          cleanData.lastUpdated = today;

          await setDoc(usageDoc, cleanData, { merge: true });

          console.log(
            `Reset daily API usage for ${provider} - new day detected`
          );
        } catch (error) {
          console.error("Failed to reset daily API usage:", error);
          // Continue with 0 usage even if reset fails
        }
      }

      const data = {
        currentUsage,
        lastUpdated: today,
      };

      // Cache the result
      this.usageCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.warn(
        "Failed to fetch API usage from Firestore, using default values:",
        error.message
      );

      // Return default data on error to prevent app from breaking
      const today = new Date().toISOString().split("T")[0];
      const data = {
        currentUsage: 0,
        lastUpdated: today,
      };

      // Cache the default result
      this.usageCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    }
  }

  /**
   * Clear cache for a specific user/provider
   * @param {string} userId - User ID
   * @param {string} provider - API provider
   */
  clearCache(userId, provider) {
    const cacheKey = `${userId}-${provider}`;
    this.usageCache.delete(cacheKey);
  }

  /**
   * Validate if user can make an API request with improved error handling
   * @param {string} provider - 'gemini' or 'huggingface'
   * @returns {Promise<Object>} Validation result
   */
  async validateApiUsage(provider) {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        // If no user, allow the request but log it
        console.warn(
          "No authenticated user for API validation, allowing request"
        );
        return {
          success: true,
          can_proceed: true,
          current_usage: 0,
          max_requests: this.apiLimits[provider]?.maxDailyRequests || 1000,
          remaining_requests:
            this.apiLimits[provider]?.maxDailyRequests || 1000,
          approachingLimit: false,
        };
      }

      if (!this.apiLimits[provider]) {
        throw new Error(`Invalid provider: ${provider}`);
      }

      // Get cached usage data (this will handle daily reset automatically)
      const usageData = await this.getCachedUsage(user.uid, provider);
      const currentUsage = usageData.currentUsage;
      const maxRequests = this.apiLimits[provider].maxDailyRequests;
      const remainingRequests = Math.max(0, maxRequests - currentUsage);
      const canProceed = currentUsage < maxRequests;

      // Log usage for debugging (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log(`API Usage for ${provider}:`, {
          current: currentUsage,
          max: maxRequests,
          remaining: remainingRequests,
          canProceed,
          date: usageData.lastUpdated,
        });
      }

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
      console.error("API usage validation error:", error);

      // On error, allow the request but log it
      return {
        success: false,
        error: error.message,
        can_proceed: true, // Allow request on error to prevent blocking users
        current_usage: 0,
        max_requests: this.apiLimits[provider]?.maxDailyRequests || 1000,
        remaining_requests: this.apiLimits[provider]?.maxDailyRequests || 1000,
      };
    }
  }

  /**
   * Manually reset API usage for testing and debugging
   * @param {string} provider - 'gemini' or 'huggingface'
   * @returns {Promise<boolean>} True if successful
   */
  async forceResetApiUsage(provider) {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        console.warn("No authenticated user for API usage reset");
        return false;
      }

      const today = new Date().toISOString().split("T")[0];
      const usageDoc = doc(this.db, "api_usage", user.uid);

      // Reset to 0 for today
      await setDoc(
        usageDoc,
        {
          [provider]: {
            [today]: 0,
          },
          lastUpdated: today,
        },
        { merge: true }
      );

      // Clear cache to force refresh
      this.clearCache(user.uid, provider);

      console.log(`Force reset API usage for ${provider} to 0`);
      return true;
    } catch (error) {
      console.error("Failed to force reset API usage:", error);
      return false;
    }
  }

  /**
   * Get current API usage status for debugging
   * @param {string} provider - 'gemini' or 'huggingface'
   * @returns {Promise<Object>} Current usage status
   */
  async getCurrentUsageStatus(provider) {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        return { error: "No authenticated user" };
      }

      const usageData = await this.getCachedUsage(user.uid, provider);
      const maxRequests = this.apiLimits[provider]?.maxDailyRequests || 0;

      return {
        currentUsage: usageData.currentUsage,
        maxRequests,
        remainingRequests: Math.max(0, maxRequests - usageData.currentUsage),
        lastUpdated: usageData.lastUpdated,
        canProceed: usageData.currentUsage < maxRequests,
      };
    } catch (error) {
      console.error("Failed to get current usage status:", error);
      return { error: error.message };
    }
  }

  /**
   * Increment API usage counter with improved error handling
   * @param {string} provider - 'gemini' or 'huggingface'
   * @returns {Promise<boolean>} True if successful, false if limit exceeded
   */
  async incrementApiUsage(provider) {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        console.warn("No authenticated user for API usage increment, skipping");
        return true;
      }

      if (!this.apiLimits[provider]) {
        throw new Error(`Invalid provider: ${provider}`);
      }

      // Validate before incrementing
      const validation = await this.validateApiUsage(provider);
      if (!validation.can_proceed) {
        console.warn(
          `API limit exceeded for ${provider}, cannot increment usage`
        );
        return false;
      }

      const today = new Date().toISOString().split("T")[0];
      const usageDoc = doc(this.db, "api_usage", user.uid);

      // Use setDoc with merge to ensure the document exists
      await setDoc(
        usageDoc,
        {
          [provider]: {
            [today]: increment(1),
          },
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );

      // Clear cache to force refresh
      this.clearCache(user.uid, provider);

      return true;
    } catch (error) {
      console.error("Failed to increment API usage:", error);
      // Don't block the user on increment failure
      return true;
    }
  }

  /**
   * Get user's API usage statistics
   * @returns {Promise<Object>} Usage statistics for all providers
   */
  async getUserApiUsageStats() {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        return {};
      }

      const usageDoc = doc(this.db, "api_usage", user.uid);
      const usageSnapshot = await getDoc(usageDoc);

      if (!usageSnapshot.exists()) {
        return {};
      }

      const usageData = usageSnapshot.data();
      const today = new Date().toISOString().split("T")[0];
      const stats = {};

      for (const [provider, limits] of Object.entries(this.apiLimits)) {
        const currentUsage = usageData[provider]?.[today] || 0;
        stats[provider] = {
          current_usage: currentUsage,
          max_requests: limits.maxDailyRequests,
          remaining_requests: Math.max(
            0,
            limits.maxDailyRequests - currentUsage
          ),
          approaching_limit: currentUsage >= limits.approachingLimitThreshold,
        };
      }

      return stats;
    } catch (error) {
      console.error("Failed to get API usage stats:", error);
      return {};
    }
  }

  /**
   * Reset API usage for a specific provider (admin function)
   * @param {string} provider - 'gemini' or 'huggingface'
   * @returns {Promise<boolean>} True if successful
   */
  async resetApiUsage(provider) {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        throw new Error("User not authenticated");
      }

      const today = new Date().toISOString().split("T")[0];
      const usageDoc = doc(this.db, "api_usage", user.uid);

      await setDoc(
        usageDoc,
        {
          [provider]: {
            [today]: 0,
          },
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );

      // Clear cache
      this.clearCache(user.uid, provider);

      return true;
    } catch (error) {
      console.error("Failed to reset API usage:", error);
      return false;
    }
  }

  /**
   * Get API limits configuration
   * @returns {Object} API limits configuration
   */
  getApiLimits() {
    return this.apiLimits;
  }
}

export default new ApiUsageService();
