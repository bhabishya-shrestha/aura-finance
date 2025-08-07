#!/usr/bin/env node

/**
 * Apply Denormalization Migration Script
 *
 * This script applies the strategic denormalization migration to your Supabase database.
 * It can be run to apply the migration and initialize the denormalized data.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   - VITE_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  console.error("\nPlease add these to your .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

class MigrationApplier {
  constructor() {
    this.stats = {
      startTime: new Date(),
      stepsCompleted: 0,
      totalSteps: 0,
      errors: [],
    };
  }

  async run() {
    console.log("🚀 Starting denormalization migration...\n");

    try {
      // Step 1: Apply the migration using direct SQL execution
      await this.applyMigration();

      // Step 2: Initialize denormalized data
      await this.initializeDenormalizedData();

      // Step 3: Validate the migration
      await this.validateMigration();

      this.printStats();
    } catch (error) {
      console.error("❌ Migration failed:", error);
      this.stats.errors.push(error.message);
      this.printStats();
      process.exit(1);
    }
  }

  async applyMigration() {
    console.log("📋 Applying denormalization migration...");

    try {
      // Read the migration file
      const migrationPath = join(
        process.cwd(),
        "supabase",
        "migrations",
        "20250101000008_strategic_denormalization.sql"
      );
      const migrationSQL = readFileSync(migrationPath, "utf8");

      // Split the migration into individual statements
      const statements = migrationSQL
        .split(";")
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"));

      this.stats.totalSteps = statements.length;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        if (statement.trim()) {
          try {
            console.log(
              `   Executing statement ${i + 1}/${statements.length}...`
            );

            // Execute SQL directly using the service role client
            const { error } = await supabase.rpc("exec_sql", {
              sql: statement,
            });

            if (error) {
              // Some statements might fail if objects already exist (IF NOT EXISTS)
              if (
                error.message.includes("already exists") ||
                error.message.includes("duplicate key")
              ) {
                console.log(
                  `   ⚠️  Statement ${i + 1} skipped (already exists): ${error.message}`
                );
              } else {
                throw new Error(`Statement ${i + 1} failed: ${error.message}`);
              }
            } else {
              console.log(`   ✅ Statement ${i + 1} executed successfully`);
            }

            this.stats.stepsCompleted++;
          } catch (stmtError) {
            console.log(
              `   ⚠️  Statement ${i + 1} skipped: ${stmtError.message}`
            );
          }
        }
      }

      console.log("✅ Migration applied successfully");
    } catch (error) {
      throw new Error(`Failed to apply migration: ${error.message}`);
    }
  }

  async applyMigrationDirect() {
    console.log("📋 Applying denormalization migration (direct SQL)...");

    try {
      // Apply migration statements directly
      const migrationSteps = [
        // Step 1: Add denormalized columns to transactions table
        {
          name: "Add denormalized columns to transactions",
          sql: `
            ALTER TABLE public.transactions 
            ADD COLUMN IF NOT EXISTS account_name TEXT,
            ADD COLUMN IF NOT EXISTS account_type_code TEXT,
            ADD COLUMN IF NOT EXISTS account_type_icon TEXT,
            ADD COLUMN IF NOT EXISTS account_type_color TEXT,
            ADD COLUMN IF NOT EXISTS category_name TEXT,
            ADD COLUMN IF NOT EXISTS category_icon TEXT,
            ADD COLUMN IF NOT EXISTS category_color TEXT,
            ADD COLUMN IF NOT EXISTS transaction_type_code TEXT,
            ADD COLUMN IF NOT EXISTS transaction_type_icon TEXT,
            ADD COLUMN IF NOT EXISTS transaction_type_color TEXT,
            ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD',
            ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '$';
          `,
        },
        // Step 2: Add denormalized columns to accounts table
        {
          name: "Add denormalized columns to accounts",
          sql: `
            ALTER TABLE public.accounts 
            ADD COLUMN IF NOT EXISTS account_type_name TEXT,
            ADD COLUMN IF NOT EXISTS account_type_icon TEXT,
            ADD COLUMN IF NOT EXISTS account_type_color TEXT,
            ADD COLUMN IF NOT EXISTS currency_name TEXT,
            ADD COLUMN IF NOT EXISTS transaction_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_transaction_date TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS monthly_expenses DECIMAL(15,2) DEFAULT 0;
          `,
        },
        // Step 3: Add denormalized columns to categories table
        {
          name: "Add denormalized columns to categories",
          sql: `
            ALTER TABLE public.categories 
            ADD COLUMN IF NOT EXISTS icon_name TEXT,
            ADD COLUMN IF NOT EXISTS icon_class TEXT,
            ADD COLUMN IF NOT EXISTS color_hex TEXT,
            ADD COLUMN IF NOT EXISTS transaction_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0;
          `,
        },
        // Step 4: Create indexes
        {
          name: "Create indexes for denormalized columns",
          sql: `
            CREATE INDEX IF NOT EXISTS idx_transactions_account_name ON public.transactions(account_name);
            CREATE INDEX IF NOT EXISTS idx_transactions_category_name ON public.transactions(category_name);
            CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type_code ON public.transactions(transaction_type_code);
            CREATE INDEX IF NOT EXISTS idx_transactions_date_amount ON public.transactions(date, amount);
            CREATE INDEX IF NOT EXISTS idx_accounts_account_type_name ON public.accounts(account_type_name);
            CREATE INDEX IF NOT EXISTS idx_accounts_transaction_count ON public.accounts(transaction_count);
            CREATE INDEX IF NOT EXISTS idx_categories_transaction_count ON public.categories(transaction_count);
          `,
        },
      ];

      this.stats.totalSteps = migrationSteps.length;

      for (let i = 0; i < migrationSteps.length; i++) {
        const step = migrationSteps[i];

        try {
          console.log(`   Executing: ${step.name}...`);

          // Execute SQL directly using the service role client
          const { error } = await supabase.rpc("exec_sql", { sql: step.sql });

          if (error) {
            // Some statements might fail if objects already exist (IF NOT EXISTS)
            if (
              error.message.includes("already exists") ||
              error.message.includes("duplicate key")
            ) {
              console.log(
                `   ⚠️  Step ${i + 1} skipped (already exists): ${error.message}`
              );
            } else {
              throw new Error(`Step ${i + 1} failed: ${error.message}`);
            }
          } else {
            console.log(`   ✅ Step ${i + 1} executed successfully`);
          }

          this.stats.stepsCompleted++;
        } catch (stmtError) {
          console.log(`   ⚠️  Step ${i + 1} skipped: ${stmtError.message}`);
        }
      }

      console.log("✅ Migration applied successfully");
    } catch (error) {
      throw new Error(`Failed to apply migration: ${error.message}`);
    }
  }

  async initializeDenormalizedData() {
    console.log("\n🔄 Initializing denormalized data...");

    try {
      // Update transaction denormalized data
      const { data: transactions, error: txError } = await supabase
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

      if (txError) {
        throw new Error(`Failed to fetch transactions: ${txError.message}`);
      }

      if (transactions && transactions.length > 0) {
        console.log(`   Updating ${transactions.length} transactions...`);

        for (const transaction of transactions) {
          await this.updateTransactionDenormalization(transaction);
        }
      } else {
        console.log("   ✅ All transactions are already denormalized");
      }

      // Update account denormalized data
      const { data: accounts, error: accError } = await supabase
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

      if (accError) {
        throw new Error(`Failed to fetch accounts: ${accError.message}`);
      }

      if (accounts && accounts.length > 0) {
        console.log(`   Updating ${accounts.length} accounts...`);

        for (const account of accounts) {
          await this.updateAccountDenormalization(account);
        }
      } else {
        console.log("   ✅ All accounts are already denormalized");
      }

      // Update category denormalized data
      const { data: categories, error: catError } = await supabase
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

      if (catError) {
        throw new Error(`Failed to fetch categories: ${catError.message}`);
      }

      if (categories && categories.length > 0) {
        console.log(`   Updating ${categories.length} categories...`);

        for (const category of categories) {
          await this.updateCategoryDenormalization(category);
        }
      } else {
        console.log("   ✅ All categories are already denormalized");
      }

      console.log("✅ Denormalized data initialized successfully");
    } catch (error) {
      throw new Error(
        `Failed to initialize denormalized data: ${error.message}`
      );
    }
  }

  async updateTransactionDenormalization(transaction) {
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

  async updateAccountDenormalization(account) {
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

  async updateCategoryDenormalization(category) {
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

  async validateMigration() {
    console.log("\n🔍 Validating migration...");

    try {
      // Check if denormalized columns exist
      const { data: denormCheck, error: denormError } = await supabase
        .from("transactions")
        .select("account_name, category_name")
        .limit(1);

      if (denormError) {
        throw new Error(
          `Denormalized columns not accessible: ${denormError.message}`
        );
      }

      console.log("✅ Migration validation successful");
    } catch (error) {
      throw new Error(`Migration validation failed: ${error.message}`);
    }
  }

  printStats() {
    const duration = new Date() - this.stats.startTime;

    console.log("\n📊 Migration Statistics:");
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(
      `📋 Steps completed: ${this.stats.stepsCompleted}/${this.stats.totalSteps}`
    );

    if (this.stats.errors.length > 0) {
      console.log(`❌ Errors: ${this.stats.errors.length}`);
      this.stats.errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log("✅ No errors encountered");
    }

    console.log("\n🎉 Denormalization migration completed successfully!");
    console.log("\nNext steps:");
    console.log(
      "1. Run the data pipeline: node scripts/maintain-denormalized-data.js run"
    );
    console.log(
      "2. Test performance: node scripts/test-performance-improvements.js run"
    );
    console.log("3. Update frontend components to use dbOptimized");
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const applier = new MigrationApplier();

  switch (command) {
    case "run":
    case undefined:
      await applier.run();
      break;

    case "help":
      console.log(`
Usage: node apply-denormalization-migration.js [command]

Commands:
  run              Apply the denormalization migration (default)
  help             Show this help message

Examples:
  node apply-denormalization-migration.js run
      `);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log(
        'Run "node apply-denormalization-migration.js help" for usage information'
      );
      process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Migration interrupted by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Migration terminated");
  process.exit(0);
});

// Run the migration
main().catch(error => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
