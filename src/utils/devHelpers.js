// Development Helper Utilities
// These utilities help with local development and testing

/**
 * Check if we're in development mode
 */
export const isDevelopment = () => {
  return import.meta.env.DEV || import.meta.env.VITE_APP_ENV === "development";
};

/**
 * Check if we're in production mode
 */
export const isProduction = () => {
  return import.meta.env.PROD || import.meta.env.VITE_APP_ENV === "production";
};

/**
 * Get the current environment
 */
export const getEnvironment = () => {
  return (
    import.meta.env.VITE_APP_ENV ||
    (import.meta.env.DEV ? "development" : "production")
  );
};

/**
 * Get the base URL for the current environment
 */
export const getBaseUrl = () => {
  if (isDevelopment()) {
    return "http://localhost:5173";
  }
  return import.meta.env.VITE_APP_URL || "https://aura-finance-tool.vercel.app";
};

/**
 * Get the OAuth redirect URL for the current environment
 */
export const getOAuthRedirectUrl = () => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/auth/callback`;
};

/**
 * Development logger that only logs in development
 */
export const devLog = {
  log: (...args) => {
    if (isDevelopment()) {
      // eslint-disable-next-line no-console
      console.log("[DEV]", ...args);
    }
  },
  error: (...args) => {
    if (isDevelopment()) {
      // eslint-disable-next-line no-console
      console.error("[DEV ERROR]", ...args);
    }
  },
  warn: (...args) => {
    if (isDevelopment()) {
      // eslint-disable-next-line no-console
      console.warn("[DEV WARN]", ...args);
    }
  },
  info: (...args) => {
    if (isDevelopment()) {
      // eslint-disable-next-line no-console
      console.info("[DEV INFO]", ...args);
    }
  },
};

/**
 * Check if all required environment variables are set
 */
export const checkEnvironmentVariables = () => {
  const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

  const optional = ["VITE_GEMINI_API_KEY", "VITE_APP_ENV", "VITE_APP_URL"];

  const missing = [];
  const warnings = [];

  // Check required variables
  required.forEach(key => {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  });

  // Check optional variables
  optional.forEach(key => {
    if (!import.meta.env[key]) {
      warnings.push(key);
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
};

/**
 * Get environment variable with fallback
 */
export const getEnvVar = (key, fallback = null) => {
  return import.meta.env[key] || fallback;
};

/**
 * Development testing utilities
 */
export const devTestUtils = {
  /**
   * Simulate OAuth callback for testing
   */
  simulateOAuthCallback: (provider = "github") => {
    if (!isDevelopment()) {
      devLog.warn("OAuth simulation only available in development");
      return;
    }

    // Create a mock OAuth callback URL
    const mockCallbackUrl = `${getBaseUrl()}/auth/callback?provider=${provider}&code=mock_code&state=mock_state`;

    devLog.info("Simulating OAuth callback:", mockCallbackUrl);

    // Navigate to the callback URL
    window.location.href = mockCallbackUrl;
  },

  /**
   * Clear all local storage and session storage
   */
  clearAllStorage: () => {
    if (!isDevelopment()) {
      devLog.warn("Storage clearing only available in development");
      return;
    }

    localStorage.clear();
    sessionStorage.clear();
    devLog.info("All storage cleared");
  },

  /**
   * Get current authentication state
   */
  getAuthState: () => {
    if (!isDevelopment()) {
      return null;
    }

    const authData = {
      localStorage: {},
      sessionStorage: {},
      cookies: document.cookie,
    };

    // Get localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        authData.localStorage[key] = localStorage.getItem(key);
      }
    }

    // Get sessionStorage items
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        authData.sessionStorage[key] = sessionStorage.getItem(key);
      }
    }

    return authData;
  },

  /**
   * Test environment configuration
   */
  testEnvironment: () => {
    if (!isDevelopment()) {
      devLog.warn("Environment testing only available in development");
      return;
    }

    const envCheck = checkEnvironmentVariables();

    devLog.info("Environment Check:", {
      environment: getEnvironment(),
      baseUrl: getBaseUrl(),
      oauthRedirectUrl: getOAuthRedirectUrl(),
      isValid: envCheck.isValid,
      missing: envCheck.missing,
      warnings: envCheck.warnings,
    });

    return envCheck;
  },
};

/**
 * Development debugging utilities
 */
export const devDebug = {
  /**
   * Log component render information
   */
  logRender: (componentName, props = {}) => {
    if (isDevelopment()) {
      devLog.info(`[RENDER] ${componentName}`, props);
    }
  },

  /**
   * Log API calls
   */
  logApiCall: (endpoint, method, data = null) => {
    if (isDevelopment()) {
      devLog.info(`[API] ${method.toUpperCase()} ${endpoint}`, data);
    }
  },

  /**
   * Log authentication events
   */
  logAuthEvent: (event, data = {}) => {
    if (isDevelopment()) {
      devLog.info(`[AUTH] ${event}`, data);
    }
  },

  /**
   * Log OAuth flow events
   */
  logOAuthEvent: (event, data = {}) => {
    if (isDevelopment()) {
      devLog.info(`[OAUTH] ${event}`, data);
    }
  },
};

/**
 * Development testing data
 */
export const devTestData = {
  /**
   * Get mock transaction data for testing
   */
  getMockTransactions: () => [
    {
      id: 1,
      date: new Date("2024-01-15"),
      description: "Grocery Store",
      amount: -85.5,
      category: "Groceries",
      type: "expense",
      accountId: 1,
    },
    {
      id: 2,
      date: new Date("2024-01-14"),
      description: "Gas Station",
      amount: -45.0,
      category: "Transport",
      type: "expense",
      accountId: 1,
    },
    {
      id: 3,
      date: new Date("2024-01-13"),
      description: "Salary Deposit",
      amount: 2500.0,
      category: "Income",
      type: "income",
      accountId: 1,
    },
  ],

  /**
   * Get mock account data for testing
   */
  getMockAccounts: () => [
    {
      id: 1,
      name: "Bank of America Checking",
      type: "checking",
      balance: 2500.0,
    },
    {
      id: 2,
      name: "Bank of America Credit Card",
      type: "credit",
      balance: -150.0,
    },
    {
      id: 3,
      name: "Savings Account",
      type: "savings",
      balance: 5000.0,
    },
  ],
};

// Export all utilities
export default {
  isDevelopment,
  isProduction,
  getEnvironment,
  getBaseUrl,
  getOAuthRedirectUrl,
  devLog,
  checkEnvironmentVariables,
  getEnvVar,
  devTestUtils,
  devDebug,
  devTestData,
};
