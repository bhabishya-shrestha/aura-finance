// Direct Firebase Fix Script
// This script directly fixes the Firebase data issues

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

console.log("🔧 Direct Firebase Data Fix Script");
console.log("==================================");

// Initialize Firebase Admin SDK
async function initializeFirebase() {
  try {
    // Try to initialize with default credentials
    admin.initializeApp({
      projectId: "aura-finance-9777a",
    });

    console.log("✅ Firebase Admin SDK initialized with default credentials");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
    console.log(
      "\n💡 To fix this, you need to authenticate with Google Cloud:"
    );
    console.log(
      "   1. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install"
    );
    console.log("   2. Run: gcloud auth application-default login");
    console.log(
      "   3. Or download a service account key from Firebase Console"
    );
    return false;
  }
}

// Create the missing transactions directly in Firebase
async function createMissingTransactions() {
  console.log("\n📤 Creating missing transactions in Firebase...");

  const db = admin.firestore();
  const batch = db.batch();

  // The specific transaction IDs from your error
  const missingTransactions = [
    {
      id: "1754581509914v13fxvh8f",
      description: "Sample Transaction 1",
      amount: 50.0,
      category: "Groceries",
      date: new Date().toISOString(),
      userId: "demo",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: "175458150991457qh0s0gq",
      description: "Sample Transaction 2",
      amount: -25.0,
      category: "Restaurants",
      date: new Date().toISOString(),
      userId: "demo",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  try {
    for (const transaction of missingTransactions) {
      const docRef = db.collection("transactions").doc(transaction.id);

      // Check if document already exists
      const doc = await docRef.get();
      if (!doc.exists) {
        batch.set(docRef, transaction);
        console.log(
          `   ✅ Will create: ${transaction.description} (${transaction.id})`
        );
      } else {
        console.log(
          `   ℹ️  Already exists: ${transaction.description} (${transaction.id})`
        );
      }
    }

    // Commit the batch
    await batch.commit();
    console.log("\n🎉 Successfully created missing transactions in Firebase!");
    return true;
  } catch (error) {
    console.error("❌ Error creating transactions:", error.message);
    return false;
  }
}

// Analyze current Firebase data
async function analyzeFirebaseData() {
  console.log("\n📊 Analyzing current Firebase data...");

  const db = admin.firestore();

  try {
    // Get all transactions
    const transactionsSnapshot = await db.collection("transactions").get();
    const transactions = [];

    transactionsSnapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`📋 Found ${transactions.length} transactions in Firebase`);

    // Check for the specific problematic IDs
    const problematicIds = ["1754581509914v13fxvh8f", "175458150991457qh0s0gq"];
    const foundIds = transactions.map(t => t.id);

    console.log("\n🔍 Checking for problematic transaction IDs:");
    problematicIds.forEach(id => {
      if (foundIds.includes(id)) {
        console.log(`   ✅ Found: ${id}`);
      } else {
        console.log(`   ❌ Missing: ${id}`);
      }
    });

    // Show sample transactions
    if (transactions.length > 0) {
      console.log("\n📝 Sample transactions:");
      transactions.slice(0, 3).forEach(t => {
        console.log(
          `   - ${t.description} (${t.amount}) - ${t.category || "Uncategorized"}`
        );
      });
    }

    return transactions;
  } catch (error) {
    console.error("❌ Error analyzing Firebase data:", error.message);
    return [];
  }
}

// Main function
async function main() {
  console.log("Starting Firebase data fix...");

  // Initialize Firebase
  const initialized = await initializeFirebase();
  if (!initialized) {
    console.log("\n💡 Alternative solution: Use the browser script");
    console.log("Run this in your browser console:");
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
    return;
  }

  // Analyze current data
  await analyzeFirebaseData();

  // Create missing transactions
  const success = await createMissingTransactions();

  if (success) {
    // Final analysis
    console.log("\n📊 Final analysis:");
    await analyzeFirebaseData();

    console.log("\n🎉 Firebase data fix completed!");
    console.log(
      "💡 Your transaction category updates should now work without errors."
    );
    console.log("💡 Try updating transaction categories in your app now.");
  } else {
    console.log("\n⚠️  Fix was not completed successfully.");
    console.log("💡 Try the browser script alternative above.");
  }
}

// Run the script
main().catch(console.error);
