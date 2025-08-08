// Browser diagnostic script - run this in the browser console
// Copy and paste this into your browser's developer console

console.log("🔍 Running transaction diagnostic...");

// Get the store instance
const store = window.__ZUSTAND_STORE__ || window.store;

if (!store) {
  console.log("❌ Store not found. Make sure you're on the app page.");
  return;
}

// Get current state
const state = store.getState();
const { transactions, accounts } = state;

console.log(`📊 Found ${transactions.length} transactions and ${accounts.length} accounts`);

if (transactions.length === 0) {
  console.log("ℹ️  No transactions found");
  return;
}

// Calculate totals
const totalIncome = transactions
  .filter(t => t.amount > 0)
  .reduce((sum, t) => sum + t.amount, 0);
  
const totalExpenses = transactions
  .filter(t => t.amount < 0)
  .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
const netFlow = totalIncome - totalExpenses;

console.log("\n📈 Current Totals:");
console.log(`   Total Income: $${totalIncome.toFixed(2)}`);
console.log(`   Total Expenses: $${totalExpenses.toFixed(2)}`);
console.log(`   Net Flow: $${netFlow.toFixed(2)}`);

// Check for categorization issues
const uncategorizedTransactions = transactions.filter(t => 
  !t.category || t.category === "Other" || t.category === "Uncategorized"
);

console.log(`\n📋 Categorization Issues:`);
console.log(`   Uncategorized transactions: ${uncategorizedTransactions.length}`);

if (uncategorizedTransactions.length > 0) {
  console.log("   Sample uncategorized transactions:");
  uncategorizedTransactions.slice(0, 5).forEach(t => {
    console.log(`     - "${t.description}" (${t.amount})`);
  });
}

// Check for potential amount sign issues
const potentialIssues = transactions.filter(t => {
  const desc = t.description.toLowerCase();
  const isPositive = t.amount > 0;
  
  // Check for income keywords with negative amounts
  const incomeKeywords = ["deposit", "salary", "payroll", "income", "refund"];
  const hasIncomeKeywords = incomeKeywords.some(keyword => desc.includes(keyword));
  
  // Check for expense keywords with positive amounts
  const expenseKeywords = ["withdrawal", "debit", "purchase", "payment", "fee"];
  const hasExpenseKeywords = expenseKeywords.some(keyword => desc.includes(keyword));
  
  return (hasIncomeKeywords && !isPositive) || (hasExpenseKeywords && isPositive);
});

console.log(`\n💰 Potential Amount Sign Issues:`);
console.log(`   Transactions with potential sign issues: ${potentialIssues.length}`);

if (potentialIssues.length > 0) {
  console.log("   Sample transactions with potential issues:");
  potentialIssues.slice(0, 5).forEach(t => {
    console.log(`     - "${t.description}" (${t.amount})`);
  });
}

// Category breakdown
const categoryBreakdown = {};
transactions.forEach(t => {
  const category = t.category || "Other";
  categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
});

console.log("\n📋 Category Breakdown:");
Object.entries(categoryBreakdown)
  .sort(([,a], [,b]) => b - a)
  .forEach(([category, count]) => {
    console.log(`   ${category}: ${count} transactions`);
  });

// Sample transactions
console.log("\n📝 Sample Transactions:");
transactions.slice(0, 10).forEach(t => {
  console.log(`   - "${t.description}" | ${t.amount} | ${t.category || 'Uncategorized'}`);
});

// Test account stats calculation
console.log("\n🏦 Account Stats Test:");
accounts.forEach(account => {
  const stats = store.getState().calculateAccountStats(account.id);
  console.log(`   ${account.name}:`);
  console.log(`     Income: $${stats.income.toFixed(2)}`);
  console.log(`     Expenses: $${stats.expenses.toFixed(2)}`);
  console.log(`     Net Flow: $${stats.netFlow.toFixed(2)}`);
  console.log(`     Transaction Count: ${stats.transactionCount}`);
});

console.log("\n✅ Diagnostic complete!");
console.log("💡 If you see issues, check the transaction categories and amount signs.");
