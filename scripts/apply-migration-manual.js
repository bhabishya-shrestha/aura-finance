#!/usr/bin/env node

/**
 * Manual Migration Application Script
 * 
 * This script extracts the SQL statements from the migration file
 * so you can apply them manually through the Supabase dashboard.
 */

import { readFileSync } from "fs";
import { join } from "path";

function extractMigrationStatements() {
  console.log("📋 Extracting migration statements for manual application...\n");

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), "supabase", "migrations", "20250101000008_strategic_denormalization.sql");
    const migrationSQL = readFileSync(migrationPath, "utf8");

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"));

    console.log("🔧 Migration Statements to apply manually:\n");
    console.log("=".repeat(80));
    
    statements.forEach((statement, index) => {
      console.log(`\n-- Statement ${index + 1}:`);
      console.log(statement + ";");
      console.log("-".repeat(40));
    });

    console.log("\n" + "=".repeat(80));
    console.log("\n📝 Instructions:");
    console.log("1. Go to your Supabase Dashboard: https://supabase.com/dashboard");
    console.log("2. Select your project: mdpfwvqpwkiojnzpctou");
    console.log("3. Go to SQL Editor");
    console.log("4. Copy and paste each statement above, one at a time");
    console.log("5. Execute each statement");
    console.log("6. After applying all statements, run: npm run db:maintain");
    
    console.log("\n⚠️  Important Notes:");
    console.log("- Apply statements in order (1, 2, 3, etc.)");
    console.log("- Some statements may fail if objects already exist (this is normal)");
    console.log("- The migration will add denormalized columns to improve performance");
    console.log("- After migration, run the data pipeline to populate the new columns");

  } catch (error) {
    console.error("❌ Failed to extract migration statements:", error.message);
    process.exit(1);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "extract":
    case undefined:
      extractMigrationStatements();
      break;

    case "help":
      console.log(`
Usage: node apply-migration-manual.js [command]

Commands:
  extract          Extract migration statements for manual application (default)
  help             Show this help message

Examples:
  node apply-migration-manual.js extract
      `);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run "node apply-migration-manual.js help" for usage information');
      process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error("❌ Script failed:", error);
  process.exit(1);
}); 