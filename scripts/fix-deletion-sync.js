// Comprehensive fix for deletion sync issues
// Run this in the browser console to fix the current deletion problems

console.log("🔧 Starting comprehensive deletion sync fix...");

// Step 1: Access the store and sync service
let store, firebaseSync;
try {
  // Try to get the store
  store = window.__ZUSTAND_STORE__ || window.store;
  if (!store) {
    console.log("❌ Store not found. Make sure you're on the app page.");
    return;
  }

  // Try to get the sync service
  firebaseSync = window.firebaseSync || 
                 (await import("../src/services/firebaseSync.js")).default;
  if (!firebaseSync) {
    console.log("❌ Firebase sync service not found.");
    return;
  }

  console.log("✅ Successfully accessed store and sync service");
} catch (error) {
  console.log("❌ Error accessing services:", error.message);
  return;
}

// Step 2: Check current state
console.log("\n📊 Checking current state...");
const state = store.getState();
const accounts = state.accounts || [];
const transactions = state.transactions || [];

console.log(`   Found ${accounts.length} accounts and ${transactions.length} transactions`);

// Step 3: Check for the problematic accounts
const problematicAccountIds = ["1754516095348", "1754532132318"];
const problematicAccounts = accounts.filter(acc => 
  problematicAccountIds.includes(acc.id)
);

console.log(`\n🎯 Found ${problematicAccounts.length} problematic accounts:`);
problematicAccounts.forEach(acc => {
  console.log(`   - ${acc.name} (ID: ${acc.id})`);
});

// Step 4: Mark problematic accounts as deleted
console.log("\n🔧 Marking problematic accounts as deleted...");
problematicAccounts.forEach(acc => {
  firebaseSync.markAsDeleted(acc.id, "accounts");
  console.log(`   ✅ Marked account ${acc.id} as deleted`);
});

// Step 5: Check deletion tracking
console.log("\n🔍 Verifying deletion tracking...");
const deletedItems = firebaseSync.getDeletedItems();
const trackedAccounts = deletedItems.filter(item => item.startsWith("accounts:"));
console.log(`   Currently tracking ${trackedAccounts.length} deleted accounts`);

// Step 6: Force a sync to clean up Firebase
console.log("\n🔄 Forcing sync to clean up Firebase...");
try {
  await firebaseSync.forceSync();
  console.log("✅ Sync completed");
} catch (error) {
  console.log("⚠️  Sync had issues:", error.message);
}

// Step 7: Reload data to see the effect
console.log("\n📥 Reloading data...");
try {
  await store.getState().loadAccounts();
  await store.getState().loadTransactions();
  console.log("✅ Data reloaded");
} catch (error) {
  console.log("⚠️  Data reload had issues:", error.message);
}

// Step 8: Check final state
console.log("\n📊 Checking final state...");
const finalState = store.getState();
const finalAccounts = finalState.accounts || [];
const remainingProblematic = finalAccounts.filter(acc => 
  problematicAccountIds.includes(acc.id)
);

if (remainingProblematic.length === 0) {
  console.log("✅ All problematic accounts have been removed!");
} else {
  console.log(`⚠️  ${remainingProblematic.length} problematic accounts still remain:`);
  remainingProblematic.forEach(acc => {
    console.log(`   - ${acc.name} (ID: ${acc.id})`);
  });
}

// Step 9: Provide next steps
console.log("\n📝 Next steps:");
console.log("1. Refresh the page to see if accounts stay deleted");
console.log("2. If accounts reappear, the sync is still restoring them");
console.log("3. You may need to manually delete them from Firebase console");
console.log("4. Or clear the browser's IndexedDB and localStorage");

// Step 10: Show current deleted items for reference
console.log("\n📋 Current deleted items tracking:");
const finalDeletedItems = firebaseSync.getDeletedItems();
if (finalDeletedItems.length === 0) {
  console.log("   No items currently tracked as deleted");
} else {
  finalDeletedItems.forEach(item => {
    console.log(`   - ${item}`);
  });
}

console.log("\n🎉 Deletion sync fix completed!");
console.log("💡 If accounts still reappear, try the manual deletion steps above.");
