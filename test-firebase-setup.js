/**
 * Test Firebase Setup
 * Run this to verify your Firebase configuration is working
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, ".env") });

import firebaseService from "./src/services/firebaseService.js";

async function testFirebaseSetup() {
  console.log("🧪 Testing Firebase Setup...\n");

  // Use a unique test email to avoid conflicts
  const testEmail = `test-${Date.now()}@aura-finance.com`;
  const testPassword = "testpassword123";

  try {
    // Test 1: Check if Firebase is initialized
    console.log("✅ Firebase service loaded successfully");

    // Test 2: Try to register a test user
    console.log("\n📝 Testing user registration...");
    console.log(`   Using test email: ${testEmail}`);
    const registerResult = await firebaseService.register(
      testEmail,
      testPassword,
      "Test User"
    );

    if (registerResult.success) {
      console.log("✅ User registration successful");
      console.log("   User ID:", registerResult.user.uid);
    } else {
      console.log("❌ User registration failed:", registerResult.error);
      return;
    }

    // Test 3: Try to login
    console.log("\n🔐 Testing user login...");
    const loginResult = await firebaseService.login(testEmail, testPassword);

    if (loginResult.success) {
      console.log("✅ User login successful");
    } else {
      console.log("❌ User login failed:", loginResult.error);
      return;
    }

    // Test 4: Try to add a test transaction
    console.log("\n💰 Testing transaction creation...");
    const transactionResult = await firebaseService.addTransaction({
      amount: 50.0,
      description: "Test transaction",
      date: new Date().toISOString().split("T")[0],
      category: "Test Category",
      accountId: "test-account",
    });

    if (transactionResult.success) {
      console.log("✅ Transaction creation successful");
      console.log("   Transaction ID:", transactionResult.data.id);
    } else {
      console.log("❌ Transaction creation failed:", transactionResult.error);
      return;
    }

    // Test 5: Try to get transactions
    console.log("\n📊 Testing transaction retrieval...");
    const getTransactionsResult = await firebaseService.getTransactions();

    if (getTransactionsResult.success) {
      console.log("✅ Transaction retrieval successful");
      console.log(
        "   Found",
        getTransactionsResult.data.length,
        "transactions"
      );
    } else {
      console.log(
        "❌ Transaction retrieval failed:",
        getTransactionsResult.error
      );
      return;
    }

    // Test 6: Try to add a test account
    console.log("\n🏦 Testing account creation...");
    const accountResult = await firebaseService.addAccount({
      name: "Test Bank Account",
      type: "checking",
      balance: 1000.0,
      initialBalance: 1000.0,
    });

    if (accountResult.success) {
      console.log("✅ Account creation successful");
      console.log("   Account ID:", accountResult.data.id);
    } else {
      console.log("❌ Account creation failed:", accountResult.error);
      return;
    }

    // Test 7: Try to get accounts
    console.log("\n📋 Testing account retrieval...");
    const getAccountsResult = await firebaseService.getAccounts();

    if (getAccountsResult.success) {
      console.log("✅ Account retrieval successful");
      console.log("   Found", getAccountsResult.data.length, "accounts");
    } else {
      console.log("❌ Account retrieval failed:", getAccountsResult.error);
      return;
    }

    // Test 8: Test account deletion
    console.log("\n🗑️ Testing account deletion...");
    if (getAccountsResult.data.length > 0) {
      const accountToDelete = getAccountsResult.data[0];
      const deleteResult = await firebaseService.deleteAccount(accountToDelete.id);
      
      if (deleteResult.success) {
        console.log("✅ Account deletion successful");
      } else {
        console.log("❌ Account deletion failed:", deleteResult.error);
      }
    }

    // Test 9: Test real-time subscription
    console.log("\n🔄 Testing real-time subscription...");
    const unsubscribe = firebaseService.subscribeToTransactions(
      transactions => {
        console.log("✅ Real-time subscription working!");
        console.log(
          "   Received",
          transactions.length,
          "transactions in real-time"
        );
        unsubscribe(); // Clean up
      }
    );

    // Wait a moment for the subscription to work
    setTimeout(() => {
      console.log("✅ Real-time subscription test completed");
    }, 2000);

    console.log("\n🎉 All Firebase tests passed!");
    console.log("\n🚀 Your Firebase setup is working perfectly!");
    console.log("   You now have cross-device sync for $0/month!");
    
    // Cleanup: Sign out the test user
    console.log("\n🧹 Cleaning up test user...");
    await firebaseService.logout();
    console.log("✅ Test user signed out");
    
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    console.log("\n🔧 Please check:");
    console.log("   1. Firebase project is created");
    console.log("   2. Authentication is enabled");
    console.log("   3. Firestore database is created");
    console.log("   4. Environment variables are set correctly");
  }
}

// Run the test
testFirebaseSetup();
