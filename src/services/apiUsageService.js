/**
 * Production-Grade API Usage Service
 * Provides robust API usage tracking with graceful degradation and proper error handling
 */

import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  increment,
} from "firebase/firestore";
import { app } from "./firebaseService.js";
import errorHandlingService from "./errorHandlingService.js";

class ApiUsageService {
  constructor() {
    this.auth = getAuth(app);
    this.db = getFirestore(app);

    // API usage limits with production-ready configuration
    this.apiLimits = {
      huggingface: {
        maxRequests: 20,
        maxDailyRequests: 2000,
        retryDelay: 8000,
        approachingLimitThreshold: 1600,
        estimatedCostPerRequest: 0.0005,
        description: "Less accurate but more uses - great for bulk processing",
        accuracy: "85-90%",
        bestFor: "High volume, cost-conscious users",
      },
      gemini: {
        maxRequests: 15,
        maxDailyRequests: 300,
        retryDelay: 15000,
        approachingLimitThreshold: 240,
        estimatedCostPerRequest: 0.001,
        description: "High accuracy but fewer uses - best for precision",
        accuracy: "95-98%",
        bestFor: "Precision-focused users",
      },
    };

    // Production-grade caching with TTL
    this.usageCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes

    // Service health tracking
    this.serviceHealth = {
      firestore: { isHealthy: true, lastError: null, errorCount: 0 },
      auth: { isHealthy: true, lastError: null, errorCount: 0 },
    };

    // Initialize service
    this.initialize();
  }

  /**
   * Initialize the service with health checks
   */
  async initialize() {
    try {
      // Test Firestore connectivity by trying to access a document we know exists
      // or by checking if we can at least connect to Firestore
      await this.testFirestoreConnection();
      this.serviceHealth.firestore.isHealthy = true;
    } catch (error) {
      errorHandlingService.logError(error, "apiUsageService:initialize", {
        component: "firestore",
      });
      this.serviceHealth.firestore.isHealthy = false;
      this.serviceHealth.firestore.lastError = error.message;
    }
  }

  /**
   * Test Firestore connection using a safer approach
   */
  async testFirestoreConnection() {
    try {
      // Instead of trying to access a non-existent health check document,
      // let's test by trying to get the current user's API usage document
      // This will test both connectivity and permissions
      const user = this.auth.currentUser;

      if (!user) {
        // If no user is authenticated, we can't test properly
        // But we can assume Firestore is available
        console.log(
          "No authenticated user for Firestore test, assuming connectivity"
        );
        return true;
      }

      // Try to access the user's API usage document
      // This will test both connectivity and permissions
      const usageDoc = doc(this.db, "api_usage", user.uid);
      await getDoc(usageDoc);

      console.log("Firestore connection test successful");
      return true;
    } catch (error) {
      // If we get a permissions error, it means Firestore is working but rules are blocking
      if (error.message.includes("Missing or insufficient permissions")) {
        console.warn("Firestore is accessible but permissions are restrictive");
        // Don't mark as unhealthy, just log the warning
        return true;
      }

      // For other errors, throw them
      throw new Error(`Firestore connection failed: ${error.message}`);
    }
  }

  /**
   * Get cached usage data with production-grade error handling
   */
  async getCachedUsage(userId, provider) {
    const cacheKey = `${userId}-${provider}`;
    const cached = this.usageCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    // Check if Firestore is healthy
    if (!this.serviceHealth.firestore.isHealthy) {
      console.warn("Firestore is unhealthy, using fallback data");
      return this.getFallbackUsageData(provider);
    }

    try {
      const usageDoc = doc(this.db, "api_usage", userId);
      const usageSnapshot = await getDoc(usageDoc);

      const today = new Date().toISOString().split("T")[0];
      const usageData = usageSnapshot.exists() ? usageSnapshot.data() : {};

      // Handle daily reset logic
      const lastUpdated = usageData.lastUpdated;
      const needsReset = lastUpdated && lastUpdated !== today;

      let currentUsage = 0;
      if (!needsReset) {
        currentUsage = usageData[provider]?.[today] || 0;
      }

      // Reset daily usage if needed
      if (needsReset) {
        await this.resetDailyUsage(usageDoc, usageData, provider, today);
      }

      const data = {
        currentUsage,
        lastUpdated: today,
        source: "firestore",
      };

      // Cache the result
      this.usageCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      // Handle Firestore errors with graceful degradation
      return await errorHandlingService.handleServiceFailure(
        "firestore",
        error,
        () => this.getFallbackUsageData(provider)
      );
    }
  }

  /**
   * Reset daily usage with proper error handling
   */
  async resetDailyUsage(usageDoc, usageData, provider, today) {
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

      // Clean up old data
      const cleanData = { ...usageData };
      if (cleanData[provider]) {
        cleanData[provider] = { [today]: 0 };
      }
      cleanData.lastUpdated = today;

      await setDoc(usageDoc, cleanData, { merge: true });

      console.log(`Reset daily API usage for ${provider} - new day detected`);
    } catch (error) {
      errorHandlingService.logError(error, "apiUsageService:resetDailyUsage", {
        provider,
        today,
      });
      // Continue with 0 usage even if reset fails
    }
  }

  /**
   * Get fallback usage data when Firestore is unavailable
   */
  getFallbackUsageData(provider) {
    const today = new Date().toISOString().split("T")[0];

    // Try to get from localStorage as backup
    try {
      const localUsage = JSON.parse(
        localStorage.getItem(`aura_api_usage_${provider}`) || "{}"
      );

      if (localUsage.date === today) {
        return {
          currentUsage: localUsage.count || 0,
          lastUpdated: today,
          source: "localStorage",
        };
      }
    } catch (error) {
      console.warn("Failed to read local usage data:", error);
    }

    return {
      currentUsage: 0,
      lastUpdated: today,
      source: "fallback",
    };
  }

  /**
   * Validate API usage with production-grade error handling
   */
  async validateApiUsage(provider) {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        return this.getDefaultValidationResult(provider);
      }

      if (!this.apiLimits[provider]) {
        throw new Error(`Invalid provider: ${provider}`);
      }

      // Check if service should be disabled due to repeated failures
      if (errorHandlingService.shouldDisableService("firestore")) {
        console.warn("Firestore service disabled due to repeated failures");
        return this.getDefaultValidationResult(provider);
      }

      const usageData = await this.getCachedUsage(user.uid, provider);
      const currentUsage = usageData.currentUsage;
      const maxRequests = this.apiLimits[provider].maxDailyRequests;
      const remainingRequests = Math.max(0, maxRequests - currentUsage);
      const canProceed = currentUsage < maxRequests;

      // Log usage for monitoring
      if (process.env.NODE_ENV === "development") {
        console.log(`API Usage for ${provider}:`, {
          current: currentUsage,
          max: maxRequests,
          remaining: remainingRequests,
          canProceed,
          date: usageData.lastUpdated,
          source: usageData.source,
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
        source: usageData.source,
      };
    } catch (error) {
      return await errorHandlingService.handleServiceFailure(
        "apiUsageValidation",
        error,
        () => this.getDefaultValidationResult(provider)
      );
    }
  }

  /**
   * Get default validation result when services are unavailable
   */
  getDefaultValidationResult(provider) {
    const maxRequests = this.apiLimits[provider]?.maxDailyRequests || 1000;

    return {
      success: true,
      can_proceed: true, // Allow requests when services are down
      current_usage: 0,
      max_requests: maxRequests,
      remaining_requests: maxRequests,
      approachingLimit: false,
      source: "default",
    };
  }

  /**
   * Increment API usage with production-grade error handling
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

      // Check if Firestore is healthy
      if (!this.serviceHealth.firestore.isHealthy) {
        // Use localStorage as fallback
        this.incrementLocalUsage(provider);
        return true;
      }

      const today = new Date().toISOString().split("T")[0];
      const usageDoc = doc(this.db, "api_usage", user.uid);

      await setDoc(
        usageDoc,
        {
          [provider]: {
            [today]: increment(1),
          },
          lastUpdated: today,
        },
        { merge: true }
      );

      // Clear cache to force refresh
      this.clearCache(user.uid, provider);

      return true;
    } catch (error) {
      return await errorHandlingService.handleServiceFailure(
        "apiUsageIncrement",
        error,
        () => {
          this.incrementLocalUsage(provider);
          return true;
        }
      );
    }
  }

  /**
   * Increment usage in localStorage as fallback
   */
  incrementLocalUsage(provider) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = `aura_api_usage_${provider}`;
      const localUsage = JSON.parse(localStorage.getItem(key) || "{}");

      if (localUsage.date === today) {
        localUsage.count = (localUsage.count || 0) + 1;
      } else {
        localUsage.date = today;
        localUsage.count = 1;
      }

      localStorage.setItem(key, JSON.stringify(localUsage));
      console.log(
        `Incremented local usage for ${provider}: ${localUsage.count}`
      );
    } catch (error) {
      console.error("Failed to increment local usage:", error);
    }
  }

  /**
   * Clear cache for a specific user/provider
   */
  clearCache(userId, provider) {
    const cacheKey = `${userId}-${provider}`;
    this.usageCache.delete(cacheKey);
  }

  /**
   * Get service health status
   */
  getServiceHealth() {
    return {
      ...this.serviceHealth,
      firestore: {
        ...this.serviceHealth.firestore,
        ...errorHandlingService.getServiceHealth("firestore"),
      },
    };
  }

  /**
   * Get API limits configuration
   */
  getApiLimits() {
    return this.apiLimits;
  }

  /**
   * Reset service health (useful for testing)
   */
  resetServiceHealth() {
    this.serviceHealth = {
      firestore: { isHealthy: true, lastError: null, errorCount: 0 },
      auth: { isHealthy: true, lastError: null, errorCount: 0 },
    };
    errorHandlingService.clearAllErrors();
  }
}

export default new ApiUsageService();
