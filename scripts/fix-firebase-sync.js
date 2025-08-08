// Comprehensive Firebase sync fix
// Run this in the browser console to fix sync issues

console.log("🔧 Starting comprehensive Firebase sync fix...");

// Step 1: Access the store and services
let store, firebaseService, firebaseSync;
try {
  // Get the store
  store = window.__ZUSTAND_STORE__ || window.store;
  if (!store) {
    console.log("❌ Store not found. Make sure you're on the app page.");
    return;
  }

  // Get Firebase services
  firebaseService = (await import("../src/services/firebaseService.js")).default;
  firebaseSync = (await import("../src/services/firebaseSync.js")).default;
  
  console.log("✅ Successfully accessed store and Firebase services");
} catch (error) {
  console.log("❌ Error accessing services:", error.message);
  return;
}

// Step 2: Check current state
console.log("\n📊 Checking current state...");
const state = store.getState();
const transactions = state.transactions || [];
const accounts = state.accounts || [];

console.log(`   Found ${transactions.length} transactions and ${accounts.length} accounts`);

// Step 3: Check Firebase authentication
console.log("\n🔐 Checking Firebase authentication...");
const currentUser = firebaseService.getCurrentUser();
if (!currentUser) {
  console.log("❌ No authenticated user found. Please log in first.");
  return;
}
console.log(`✅ Authenticated as: ${currentUser.email}`);

// Step 4: Get Firebase data for comparison
console.log("\n🔄 Getting Firebase data...");
try {
  const firebaseTransactionsResult = await firebaseService.getTransactions();
  const firebaseAccountsResult = await firebaseService.getAccounts();
  
  const firebaseTransactions = firebaseTransactionsResult.success ? firebaseTransactionsResult.data || [] : [];
  const firebaseAccounts = firebaseAccountsResult.success ? firebaseAccountsResult.data || [] : [];
  
  console.log(`   Firebase has ${firebaseTransactions.length} transactions and ${firebaseAccounts.length} accounts`);
  
  // Step 5: Find missing transactions in Firebase
  const localTransactionIds = new Set(transactions.map(t => t.id));
  const firebaseTransactionIds = new Set(firebaseTransactions.map(t => t.id));
  
  const missingInFirebase = transactions.filter(t => !firebaseTransactionIds.has(t.id));
  const missingInLocal = firebaseTransactions.filter(t => !localTransactionIds.has(t.id));
  
  console.log(`\n📋 Sync Analysis:`);
  console.log(`   Transactions missing in Firebase: ${missingInFirebase.length}`);
  console.log(`   Transactions missing locally: ${missingInLocal.length}`);
  
  // Step 6: Upload missing transactions to Firebase
  if (missingInFirebase.length > 0) {
    console.log(`\n📤 Uploading ${missingInFirebase.length} missing transactions to Firebase...`);
    
    let uploadedCount = 0;
    let failedCount = 0;
    
    for (const transaction of missingInFirebase) {
      try {
        const result = await firebaseService.addTransaction(transaction);
        if (result.success) {
          uploadedCount++;
          console.log(`   ✅ Uploaded: ${transaction.description}`);
        } else {
          failedCount++;
          console.log(`   ❌ Failed to upload: ${transaction.description} - ${result.error}`);
        }
      } catch (error) {
        failedCount++;
        console.log(`   ❌ Error uploading: ${transaction.description} - ${error.message}`);
      }
    }
    
    console.log(`\n📈 Upload Summary:`);
    console.log(`   Successfully uploaded: ${uploadedCount}`);
    console.log(`   Failed uploads: ${failedCount}`);
  }
  
  // Step 7: Find missing accounts in Firebase
  const localAccountIds = new Set(accounts.map(a => a.id));
  const firebaseAccountIds = new Set(firebaseAccounts.map(a => a.id));
  
  const missingAccountsInFirebase = accounts.filter(a => !firebaseAccountIds.has(a.id));
  const missingAccountsInLocal = firebaseAccounts.filter(a => !localAccountIds.has(a.id));
  
  console.log(`\n🏦 Account Sync Analysis:`);
  console.log(`   Accounts missing in Firebase: ${missingAccountsInFirebase.length}`);
  console.log(`   Accounts missing locally: ${missingAccountsInLocal.length}`);
  
  // Step 8: Upload missing accounts to Firebase
  if (missingAccountsInFirebase.length > 0) {
    console.log(`\n📤 Uploading ${missingAccountsInFirebase.length} missing accounts to Firebase...`);
    
    let uploadedCount = 0;
    let failedCount = 0;
    
    for (const account of missingAccountsInFirebase) {
      try {
        const result = await firebaseService.addAccount(account);
        if (result.success) {
          uploadedCount++;
          console.log(`   ✅ Uploaded: ${account.name}`);
        } else {
          failedCount++;
          console.log(`   ❌ Failed to upload: ${account.name} - ${result.error}`);
        }
      } catch (error) {
        failedCount++;
        console.log(`   ❌ Error uploading: ${account.name} - ${error.message}`);
      }
    }
    
    console.log(`\n📈 Account Upload Summary:`);
    console.log(`   Successfully uploaded: ${uploadedCount}`);
    console.log(`   Failed uploads: ${failedCount}`);
  }
  
  // Step 9: Force a sync to ensure everything is in sync
  console.log("\n🔄 Forcing sync to ensure consistency...");
  try {
    await firebaseSync.forceSync();
    console.log("✅ Sync completed");
  } catch (error) {
    console.log("⚠️  Sync had issues:", error.message);
  }
  
  // Step 10: Reload data to see the final state
  console.log("\n📥 Reloading data...");
  try {
    await store.getState().loadTransactions();
    await store.getState().loadAccounts();
    console.log("✅ Data reloaded");
  } catch (error) {
    console.log("⚠️  Data reload had issues:", error.message);
  }
  
  // Step 11: Final verification
  console.log("\n🔍 Final verification...");
  const finalState = store.getState();
  const finalTransactions = finalState.transactions || [];
  const finalAccounts = finalState.accounts || [];
  
  console.log(`   Final state: ${finalTransactions.length} transactions, ${finalAccounts.length} accounts`);
  
  // Check for any remaining sync issues
  const finalFirebaseTransactionsResult = await firebaseService.getTransactions();
  const finalFirebaseAccountsResult = await firebaseService.getAccounts();
  
  const finalFirebaseTransactions = finalFirebaseTransactionsResult.success ? finalFirebaseTransactionsResult.data || [] : [];
  const finalFirebaseAccounts = finalFirebaseAccountsResult.success ? finalFirebaseAccountsResult.data || [] : [];
  
  const transactionSyncDiff = Math.abs(finalTransactions.length - finalFirebaseTransactions.length);
  const accountSyncDiff = Math.abs(finalAccounts.length - finalFirebaseAccounts.length);
  
  if (transactionSyncDiff === 0 && accountSyncDiff === 0) {
    console.log("✅ Perfect sync achieved!");
  } else {
    console.log(`⚠️  Sync differences remain:`);
    console.log(`   Transactions: ${transactionSyncDiff} difference`);
    console.log(`   Accounts: ${accountSyncDiff} difference`);
  }
  
} catch (error) {
  console.log("❌ Error during sync fix:", error.message);
}

console.log("\n🎉 Firebase sync fix completed!");
console.log("💡 Try updating transaction categories again - it should work now.");
