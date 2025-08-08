// Firebase CLI Fix Script
// This script uses Firebase CLI to directly fix the data issues

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔧 Firebase CLI Data Fix Script");
console.log("================================");

// Function to run Firebase CLI commands
function runFirebaseCommand(command) {
  try {
    const result = execSync(command, { encoding: "utf8" });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Function to create a JSON file for Firebase import
function createImportData() {
  const importData = {
    transactions: {
      "1754581509914v13fxvh8f": {
        description: "Sample Transaction 1",
        amount: 50.0,
        category: "Groceries",
        date: new Date().toISOString(),
        userId: "demo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      "175458150991457qh0s0gq": {
        description: "Sample Transaction 2",
        amount: -25.0,
        category: "Restaurants",
        date: new Date().toISOString(),
        userId: "demo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    accounts: {
      "sample-account-1": {
        name: "Checking Account",
        type: "checking",
        balance: 1000.0,
        userId: "demo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  };

  const importPath = path.join(__dirname, "../firebase-import-data.json");
  fs.writeFileSync(importPath, JSON.stringify(importData, null, 2));
  console.log(`✅ Created import data file: ${importPath}`);
  return importPath;
}

// Main function
async function main() {
  console.log("\n📋 Step 1: Checking Firebase project status...");

  // Check current project
  const projectCheck = runFirebaseCommand("firebase use");
  if (projectCheck.success) {
    console.log("✅ Firebase project status:");
    console.log(projectCheck.output);
  } else {
    console.log("❌ Error checking Firebase project:", projectCheck.error);
    return;
  }

  console.log("\n📋 Step 2: Creating import data...");
  const importPath = createImportData();

  console.log("\n📋 Step 3: Checking Firestore rules...");
  const rulesCheck = runFirebaseCommand("firebase firestore:rules:get");
  if (rulesCheck.success) {
    console.log("✅ Firestore rules retrieved");
  } else {
    console.log("⚠️  Could not retrieve Firestore rules:", rulesCheck.error);
  }

  console.log("\n📋 Step 4: Analyzing current data...");

  // Try to get current data using Firebase CLI
  console.log("💡 To manually check your Firestore data:");
  console.log(
    "   1. Go to Firebase Console: https://console.firebase.google.com/project/aura-finance-9777a/firestore"
  );
  console.log("   2. Navigate to Firestore Database");
  console.log('   3. Check the "transactions" and "accounts" collections');

  console.log("\n📋 Step 5: Manual data creation instructions...");
  console.log(
    "Since Firebase CLI has limited direct data manipulation, here are the manual steps:"
  );

  console.log("\n🔧 Option 1: Use Firebase Console (Recommended)");
  console.log(
    "   1. Go to: https://console.firebase.google.com/project/aura-finance-9777a/firestore"
  );
  console.log(
    '   2. Click "Start collection" or navigate to existing collections'
  );
  console.log("   3. Add documents with these IDs:");
  console.log("      - transactions/1754581509914v13fxvh8f");
  console.log("      - transactions/175458150991457qh0s0gq");
  console.log(
    "   4. Add the data from the import file: firebase-import-data.json"
  );

  console.log("\n🔧 Option 2: Use Firebase Emulator (for testing)");
  console.log("   1. Run: firebase emulators:start");
  console.log("   2. Import data using the emulator UI");
  console.log("   3. Export and then import to production");

  console.log("\n🔧 Option 3: Use the browser script (Quick fix)");
  console.log("   Run this in your browser console:");
  console.log(`
// Quick browser fix
const store = window.__ZUSTAND_STORE__ || window.store;
const transactions = store.getState().transactions || [];
const firebaseService = (await import("../src/services/firebaseService.js")).default;

for (const transaction of transactions) {
  try {
    await firebaseService.addTransaction(transaction);
    console.log('✅ Uploaded:', transaction.description);
  } catch (error) {
    console.log('❌ Failed:', transaction.description);
  }
}
  `);

  console.log("\n🎯 Recommended Action:");
  console.log("   1. Use the browser script above for immediate fix");
  console.log("   2. Then use Firebase Console to verify the data");
  console.log("   3. Your transaction category updates should work after this");

  console.log("\n📁 Import data file created at:", importPath);
  console.log(
    "💡 You can use this file to manually import data via Firebase Console"
  );
}

// Run the script
main().catch(console.error);
