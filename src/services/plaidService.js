/**
 * Plaid Integration Service
 *
 * This service provides secure integration with Plaid's financial data API.
 * Designed for standalone developers using Plaid's free tier with proper
 * rate limiting and security measures.
 *
 * Free Tier Limits:
 * - 100 Items (linked accounts)
 * - 2,000 transactions per month
 * - Rate limits: 30 requests per minute per Item
 */

import { supabase } from "../lib/supabase";

// Plaid API configuration
const PLAID_CONFIG = {
  // Use environment variables for security
  clientId: import.meta.env.VITE_PLAID_CLIENT_ID,
  secret: import.meta.env.VITE_PLAID_SECRET,
  env: import.meta.env.VITE_PLAID_ENV || "sandbox", // sandbox, development, production
  version: "2020-09-14",

  // Rate limiting configuration
  rateLimits: {
    transactionsPerMinute: 30,
    accountsPerMinute: 15,
    balancePerMinute: 5,
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  },

  // Free tier limits
  freeTierLimits: {
    maxItems: 100,
    maxTransactionsPerMonth: 2000,
    maxAccountsPerItem: 20,
  },
};

// Rate limiting utility
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.limits = PLAID_CONFIG.rateLimits;
  }

  canMakeRequest(endpoint, itemId = null) {
    const key = itemId ? `${endpoint}:${itemId}` : endpoint;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requests = this.requests.get(key);

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < windowMs);
    this.requests.set(key, validRequests);

    // Check if we can make another request
    const limit = this.getLimitForEndpoint(endpoint);
    return validRequests.length < limit;
  }

  recordRequest(endpoint, itemId = null) {
    const key = itemId ? `${endpoint}:${itemId}` : endpoint;
    const now = Date.now();

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    this.requests.get(key).push(now);
  }

  getLimitForEndpoint(endpoint) {
    const limits = {
      "/transactions/get": this.limits.transactionsPerMinute,
      "/accounts/get": this.limits.accountsPerMinute,
      "/accounts/balance/get": this.limits.balancePerMinute,
      "/item/get": 15,
      "/institutions/get": 50,
    };

    return limits[endpoint] || 30; // Default limit
  }

  async waitForRateLimit(endpoint, itemId = null) {
    const maxWaitTime = 30000; // 30 seconds max wait
    const startTime = Date.now();

    while (!this.canMakeRequest(endpoint, itemId)) {
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error("Rate limit exceeded - maximum wait time reached");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// Initialize rate limiter
const rateLimiter = new RateLimiter();

// Secure API request utility
class PlaidAPI {
  constructor() {
    this.baseURL = `https://${PLAID_CONFIG.env === "sandbox" ? "sandbox" : "production"}.plaid.com`;
    this.config = PLAID_CONFIG;
  }

  async makeRequest(endpoint, data = {}, itemId = null) {
    // Check rate limits before making request
    await rateLimiter.waitForRateLimit(endpoint, itemId);

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      "Plaid-Version": this.config.version,
    };

    const requestData = {
      client_id: this.config.clientId,
      secret: this.config.secret,
      ...data,
    };

    try {
      // Record the request for rate limiting
      rateLimiter.recordRequest(endpoint, itemId);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new PlaidError(result);
      }

      return result;
    } catch (error) {
      if (error instanceof PlaidError) {
        throw error;
      }

      // Handle network errors
      throw new PlaidError({
        error_type: "API_ERROR",
        error_code: "NETWORK_ERROR",
        error_message: error.message,
      });
    }
  }

  // Retry logic with exponential backoff
  async makeRequestWithRetry(endpoint, data = {}, itemId = null, retries = 0) {
    try {
      return await this.makeRequest(endpoint, data, itemId);
    } catch (error) {
      if (
        error.error_code === "RATE_LIMIT_EXCEEDED" &&
        retries < this.config.rateLimits.maxRetries
      ) {
        const delay = this.config.rateLimits.retryDelay * Math.pow(2, retries);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(endpoint, data, itemId, retries + 1);
      }
      throw error;
    }
  }
}

// Custom error class for Plaid errors
class PlaidError extends Error {
  constructor(plaidResponse) {
    super(plaidResponse.error_message || "Plaid API error");
    this.name = "PlaidError";
    this.error_type = plaidResponse.error_type;
    this.error_code = plaidResponse.error_code;
    this.display_message = plaidResponse.display_message;
    this.request_id = plaidResponse.request_id;
  }
}

// Initialize Plaid API
const plaidAPI = new PlaidAPI();

// Main Plaid service
export const plaidService = {
  /**
   * Create a Link token for connecting accounts
   */
  async createLinkToken(userId, clientName = "Aura Finance") {
    try {
      const response = await plaidAPI.makeRequest("/link/token/create", {
        user: { client_user_id: userId },
        client_name: clientName,
        country_codes: ["US"],
        language: "en",
        products: ["transactions", "auth"],
        account_filters: {
          depository: {
            account_subtypes: ["checking", "savings"],
          },
          credit: {
            account_subtypes: ["credit card"],
          },
        },
      });

      return response;
    } catch (error) {
      // Error logged
      throw error;
    }
  },

  /**
   * Exchange public token for access token
   */
  async exchangePublicToken(publicToken) {
    try {
      const response = await plaidAPI.makeRequest(
        "/item/public_token/exchange",
        {
          public_token: publicToken,
        },
      );

      return response;
    } catch (error) {
      // Error logged
      throw error;
    }
  },

  /**
   * Get accounts for an item
   */
  async getAccounts(accessToken) {
    try {
      const response = await plaidAPI.makeRequestWithRetry("/accounts/get", {
        access_token: accessToken,
      });

      return response.accounts;
    } catch (error) {
      // Error logged
      throw error;
    }
  },

  /**
   * Get account balances
   */
  async getAccountBalances(accessToken, accountIds = null) {
    try {
      const data = { access_token: accessToken };
      if (accountIds) {
        data.account_ids = accountIds;
      }

      const response = await plaidAPI.makeRequestWithRetry(
        "/accounts/balance/get",
        data,
      );
      return response.accounts;
    } catch (error) {
      // Error logged
      throw error;
    }
  },

  /**
   * Get transactions with pagination and date filtering
   */
  async getTransactions(accessToken, startDate, endDate, options = {}) {
    try {
      const {
        count = 100, // Max 500 for free tier
        offset = 0,
        accountIds = null,
      } = options;

      // Validate count for free tier
      const maxCount = Math.min(count, 500);

      const data = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        count: maxCount,
        offset,
      };

      if (accountIds) {
        data.account_ids = accountIds;
      }

      const response = await plaidAPI.makeRequestWithRetry(
        "/transactions/get",
        data,
      );

      return {
        transactions: response.transactions,
        total_transactions: response.total_transactions,
        request_id: response.request_id,
      };
    } catch (error) {
      // Error logged
      throw error;
    }
  },

  /**
   * Get institution information
   */
  async getInstitution(institutionId) {
    try {
      const response = await plaidAPI.makeRequestWithRetry(
        "/institutions/get_by_id",
        {
          institution_id: institutionId,
          country_codes: ["US"],
        },
      );

      return response.institution;
    } catch (error) {
      // Error logged
      throw error;
    }
  },

  /**
   * Remove an item (disconnect account)
   */
  async removeItem(accessToken) {
    try {
      const response = await plaidAPI.makeRequest("/item/remove", {
        access_token: accessToken,
      });

      return response;
    } catch (error) {
      // Error logged
      throw error;
    }
  },

  /**
   * Get item status
   */
  async getItemStatus(accessToken) {
    try {
      const response = await plaidAPI.makeRequestWithRetry("/item/get", {
        access_token: accessToken,
      });

      return response.item;
    } catch (error) {
      // Error logged
      throw error;
    }
  },
};

// Database integration for storing Plaid data securely
export const plaidDatabase = {
  /**
   * Store Plaid item securely
   */
  async storePlaidItem(userId, itemData) {
    try {
      const { data, error } = await supabase.from("plaid_items").upsert({
        user_id: userId,
        item_id: itemData.item_id,
        access_token: itemData.access_token, // Encrypted in database
        institution_id: itemData.institution_id,
        status: itemData.status,
        last_sync: new Date().toISOString(),
      });

      if (error) throw error;
      return data;
    } catch (error) {
      // Error logged
      throw error;
    }
  },

  /**
   * Get user's Plaid items
   */
  async getPlaidItems(userId) {
    try {
      const { data, error } = await supabase
        .from("plaid_items")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "good");

      if (error) throw error;
      return data;
    } catch (error) {
      // Error logged
      throw error;
    }
  },

  /**
   * Store accounts from Plaid
   */
  async storeAccounts(userId, itemId, accounts) {
    try {
      const accountsToInsert = accounts.map((account) => ({
        user_id: userId,
        plaid_item_id: itemId,
        plaid_account_id: account.account_id,
        name: account.name,
        type: account.type,
        subtype: account.subtype,
        mask: account.mask,
        current_balance: account.balances.current,
        available_balance: account.balances.available,
        iso_currency_code: account.balances.iso_currency_code,
        unofficial_currency_code: account.balances.unofficial_currency_code,
      }));

      const { data, error } = await supabase
        .from("plaid_accounts")
        .upsert(accountsToInsert, { onConflict: "plaid_account_id" });

      if (error) throw error;
      return data;
    } catch (error) {
      // Error logged
      throw error;
    }
  },

  /**
   * Store transactions from Plaid
   */
  async storeTransactions(userId, itemId, transactions) {
    try {
      const transactionsToInsert = transactions.map((transaction) => ({
        user_id: userId,
        plaid_item_id: itemId,
        plaid_transaction_id: transaction.transaction_id,
        plaid_account_id: transaction.account_id,
        date: transaction.date,
        name: transaction.name,
        amount: transaction.amount,
        currency_code: transaction.iso_currency_code,
        pending: transaction.pending,
        category: transaction.category?.join(", ") || null,
        category_id: transaction.category_id,
        location: transaction.location
          ? JSON.stringify(transaction.location)
          : null,
        payment_channel: transaction.payment_channel,
        pending_transaction_id: transaction.pending_transaction_id,
        account_owner: transaction.account_owner,
        transaction_code: transaction.transaction_code,
        merchant_name: transaction.merchant_name,
        check_number: transaction.check_number,
        payment_meta: transaction.payment_meta
          ? JSON.stringify(transaction.payment_meta)
          : null,
      }));

      const { data, error } = await supabase
        .from("plaid_transactions")
        .upsert(transactionsToInsert, { onConflict: "plaid_transaction_id" });

      if (error) throw error;
      return data;
    } catch (error) {
      // Error logged
      throw error;
    }
  },

  /**
   * Remove Plaid item and all associated data
   */
  async removePlaidItem(userId, itemId) {
    try {
      // Delete in order to maintain referential integrity
      await supabase
        .from("plaid_transactions")
        .delete()
        .eq("user_id", userId)
        .eq("plaid_item_id", itemId);

      await supabase
        .from("plaid_accounts")
        .delete()
        .eq("user_id", userId)
        .eq("plaid_item_id", itemId);

      const { error } = await supabase
        .from("plaid_items")
        .delete()
        .eq("user_id", userId)
        .eq("item_id", itemId);

      if (error) throw error;
      return true;
    } catch (error) {
      // Error logged
      throw error;
    }
  },
};

// Usage tracking for free tier limits
export const plaidUsageTracker = {
  async trackRequest(userId, endpoint) {
    try {
      const { error } = await supabase.from("plaid_usage").insert({
        user_id: userId,
        endpoint,
        timestamp: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      // Error logged
    }
  },

  async getMonthlyUsage(userId, month = null) {
    try {
      const startDate = month || new Date().toISOString().slice(0, 7) + "-01";
      const endDate = new Date(
        new Date(startDate).getFullYear(),
        new Date(startDate).getMonth() + 1,
        0,
      ).toISOString();

      const { data, error } = await supabase
        .from("plaid_usage")
        .select("endpoint, count(*)")
        .eq("user_id", userId)
        .gte("timestamp", startDate)
        .lte("timestamp", endDate)
        .group("endpoint");

      if (error) throw error;
      return data;
    } catch (error) {
      // Error logged
      return [];
    }
  },

  async checkFreeTierLimits(userId) {
    try {
      const usage = await this.getMonthlyUsage(userId);
      const totalTransactions =
        usage.find((u) => u.endpoint === "/transactions/get")?.count || 0;

      return {
        transactionsRemaining: Math.max(
          0,
          PLAID_CONFIG.freeTierLimits.maxTransactionsPerMonth -
            totalTransactions,
        ),
        isWithinLimits:
          totalTransactions <
          PLAID_CONFIG.freeTierLimits.maxTransactionsPerMonth,
      };
    } catch (error) {
      // Error logged
      return { transactionsRemaining: 0, isWithinLimits: false };
    }
  },
};

export default plaidService;
