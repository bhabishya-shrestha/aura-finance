// Quick diagnostic script - copy and paste this into your browser console
// Make sure you're on the app page first

console.log("🔍 Quick Transaction Diagnostic...");

// Try to get the store
let store;
try {
  // Try different ways to access the store
  store =
    window.__ZUSTAND_STORE__ ||
    window.store ||
    document.querySelector("[data-zustand-store]")?.__ZUSTAND_STORE__;
} catch (e) {
  console.log("❌ Couldn't access store directly");
}

if (!store) {
  console.log("❌ Store not found. Please make sure you're on the app page.");
  console.log("💡 Try refreshing the page and running this again.");
  return;
}

// Get transactions
const state = store.getState();
const transactions = state.transactions || [];
const accounts = state.accounts || [];

console.log(
  `📊 Found ${transactions.length} transactions and ${accounts.length} accounts`
);

if (transactions.length === 0) {
  console.log("ℹ️  No transactions found - this explains why expenses are 0");
  return;
}

// Quick analysis
const positiveTransactions = transactions.filter(t => t.amount > 0);
const negativeTransactions = transactions.filter(t => t.amount < 0);
const zeroTransactions = transactions.filter(t => t.amount === 0);

console.log("\n📈 Transaction Analysis:");
console.log(`   Positive amounts (income): ${positiveTransactions.length}`);
console.log(`   Negative amounts (expenses): ${negativeTransactions.length}`);
console.log(`   Zero amounts: ${zeroTransactions.length}`);

// Show sample transactions
console.log("\n📝 Sample Transactions:");
transactions.slice(0, 10).forEach(t => {
  const sign = t.amount > 0 ? "+" : t.amount < 0 ? "-" : "0";
  console.log(
    `   ${sign}${Math.abs(t.amount).toFixed(2)} | "${t.description}" | ${t.category || "Uncategorized"}`
  );
});

// Check for potential issues
console.log("\n🔍 Potential Issues:");

// Check for transactions that should be expenses but are positive
const expenseKeywords = [
  "payment",
  "purchase",
  "withdrawal",
  "debit",
  "fee",
  "charge",
  "bill",
];
const potentialExpenseIssues = positiveTransactions.filter(t => {
  const desc = t.description.toLowerCase();
  return expenseKeywords.some(keyword => desc.includes(keyword));
});

if (potentialExpenseIssues.length > 0) {
  console.log(
    `   ⚠️  ${potentialExpenseIssues.length} positive transactions that might be expenses:`
  );
  potentialExpenseIssues.slice(0, 5).forEach(t => {
    console.log(`      +${t.amount.toFixed(2)} | "${t.description}"`);
  });
}

// Check for transactions that should be income but are negative
const incomeKeywords = [
  "deposit",
  "salary",
  "payroll",
  "income",
  "refund",
  "credit",
];
const potentialIncomeIssues = negativeTransactions.filter(t => {
  const desc = t.description.toLowerCase();
  return incomeKeywords.some(keyword => desc.includes(keyword));
});

if (potentialIncomeIssues.length > 0) {
  console.log(
    `   ⚠️  ${potentialIncomeIssues.length} negative transactions that might be income:`
  );
  potentialIncomeIssues.slice(0, 5).forEach(t => {
    console.log(`      ${t.amount.toFixed(2)} | "${t.description}"`);
  });
}

// Calculate totals
const totalIncome = positiveTransactions.reduce((sum, t) => sum + t.amount, 0);
const totalExpenses = negativeTransactions.reduce(
  (sum, t) => sum + Math.abs(t.amount),
  0
);
const netFlow = totalIncome - totalExpenses;

console.log("\n💰 Totals:");
console.log(`   Income: $${totalIncome.toFixed(2)}`);
console.log(`   Expenses: $${totalExpenses.toFixed(2)}`);
console.log(`   Net Flow: $${netFlow.toFixed(2)}`);

// Test account stats
if (accounts.length > 0) {
  console.log("\n🏦 Account Stats Test:");
  accounts.forEach(account => {
    try {
      const stats = store.getState().calculateAccountStats(account.id);
      console.log(`   ${account.name}:`);
      console.log(`     Income: $${stats.income.toFixed(2)}`);
      console.log(`     Expenses: $${stats.expenses.toFixed(2)}`);
      console.log(`     Net Flow: $${stats.netFlow.toFixed(2)}`);
    } catch (e) {
      console.log(`   ${account.name}: Error calculating stats`);
    }
  });
}

console.log("\n✅ Diagnostic complete!");
console.log(
  "💡 If expenses are 0, check if your transactions have negative amounts."
);
