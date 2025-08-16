/**
 * Clear Local Database - Browser Console Script
 * 
 * Copy and paste this entire script into your browser console to clear all local data
 */

(async function clearLocalDatabase() {
  console.log("🧹 Clearing Local Database...");
  
  try {
    // Import Dexie dynamically
    const { Dexie } = await import('https://unpkg.com/dexie@latest/dist/dexie.js');
    
    // Create a temporary database instance
    const db = new Dexie("AuraFinanceDB");
    
    // Define the schema (same as in database.js)
    db.version(3).stores({
      users: "++id, email, name, passwordHash, createdAt, updatedAt",
      sessions: "++id, userId, token, expiresAt, createdAt",
      transactions: "++id, date, description, amount, category, accountId, userId",
      accounts: "++id, name, type, balance, initialBalance, lastBalanceUpdate, userId",
    });
    
    // Get current counts
    const transactionCount = await db.transactions.count();
    const accountCount = await db.accounts.count();
    
    console.log(`📊 Current state: ${transactionCount} transactions, ${accountCount} accounts`);
    
    if (transactionCount > 0) {
      console.log("🗑️ Deleting all transactions...");
      await db.transactions.clear();
      console.log("✅ All transactions deleted");
    }
    
    if (accountCount > 0) {
      console.log("🗑️ Deleting all accounts...");
      await db.accounts.clear();
      console.log("✅ All accounts deleted");
    }
    
    // Close the database
    await db.close();
    
    console.log("🎉 Local database cleared successfully!");
    console.log("🔄 Please refresh the page to see the changes.");
    
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    console.log("💡 Alternative: Open Developer Tools → Application → IndexedDB → AuraFinanceDB → Delete");
  }
})();
