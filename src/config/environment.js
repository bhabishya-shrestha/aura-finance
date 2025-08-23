/**
 * Environment Configuration
 * Handles development vs production settings
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

export const config = {
  // Environment flags
  isDevelopment,
  isProduction,

  // Feature flags
  features: {
    // Enable detailed logging in development only
    debugLogging: isDevelopment,

    // Enable console logs for debugging
    consoleLogs: isDevelopment,

    // Enable verbose Firebase sync logging
    verboseSync: isDevelopment,

    // Enable performance monitoring
    performanceMonitoring: isProduction,

    // Enable error tracking
    errorTracking: isProduction,
  },

  // Logging configuration
  logging: {
    // Log levels: 'error', 'warn', 'info', 'debug'
    level: isDevelopment ? "debug" : "error",

    // Enable console logging
    console: isDevelopment,

    // Enable remote logging (for production)
    remote: isProduction,
  },

  // Firebase configuration
  firebase: {
    // Enable verbose sync logging
    verboseSync: isDevelopment,

    // Enable sync debugging
    debugSync: isDevelopment,
  },

  // Performance configuration
  performance: {
    // Enable performance monitoring
    monitoring: isProduction,

    // Enable bundle analysis
    bundleAnalysis: isDevelopment,
  },
};

// Utility functions for conditional logging
export const logger = {
  debug: (message, ...args) => {
    if (config.features.debugLogging) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  },

  info: (message, ...args) => {
    if (config.features.consoleLogs) {
      console.log(`ℹ️ [INFO] ${message}`, ...args);
    }
  },

  warn: (message, ...args) => {
    if (config.features.consoleLogs) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  },

  error: (message, ...args) => {
    // Always log errors, even in production
    console.error(`❌ [ERROR] ${message}`, ...args);
  },

  sync: (message, ...args) => {
    if (config.firebase.verboseSync) {
      console.log(`🔄 [SYNC] ${message}`, ...args);
    }
  },

  firebase: (message, ...args) => {
    if (config.firebase.debugSync) {
      console.log(`🔥 [FIREBASE] ${message}`, ...args);
    }
  },
};

export default config;
