/**
 * Production-Grade Error Handling Service
 * Provides centralized error handling, logging, and graceful degradation
 */

class ErrorHandlingService {
  constructor() {
    this.errorCounts = new Map();
    this.maxErrorsPerMinute = 10;
    this.errorWindow = 60000; // 1 minute
    this.errorTimestamps = [];
  }

  /**
   * Log error with proper categorization and rate limiting
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   * @param {Object} metadata - Additional error context
   */
  logError(error, context, metadata = {}) {
    const errorKey = `${context}:${error.message}`;
    const now = Date.now();

    // Rate limiting - prevent error spam
    this.errorTimestamps.push(now);
    this.errorTimestamps = this.errorTimestamps.filter(
      timestamp => now - timestamp < this.errorWindow
    );

    if (this.errorTimestamps.length > this.maxErrorsPerMinute) {
      console.warn(
        `Error rate limit exceeded for ${context}, suppressing further errors`
      );
      return;
    }

    // Increment error count
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    // Production error logging
    const errorLog = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      stack: error.stack,
      count: currentCount + 1,
      metadata,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console in development, send to monitoring service in production
    if (process.env.NODE_ENV === "development") {
      console.error(`[${context}] Error #${currentCount + 1}:`, errorLog);
    } else {
      // In production, send to monitoring service (e.g., Sentry, LogRocket)
      this.sendToMonitoringService(errorLog);
    }

    // Store in localStorage for debugging
    this.storeErrorLocally(errorLog);
  }

  /**
   * Handle service failures with graceful degradation
   * @param {string} serviceName - Name of the failed service
   * @param {Error} error - The error that occurred
   * @param {Function} fallback - Fallback function to execute
   * @returns {Promise<any>} Result from fallback or error
   */
  async handleServiceFailure(serviceName, error, fallback) {
    this.logError(error, `service:${serviceName}`, {
      service: serviceName,
      fallback: !!fallback,
    });

    if (fallback) {
      try {
        console.warn(`Service ${serviceName} failed, using fallback`);
        return await fallback();
      } catch (fallbackError) {
        this.logError(fallbackError, `fallback:${serviceName}`);
        throw new Error(`Service ${serviceName} and fallback both failed`);
      }
    }

    throw error;
  }

  /**
   * Check if a service should be disabled due to repeated failures
   * @param {string} serviceName - Name of the service
   * @returns {boolean} True if service should be disabled
   */
  shouldDisableService(serviceName) {
    const errorKey = `service:${serviceName}`;
    const count = this.errorCounts.get(errorKey) || 0;
    return count >= 5; // Disable after 5 consecutive failures
  }

  /**
   * Get service health status
   * @param {string} serviceName - Name of the service
   * @returns {Object} Health status information
   */
  getServiceHealth(serviceName) {
    const errorKey = `service:${serviceName}`;
    const count = this.errorCounts.get(errorKey) || 0;

    return {
      service: serviceName,
      errorCount: count,
      isHealthy: count < 3,
      isDegraded: count >= 3 && count < 5,
      isDisabled: count >= 5,
      lastError: this.getLastError(serviceName),
    };
  }

  /**
   * Reset error counts for a service (useful for testing)
   * @param {string} serviceName - Name of the service
   */
  resetServiceErrors(serviceName) {
    const errorKey = `service:${serviceName}`;
    this.errorCounts.delete(errorKey);
  }

  /**
   * Send error to monitoring service (production only)
   * @param {Object} errorLog - Error log object
   */
  sendToMonitoringService(errorLog) {
    // In production, this would send to Sentry, LogRocket, etc.
    // For now, we'll just store it for later analysis
    try {
      const monitoringData = JSON.parse(
        localStorage.getItem("aura_error_monitoring") || "[]"
      );
      monitoringData.push(errorLog);

      // Keep only last 100 errors
      if (monitoringData.length > 100) {
        monitoringData.splice(0, monitoringData.length - 100);
      }

      localStorage.setItem(
        "aura_error_monitoring",
        JSON.stringify(monitoringData)
      );
    } catch (error) {
      console.error("Failed to store error for monitoring:", error);
    }
  }

  /**
   * Store error locally for debugging
   * @param {Object} errorLog - Error log object
   */
  storeErrorLocally(errorLog) {
    try {
      const localErrors = JSON.parse(
        localStorage.getItem("aura_local_errors") || "[]"
      );
      localErrors.push(errorLog);

      // Keep only last 50 errors
      if (localErrors.length > 50) {
        localErrors.splice(0, localErrors.length - 50);
      }

      localStorage.setItem("aura_local_errors", JSON.stringify(localErrors));
    } catch (error) {
      console.error("Failed to store error locally:", error);
    }
  }

  /**
   * Get the last error for a service
   * @param {string} serviceName - Name of the service
   * @returns {Object|null} Last error or null
   */
  getLastError(serviceName) {
    try {
      const localErrors = JSON.parse(
        localStorage.getItem("aura_local_errors") || "[]"
      );
      return (
        localErrors
          .filter(error => error.context === `service:${serviceName}`)
          .pop() || null
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all errors for debugging
   * @returns {Array} Array of error logs
   */
  getAllErrors() {
    try {
      return JSON.parse(localStorage.getItem("aura_local_errors") || "[]");
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear all stored errors
   */
  clearAllErrors() {
    localStorage.removeItem("aura_local_errors");
    localStorage.removeItem("aura_error_monitoring");
    this.errorCounts.clear();
    this.errorTimestamps = [];
  }
}

export default new ErrorHandlingService();
