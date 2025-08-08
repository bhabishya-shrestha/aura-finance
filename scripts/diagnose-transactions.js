// Diagnostic script to check transaction state and identify issues
import db from "../src/database.js";

async function diagnoseTransactions() {
  console.log("🔍 Diagnosing transaction issues...");

  try {
    // Get all transactions
    const allTransactions = await db.transactions.toArray();
    console.log(`📊 Found ${allTransactions.length} transactions`);

    if (allTransactions.length === 0) {
      console.log("ℹ️  No transactions found in database");
      return;
    }

    // Calculate totals
    const totalIncome = allTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = allTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netFlow = totalIncome - totalExpenses;

    console.log("\n📈 Current Totals:");
    console.log(`   Total Income: $${totalIncome.toFixed(2)}`);
    console.log(`   Total Expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`   Net Flow: $${netFlow.toFixed(2)}`);

    // Check for categorization issues
    const uncategorizedTransactions = allTransactions.filter(
      t =>
        !t.category || t.category === "Other" || t.category === "Uncategorized"
    );

    console.log(`\n📋 Categorization Issues:`);
    console.log(
      `   Uncategorized transactions: ${uncategorizedTransactions.length}`
    );

    if (uncategorizedTransactions.length > 0) {
      console.log("   Sample uncategorized transactions:");
      uncategorizedTransactions.slice(0, 5).forEach(t => {
        console.log(`     - "${t.description}" (${t.amount})`);
      });
    }

    // Check for potential amount sign issues
    const potentialIssues = allTransactions.filter(t => {
      const desc = t.description.toLowerCase();
      const isPositive = t.amount > 0;

      // Check for income keywords with negative amounts
      const incomeKeywords = [
        "deposit",
        "salary",
        "payroll",
        "income",
        "refund",
      ];
      const hasIncomeKeywords = incomeKeywords.some(keyword =>
        desc.includes(keyword)
      );

      // Check for expense keywords with positive amounts
      const expenseKeywords = [
        "withdrawal",
        "debit",
        "purchase",
        "payment",
        "fee",
      ];
      const hasExpenseKeywords = expenseKeywords.some(keyword =>
        desc.includes(keyword)
      );

      return (
        (hasIncomeKeywords && !isPositive) || (hasExpenseKeywords && isPositive)
      );
    });

    console.log(`\n💰 Potential Amount Sign Issues:`);
    console.log(
      `   Transactions with potential sign issues: ${potentialIssues.length}`
    );

    if (potentialIssues.length > 0) {
      console.log("   Sample transactions with potential issues:");
      potentialIssues.slice(0, 5).forEach(t => {
        console.log(`     - "${t.description}" (${t.amount})`);
      });
    }

    // Category breakdown
    const categoryBreakdown = {};
    allTransactions.forEach(t => {
      const category = t.category || "Other";
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    console.log("\n📋 Category Breakdown:");
    Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} transactions`);
      });

    // Sample transactions
    console.log("\n📝 Sample Transactions:");
    allTransactions.slice(0, 10).forEach(t => {
      console.log(
        `   - "${t.description}" | ${t.amount} | ${t.category || "Uncategorized"}`
      );
    });
  } catch (error) {
    console.error("❌ Error diagnosing transactions:", error);
  } finally {
    await db.close();
  }
}

// Run the diagnosis
diagnoseTransactions();
