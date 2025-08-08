// Quick Firebase fix - run this in browser console immediately
// This will fix the "No document to update" errors

console.log("🚀 Quick Firebase fix starting...");

// Step 1: Get the store
const store = window.__ZUSTAND_STORE__ || window.store;
if (!store) {
  console.log("❌ Store not found. Make sure you're on the app page.");
  return;
}

// Step 2: Get current transactions
const state = store.getState();
const transactions = state.transactions || [];
console.log(`📊 Found ${transactions.length} local transactions`);

// Step 3: Import Firebase service
let firebaseService;
try {
  firebaseService = (await import("../src/services/firebaseService.js"))
    .default;
} catch (error) {
  console.log("❌ Couldn't import Firebase service:", error.message);
  return;
}

// Step 4: Check authentication
const currentUser = firebaseService.getCurrentUser();
if (!currentUser) {
  console.log("❌ Not authenticated with Firebase. Please log in first.");
  return;
}
console.log(`✅ Authenticated as: ${currentUser.email}`);

// Step 5: Get Firebase transactions for comparison
console.log("🔄 Getting Firebase transactions...");
const firebaseResult = await firebaseService.getTransactions();
const firebaseTransactions = firebaseResult.success
  ? firebaseResult.data || []
  : [];
console.log(`📊 Found ${firebaseTransactions.length} Firebase transactions`);

// Step 6: Find missing transactions
const localIds = new Set(transactions.map(t => t.id));
const firebaseIds = new Set(firebaseTransactions.map(t => t.id));
const missingInFirebase = transactions.filter(t => !firebaseIds.has(t.id));

console.log(`\n📋 Analysis:`);
console.log(`   Transactions missing in Firebase: ${missingInFirebase.length}`);

if (missingInFirebase.length === 0) {
  console.log("✅ All transactions are already in Firebase!");
  return;
}

// Step 7: Upload missing transactions
console.log(
  `\n📤 Uploading ${missingInFirebase.length} missing transactions...`
);
let successCount = 0;
let failCount = 0;

for (const transaction of missingInFirebase) {
  try {
    const result = await firebaseService.addTransaction(transaction);
    if (result.success) {
      successCount++;
      console.log(`   ✅ Uploaded: ${transaction.description}`);
    } else {
      failCount++;
      console.log(`   ❌ Failed: ${transaction.description} - ${result.error}`);
    }
  } catch (error) {
    failCount++;
    console.log(`   ❌ Error: ${transaction.description} - ${error.message}`);
  }
}

console.log(`\n📈 Upload Summary:`);
console.log(`   Successfully uploaded: ${successCount}`);
console.log(`   Failed uploads: ${failCount}`);

if (successCount > 0) {
  console.log("\n🎉 Fix completed! Try updating transaction categories again.");
  console.log("💡 The 'No document to update' errors should be resolved now.");
} else {
  console.log("\n⚠️  No transactions were uploaded. Check the errors above.");
}
