import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optimized database operations using denormalized data
export const dbOptimized = {
  // Optimized transaction queries using denormalized data
  getTransactions: async (filters = {}) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase.rpc("get_transactions_optimized", {
      user_uuid: user.id,
      filters: filters,
    });

    return { data, error };
  },

  // Optimized dashboard data using materialized view
  getDashboardData: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase.rpc("get_dashboard_data", {
      user_uuid: user.id,
    });

    return { data: data?.[0] || null, error };
  },

  // Optimized account queries using materialized view
  getAccounts: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase
      .from("account_performance")
      .select("*")
      .eq("user_id", user.id)
      .order("balance", { ascending: false });

    return { data, error };
  },

  // Optimized category queries using materialized view
  getCategories: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase
      .from("category_analytics")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_count", { ascending: false });

    return { data, error };
  },

  // Create transaction with automatic denormalization
  createTransaction: async transactionData => {
    const { data, error } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select("*")
      .single();

    // The trigger will automatically update denormalized data
    return { data, error };
  },

  // Update transaction with automatic denormalization
  updateTransaction: async (id, updates) => {
    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    // The trigger will automatically update denormalized data
    return { data, error };
  },

  // Delete transaction with automatic denormalization
  deleteTransaction: async id => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    // The trigger will automatically update denormalized data
    return { error };
  },

  // Create account with automatic denormalization
  createAccount: async accountData => {
    const { data, error } = await supabase
      .from("accounts")
      .insert(accountData)
      .select("*")
      .single();

    return { data, error };
  },

  // Update account with automatic denormalization
  updateAccount: async (id, updates) => {
    const { data, error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    return { data, error };
  },

  // Delete account with cascade
  deleteAccount: async id => {
    // First, delete all transactions associated with this account
    const { error: deleteTransactionsError } = await supabase
      .from("transactions")
      .delete()
      .eq("account_id", id);

    if (deleteTransactionsError) {
      return { error: deleteTransactionsError };
    }

    // Then delete the account
    const { error } = await supabase.from("accounts").delete().eq("id", id);

    return { error };
  },

  // Create category with automatic denormalization
  createCategory: async categoryData => {
    const { data, error } = await supabase
      .from("categories")
      .insert(categoryData)
      .select("*")
      .single();

    return { data, error };
  },

  // Update category with automatic denormalization
  updateCategory: async (id, updates) => {
    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    return { data, error };
  },

  // Delete category with cleanup
  deleteCategory: async id => {
    // First, update all transactions that reference this category to set category_id to NULL
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ category_id: null })
      .eq("category_id", id);

    if (updateError) {
      return { error: updateError };
    }

    // Then delete the category
    const { error } = await supabase.from("categories").delete().eq("id", id);

    return { error };
  },

  // Search transactions using denormalized data (much faster)
  searchTransactions: async (searchTerm, filters = {}) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .or(
        `description.ilike.%${searchTerm}%,category_name.ilike.%${searchTerm}%,account_name.ilike.%${searchTerm}%`
      )
      .order("date", { ascending: false });

    // Apply additional filters
    if (filters.accountId) {
      query = query.eq("account_id", filters.accountId);
    }
    if (filters.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }
    if (filters.startDate) {
      query = query.gte("date", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("date", filters.endDate);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // Get recent transactions using denormalized data
  getRecentTransactions: async (limit = 10) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(limit);

    return { data, error };
  },

  // Get account analytics using materialized view
  getAccountAnalytics: async accountId => {
    const { data, error } = await supabase
      .from("account_performance")
      .select("*")
      .eq("account_id", accountId)
      .single();

    return { data, error };
  },

  // Get category analytics using materialized view
  getCategoryAnalytics: async categoryId => {
    const { data, error } = await supabase
      .from("category_analytics")
      .select("*")
      .eq("category_id", categoryId)
      .single();

    return { data, error };
  },

  // Refresh materialized views (for admin use)
  refreshAnalytics: async () => {
    const { data, error } = await supabase.rpc("refresh_analytics_views");
    return { data, error };
  },

  // Get transaction statistics using denormalized data
  getTransactionStats: async (filters = {}) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    let query = supabase
      .from("transactions")
      .select("amount, date, transaction_type_code")
      .eq("user_id", user.id);

    // Apply filters
    if (filters.startDate) {
      query = query.gte("date", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("date", filters.endDate);
    }
    if (filters.accountId) {
      query = query.eq("account_id", filters.accountId);
    }

    const { data, error } = await query;

    if (error) return { data: null, error };

    // Calculate statistics
    const stats = {
      totalTransactions: data.length,
      totalIncome: data
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
      totalExpenses: data
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      averageAmount:
        data.reduce((sum, t) => sum + Math.abs(t.amount), 0) / data.length || 0,
      incomeCount: data.filter(t => t.amount > 0).length,
      expenseCount: data.filter(t => t.amount < 0).length,
    };

    return { data: stats, error: null };
  },

  // Get monthly trends using denormalized data
  getMonthlyTrends: async (months = 12) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase
      .from("transactions")
      .select("amount, date")
      .eq("user_id", user.id)
      .gte(
        "date",
        new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("date", { ascending: true });

    if (error) return { data: [], error };

    // Group by month
    const monthlyData = data.reduce((acc, transaction) => {
      const month = new Date(transaction.date).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0, count: 0 };
      }

      if (transaction.amount > 0) {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expenses += Math.abs(transaction.amount);
      }
      acc[month].count += 1;

      return acc;
    }, {});

    // Convert to array format
    const trends = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
      count: data.count,
    }));

    return { data: trends, error: null };
  },
};

export default dbOptimized;
