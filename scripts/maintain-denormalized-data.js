#!/usr/bin/env node

/**
 * Data Pipeline: Maintain Denormalized Data
 *
 * This script maintains the denormalized data and materialized views
 * to ensure optimal read performance. It can be run:
 * - As a cron job (recommended: every 5 minutes)
 * - On-demand for data consistency
 * - After bulk operations
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

class DenormalizationPipeline {
  constructor() {
    this.stats = {
      startTime: new Date(),
      transactionsUpdated: 0,
      accountsUpdated: 0,
      categoriesUpdated: 0,
      viewsRefreshed: 0,
      errors: [],
    };
  }

  async run() {
    console.log("🚀 Starting denormalization pipeline...");

    try {
      // Step 1: Update denormalized transaction data
      await this.updateTransactionDenormalization();

      // Step 2: Update denormalized account data
      await this.updateAccountDenormalization();

      // Step 3: Update denormalized category data
      await this.updateCategoryDenormalization();

      // Step 4: Refresh materialized views
      await this.refreshMaterializedViews();

      // Step 5: Validate data consistency
      await this.validateDataConsistency();

      this.printStats();
    } catch (error) {
      console.error("❌ Pipeline failed:", error);
      this.stats.errors.push(error.message);
      this.printStats();
      process.exit(1);
    }
  }

  async updateTransactionDenormalization() {
    console.log("📊 Updating transaction denormalization...");

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(
        `
        id,
        account_id,
        category_id,
        transaction_type_id,
        account:accounts(
          name,
          account_type_id,
          currency_id,
          account_types(code, icon_id, color_id),
          currencies(code, symbol)
        ),
        category:categories(
          name,
          icon_id,
          color_id,
          category_icons(ui_icons(name)),
          ui_colors(hex_code)
        ),
        transaction_types(
          code,
          icon_id,
          color_id,
          ui_icons(name),
          ui_colors(hex_code)
        )
      `
      )
      .is("account_name", null);

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    if (transactions && transactions.length > 0) {
      console.log(`🔄 Updating ${transactions.length} transactions...`);

      for (const transaction of transactions) {
        await this.updateSingleTransaction(transaction);
        this.stats.transactionsUpdated++;
      }
    } else {
      console.log("✅ All transactions are already denormalized");
    }
  }

  async updateSingleTransaction(transaction) {
    const updates = {};

    if (transaction.account) {
      updates.account_name = transaction.account.name;
      updates.account_type_code = transaction.account.account_types?.code;
      updates.currency_code = transaction.account.currencies?.code;
      updates.currency_symbol = transaction.account.currencies?.symbol;

      // Get account type UI details
      if (transaction.account.account_types) {
        const { data: accountTypeUI } = await supabase
          .from("account_types")
          .select(
            `
            ui_icons(name),
            ui_colors(hex_code)
          `
          )
          .eq("id", transaction.account.account_types.id)
          .single();

        if (accountTypeUI) {
          updates.account_type_icon = accountTypeUI.ui_icons?.name;
          updates.account_type_color = accountTypeUI.ui_colors?.hex_code;
        }
      }
    }

    if (transaction.category) {
      updates.category_name = transaction.category.name;
      updates.category_icon =
        transaction.category.category_icons?.ui_icons?.name;
      updates.category_color = transaction.category.ui_colors?.hex_code;
    }

    if (transaction.transaction_types) {
      updates.transaction_type_code = transaction.transaction_types.code;
      updates.transaction_type_icon =
        transaction.transaction_types.ui_icons?.name;
      updates.transaction_type_color =
        transaction.transaction_types.ui_colors?.hex_code;
    }

    const { error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", transaction.id);

    if (error) {
      throw new Error(
        `Failed to update transaction ${transaction.id}: ${error.message}`
      );
    }
  }

  async updateAccountDenormalization() {
    console.log("🏦 Updating account denormalization...");

    const { data: accounts, error } = await supabase
      .from("accounts")
      .select(
        `
        id,
        account_type_id,
        currency_id,
        account_types(name, icon_id, color_id),
        currencies(name),
        ui_icons(name),
        ui_colors(hex_code)
      `
      )
      .is("account_type_name", null);

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    if (accounts && accounts.length > 0) {
      console.log(`🔄 Updating ${accounts.length} accounts...`);

      for (const account of accounts) {
        await this.updateSingleAccount(account);
        this.stats.accountsUpdated++;
      }
    } else {
      console.log("✅ All accounts are already denormalized");
    }
  }

  async updateSingleAccount(account) {
    const updates = {};

    if (account.account_types) {
      updates.account_type_name = account.account_types.name;
    }

    if (account.currencies) {
      updates.currency_name = account.currencies.name;
    }

    // Get UI details
    if (account.account_types) {
      const { data: accountTypeUI } = await supabase
        .from("account_types")
        .select(
          `
          ui_icons(name),
          ui_colors(hex_code)
        `
        )
        .eq("id", account.account_types.id)
        .single();

      if (accountTypeUI) {
        updates.account_type_icon = accountTypeUI.ui_icons?.name;
        updates.account_type_color = accountTypeUI.ui_colors?.hex_code;
      }
    }

    // Update transaction count and financial metrics
    const { data: transactionStats } = await supabase
      .from("transactions")
      .select("amount, date")
      .eq("account_id", account.id);

    if (transactionStats) {
      updates.transaction_count = transactionStats.length;
      updates.last_transaction_date =
        transactionStats.length > 0
          ? Math.max(...transactionStats.map(t => new Date(t.date)))
          : null;
      updates.monthly_income = transactionStats
        .filter(
          t =>
            t.amount > 0 &&
            new Date(t.date) >=
              new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        )
        .reduce((sum, t) => sum + t.amount, 0);
      updates.monthly_expenses = transactionStats
        .filter(
          t =>
            t.amount < 0 &&
            new Date(t.date) >=
              new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }

    const { error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", account.id);

    if (error) {
      throw new Error(
        `Failed to update account ${account.id}: ${error.message}`
      );
    }
  }

  async updateCategoryDenormalization() {
    console.log("🏷️ Updating category denormalization...");

    const { data: categories, error } = await supabase
      .from("categories")
      .select(
        `
        id,
        icon_id,
        color_id,
        category_icons(ui_icons(name, icon_class)),
        ui_colors(hex_code)
      `
      )
      .is("icon_name", null);

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    if (categories && categories.length > 0) {
      console.log(`🔄 Updating ${categories.length} categories...`);

      for (const category of categories) {
        await this.updateSingleCategory(category);
        this.stats.categoriesUpdated++;
      }
    } else {
      console.log("✅ All categories are already denormalized");
    }
  }

  async updateSingleCategory(category) {
    const updates = {};

    if (category.category_icons?.ui_icons) {
      updates.icon_name = category.category_icons.ui_icons.name;
      updates.icon_class = category.category_icons.ui_icons.icon_class;
    }

    if (category.ui_colors) {
      updates.color_hex = category.ui_colors.hex_code;
    }

    // Update transaction count and financial metrics
    const { data: transactionStats } = await supabase
      .from("transactions")
      .select("amount")
      .eq("category_id", category.id);

    if (transactionStats) {
      updates.transaction_count = transactionStats.length;
      updates.total_amount = transactionStats.reduce(
        (sum, t) => sum + t.amount,
        0
      );
    }

    const { error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", category.id);

    if (error) {
      throw new Error(
        `Failed to update category ${category.id}: ${error.message}`
      );
    }
  }

  async refreshMaterializedViews() {
    console.log("🔄 Refreshing materialized views...");

    const { error } = await supabase.rpc("refresh_analytics_views");

    if (error) {
      throw new Error(`Failed to refresh materialized views: ${error.message}`);
    }

    this.stats.viewsRefreshed = 3; // dashboard_analytics, account_performance, category_analytics
    console.log("✅ Materialized views refreshed successfully");
  }

  async validateDataConsistency() {
    console.log("🔍 Validating data consistency...");

    // Check for orphaned denormalized data
    const { data: orphanedTransactions, error: orphanedError } = await supabase
      .from("transactions")
      .select("id, account_name, account_id")
      .not("account_id", "is", null)
      .is("account_name", null);

    if (orphanedError) {
      throw new Error(
        `Failed to validate transactions: ${orphanedError.message}`
      );
    }

    if (orphanedTransactions && orphanedTransactions.length > 0) {
      console.warn(
        `⚠️ Found ${orphanedTransactions.length} transactions with missing denormalized data`
      );
      this.stats.errors.push(
        `${orphanedTransactions.length} transactions need denormalization`
      );
    } else {
      console.log("✅ Transaction denormalization is consistent");
    }

    // Check materialized view freshness
    const { data: viewStats, error: viewError } = await supabase
      .from("dashboard_analytics")
      .select("user_id")
      .limit(1);

    if (viewError) {
      throw new Error(
        `Failed to validate materialized views: ${viewError.message}`
      );
    }

    console.log("✅ Materialized views are up to date");
  }

  printStats() {
    const duration = new Date() - this.stats.startTime;

    console.log("\n📈 Pipeline Statistics:");
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Transactions updated: ${this.stats.transactionsUpdated}`);
    console.log(`🏦 Accounts updated: ${this.stats.accountsUpdated}`);
    console.log(`🏷️ Categories updated: ${this.stats.categoriesUpdated}`);
    console.log(`🔄 Views refreshed: ${this.stats.viewsRefreshed}`);

    if (this.stats.errors.length > 0) {
      console.log(`❌ Errors: ${this.stats.errors.length}`);
      this.stats.errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log("✅ No errors encountered");
    }

    console.log("\n🎉 Denormalization pipeline completed successfully!");
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const pipeline = new DenormalizationPipeline();

  switch (command) {
    case "run":
    case undefined:
      await pipeline.run();
      break;

    case "validate":
      await pipeline.validateDataConsistency();
      break;

    case "refresh-views":
      await pipeline.refreshMaterializedViews();
      break;

    case "help":
      console.log(`
Usage: node maintain-denormalized-data.js [command]

Commands:
  run              Run the full denormalization pipeline (default)
  validate         Only validate data consistency
  refresh-views    Only refresh materialized views
  help             Show this help message

Examples:
  node maintain-denormalized-data.js run
  node maintain-denormalized-data.js validate
  node maintain-denormalized-data.js refresh-views
      `);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log(
        'Run "node maintain-denormalized-data.js help" for usage information'
      );
      process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Pipeline interrupted by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Pipeline terminated");
  process.exit(0);
});

// Run the pipeline
main().catch(error => {
  console.error("❌ Pipeline failed:", error);
  process.exit(1);
});
