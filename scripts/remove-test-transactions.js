import db from "../src/database.js";

// Test transaction descriptions to identify and remove
const testTransactionDescriptions = [
  "Grocery Shopping",
  "Salary Payment", 
  "Gas Station",
  "Restaurant Dinner",
  "Movie Tickets",
  "July Shopping",
  "July Income",
  "March Utilities",
  "Old Transaction"
];

async function removeTestTransactions() {
  try {
    console.log("🔍 Searching for test transactions...");

    // Get all transactions
    const allTransactions = await db.transactions.toArray();
    
    // Filter out test transactions
    const testTransactions = allTransactions.filter(transaction => 
      testTransactionDescriptions.includes(transaction.description)
    );

    if (testTransactions.length === 0) {
      console.log("✅ No test transactions found to remove");
      return;
    }

    console.log(`📊 Found ${testTransactions.length} test transactions to remove`);

    // Remove test transactions
    for (const transaction of testTransactions) {
      await db.transactions.delete(transaction.id);
      console.log(`🗑️ Removed: ${transaction.description} (${transaction.amount})`);
    }

    console.log(`✅ Successfully removed ${testTransactions.length} test transactions`);
    console.log("\nTest transactions removed:");
    testTransactions.forEach(t => {
      console.log(`- ${t.description} (${t.amount}) - ${new Date(t.date).toLocaleDateString()}`);
    });

  } catch (error) {
    console.error("❌ Error removing test transactions:", error);
  } finally {
    await db.close();
  }
}

// Run the script
removeTestTransactions(); 