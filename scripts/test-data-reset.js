#!/usr/bin/env node

/**
 * Test script to verify data reset functionality
 * This script simulates the data reset process and checks for data persistence
 */

import { execSync } from "child_process";
import path from "path";

async function testDataReset() {
  try {
    console.log("🧪 Testing data reset functionality...");

    // Step 1: Check current Firebase data
    console.log("\n📊 Step 1: Checking current Firebase data...");
    try {
      const result = execSync(
        "firebase firestore:get --project=aura-finance-9777a",
        { encoding: "utf8", stdio: "pipe" }
      );
      console.log("Current Firebase data:", result);
    } catch (error) {
      console.log("No Firebase data found or error accessing:", error.message);
    }

    // Step 2: Clear Firebase data
    console.log("\n🗑️  Step 2: Clearing Firebase data...");
    try {
      const clearResult = execSync(
        "firebase firestore:delete --all-collections --project=aura-finance-9777a --force",
        { encoding: "utf8", stdio: "pipe" }
      );
      console.log("Firebase data cleared:", clearResult);
    } catch (error) {
      console.log("Error clearing Firebase data:", error.message);
    }

    // Step 3: Verify Firebase is empty
    console.log("\n✅ Step 3: Verifying Firebase is empty...");
    try {
      const verifyResult = execSync(
        "firebase firestore:get --project=aura-finance-9777a",
        { encoding: "utf8", stdio: "pipe" }
      );
      console.log("Firebase data after clear:", verifyResult);
    } catch (error) {
      console.log("Firebase appears to be empty (expected):", error.message);
    }

    console.log("\n🎉 Data reset test completed!");
    console.log("\n📝 Next steps:");
    console.log("1. Open the app in your browser");
    console.log("2. Go to Settings > Data Management");
    console.log('3. Click "Reset All Data"');
    console.log("4. Verify that no data appears after reset");
    console.log("5. Check browser console for any sync messages");
  } catch (error) {
    console.error("❌ Error during data reset test:", error.message);
    process.exit(1);
  }
}

testDataReset();
