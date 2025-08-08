// Script to fix transaction categorization and net flow calculation issues
// This script analyzes existing transactions and fixes categorization problems

import db from "../src/database.js";

// Enhanced categorization function
const categorizeTransaction = description => {
  if (!description || typeof description !== "string") {
    return "Other";
  }

  const desc = description.toLowerCase();

  // Enhanced categorization with more merchants and patterns
  const categories = {
    Groceries: [
      "grocery",
      "supermarket",
      "food",
      "market",
      "safeway",
      "kroger",
      "whole foods",
      "trader joe",
      "walmart",
      "target",
      "costco",
      "sams club",
      "albertsons",
      "publix",
      "wegmans",
      "shoprite",
      "stop & shop",
    ],
    Restaurants: [
      "restaurant",
      "cafe",
      "dining",
      "pizza",
      "burger",
      "mcdonald",
      "starbucks",
      "subway",
      "chipotle",
      "panera",
      "olive garden",
      "applebees",
      "chili",
      "taco bell",
      "kfc",
      "dominos",
      "papa johns",
    ],
    Transport: [
      "gas",
      "fuel",
      "uber",
      "lyft",
      "taxi",
      "parking",
      "shell",
      "exxon",
      "chevron",
      "bp",
      "mobil",
      "valero",
      "speedway",
      "public transit",
      "metro",
      "bus",
      "train",
      "airline",
      "delta",
      "united",
    ],
    Utilities: [
      "electric",
      "water",
      "internet",
      "phone",
      "at&t",
      "verizon",
      "comcast",
      "spectrum",
      "cox",
      "xfinity",
      "gas company",
      "utility",
    ],
    Shopping: [
      "amazon",
      "target",
      "shop",
      "store",
      "best buy",
      "home depot",
      "lowes",
      "macy",
      "nordstrom",
      "kohl",
      "marshalls",
      "tj maxx",
      "ross",
      "burlington",
      "old navy",
      "gap",
      "h&m",
      "zara",
    ],
    Income: [
      "deposit",
      "salary",
      "payroll",
      "income",
      "direct deposit",
      "transfer in",
      "refund",
      "reimbursement",
      "bonus",
      "commission",
    ],
    Entertainment: [
      "netflix",
      "spotify",
      "movie",
      "theater",
      "game",
      "hulu",
      "disney",
      "youtube",
      "prime",
      "hbo",
      "peacock",
      "paramount",
      "concert",
      "show",
      "ticket",
      "amazon prime",
    ],
    Healthcare: [
      "pharmacy",
      "medical",
      "doctor",
      "hospital",
      "cvs",
      "walgreens",
      "rite aid",
      "insurance",
      "copay",
      "deductible",
      "prescription",
    ],
    Housing: [
      "rent",
      "mortgage",
      "home",
      "apartment",
      "lease",
      "property",
      "maintenance",
      "repair",
      "furniture",
      "ikea",
      "wayfair",
    ],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return category;
    }
  }

  return "Other";
};

// Function to determine if a transaction should be income based on description and amount
const shouldBeIncome = (description, amount) => {
  if (!description) return amount > 0;
  
  const desc = description.toLowerCase();
  
  // Keywords that indicate income regardless of amount
  const incomeKeywords = [
    "deposit",
    "salary",
    "payroll",
    "income",
    "direct deposit",
    "transfer in",
    "refund",
    "reimbursement",
    "bonus",
    "commission",
    "credit",
    "payment received",
  ];
  
  if (incomeKeywords.some(keyword => desc.includes(keyword))) {
    return true;
  }
  
  // Keywords that indicate expense regardless of amount
  const expenseKeywords = [
    "withdrawal",
    "debit",
    "purchase",
    "payment",
    "fee",
    "charge",
    "atm",
    "cash withdrawal",
  ];
  
  if (expenseKeywords.some(keyword => desc.includes(keyword))) {
    return false;
  }
  
  // Default: positive amounts are income, negative are expenses
  return amount > 0;
};

async function fixTransactionCategorization() {
  console.log("🔧 Starting transaction categorization fix...");
  
  try {
    // Get all transactions
    const allTransactions = await db.transactions.toArray();
    console.log(`📊 Found ${allTransactions.length} transactions to analyze`);
    
    let fixedCount = 0;
    let recategorizedCount = 0;
    let amountFixedCount = 0;
    
    for (const transaction of allTransactions) {
      let needsUpdate = false;
      const updates = {};
      
      // Fix categorization
      const currentCategory = transaction.category || "Other";
      const suggestedCategory = categorizeTransaction(transaction.description);
      
      if (currentCategory !== suggestedCategory) {
        updates.category = suggestedCategory;
        needsUpdate = true;
        recategorizedCount++;
        console.log(`🔄 Recategorizing: "${transaction.description}" from "${currentCategory}" to "${suggestedCategory}"`);
      }
      
      // Fix amount signs based on description and category
      const shouldBeIncomeTransaction = shouldBeIncome(transaction.description, transaction.amount);
      const currentIsPositive = transaction.amount > 0;
      
      if (shouldBeIncomeTransaction !== currentIsPositive) {
        // Fix the amount sign
        updates.amount = Math.abs(transaction.amount) * (shouldBeIncomeTransaction ? 1 : -1);
        needsUpdate = true;
        amountFixedCount++;
        console.log(`💰 Fixing amount: "${transaction.description}" from ${transaction.amount} to ${updates.amount} (${shouldBeIncomeTransaction ? 'income' : 'expense'})`);
      }
      
      // Update transaction if needed
      if (needsUpdate) {
        await db.transactions.update(transaction.id, updates);
        fixedCount++;
      }
    }
    
    console.log("\n📈 Fix Summary:");
    console.log(`✅ Total transactions processed: ${allTransactions.length}`);
    console.log(`🔄 Transactions recategorized: ${recategorizedCount}`);
    console.log(`💰 Amount signs fixed: ${amountFixedCount}`);
    console.log(`🔧 Total transactions updated: ${fixedCount}`);
    
    // Verify the fixes
    console.log("\n🔍 Verifying fixes...");
    const updatedTransactions = await db.transactions.toArray();
    
    // Calculate totals
    const totalIncome = updatedTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpenses = updatedTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const netFlow = totalIncome - totalExpenses;
    
    console.log(`📊 After fixes:`);
    console.log(`   Total Income: $${totalIncome.toFixed(2)}`);
    console.log(`   Total Expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`   Net Flow: $${netFlow.toFixed(2)}`);
    
    // Check for any remaining issues
    const uncategorizedTransactions = updatedTransactions.filter(t => 
      !t.category || t.category === "Other" || t.category === "Uncategorized"
    );
    
    if (uncategorizedTransactions.length > 0) {
      console.log(`\n⚠️  ${uncategorizedTransactions.length} transactions still need manual categorization:`);
      uncategorizedTransactions.slice(0, 10).forEach(t => {
        console.log(`   - "${t.description}" (${t.amount})`);
      });
      if (uncategorizedTransactions.length > 10) {
        console.log(`   ... and ${uncategorizedTransactions.length - 10} more`);
      }
    }
    
    // Category breakdown
    const categoryBreakdown = {};
    updatedTransactions.forEach(t => {
      const category = t.category || "Other";
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });
    
    console.log("\n📋 Category breakdown:");
    Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} transactions`);
      });
    
    console.log("\n🎉 Transaction categorization fix completed!");
    console.log("💡 The net flow should now display correctly in the app.");
    
  } catch (error) {
    console.error("❌ Error fixing transaction categorization:", error);
  } finally {
    await db.close();
  }
}

// Run the fix
fixTransactionCategorization();
