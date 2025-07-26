const API_BASE_URL = "http://localhost:3001/api";

// Token management
const getToken = () => localStorage.getItem("authToken");
const setToken = (token) => localStorage.setItem("authToken", token);
const removeToken = () => localStorage.removeItem("authToken");

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  register: async (userData) => {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (response.success && response.data.token) {
      setToken(response.data.token);
    }

    return response;
  },

  login: async (credentials) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data.token) {
      setToken(response.data.token);
    }

    return response;
  },

  logout: () => {
    removeToken();
  },

  getCurrentUser: async () => {
    return await apiRequest("/auth/me");
  },

  isAuthenticated: () => {
    return !!getToken();
  },
};

// Users API
export const usersAPI = {
  getProfile: async () => {
    return await apiRequest("/users/profile");
  },

  updateProfile: async (profileData) => {
    return await apiRequest("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },
};

// Accounts API
export const accountsAPI = {
  getAll: async () => {
    return await apiRequest("/accounts");
  },

  getById: async (id) => {
    return await apiRequest(`/accounts/${id}`);
  },

  create: async (accountData) => {
    return await apiRequest("/accounts", {
      method: "POST",
      body: JSON.stringify(accountData),
    });
  },

  update: async (id, accountData) => {
    return await apiRequest(`/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(accountData),
    });
  },

  delete: async (id) => {
    return await apiRequest(`/accounts/${id}`, {
      method: "DELETE",
    });
  },
};

// Transactions API
export const transactionsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/transactions?${queryString}`
      : "/transactions";
    return await apiRequest(endpoint);
  },

  getById: async (id) => {
    return await apiRequest(`/transactions/${id}`);
  },

  create: async (transactionData) => {
    return await apiRequest("/transactions", {
      method: "POST",
      body: JSON.stringify(transactionData),
    });
  },

  update: async (id, transactionData) => {
    return await apiRequest(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(transactionData),
    });
  },

  delete: async (id) => {
    return await apiRequest(`/transactions/${id}`, {
      method: "DELETE",
    });
  },

  // Batch operations
  createBatch: async (transactions) => {
    return await apiRequest("/transactions/batch", {
      method: "POST",
      body: JSON.stringify({ transactions }),
    });
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    return await apiRequest("/categories");
  },

  create: async (categoryData) => {
    return await apiRequest("/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  },

  update: async (id, categoryData) => {
    return await apiRequest(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    });
  },

  delete: async (id) => {
    return await apiRequest(`/categories/${id}`, {
      method: "DELETE",
    });
  },
};

// Analytics API
export const analyticsAPI = {
  getNetWorth: async () => {
    return await apiRequest("/analytics/net-worth");
  },

  getSpendingByCategory: async (period = "month") => {
    return await apiRequest(`/analytics/spending-by-category?period=${period}`);
  },

  getMonthlyTrends: async (year) => {
    return await apiRequest(`/analytics/monthly-trends?year=${year}`);
  },

  getIncomeVsSpending: async (period = "month") => {
    return await apiRequest(`/analytics/income-vs-spending?period=${period}`);
  },
};

// Export all APIs
export default {
  auth: authAPI,
  users: usersAPI,
  accounts: accountsAPI,
  transactions: transactionsAPI,
  categories: categoriesAPI,
  analytics: analyticsAPI,
};
