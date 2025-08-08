// Test script to verify the deletion fix
// This script tests that deleted accounts don't reappear after sync

import db from "./src/database.js";
import firebaseSync from "./src/services/firebaseSync.js";

async function testDeletionFix() {
  console.log("🧪 Testing deletion fix...");
  
  try {
    // Step 1: Clear any existing deleted items
    firebaseSync.clearDeletedItems();
    console.log("✅ Cleared existing deleted items");
    
    // Step 2: Create a test account
    const testAccount = {
      id: Date.now().toString(),
      name: "Test Account for Deletion",
      type: "checking",
      balance: 1000,
      userId: "test-user",
      createdAt: new Date().toISOString()
    };
    
    await db.accounts.add(testAccount);
    console.log("✅ Created test account:", testAccount.id);
    
    // Step 3: Mark it as deleted
    firebaseSync.markAsDeleted(testAccount.id, "accounts");
    console.log("✅ Marked account as deleted");
    
    // Step 4: Verify it's in the deleted items set
    const deletedKey = `accounts:${testAccount.id}`;
    if (firebaseSync.deletedItems.has(deletedKey)) {
      console.log("✅ Account properly tracked as deleted");
    } else {
      console.log("❌ Account not tracked as deleted");
      return;
    }
    
    // Step 5: Simulate sync scenario (remote has account, local doesn't)
    const localAccounts = []; // Empty local accounts
    const remoteAccounts = [testAccount]; // Remote still has the account
    
    console.log("🔄 Simulating sync scenario...");
    
    // Step 6: Test the merge logic
    const mergedData = await firebaseSync.mergeAndSyncData(
      localAccounts, 
      remoteAccounts, 
      "accounts"
    );
    
    // Step 7: Verify the account was NOT restored
    if (mergedData.length === 0) {
      console.log("✅ Account was NOT restored during sync (correct behavior)");
    } else {
      console.log("❌ Account was restored during sync (incorrect behavior)");
      console.log("Merged data:", mergedData);
      return;
    }
    
    // Step 8: Verify local database is still empty
    const localAccountsAfterSync = await db.accounts.toArray();
    if (localAccountsAfterSync.length === 0) {
      console.log("✅ Local database remains empty after sync");
    } else {
      console.log("❌ Local database has accounts after sync");
      console.log("Local accounts:", localAccountsAfterSync);
      return;
    }
    
    // Step 9: Test persistence across page reloads
    const storedItems = JSON.parse(localStorage.getItem('deletedItems') || '[]');
    if (storedItems.includes(deletedKey)) {
      console.log("✅ Deleted items persisted to localStorage");
    } else {
      console.log("❌ Deleted items not persisted to localStorage");
      return;
    }
    
    console.log("🎉 All tests passed! Deletion fix is working correctly");
    console.log("📝 Deleted accounts will no longer reappear after sync");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Clean up
    try {
      await db.accounts.clear();
      firebaseSync.clearDeletedItems();
      console.log("🧹 Test cleanup completed");
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }
}

// Run the test
testDeletionFix();
