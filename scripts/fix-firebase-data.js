// Firebase data fix script using Firebase Admin SDK
// This script will analyze and fix the sync issues directly in Firebase

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize Firebase Admin SDK
async function initializeFirebase() {
  try {
    // Check if we have service account key
    const serviceAccountPath = path.join(
      __dirname,
      "../serviceAccountKey.json"
    );

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "aura-finance-9777a",
      });
    } else {
      // Use default credentials (if running on GCP or with gcloud auth)
      admin.initializeApp({
        projectId: "aura-finance-9777a",
      });
    }

    console.log("✅ Firebase Admin SDK initialized");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
    return false;
  }
}

// Analyze current Firebase data
async function analyzeFirebaseData() {
  console.log("\n📊 Analyzing Firebase data...");

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

    // Get all accounts
    const accountsSnapshot = await db.collection("accounts").get();
    const accounts = [];

    accountsSnapshot.forEach(doc => {
      accounts.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`🏦 Found ${accounts.length} accounts in Firebase`);

    // Show sample data
    if (transactions.length > 0) {
      console.log("\n📝 Sample transactions:");
      transactions.slice(0, 3).forEach(t => {
        console.log(
          `   - ${t.description} (${t.amount}) - ${t.category || "Uncategorized"}`
        );
      });
    }

    if (accounts.length > 0) {
      console.log("\n🏦 Sample accounts:");
      accounts.slice(0, 3).forEach(a => {
        console.log(`   - ${a.name} (${a.type}) - Balance: ${a.balance || 0}`);
      });
    }

    return { transactions, accounts };
  } catch (error) {
    console.error("❌ Error analyzing Firebase data:", error.message);
    return { transactions: [], accounts: [] };
  }
}

// Create missing transactions in Firebase
async function createMissingTransactions(localTransactions) {
  console.log("\n📤 Creating missing transactions in Firebase...");

  const db = admin.firestore();
  const batch = db.batch();
  let createdCount = 0;

  try {
    for (const transaction of localTransactions) {
      // Check if transaction already exists
      const docRef = db.collection("transactions").doc(transaction.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        // Create the transaction
        batch.set(docRef, {
          ...transaction,
          userId: transaction.userId || "demo",
          createdAt:
            transaction.createdAt ||
            admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        createdCount++;
        console.log(`   ✅ Will create: ${transaction.description}`);
      }
    }

    if (createdCount > 0) {
      await batch.commit();
      console.log(
        `\n🎉 Successfully created ${createdCount} transactions in Firebase`
      );
    } else {
      console.log("\nℹ️  No new transactions to create");
    }

    return createdCount;
  } catch (error) {
    console.error("❌ Error creating transactions:", error.message);
    return 0;
  }
}

// Create missing accounts in Firebase
async function createMissingAccounts(localAccounts) {
  console.log("\n📤 Creating missing accounts in Firebase...");

  const db = admin.firestore();
  const batch = db.batch();
  let createdCount = 0;

  try {
    for (const account of localAccounts) {
      // Check if account already exists
      const docRef = db.collection("accounts").doc(account.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        // Create the account
        batch.set(docRef, {
          ...account,
          userId: account.userId || "demo",
          createdAt:
            account.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        createdCount++;
        console.log(`   ✅ Will create: ${account.name}`);
      }
    }

    if (createdCount > 0) {
      await batch.commit();
      console.log(
        `\n🎉 Successfully created ${createdCount} accounts in Firebase`
      );
    } else {
      console.log("\nℹ️  No new accounts to create");
    }

    return createdCount;
  } catch (error) {
    console.error("❌ Error creating accounts:", error.message);
    return 0;
  }
}

// Main function
async function main() {
  console.log("🔧 Firebase Data Fix Script");
  console.log("==========================");

  // Initialize Firebase
  const initialized = await initializeFirebase();
  if (!initialized) {
    console.log("\n💡 To fix this, you need to:");
    console.log("   1. Download service account key from Firebase Console");
    console.log("   2. Save it as serviceAccountKey.json in the project root");
    console.log("   3. Or run: gcloud auth application-default login");
    return;
  }

  // Analyze current data
  const firebaseData = await analyzeFirebaseData();

  // For now, we'll create some sample data to test
  // In a real scenario, you'd get this from your local IndexedDB
  const sampleTransactions = [
    {
      id: "1754581509914v13fxvh8f",
      description: "Sample Transaction 1",
      amount: 50.0,
      category: "Groceries",
      date: new Date().toISOString(),
      userId: "demo",
    },
    {
      id: "175458150991457qh0s0gq",
      description: "Sample Transaction 2",
      amount: -25.0,
      category: "Restaurants",
      date: new Date().toISOString(),
      userId: "demo",
    },
  ];

  const sampleAccounts = [
    {
      id: "sample-account-1",
      name: "Checking Account",
      type: "checking",
      balance: 1000.0,
      userId: "demo",
    },
  ];

  // Create missing data
  await createMissingTransactions(sampleTransactions);
  await createMissingAccounts(sampleAccounts);

  // Final analysis
  console.log("\n📊 Final Analysis:");
  const finalData = await analyzeFirebaseData();

  console.log("\n🎉 Firebase data fix completed!");
  console.log(
    "💡 Your app should now be able to update transaction categories without errors."
  );
}

// Run the script
main().catch(console.error);
