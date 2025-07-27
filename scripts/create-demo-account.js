#!/usr/bin/env node

/* eslint-env node */

/**
 * Demo Account Creation Script
 * Creates a demo account for showcasing Aura Finance
 *
 * Usage: node scripts/create-demo-account.js
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   - VITE_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  console.error("");
  console.error("Please add these to your .env file");
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DEMO_ACCOUNT = {
  email: process.env.DEMO_EMAIL || "test@gmail.com",
  password: process.env.DEMO_PASSWORD || "demo123",
  name: "Demo User",
  metadata: {
    is_demo_account: true,
    created_for: "showcase",
    created_at: new Date().toISOString(),
  },
};

async function createDemoAccount() {
  console.log("🚀 Creating demo account for Aura Finance...");
  console.log("");

  try {
    // Check if demo account already exists
    console.log("📋 Checking if demo account already exists...");
    const { data: existingUser, error: checkError } =
      await supabase.auth.admin.listUsers();

    if (checkError) {
      console.error("❌ Error checking existing users:", checkError.message);
      return;
    }

    const demoUserExists = existingUser.users.find(
      (user) => user.email === DEMO_ACCOUNT.email
    );

    if (demoUserExists) {
      console.log("✅ Demo account already exists");
      console.log(`   Email: ${DEMO_ACCOUNT.email}`);
      console.log(`   Password: ${DEMO_ACCOUNT.password}`);
      console.log("");
      console.log(
        "🔗 Demo Login URL: https://aura-finance-tool.vercel.app/auth"
      );
      return;
    }

    // Create demo user
    console.log("👤 Creating demo user account...");
    const { data: user, error: createError } =
      await supabase.auth.admin.createUser({
        email: DEMO_ACCOUNT.email,
        password: DEMO_ACCOUNT.password,
        email_confirm: true,
        user_metadata: DEMO_ACCOUNT.metadata,
      });

    if (createError) {
      console.error("❌ Error creating demo user:", createError.message);
      return;
    }

    console.log("✅ Demo user created successfully!");
    console.log(`   User ID: ${user.user.id}`);
    console.log(`   Email: ${user.user.email}`);
    console.log("");

    // Create demo data
    console.log("📊 Creating demo data...");
    await createDemoData(user.user.id);

    console.log("🎉 Demo account setup complete!");
    console.log("");
    console.log("📋 Demo Account Details:");
    console.log(`   Email: ${DEMO_ACCOUNT.email}`);
    console.log(`   Password: ${DEMO_ACCOUNT.password}`);
    console.log(`   Name: ${DEMO_ACCOUNT.name}`);
    console.log("");
    console.log("🔗 Demo Login URL: https://aura-finance-tool.vercel.app/auth");
    console.log("");
    console.log("💡 Use these credentials for showcasing the application");
  } catch (error) {
    console.error("💥 Unexpected error:", error.message);
    process.exit(1);
  }
}

async function createDemoData(userId) {
  try {
    // Create demo accounts
    const demoAccounts = [
      {
        name: "Main Checking",
        type: "checking",
        balance: 5240.5,
        currency: "USD",
        is_active: true,
        user_id: userId,
      },
      {
        name: "Savings Account",
        type: "savings",
        balance: 12500.0,
        currency: "USD",
        is_active: true,
        user_id: userId,
      },
      {
        name: "Credit Card",
        type: "credit",
        balance: -1250.75,
        currency: "USD",
        is_active: true,
        user_id: userId,
      },
      {
        name: "Investment Portfolio",
        type: "investment",
        balance: 45000.0,
        currency: "USD",
        is_active: true,
        user_id: userId,
      },
    ];

    for (const account of demoAccounts) {
      const { error } = await supabase.from("accounts").insert(account);

      if (error) {
        console.error(
          `❌ Error creating account ${account.name}:`,
          error.message
        );
      } else {
        console.log(`   ✅ Created account: ${account.name}`);
      }
    }

    // Create demo categories
    const demoCategories = [
      {
        name: "Food & Dining",
        color: "#FF6B6B",
        icon: "utensils",
        is_default: true,
        user_id: userId,
      },
      {
        name: "Transportation",
        color: "#4ECDC4",
        icon: "car",
        is_default: true,
        user_id: userId,
      },
      {
        name: "Shopping",
        color: "#45B7D1",
        icon: "shopping-bag",
        is_default: true,
        user_id: userId,
      },
      {
        name: "Entertainment",
        color: "#96CEB4",
        icon: "film",
        is_default: true,
        user_id: userId,
      },
      {
        name: "Healthcare",
        color: "#FFEAA7",
        icon: "heart",
        is_default: true,
        user_id: userId,
      },
      {
        name: "Utilities",
        color: "#DDA0DD",
        icon: "zap",
        is_default: true,
        user_id: userId,
      },
      {
        name: "Salary",
        color: "#98D8C8",
        icon: "dollar-sign",
        is_default: true,
        user_id: userId,
      },
      {
        name: "Investment",
        color: "#F7DC6F",
        icon: "trending-up",
        is_default: true,
        user_id: userId,
      },
    ];

    for (const category of demoCategories) {
      const { error } = await supabase.from("categories").insert(category);

      if (error) {
        console.error(
          `❌ Error creating category ${category.name}:`,
          error.message
        );
      } else {
        console.log(`   ✅ Created category: ${category.name}`);
      }
    }

    // Get account and category IDs for transactions
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id, name")
      .eq("user_id", userId);

    const { data: categories } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", userId);

    // Create demo transactions
    const demoTransactions = [
      {
        description: "Grocery Shopping",
        amount: -85.5,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        type: "expense",
        account_id: accounts.find((a) => a.name === "Main Checking").id,
        category_id: categories.find((c) => c.name === "Food & Dining").id,
        user_id: userId,
      },
      {
        description: "Gas Station",
        amount: -45.0,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        type: "expense",
        account_id: accounts.find((a) => a.name === "Main Checking").id,
        category_id: categories.find((c) => c.name === "Transportation").id,
        user_id: userId,
      },
      {
        description: "Salary Deposit",
        amount: 3500.0,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        type: "income",
        account_id: accounts.find((a) => a.name === "Main Checking").id,
        category_id: categories.find((c) => c.name === "Salary").id,
        user_id: userId,
      },
      {
        description: "Netflix Subscription",
        amount: -15.99,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        type: "expense",
        account_id: accounts.find((a) => a.name === "Credit Card").id,
        category_id: categories.find((c) => c.name === "Entertainment").id,
        user_id: userId,
      },
      {
        description: "Investment Dividend",
        amount: 250.0,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        type: "income",
        account_id: accounts.find((a) => a.name === "Investment Portfolio").id,
        category_id: categories.find((c) => c.name === "Investment").id,
        user_id: userId,
      },
    ];

    for (const transaction of demoTransactions) {
      const { error } = await supabase.from("transactions").insert(transaction);

      if (error) {
        console.error(
          `❌ Error creating transaction ${transaction.description}:`,
          error.message
        );
      } else {
        console.log(`   ✅ Created transaction: ${transaction.description}`);
      }
    }

    console.log("   ✅ Demo data created successfully!");
  } catch (error) {
    console.error("❌ Error creating demo data:", error.message);
  }
}

// Run the script
createDemoAccount();
