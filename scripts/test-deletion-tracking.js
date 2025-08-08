// Test script to verify deletion tracking
// Run this in the browser console after the app is loaded

console.log("🧪 Testing deletion tracking...");

// Try to access the Firebase sync service
let firebaseSync;
try {
  // Try to get the sync service from the window object or import it
  firebaseSync =
    window.firebaseSync ||
    (await import("../src/services/firebaseSync.js")).default;
} catch (error) {
  console.log("❌ Couldn't access Firebase sync service:", error.message);
  console.log(
    "💡 Make sure you're on the app page and the sync service is loaded"
  );
  return;
}

if (!firebaseSync) {
  console.log("❌ Firebase sync service not found");
  return;
}

console.log("✅ Firebase sync service found");

// Test 1: Check current deleted items
console.log("\n📋 Current deleted items:");
const currentDeleted = firebaseSync.getDeletedItems();
if (currentDeleted.length === 0) {
  console.log("   No items currently marked as deleted");
} else {
  currentDeleted.forEach(item => {
    console.log(`   - ${item}`);
  });
}

// Test 2: Mark some test items as deleted
console.log("\n🔧 Testing deletion marking...");
const testAccountId = "test-account-123";
const testTransactionId = "test-transaction-456";

firebaseSync.markAsDeleted(testAccountId, "accounts");
firebaseSync.markAsDeleted(testTransactionId, "transactions");

console.log("✅ Marked test items as deleted");

// Test 3: Verify they're tracked
console.log("\n🔍 Verifying deletion tracking...");
const updatedDeleted = firebaseSync.getDeletedItems();
const accountDeleted = updatedDeleted.includes(`accounts:${testAccountId}`);
const transactionDeleted = updatedDeleted.includes(
  `transactions:${testTransactionId}`
);

if (accountDeleted && transactionDeleted) {
  console.log("✅ Both test items are properly tracked as deleted");
} else {
  console.log("❌ Some test items are not tracked properly");
  console.log("   Account deleted:", accountDeleted);
  console.log("   Transaction deleted:", transactionDeleted);
}

// Test 4: Check localStorage persistence
console.log("\n💾 Checking localStorage persistence...");
try {
  const stored = JSON.parse(localStorage.getItem("deletedItems") || "[]");
  const storedAccount = stored.includes(`accounts:${testAccountId}`);
  const storedTransaction = stored.includes(
    `transactions:${testTransactionId}`
  );

  if (storedAccount && storedTransaction) {
    console.log("✅ Deleted items are properly stored in localStorage");
  } else {
    console.log("❌ Deleted items are not properly stored in localStorage");
  }
} catch (error) {
  console.log("❌ Error checking localStorage:", error.message);
}

// Test 5: Test clearing
console.log("\n🧹 Testing clear functionality...");
firebaseSync.clearDeletedItems();
const afterClear = firebaseSync.getDeletedItems();
if (afterClear.length === 0) {
  console.log("✅ Deleted items cleared successfully");
} else {
  console.log("❌ Failed to clear deleted items");
}

// Test 6: Check if the specific accounts you mentioned are tracked
console.log("\n🎯 Checking specific account IDs...");
const specificAccounts = ["1754516095348", "1754532132318"];
specificAccounts.forEach(accountId => {
  const isTracked = firebaseSync
    .getDeletedItems()
    .includes(`accounts:${accountId}`);
  console.log(
    `   Account ${accountId}: ${isTracked ? "✅ Tracked as deleted" : "❌ Not tracked"}`
  );
});

console.log("\n✅ Deletion tracking test completed!");
console.log(
  "💡 If the specific accounts show as 'Not tracked', they may have been restored by sync."
);
