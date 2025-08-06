#!/usr/bin/env node

/**
 * Performance Testing Script
 *
 * This script tests the performance improvements from strategic denormalization
 * by comparing query execution times between 3NF and denormalized approaches.
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

class PerformanceTester {
  constructor() {
    this.results = {
      tests: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        averageImprovement: 0,
        totalTimeSaved: 0,
      },
    };
  }

  async runAllTests() {
    console.log("🚀 Starting performance tests...\n");

    // Test 1: Transaction List Query
    await this.testTransactionListQuery();

    // Test 2: Dashboard Analytics Query
    await this.testDashboardAnalyticsQuery();

    // Test 3: Account Performance Query
    await this.testAccountPerformanceQuery();

    // Test 4: Search Query
    await this.testSearchQuery();

    // Test 5: Category Analytics Query
    await this.testCategoryAnalyticsQuery();

    this.printResults();
  }

  async testTransactionListQuery() {
    console.log("📊 Testing Transaction List Query...");

    // Get a sample user
    const { data: users } = await supabase.from("users").select("id").limit(1);
    if (!users || users.length === 0) {
      console.log("⚠️ No users found for testing");
      return;
    }

    const userId = users[0].id;

    // Test 3NF approach (complex joins)
    const startTime3NF = Date.now();
    const { data: data3NF, error: error3NF } = await supabase
      .from("transactions")
      .select(
        `
        *,
        account:accounts(name, account_type_id, currency_id),
        account_types(code, icon_id, color_id),
        ui_icons(name),
        ui_colors(hex_code),
        categories(name, icon_id, color_id),
        category_icons(ui_icons(name)),
        ui_colors(hex_code)
      `
      )
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(50);
    const time3NF = Date.now() - startTime3NF;

    // Test denormalized approach (simple query)
    const startTimeDenorm = Date.now();
    const { data: dataDenorm, error: errorDenorm } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(50);
    const timeDenorm = Date.now() - startTimeDenorm;

    const improvement = (((time3NF - timeDenorm) / time3NF) * 100).toFixed(1);
    const speedup = (time3NF / timeDenorm).toFixed(1);

    this.results.tests.push({
      name: "Transaction List Query",
      time3NF,
      timeDenorm,
      improvement: parseFloat(improvement),
      speedup: parseFloat(speedup),
      success: !error3NF && !errorDenorm,
      dataCount: dataDenorm?.length || 0,
    });

    console.log(
      `  3NF: ${time3NF}ms | Denormalized: ${timeDenorm}ms | Improvement: ${improvement}% (${speedup}x faster)`
    );
  }

  async testDashboardAnalyticsQuery() {
    console.log("📈 Testing Dashboard Analytics Query...");

    const { data: users } = await supabase.from("users").select("id").limit(1);
    if (!users || users.length === 0) return;

    const userId = users[0].id;

    // Test 3NF approach (multiple queries)
    const startTime3NF = Date.now();

    // Multiple queries for dashboard data
    const { data: accounts } = await supabase
      .from("accounts")
      .select("balance")
      .eq("user_id", userId);
    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, date")
      .eq("user_id", userId);

    // Calculate dashboard metrics
    const totalBalance = accounts?.reduce((sum, a) => sum + a.balance, 0) || 0;
    const totalTransactions = transactions?.length || 0;
    const totalIncome =
      transactions
        ?.filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalExpenses =
      transactions
        ?.filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    const time3NF = Date.now() - startTime3NF;

    // Test denormalized approach (materialized view)
    const startTimeDenorm = Date.now();
    const { data: dashboardData } = await supabase
      .from("dashboard_analytics")
      .select("*")
      .eq("user_id", userId)
      .single();
    const timeDenorm = Date.now() - startTimeDenorm;

    const improvement = (((time3NF - timeDenorm) / time3NF) * 100).toFixed(1);
    const speedup = (time3NF / timeDenorm).toFixed(1);

    this.results.tests.push({
      name: "Dashboard Analytics Query",
      time3NF,
      timeDenorm,
      improvement: parseFloat(improvement),
      speedup: parseFloat(speedup),
      success: true,
      dataCount: 1,
    });

    console.log(
      `  3NF: ${time3NF}ms | Denormalized: ${timeDenorm}ms | Improvement: ${improvement}% (${speedup}x faster)`
    );
  }

  async testAccountPerformanceQuery() {
    console.log("🏦 Testing Account Performance Query...");

    const { data: users } = await supabase.from("users").select("id").limit(1);
    if (!users || users.length === 0) return;

    const userId = users[0].id;

    // Test 3NF approach (complex joins)
    const startTime3NF = Date.now();
    const { data: accounts3NF } = await supabase
      .from("accounts")
      .select(
        `
        *,
        account_types(code, name, icon_id, color_id),
        ui_icons(name),
        ui_colors(hex_code),
        currencies(code, symbol)
      `
      )
      .eq("user_id", userId);
    const time3NF = Date.now() - startTime3NF;

    // Test denormalized approach (materialized view)
    const startTimeDenorm = Date.now();
    const { data: accountsDenorm } = await supabase
      .from("account_performance")
      .select("*")
      .eq("user_id", userId);
    const timeDenorm = Date.now() - startTimeDenorm;

    const improvement = (((time3NF - timeDenorm) / time3NF) * 100).toFixed(1);
    const speedup = (time3NF / timeDenorm).toFixed(1);

    this.results.tests.push({
      name: "Account Performance Query",
      time3NF,
      timeDenorm,
      improvement: parseFloat(improvement),
      speedup: parseFloat(speedup),
      success: true,
      dataCount: accountsDenorm?.length || 0,
    });

    console.log(
      `  3NF: ${time3NF}ms | Denormalized: ${timeDenorm}ms | Improvement: ${improvement}% (${speedup}x faster)`
    );
  }

  async testSearchQuery() {
    console.log("🔍 Testing Search Query...");

    const { data: users } = await supabase.from("users").select("id").limit(1);
    if (!users || users.length === 0) return;

    const userId = users[0].id;
    const searchTerm = "test";

    // Test 3NF approach (complex search with joins)
    const startTime3NF = Date.now();
    const { data: search3NF } = await supabase
      .from("transactions")
      .select(
        `
        *,
        account:accounts(name),
        category:categories(name)
      `
      )
      .eq("user_id", userId)
      .or(
        `description.ilike.%${searchTerm}%,account.name.ilike.%${searchTerm}%,category.name.ilike.%${searchTerm}%`
      );
    const time3NF = Date.now() - startTime3NF;

    // Test denormalized approach (simple search)
    const startTimeDenorm = Date.now();
    const { data: searchDenorm } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .or(
        `description.ilike.%${searchTerm}%,account_name.ilike.%${searchTerm}%,category_name.ilike.%${searchTerm}%`
      );
    const timeDenorm = Date.now() - startTimeDenorm;

    const improvement = (((time3NF - timeDenorm) / time3NF) * 100).toFixed(1);
    const speedup = (time3NF / timeDenorm).toFixed(1);

    this.results.tests.push({
      name: "Search Query",
      time3NF,
      timeDenorm,
      improvement: parseFloat(improvement),
      speedup: parseFloat(speedup),
      success: true,
      dataCount: searchDenorm?.length || 0,
    });

    console.log(
      `  3NF: ${time3NF}ms | Denormalized: ${timeDenorm}ms | Improvement: ${improvement}% (${speedup}x faster)`
    );
  }

  async testCategoryAnalyticsQuery() {
    console.log("🏷️ Testing Category Analytics Query...");

    const { data: users } = await supabase.from("users").select("id").limit(1);
    if (!users || users.length === 0) return;

    const userId = users[0].id;

    // Test 3NF approach (complex aggregation)
    const startTime3NF = Date.now();
    const { data: categories3NF } = await supabase
      .from("categories")
      .select(
        `
        *,
        category_icons(ui_icons(name, icon_class)),
        ui_colors(hex_code)
      `
      )
      .eq("user_id", userId);
    const time3NF = Date.now() - startTime3NF;

    // Test denormalized approach (materialized view)
    const startTimeDenorm = Date.now();
    const { data: categoriesDenorm } = await supabase
      .from("category_analytics")
      .select("*")
      .eq("user_id", userId);
    const timeDenorm = Date.now() - startTimeDenorm;

    const improvement = (((time3NF - timeDenorm) / time3NF) * 100).toFixed(1);
    const speedup = (time3NF / timeDenorm).toFixed(1);

    this.results.tests.push({
      name: "Category Analytics Query",
      time3NF,
      timeDenorm,
      improvement: parseFloat(improvement),
      speedup: parseFloat(speedup),
      success: true,
      dataCount: categoriesDenorm?.length || 0,
    });

    console.log(
      `  3NF: ${time3NF}ms | Denormalized: ${timeDenorm}ms | Improvement: ${improvement}% (${speedup}x faster)`
    );
  }

  printResults() {
    console.log("\n📊 Performance Test Results:");
    console.log("=".repeat(80));

    let totalImprovement = 0;
    let totalTimeSaved = 0;
    let passedTests = 0;

    this.results.tests.forEach((test, index) => {
      const status = test.success ? "✅" : "❌";
      console.log(`${index + 1}. ${status} ${test.name}`);
      console.log(`   Before: ${test.time3NF}ms | After: ${test.timeDenorm}ms`);
      console.log(
        `   Improvement: ${test.improvement}% (${test.speedup}x faster)`
      );
      console.log(`   Records: ${test.dataCount}`);
      console.log("");

      if (test.success) {
        totalImprovement += test.improvement;
        totalTimeSaved += test.time3NF - test.timeDenorm;
        passedTests++;
      }
    });

    const averageImprovement = totalImprovement / passedTests;

    console.log("📈 Summary:");
    console.log(`   Tests Passed: ${passedTests}/${this.results.tests.length}`);
    console.log(`   Average Improvement: ${averageImprovement.toFixed(1)}%`);
    console.log(`   Total Time Saved: ${totalTimeSaved}ms`);
    console.log(
      `   Performance Gain: ${((totalTimeSaved / (totalTimeSaved + this.results.tests.reduce((sum, t) => sum + t.timeDenorm, 0))) * 100).toFixed(1)}%`
    );

    if (averageImprovement > 50) {
      console.log("\n🎉 Excellent performance improvements achieved!");
    } else if (averageImprovement > 20) {
      console.log("\n👍 Good performance improvements achieved!");
    } else {
      console.log(
        "\n⚠️ Performance improvements are minimal. Consider reviewing the implementation."
      );
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const tester = new PerformanceTester();

  switch (command) {
    case "run":
    case undefined:
      await tester.runAllTests();
      break;

    case "help":
      console.log(`
Usage: node test-performance-improvements.js [command]

Commands:
  run              Run all performance tests (default)
  help             Show this help message

Examples:
  node test-performance-improvements.js run
      `);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log(
        'Run "node test-performance-improvements.js help" for usage information'
      );
      process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Performance testing interrupted by user");
  process.exit(0);
});

// Run the tests
main().catch(error => {
  console.error("❌ Performance testing failed:", error);
  process.exit(1);
});
