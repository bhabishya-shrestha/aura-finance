import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper functions for common operations
export const auth = {
  // Sign up with email and password
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  getSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database operations
export const db = {
  // Accounts
  getAccounts: async () => {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });
    return { data, error };
  },

  createAccount: async (accountData) => {
    const { data, error } = await supabase
      .from("accounts")
      .insert(accountData)
      .select()
      .single();
    return { data, error };
  },

  updateAccount: async (id, updates) => {
    const { data, error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  },

  deleteAccount: async (id) => {
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

  // Transactions
  getTransactions: async (filters = {}) => {
    let query = supabase
      .from("transactions")
      .select(
        `
        *,
        account:accounts(name, type, is_active),
        category:categories(name, color, icon, is_default)
      `,
      )
      .order("date", { ascending: false });

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

    // Process the data to handle null references
    if (data) {
      data.forEach((transaction) => {
        // Handle deleted accounts
        if (!transaction.account || !transaction.account.is_active) {
          transaction.account = {
            name: "Deleted Account",
            type: "unknown",
            is_active: false,
          };
        }

        // Handle deleted categories
        if (!transaction.category) {
          transaction.category = {
            name: "Uncategorized",
            color: "#6B7280",
            icon: "tag",
            is_default: false,
          };
        }
      });
    }

    return { data, error };
  },

  createTransaction: async (transactionData) => {
    const { data, error } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select(
        `
        *,
        account:accounts(name, type, is_active),
        category:categories(name, color, icon, is_default)
      `,
      )
      .single();

    // Process the data to handle null references
    if (data) {
      if (!data.account || !data.account.is_active) {
        data.account = {
          name: "Deleted Account",
          type: "unknown",
          is_active: false,
        };
      }

      if (!data.category) {
        data.category = {
          name: "Uncategorized",
          color: "#6B7280",
          icon: "tag",
          is_default: false,
        };
      }
    }

    return { data, error };
  },

  updateTransaction: async (id, updates) => {
    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id)
      .select(
        `
        *,
        account:accounts(name, type, is_active),
        category:categories(name, color, icon, is_default)
      `,
      )
      .single();

    // Process the data to handle null references
    if (data) {
      if (!data.account || !data.account.is_active) {
        data.account = {
          name: "Deleted Account",
          type: "unknown",
          is_active: false,
        };
      }

      if (!data.category) {
        data.category = {
          name: "Uncategorized",
          color: "#6B7280",
          icon: "tag",
          is_default: false,
        };
      }
    }

    return { data, error };
  },

  deleteTransaction: async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    return { error };
  },

  // Categories
  getCategories: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });
    return { data, error };
  },

  createCategory: async (categoryData) => {
    const { data, error } = await supabase
      .from("categories")
      .insert(categoryData)
      .select()
      .single();
    return { data, error };
  },

  updateCategory: async (id, updates) => {
    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  },

  deleteCategory: async (id) => {
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
};
